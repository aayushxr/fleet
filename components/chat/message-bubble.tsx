"use client";

import type { Message } from "@/lib/types";
import { UserAvatar } from "./user-avatar";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useRelativeTime } from "@/hooks/use-relative-time";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  ttlMinutes: number;
}

function computeOpacity(timestamp: number, ttlMinutes: number): number {
  const ttlMs = ttlMinutes * 60_000;
  const expiresAt = timestamp + ttlMs;
  const now = Date.now();
  const remaining = expiresAt - now;
  const total = ttlMs;
  return Math.max(0.15, remaining / total);
}

export function MessageBubble({ message, isOwn, ttlMinutes }: MessageBubbleProps) {
  const relative = useRelativeTime(message.timestamp);
  const opacity = computeOpacity(message.timestamp, ttlMinutes);

  return (
    <div
      className={cn("flex gap-2 px-4", isOwn ? "flex-row-reverse" : "flex-row")}
      style={{ opacity }}
    >
      {!isOwn && <UserAvatar username={message.sender} size="sm" className="mt-1" />}
      <div
        className={cn(
          "flex flex-col gap-0.5 max-w-[70%] md:max-w-[70%]",
          isOwn ? "items-end" : "items-start"
        )}
        style={{ maxWidth: "min(70%, 32rem)" }}
      >
        {!isOwn && (
          <span className="text-[10px] uppercase tracking-wider text-white/35 font-medium px-1">
            {message.sender}
          </span>
        )}
        <div
          className={cn(
            "rounded-lg px-3 py-2 text-sm ttl-fade break-words whitespace-pre-wrap",
            isOwn
              ? "bg-white/[0.1] text-white/90"
              : "bg-white/[0.05] text-white/75"
          )}
        >
          {message.content}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-[10px] text-white/20 px-1 cursor-default">
              {relative}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {new Date(message.timestamp).toLocaleString()}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
