import type { Server } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from "@/lib/types";
import { CLEANUP_INTERVAL_MS } from "./constants";
import { store } from "./store";

type IOServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

export function startCleanup(io: IOServer): ReturnType<typeof setInterval> {
  return setInterval(() => {
    const expired = store.expireMessages();
    for (const [roomId, messageIds] of expired) {
      io.to(roomId).emit("messages-expired", messageIds);
    }
    store.cleanupEmptyRooms();
  }, CLEANUP_INTERVAL_MS);
}
