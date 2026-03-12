"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/hooks/use-socket";
import { ChatHeader } from "@/components/chat/chat-header";
import { MessageList } from "@/components/chat/message-list";
import { MessageInput } from "@/components/chat/message-input";
import { UserSidebar } from "@/components/chat/user-sidebar";
import { TypingIndicator } from "@/components/chat/typing-indicator";
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
    sendMessage,
    startTyping,
    stopTyping,
    leaveRoom,
  } = useSocket(username ? decodedRoom : "", username ?? "");

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const handleLeave = () => {
    leaveRoom();
    sessionStorage.removeItem("fleet:username");
    router.push("/");
  };

  if (!username) return null;

  return (
    <div className="flex h-dvh">
      <UserSidebar
        users={users}
        currentUser={username}
        mobile
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
      />
      <UserSidebar users={users} currentUser={username} />

      <div className="flex flex-1 flex-col min-w-0">
        <ChatHeader
          displayName={displayName || decodedRoom}
          userCount={users.length}
          connectionStatus={connectionStatus}
          ttlMinutes={ttlMinutes}
          onLeave={handleLeave}
          onOpenSidebar={() => setSidebarOpen(true)}
        />

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
      </div>
    </div>
  );
}
