"use client";

import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface CallButtonProps {
  callActive: boolean;
  inCall: boolean;
  onStartCall: () => void;
  onJoinCall: () => void;
}

export function CallButton({ callActive, inCall, onStartCall, onJoinCall }: CallButtonProps) {
  if (inCall) return null;

  if (callActive) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" onClick={onJoinCall} className="gap-1.5 text-xs h-7">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
            </span>
            <Phone className="size-3.5" />
            Join
          </Button>
        </TooltipTrigger>
        <TooltipContent>Join the call</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" onClick={onStartCall}>
          <Phone className="size-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Start a call</TooltipContent>
    </Tooltip>
  );
}
