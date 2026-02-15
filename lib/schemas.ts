import { z } from "zod/v4";

export const joinFormSchema = z.object({
  username: z
    .string()
    .min(2, "At least 2 characters")
    .max(20, "At most 20 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Only letters, numbers, hyphens, and underscores"),
  roomName: z
    .string()
    .min(2, "At least 2 characters")
    .max(30, "At most 30 characters")
    .regex(/^[a-zA-Z0-9 _-]+$/, "Only letters, numbers, spaces, hyphens, and underscores"),
});

export type JoinFormValues = z.infer<typeof joinFormSchema>;
