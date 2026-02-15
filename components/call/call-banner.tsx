"use client";

import type { CallState } from "@/lib/types";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CallBannerProps {
  callState: CallState;
  onJoinCall: () => void;
}

export function CallBanner({ callState, onJoinCall }: CallBannerProps) {
  if (!callState.active) return null;

  const count = callState.participants.length;

  return (
    <div className="h-8 border-b bg-emerald-500/10 flex items-center justify-between px-4">
      <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400">
        <Phone className="size-3" />
        <span>
          Call in progress — {count} {count === 1 ? "participant" : "participants"}
        </span>
      </div>
      <Button variant="ghost" size="sm" onClick={onJoinCall} className="h-5 text-xs px-2">
        Join
      </Button>
    </div>
  );
}
