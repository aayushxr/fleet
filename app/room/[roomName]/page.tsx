"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/hooks/use-socket";
import { useWebRTC } from "@/hooks/use-webrtc";
import { ChatHeader } from "@/components/chat/chat-header";
import { MessageList } from "@/components/chat/message-list";
import { MessageInput } from "@/components/chat/message-input";
import { UserSidebar } from "@/components/chat/user-sidebar";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { CallOverlay } from "@/components/call/call-overlay";
import { CallBanner } from "@/components/call/call-banner";
import { toast } from "sonner";

export default function RoomPage({
  params,
}: {
  params: Promise<{ roomName: string }>;
}) {
  const { roomName } = use(params);
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("fleet:username");
    if (!stored) {
      router.replace("/");
      return;
    }
    setUsername(stored);
  }, [router]);

  const decodedRoom = decodeURIComponent(roomName);

  const {
    messages,
    users,
    displayName,
    ttlMinutes,
    typingUsers,
    connectionStatus,
    error,
    userId,
    callState,
    socketRef,
    sendMessage,
    startTyping,
    stopTyping,
    leaveRoom,
  } = useSocket(username ? decodedRoom : "", username ?? "");

  const webrtc = useWebRTC(socketRef, userId, callState);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  useEffect(() => {
    if (webrtc.error) toast.error(webrtc.error);
  }, [webrtc.error]);

  const handleLeave = () => {
    if (webrtc.inCall) {
      webrtc.leaveCall();
    }
    leaveRoom();
    sessionStorage.removeItem("fleet:username");
    router.push("/");
  };

  if (!username) return null;

  const callParticipantIds = callState.participants.map((p) => p.userId);

  const chatContent = (
    <>
      <MessageList
        messages={messages}
        currentUser={username}
        ttlMinutes={ttlMinutes}
      />
      <TypingIndicator usernames={typingUsers} currentUser={username} />
      <MessageInput
        onSend={sendMessage}
        onTypingStart={startTyping}
        onTypingStop={stopTyping}
        disabled={connectionStatus !== "connected"}
      />
    </>
  );

  return (
    <div className="relative flex h-dvh bg-background">
      {/* Grain texture */}
      <div
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      <UserSidebar
        users={users}
        currentUser={username}
        mobile
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        callParticipantIds={callParticipantIds}
      />
      <UserSidebar
        users={users}
        currentUser={username}
        callParticipantIds={callParticipantIds}
      />

      <div className="flex flex-1 flex-col min-w-0">
        <ChatHeader
          displayName={displayName || decodedRoom}
          userCount={users.length}
          connectionStatus={connectionStatus}
          ttlMinutes={ttlMinutes}
          onLeave={handleLeave}
          onOpenSidebar={() => setSidebarOpen(true)}
          callActive={callState.active}
          inCall={webrtc.inCall}
          onStartCall={webrtc.startCall}
          onJoinCall={webrtc.joinCall}
        />

        {webrtc.inCall ? (
          <CallOverlay
            localStream={webrtc.localStream}
            localUsername={username}
            peers={webrtc.peers}
            isMuted={webrtc.isMuted}
            isCameraOff={webrtc.isCameraOff}
            isScreenSharing={webrtc.isScreenSharing}
            onToggleMute={webrtc.toggleMute}
            onToggleCamera={webrtc.toggleCamera}
            onToggleScreenShare={webrtc.toggleScreenShare}
            onLeaveCall={webrtc.leaveCall}
          >
            {chatContent}
          </CallOverlay>
        ) : (
          <>
            {callState.active && (
              <CallBanner callState={callState} onJoinCall={webrtc.joinCall} />
            )}
            {chatContent}
          </>
        )}
      </div>
    </div>
  );
}
