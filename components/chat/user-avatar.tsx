import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  username: string;
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function UserAvatar({ username, size = "default", className }: UserAvatarProps) {
  return (
    <Avatar size={size} className={cn(className)}>
      <AvatarFallback className="bg-white/[0.08] text-white/40 text-xs uppercase">
        {username.charAt(0)}
      </AvatarFallback>
    </Avatar>
  );
}
