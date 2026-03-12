import { randomUUID } from "crypto";
import type { User, Message, ChatEntry, SystemEvent, RoomState } from "@/lib/types";
import {
  DEFAULT_TTL_MINUTES,
  MAX_ROOM_CAPACITY,
  MAX_MESSAGES_PER_ROOM,
  MAX_MESSAGES_PER_MINUTE,
  TYPING_TIMEOUT_MS,
} from "./constants";

interface InternalRoom {
  name: string;
  displayName: string;
  messages: ChatEntry[];
  activeUsers: Map<string, User>;
  createdAt: number;
  ttlMinutes: number;
}

class ChatStore {
  rooms = new Map<string, InternalRoom>();
  socketToRoom = new Map<string, string>();
  typingUsers = new Map<string, Map<string, ReturnType<typeof setTimeout>>>();
  messageRateLimit = new Map<string, number[]>();

  normalizeRoomName(name: string): string {
    return name.toLowerCase().replace(/\s+/g, "-");
  }

  getOrCreateRoom(displayName: string): InternalRoom {
    const id = this.normalizeRoomName(displayName);
    let room = this.rooms.get(id);
    if (!room) {
      room = {
        name: id,
        displayName,
        messages: [],
        activeUsers: new Map(),
        createdAt: Date.now(),
        ttlMinutes: DEFAULT_TTL_MINUTES,
      };
      this.rooms.set(id, room);
    }
    return room;
  }

  isRoomFull(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    return room ? room.activeUsers.size >= MAX_ROOM_CAPACITY : false;
  }

  isUsernameTakenInRoom(roomId: string, username: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    const lower = username.toLowerCase();
    for (const user of room.activeUsers.values()) {
      if (user.username.toLowerCase() === lower) return true;
    }
    return false;
  }

  addUserToRoom(socketId: string, username: string, roomId: string): { user: User; entry: ChatEntry } {
    const room = this.rooms.get(roomId)!;
    const user: User = {
      id: socketId,
      username,
      roomId,
      joinedAt: Date.now(),
    };
    room.activeUsers.set(socketId, user);
    this.socketToRoom.set(socketId, roomId);

    const event: SystemEvent = {
      id: randomUUID(),
      type: "join",
      username,
      timestamp: Date.now(),
    };
    const entry: ChatEntry = { ...event, kind: "system" };
    room.messages.push(entry);
    this.trimMessages(roomId);

    return { user, entry };
  }

  removeUserFromRoom(socketId: string): { roomId: string; entry: ChatEntry } | null {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    const user = room.activeUsers.get(socketId);
    if (!user) return null;

    room.activeUsers.delete(socketId);
    this.socketToRoom.delete(socketId);
    this.clearTyping(socketId, roomId);

    const event: SystemEvent = {
      id: randomUUID(),
      type: "leave",
      username: user.username,
      timestamp: Date.now(),
    };
    const entry: ChatEntry = { ...event, kind: "system" };
    room.messages.push(entry);

    return { roomId, entry };
  }

  checkRateLimit(socketId: string): boolean {
    const now = Date.now();
    const timestamps = this.messageRateLimit.get(socketId) ?? [];
    const recent = timestamps.filter((t) => now - t < 60_000);
    if (recent.length >= MAX_MESSAGES_PER_MINUTE) return false;
    recent.push(now);
    this.messageRateLimit.set(socketId, recent);
    return true;
  }

  addMessage(socketId: string, content: string): ChatEntry | null {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    const user = room.activeUsers.get(socketId);
    if (!user) return null;

    const message: Message = {
      id: randomUUID(),
      sender: user.username,
      content,
      timestamp: Date.now(),
      roomId,
    };
    const entry: ChatEntry = { ...message, kind: "message" };
    room.messages.push(entry);
    this.trimMessages(roomId);

    return entry;
  }

  setTyping(socketId: string, roomId: string, username: string): void {
    if (!this.typingUsers.has(roomId)) {
      this.typingUsers.set(roomId, new Map());
    }
    const roomTyping = this.typingUsers.get(roomId)!;

    const existing = roomTyping.get(socketId);
    if (existing) clearTimeout(existing);

    const timeout = setTimeout(() => {
      roomTyping.delete(socketId);
    }, TYPING_TIMEOUT_MS);
    roomTyping.set(socketId, timeout);
  }

  clearTyping(socketId: string, roomId: string): void {
    const roomTyping = this.typingUsers.get(roomId);
    if (!roomTyping) return;
    const timeout = roomTyping.get(socketId);
    if (timeout) clearTimeout(timeout);
    roomTyping.delete(socketId);
  }

  getTypingUsernames(roomId: string, excludeSocketId?: string): string[] {
    const roomTyping = this.typingUsers.get(roomId);
    if (!roomTyping) return [];

    const room = this.rooms.get(roomId);
    if (!room) return [];

    const names: string[] = [];
    for (const [sid] of roomTyping) {
      if (sid === excludeSocketId) continue;
      const user = room.activeUsers.get(sid);
      if (user) names.push(user.username);
    }
    return names;
  }

  expireMessages(): Map<string, string[]> {
    const expired = new Map<string, string[]>();
    const now = Date.now();

    for (const [roomId, room] of this.rooms) {
      const ttlMs = room.ttlMinutes * 60_000;
      const expiredIds: string[] = [];

      room.messages = room.messages.filter((entry) => {
        if (now - entry.timestamp > ttlMs) {
          expiredIds.push(entry.id);
          return false;
        }
        return true;
      });

      if (expiredIds.length > 0) {
        expired.set(roomId, expiredIds);
      }
    }

    return expired;
  }

  cleanupEmptyRooms(): void {
    for (const [roomId, room] of this.rooms) {
      if (room.activeUsers.size === 0) {
        this.rooms.delete(roomId);
        this.typingUsers.delete(roomId);
      }
    }
  }

  getRoomState(roomId: string): RoomState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    return {
      name: room.name,
      displayName: room.displayName,
      ttlMinutes: room.ttlMinutes,
      users: Array.from(room.activeUsers.values()),
      messages: [...room.messages],
      createdAt: room.createdAt,
    };
  }

  private trimMessages(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    if (room.messages.length > MAX_MESSAGES_PER_ROOM) {
      room.messages = room.messages.slice(-MAX_MESSAGES_PER_ROOM);
    }
  }
}

export const store = new ChatStore();
