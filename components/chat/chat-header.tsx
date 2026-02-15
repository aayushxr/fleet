"use client";

import { Copy, LogOut, Menu, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { ConnectionStatus } from "./connection-status";

interface ChatHeaderProps {
  displayName: string;
  userCount: number;
  connectionStatus: "connecting" | "connected" | "disconnected" | "reconnecting";
  ttlMinutes: number;
  onLeave: () => void;
  onOpenSidebar?: () => void;
}

export function ChatHeader({
  displayName,
  userCount,
  connectionStatus,
  ttlMinutes,
  onLeave,
  onOpenSidebar,
}: ChatHeaderProps) {
  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Room link copied to clipboard");
  };

  return (
    <header className="flex items-center gap-3 border-b px-4 py-3 h-14">
      {onOpenSidebar && (
        <Button variant="ghost" size="icon-sm" onClick={onOpenSidebar} className="md:hidden">
          <Menu className="size-4" />
        </Button>
      )}

      <div className="flex items-center gap-2 min-w-0 flex-1">
        <ConnectionStatus status={connectionStatus} />
        <h1 className="font-semibold text-sm truncate">{displayName}</h1>
        <Badge variant="secondary" className="text-[10px] font-normal">
          {userCount} {userCount === 1 ? "user" : "users"}
        </Badge>
      </div>

      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 text-xs text-muted-foreground px-2">
              <Clock className="size-3" />
              <span>{ttlMinutes}m</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>Messages expire after {ttlMinutes} minutes</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-4" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={copyLink}>
              <Copy className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy room link</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={onLeave}>
              <LogOut className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Leave room</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
