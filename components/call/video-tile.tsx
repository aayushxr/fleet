"use client";

import { useEffect, useRef } from "react";
import { MicOff } from "lucide-react";
import { UserAvatar } from "@/components/chat/user-avatar";
import { cn } from "@/lib/utils";

interface VideoTileProps {
  stream: MediaStream | null;
  username: string;
  isMuted: boolean;
  isCameraOff: boolean;
  isSpeaking: boolean;
  connectionState?: RTCPeerConnectionState;
  isLocal?: boolean;
}

export function VideoTile({
  stream,
  username,
  isMuted,
  isCameraOff,
  isSpeaking,
  connectionState,
  isLocal,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const hasVideo = stream && stream.getVideoTracks().some((t) => t.enabled) && !isCameraOff;

  return (
    <div
      className={cn(
        "rounded-lg overflow-hidden bg-zinc-900 relative aspect-video",
        isSpeaking && "ring-2 ring-emerald-500 animate-speaking"
      )}
    >
      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={cn(
            "w-full h-full object-cover",
            isLocal && "scale-x-[-1]"
          )}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-zinc-800">
          <UserAvatar username={username} size="lg" />
        </div>
      )}

      {/* Bottom overlay */}
      <div className="absolute bottom-0 inset-x-0 px-2 py-1.5 bg-gradient-to-t from-black/60 to-transparent flex items-center gap-1.5">
        <span className="text-xs text-white truncate">
          {username}
          {isLocal && " (you)"}
        </span>
        {isMuted && <MicOff className="size-3 text-red-400 shrink-0" />}
      </div>

      {/* Connection state indicator */}
      {!isLocal && connectionState && (
        <div className="absolute top-2 right-2">
          <span
            className={cn(
              "size-2 rounded-full block",
              connectionState === "connected" && "bg-emerald-500",
              connectionState === "connecting" && "bg-amber-500",
              (connectionState === "failed" || connectionState === "disconnected" || connectionState === "closed") &&
                "bg-red-500"
            )}
          />
        </div>
      )}
    </div>
  );
}
