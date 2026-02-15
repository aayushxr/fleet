"use client";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Status = "connecting" | "connected" | "disconnected" | "reconnecting";

const config: Record<Status, { color: string; pulse: boolean; label: string }> = {
  connected: { color: "bg-emerald-500", pulse: false, label: "Connected" },
  connecting: { color: "bg-amber-500", pulse: true, label: "Connecting..." },
  reconnecting: { color: "bg-amber-500", pulse: true, label: "Reconnecting..." },
  disconnected: { color: "bg-red-500", pulse: false, label: "Disconnected" },
};

export function ConnectionStatus({ status }: { status: Status }) {
  const { color, pulse, label } = config[status];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-block size-2 rounded-full shrink-0",
            color,
            pulse && "animate-pulse"
          )}
        />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
