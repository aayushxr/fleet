"use client";

import { useReducer, useRef, useEffect, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type {
  ChatEntry,
  User,
  RoomState,
  CallState,
  ServerToClientEvents,
  ClientToServerEvents,
} from "@/lib/types";

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "reconnecting";

interface SocketState {
  messages: ChatEntry[];
  users: User[];
  roomName: string;
  displayName: string;
  ttlMinutes: number;
  typingUsers: string[];
  connectionStatus: ConnectionStatus;
  error: string | null;
  userId: string;
  callState: CallState;
}

type SocketAction =
  | { type: "room-state"; payload: RoomState }
  | { type: "new-message"; payload: ChatEntry }
  | { type: "user-joined"; payload: { user: User; entry: ChatEntry } }
  | { type: "user-left"; payload: { userId: string; entry: ChatEntry } }
  | { type: "typing-update"; payload: string[] }
  | { type: "ttl-updated"; payload: { ttlMinutes: number; entry: ChatEntry } }
  | { type: "messages-expired"; payload: string[] }
  | { type: "connection-status"; payload: ConnectionStatus }
  | { type: "error"; payload: string }
  | { type: "set-user-id"; payload: string }
  | { type: "call-state-changed"; payload: CallState };

const initialCallState: CallState = {
  active: false,
  participants: [],
  startedAt: null,
  startedBy: null,
};

const initialState: SocketState = {
  messages: [],
  users: [],
  roomName: "",
  displayName: "",
  ttlMinutes: 30,
  typingUsers: [],
  connectionStatus: "connecting",
  error: null,
  userId: "",
  callState: initialCallState,
};

function reducer(state: SocketState, action: SocketAction): SocketState {
  switch (action.type) {
    case "room-state":
      return {
        ...state,
        messages: action.payload.messages,
        users: action.payload.users,
        roomName: action.payload.name,
        displayName: action.payload.displayName,
        ttlMinutes: action.payload.ttlMinutes,
        callState: action.payload.callState,
        error: null,
      };
    case "new-message":
      return { ...state, messages: [...state.messages, action.payload] };
    case "user-joined":
      return {
        ...state,
        users: [...state.users, action.payload.user],
        messages: [...state.messages, action.payload.entry],
      };
    case "user-left":
      return {
        ...state,
        users: state.users.filter((u) => u.id !== action.payload.userId),
        messages: [...state.messages, action.payload.entry],
      };
    case "typing-update":
      return { ...state, typingUsers: action.payload };
    case "ttl-updated":
      return {
        ...state,
        ttlMinutes: action.payload.ttlMinutes,
        messages: [...state.messages, action.payload.entry],
      };
    case "messages-expired":
      return {
        ...state,
        messages: state.messages.filter((m) => !action.payload.includes(m.id)),
      };
    case "connection-status":
      return { ...state, connectionStatus: action.payload };
    case "error":
      return { ...state, error: action.payload };
    case "set-user-id":
      return { ...state, userId: action.payload };
    case "call-state-changed":
      return { ...state, callState: action.payload };
    default:
      return state;
  }
}

export function useSocket(roomName: string, username: string) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!roomName || !username) return;

    let cancelled = false;

    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
      path: "/socket.io/",
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      if (cancelled) {
        socket.disconnect();
        return;
      }
      dispatch({ type: "set-user-id", payload: socket.id! });
      dispatch({ type: "connection-status", payload: "connected" });
      socket.emit("join-room", { roomName, username });
    });

    socket.on("disconnect", () => {
      if (!cancelled) dispatch({ type: "connection-status", payload: "disconnected" });
    });

    socket.io.on("reconnect_attempt", () => {
      if (!cancelled) dispatch({ type: "connection-status", payload: "reconnecting" });
    });

    socket.io.on("reconnect", () => {
      if (!cancelled) {
        dispatch({ type: "connection-status", payload: "connected" });
        socket.emit("join-room", { roomName, username });
      }
    });

    socket.on("room-state", (s) => !cancelled && dispatch({ type: "room-state", payload: s }));
    socket.on("new-message", (m) => !cancelled && dispatch({ type: "new-message", payload: m }));
    socket.on("user-joined", (d) => !cancelled && dispatch({ type: "user-joined", payload: d }));
    socket.on("user-left", (d) => !cancelled && dispatch({ type: "user-left", payload: d }));
    socket.on("typing-update", (u) => !cancelled && dispatch({ type: "typing-update", payload: u }));
    socket.on("ttl-updated", (d) => !cancelled && dispatch({ type: "ttl-updated", payload: d }));
    socket.on("messages-expired", (ids) => !cancelled && dispatch({ type: "messages-expired", payload: ids }));
    socket.on("error", (d) => !cancelled && dispatch({ type: "error", payload: d.message }));
    socket.on("call-state-changed", (cs) => !cancelled && dispatch({ type: "call-state-changed", payload: cs }));

    return () => {
      cancelled = true;
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomName, username]);

  const sendMessage = useCallback((content: string) => {
    socketRef.current?.emit("send-message", { content });
  }, []);

  const startTyping = useCallback(() => {
    socketRef.current?.emit("typing-start");
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("typing-stop");
    }, 1000);
  }, []);

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketRef.current?.emit("typing-stop");
  }, []);

  const leaveRoom = useCallback(() => {
    socketRef.current?.emit("leave-room");
  }, []);

  const setTTL = useCallback((ttlMinutes: number) => {
    socketRef.current?.emit("set-ttl", { ttlMinutes });
  }, []);

  return {
    ...state,
    socketRef,
    sendMessage,
    startTyping,
    stopTyping,
    leaveRoom,
    setTTL,
  };
}
