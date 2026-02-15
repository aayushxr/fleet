import type { SystemEvent } from "@/lib/types";

function label(event: SystemEvent): string {
  switch (event.type) {
    case "join":
      return `${event.username} joined`;
    case "leave":
      return `${event.username} left`;
    case "ttl-change":
      return `${event.username} set message TTL to ${event.content} min`;
    default:
      return "";
  }
}

export function SystemMessage({ event }: { event: SystemEvent }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs text-muted-foreground shrink-0">
        {label(event)}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
