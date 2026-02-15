import type { SystemEvent } from "@/lib/types";

function label(event: SystemEvent): string {
  switch (event.type) {
    case "join":
      return `${event.username} joined`;
    case "leave":
      return `${event.username} left`;
    case "ttl-change":
      return `${event.username} set message TTL to ${event.content} min`;
    case "call-join":
      return `${event.username} ${event.content}`;
    case "call-leave":
      return `${event.username} ${event.content}`;
    default:
      return "";
  }
}

export function SystemMessage({ event }: { event: SystemEvent }) {
  return (
    <div className="flex items-center gap-3 py-2 px-4">
      <div className="h-px flex-1 bg-white/[0.04]" />
      <span className="text-[10px] uppercase tracking-wider text-white/20 shrink-0">
        {label(event)}
      </span>
      <div className="h-px flex-1 bg-white/[0.04]" />
    </div>
  );
}
