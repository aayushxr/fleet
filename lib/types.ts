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
  type: "join" | "leave" | "ttl-change" | "call-join" | "call-leave";
  username: string;
  timestamp: number;
  content?: string;
}

export type ChatEntry = (Message & { kind: "message" }) | (SystemEvent & { kind: "system" });

export interface CallParticipant {
  userId: string;
  username: string;
  joinedCallAt: number;
}

export interface CallState {
  active: boolean;
  participants: CallParticipant[];
  startedAt: number | null;
  startedBy: string | null;
}

export interface RoomState {
  name: string;
  displayName: string;
  ttlMinutes: number;
  users: User[];
  messages: ChatEntry[];
  createdAt: number;
  callState: CallState;
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

export interface SignalOfferPayload {
  targetUserId: string;
  sdp: RTCSessionDescriptionInit;
}

export interface SignalAnswerPayload {
  targetUserId: string;
  sdp: RTCSessionDescriptionInit;
}

export interface SignalIceCandidatePayload {
  targetUserId: string;
  candidate: RTCIceCandidateInit;
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
  "call-state-changed": (callState: CallState) => void;
  "call-signal-offer": (data: { fromUserId: string; sdp: RTCSessionDescriptionInit }) => void;
  "call-signal-answer": (data: { fromUserId: string; sdp: RTCSessionDescriptionInit }) => void;
  "call-signal-ice-candidate": (data: { fromUserId: string; candidate: RTCIceCandidateInit }) => void;
}

export interface ClientToServerEvents {
  "join-room": (payload: JoinRoomPayload) => void;
  "leave-room": () => void;
  "send-message": (payload: SendMessagePayload) => void;
  "typing-start": () => void;
  "typing-stop": () => void;
  "set-ttl": (payload: SetTTLPayload) => void;
  "call-start": () => void;
  "call-join": () => void;
  "call-leave": () => void;
  "call-signal-offer": (payload: SignalOfferPayload) => void;
  "call-signal-answer": (payload: SignalAnswerPayload) => void;
  "call-signal-ice-candidate": (payload: SignalIceCandidatePayload) => void;
}

export interface SocketData {
  userId: string;
  username: string;
  roomId: string;
}
