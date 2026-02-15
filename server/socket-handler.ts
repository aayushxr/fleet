import type { Server, Socket } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents, SocketData, SystemEvent, ChatEntry } from "@/lib/types";
import { randomUUID } from "crypto";
import { joinRoomSchema, sendMessageSchema, setTTLSchema } from "./validators";
import { store } from "./store";
import { handleCallLeave } from "./call-handler";

type IOServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
type IOSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

export function registerSocketHandlers(io: IOServer): void {
  io.on("connection", (socket: IOSocket) => {
    socket.on("join-room", (payload) => {
      const result = joinRoomSchema.safeParse(payload);
      if (!result.success) {
        socket.emit("error", { message: "Invalid join payload" });
        return;
      }

      const { roomName, username } = result.data;

      // If already in a room, leave it first
      if (socket.data.roomId) {
        leaveCurrentRoom(io, socket);
      }

      const room = store.getOrCreateRoom(roomName);
      const roomId = room.name;

      if (store.isRoomFull(roomId)) {
        socket.emit("error", { message: "Room is full" });
        return;
      }

      if (store.isUsernameTakenInRoom(roomId, username)) {
        socket.emit("error", { message: "Username is already taken in this room" });
        return;
      }

      const { user, entry } = store.addUserToRoom(socket.id, username, roomId);
      socket.data = { userId: socket.id, username, roomId };

      socket.join(roomId);

      const roomState = store.getRoomState(roomId);
      if (roomState) {
        socket.emit("room-state", roomState);
      }

      socket.to(roomId).emit("user-joined", { user, entry });
    });

    socket.on("leave-room", () => {
      leaveCurrentRoom(io, socket);
    });

    socket.on("send-message", (payload) => {
      const result = sendMessageSchema.safeParse(payload);
      if (!result.success) {
        socket.emit("error", { message: "Invalid message" });
        return;
      }

      if (!socket.data.roomId) {
        socket.emit("error", { message: "Not in a room" });
        return;
      }

      if (!store.checkRateLimit(socket.id)) {
        socket.emit("error", { message: "Rate limit exceeded. Slow down." });
        return;
      }

      const entry = store.addMessage(socket.id, result.data.content);
      if (entry) {
        io.to(socket.data.roomId).emit("new-message", entry);
        store.clearTyping(socket.id, socket.data.roomId);
        io.to(socket.data.roomId).emit(
          "typing-update",
          store.getTypingUsernames(socket.data.roomId)
        );
      }
    });

    socket.on("typing-start", () => {
      if (!socket.data.roomId || !socket.data.username) return;
      store.setTyping(socket.id, socket.data.roomId, socket.data.username);
      socket.to(socket.data.roomId).emit(
        "typing-update",
        store.getTypingUsernames(socket.data.roomId, socket.id)
      );
    });

    socket.on("typing-stop", () => {
      if (!socket.data.roomId) return;
      store.clearTyping(socket.id, socket.data.roomId);
      socket.to(socket.data.roomId).emit(
        "typing-update",
        store.getTypingUsernames(socket.data.roomId, socket.id)
      );
    });

    socket.on("set-ttl", (payload) => {
      const result = setTTLSchema.safeParse(payload);
      if (!result.success) {
        socket.emit("error", { message: "Invalid TTL value" });
        return;
      }

      const roomId = socket.data.roomId;
      if (!roomId) return;

      const room = store.rooms.get(roomId);
      if (!room) return;

      room.ttlMinutes = result.data.ttlMinutes;

      const event: SystemEvent = {
        id: randomUUID(),
        type: "ttl-change",
        username: socket.data.username,
        timestamp: Date.now(),
        content: `${result.data.ttlMinutes}`,
      };
      const entry: ChatEntry = { ...event, kind: "system" };
      room.messages.push(entry);

      io.to(roomId).emit("ttl-updated", { ttlMinutes: result.data.ttlMinutes, entry });
    });

    socket.on("disconnect", () => {
      leaveCurrentRoom(io, socket);
    });
  });
}

function leaveCurrentRoom(io: IOServer, socket: IOSocket): void {
  handleCallLeave(io, socket);
  const result = store.removeUserFromRoom(socket.id);
  if (result) {
    socket.to(result.roomId).emit("user-left", { userId: socket.id, entry: result.entry });
    socket.leave(result.roomId);
    socket.data = {} as SocketData;
  }
}
