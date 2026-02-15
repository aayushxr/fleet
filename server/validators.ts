import { z } from "zod/v4";

function sanitize(s: string): string {
  return s.trim().replace(/\s+/g, " ").replace(/[\x00-\x1F\x7F]/g, "");
}

const sanitizedString = z.string().transform(sanitize);

export const joinRoomSchema = z.object({
  roomName: sanitizedString.pipe(
    z.string().min(2).max(30)
  ),
  username: sanitizedString.pipe(
    z.string().min(2).max(20).regex(/^[a-zA-Z0-9_-]+$/)
  ),
});

export const sendMessageSchema = z.object({
  content: sanitizedString.pipe(
    z.string().min(1).max(1000)
  ),
});

export const setTTLSchema = z.object({
  ttlMinutes: z.number().int().min(1).max(1440),
});
