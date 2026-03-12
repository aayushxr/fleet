export interface User {
  id: string;
  username: string;
  roomId: string;
  joinedAt: number;
}

export interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: number;
  roomId: string;
}

export interface SystemEvent {
  id: string;
  type: "join" | "leave" | "ttl-change";
  username: string;
  timestamp: number;
  content?: string;
}

export type ChatEntry = (Message & { kind: "message" }) | (SystemEvent & { kind: "system" });

export interface RoomState {
  name: string;
  displayName: string;
  ttlMinutes: number;
  users: User[];
  messages: ChatEntry[];
  createdAt: number;
}

export interface JoinRoomPayload {
  roomName: string;
  username: string;
}

export interface SendMessagePayload {
  content: string;
}

export interface SetTTLPayload {
  ttlMinutes: number;
}

export interface ServerToClientEvents {
  "room-state": (state: RoomState) => void;
  "new-message": (entry: ChatEntry) => void;
  "user-joined": (data: { user: User; entry: ChatEntry }) => void;
  "user-left": (data: { userId: string; entry: ChatEntry }) => void;
  "typing-update": (usernames: string[]) => void;
  "ttl-updated": (data: { ttlMinutes: number; entry: ChatEntry }) => void;
  "messages-expired": (messageIds: string[]) => void;
  "error": (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  "join-room": (payload: JoinRoomPayload) => void;
  "leave-room": () => void;
  "send-message": (payload: SendMessagePayload) => void;
  "typing-start": () => void;
  "typing-stop": () => void;
  "set-ttl": (payload: SetTTLPayload) => void;
}

export interface SocketData {
  userId: string;
  username: string;
  roomId: string;
}
