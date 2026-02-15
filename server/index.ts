import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from "@/lib/types";
import { registerSocketHandlers } from "./socket-handler";
import { registerCallHandlers } from "./call-handler";
import { startCleanup } from "./cleanup";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME ?? "localhost";
const port = parseInt(process.env.PORT ?? "3000", 10);

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(
    httpServer,
    {
      path: "/socket.io/",
      addTrailingSlash: false,
      cors: dev ? { origin: "*" } : undefined,
    }
  );

  registerSocketHandlers(io);
  registerCallHandlers(io);
  const cleanupInterval = startCleanup(io);

  httpServer.listen(port, () => {
    console.log(`> Fleet running on http://${hostname}:${port}`);
  });

  const shutdown = () => {
    console.log("\n> Shutting down...");
    clearInterval(cleanupInterval);
    io.close();
    httpServer.close(() => {
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
});
