"use client";

import type { User } from "@/lib/types";
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
}

function UserList({ users, currentUser }: { users: User[]; currentUser: string }) {
  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col gap-1 p-3">
        <p className="text-xs font-medium text-muted-foreground px-2 pb-2">
          Online — {users.length}
        </p>
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-2.5 rounded-md px-2 py-1.5"
          >
            <div className="relative">
              <UserAvatar username={user.username} size="sm" />
              <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
            </div>
            <span className="text-sm truncate">
              {user.username}
              {user.username === currentUser && (
                <span className="text-muted-foreground ml-1 text-xs">(you)</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

export function UserSidebar({ users, currentUser, open, onOpenChange, mobile }: UserSidebarProps) {
  if (mobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="border-b">
            <SheetTitle className="text-sm">People</SheetTitle>
          </SheetHeader>
          <UserList users={users} currentUser={currentUser} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className="hidden md:flex w-60 border-r flex-col">
      <div className="border-b px-4 py-3 h-14 flex items-center">
        <span className="text-sm font-semibold">People</span>
      </div>
      <UserList users={users} currentUser={currentUser} />
    </aside>
  );
}
