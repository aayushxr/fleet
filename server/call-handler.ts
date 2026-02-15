import type { Server, Socket } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from "@/lib/types";
import { store } from "./store";

type IOServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
type IOSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

export function handleCallLeave(io: IOServer, socket: IOSocket): void {
  const result = store.leaveCall(socket.id);
  if (result) {
    io.to(result.roomId).emit("call-state-changed", result.callState);
    io.to(result.roomId).emit("new-message", result.entry);
  }
}

export function registerCallHandlers(io: IOServer): void {
  io.on("connection", (socket: IOSocket) => {
    socket.on("call-start", () => {
      const roomId = socket.data.roomId;
      if (!roomId || !socket.data.username) {
        socket.emit("error", { message: "Not in a room" });
        return;
      }

      if (store.isInCall(socket.id)) {
        socket.emit("error", { message: "Already in a call" });
        return;
      }

      const result = store.startCall(roomId, socket.id, socket.data.username);
      if (!result) {
        socket.emit("error", { message: "A call is already in progress" });
        return;
      }

      io.to(roomId).emit("call-state-changed", result.callState);
      io.to(roomId).emit("new-message", result.entry);
    });

    socket.on("call-join", () => {
      const roomId = socket.data.roomId;
      if (!roomId || !socket.data.username) {
        socket.emit("error", { message: "Not in a room" });
        return;
      }

      if (store.isInCall(socket.id)) {
        socket.emit("error", { message: "Already in a call" });
        return;
      }

      const result = store.joinCall(roomId, socket.id, socket.data.username);
      if (!result) {
        socket.emit("error", { message: "Cannot join call (full or not active)" });
        return;
      }

      io.to(roomId).emit("call-state-changed", result.callState);
      io.to(roomId).emit("new-message", result.entry);
    });

    socket.on("call-leave", () => {
      handleCallLeave(io, socket);
    });

    socket.on("call-signal-offer", (payload) => {
      io.to(payload.targetUserId).emit("call-signal-offer", {
        fromUserId: socket.id,
        sdp: payload.sdp,
      });
    });

    socket.on("call-signal-answer", (payload) => {
      io.to(payload.targetUserId).emit("call-signal-answer", {
        fromUserId: socket.id,
        sdp: payload.sdp,
      });
    });

    socket.on("call-signal-ice-candidate", (payload) => {
      io.to(payload.targetUserId).emit("call-signal-ice-candidate", {
        fromUserId: socket.id,
        candidate: payload.candidate,
      });
    });
  });
}
