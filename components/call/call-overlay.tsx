"use client";

import { useState, type ReactNode } from "react";
import type { PeerState } from "@/hooks/use-webrtc";
import { VideoGrid } from "./video-grid";
import { CallControls } from "./call-controls";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface CallOverlayProps {
  localStream: MediaStream | null;
  localUsername: string;
  peers: Map<string, PeerState>;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onLeaveCall: () => void;
  children: ReactNode;
}

export function CallOverlay({
  localStream,
  localUsername,
  peers,
  isMuted,
  isCameraOff,
  isScreenSharing,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  onLeaveCall,
  children,
}: CallOverlayProps) {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 relative min-h-0">
      <VideoGrid
        localStream={localStream}
        localUsername={localUsername}
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        peers={peers}
      />

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
        <CallControls
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          isScreenSharing={isScreenSharing}
          onToggleMute={onToggleMute}
          onToggleCamera={onToggleCamera}
          onToggleScreenShare={onToggleScreenShare}
          onLeaveCall={onLeaveCall}
          onToggleChat={() => setChatOpen(true)}
        />
      </div>

      <Sheet open={chatOpen} onOpenChange={setChatOpen}>
        <SheetContent side="right" className="w-80 sm:w-96 p-0 flex flex-col">
          <SheetHeader className="border-b">
            <SheetTitle className="text-sm">Chat</SheetTitle>
          </SheetHeader>
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {children}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
