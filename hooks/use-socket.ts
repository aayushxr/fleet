"use client";

import { useReducer, useRef, useEffect, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type {
  ChatEntry,
  User,
  RoomState,
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
  | { type: "error"; payload: string };

const initialState: SocketState = {
  messages: [],
  users: [],
  roomName: "",
  displayName: "",
  ttlMinutes: 30,
  typingUsers: [],
  connectionStatus: "connecting",
  error: null,
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
    sendMessage,
    startTyping,
    stopTyping,
    leaveRoom,
    setTTL,
  };
}
