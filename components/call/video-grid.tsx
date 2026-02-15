"use client";

import type { PeerState } from "@/hooks/use-webrtc";
import { VideoTile } from "./video-tile";
import { cn } from "@/lib/utils";

interface VideoGridProps {
  localStream: MediaStream | null;
  localUsername: string;
  isMuted: boolean;
  isCameraOff: boolean;
  peers: Map<string, PeerState>;
}

function getGridCols(count: number): string {
  if (count <= 1) return "grid-cols-1";
  if (count <= 2) return "grid-cols-2";
  if (count <= 4) return "grid-cols-2";
  return "grid-cols-3";
}

export function VideoGrid({
  localStream,
  localUsername,
  isMuted,
  isCameraOff,
  peers,
}: VideoGridProps) {
  const totalTiles = 1 + peers.size;
  const gridCols = getGridCols(totalTiles);

  return (
    <div
      className={cn(
        "grid gap-2 p-4 flex-1 auto-rows-fr max-md:grid-cols-2",
        gridCols
      )}
    >
      <VideoTile
        stream={localStream}
        username={localUsername}
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        isSpeaking={false}
        isLocal
      />
      {Array.from(peers.values()).map((peer) => (
        <VideoTile
          key={peer.userId}
          stream={peer.stream}
          username={peer.username}
          isMuted={peer.isMuted}
          isCameraOff={peer.isCameraOff}
          isSpeaking={peer.isSpeaking}
          connectionState={peer.connectionState}
        />
      ))}
    </div>
  );
}
