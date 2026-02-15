"use client";

import { Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface CallControlsProps {
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onLeaveCall: () => void;
  onToggleChat: () => void;
}

export function CallControls({
  isMuted,
  isCameraOff,
  isScreenSharing,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  onLeaveCall,
  onToggleChat,
}: CallControlsProps) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-background/80 backdrop-blur border px-4 py-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleMute}
            className={cn(isMuted && "bg-muted")}
          >
            {isMuted ? <MicOff className="size-4" /> : <Mic className="size-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{isMuted ? "Unmute" : "Mute"}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleCamera}
            className={cn(isCameraOff && "bg-muted")}
          >
            {isCameraOff ? <VideoOff className="size-4" /> : <Video className="size-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{isCameraOff ? "Turn on camera" : "Turn off camera"}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleScreenShare}
            className={cn(isScreenSharing && "bg-muted")}
          >
            <MonitorUp className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{isScreenSharing ? "Stop sharing" : "Share screen"}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleChat}
          >
            <MessageSquare className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Show chat</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="destructive" size="icon-sm" onClick={onLeaveCall}>
            <PhoneOff className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Leave call</TooltipContent>
      </Tooltip>
    </div>
  );
}
