"use client";

import type { User } from "@/lib/types";
import { Phone } from "lucide-react";
import { UserAvatar } from "./user-avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface UserSidebarProps {
  users: User[];
  currentUser: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  mobile?: boolean;
  callParticipantIds?: string[];
}

function UserList({ users, currentUser, callParticipantIds = [] }: { users: User[]; currentUser: string; callParticipantIds?: string[] }) {
  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col gap-0.5 p-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/30 px-2 pb-2">
          Online — {users.length}
        </p>
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-white/[0.04]"
          >
            <div className="relative">
              <UserAvatar username={user.username} size="sm" />
              <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
            </div>
            <span className="text-sm text-white/70 truncate">
              {user.username}
              {user.username === currentUser && (
                <span className="text-white/30 ml-1 text-xs">(you)</span>
              )}
            </span>
            {callParticipantIds.includes(user.id) && (
              <Phone className="size-3 text-white/30 shrink-0 ml-auto" />
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

export function UserSidebar({ users, currentUser, open, onOpenChange, mobile, callParticipantIds = [] }: UserSidebarProps) {
  if (mobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-64 p-0 bg-[oklch(0.055_0.003_286)] border-white/[0.06]">
          <SheetHeader className="border-b border-white/[0.06]">
            <SheetTitle className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/40">People</SheetTitle>
          </SheetHeader>
          <UserList users={users} currentUser={currentUser} callParticipantIds={callParticipantIds} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className="hidden md:flex w-60 border-r border-white/[0.06] flex-col bg-[oklch(0.055_0.003_286)]">
      <div className="border-b border-white/[0.06] px-4 py-3 h-14 flex items-center">
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/40">People</span>
      </div>
      <UserList users={users} currentUser={currentUser} callParticipantIds={callParticipantIds} />
    </aside>
  );
}
