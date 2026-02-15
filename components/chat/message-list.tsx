"use client";

import { useEffect, useState } from "react";
import type { ChatEntry } from "@/lib/types";
import { MessageBubble } from "./message-bubble";
import { SystemMessage } from "./system-message";
import { useAutoScroll } from "@/hooks/use-auto-scroll";

interface MessageListProps {
  messages: ChatEntry[];
  currentUser: string;
  ttlMinutes: number;
}

export function MessageList({ messages, currentUser, ttlMinutes }: MessageListProps) {
  const { sentinelRef, containerRef, handleScroll } = useAutoScroll([messages.length]);
  const [, setTick] = useState(0);

  // Force re-render every 10s so TTL opacity updates
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto"
    >
      <div className="flex flex-col gap-1 py-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-12">
            No messages yet. Start the conversation.
          </p>
        )}
        {messages.map((entry) =>
          entry.kind === "system" ? (
            <SystemMessage key={entry.id} event={entry} />
          ) : (
            <MessageBubble
              key={entry.id}
              message={entry}
              isOwn={entry.sender === currentUser}
              ttlMinutes={ttlMinutes}
            />
          )
        )}
        <div ref={sentinelRef} />
      </div>
    </div>
  );
}
