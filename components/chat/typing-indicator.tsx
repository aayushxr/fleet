export function TypingIndicator({
  usernames,
  currentUser,
}: {
  usernames: string[];
  currentUser: string;
}) {
  const others = usernames.filter((u) => u !== currentUser);

  if (others.length === 0) {
    return <div className="h-5" />;
  }

  const text =
    others.length === 1
      ? `${others[0]} is typing...`
      : others.length === 2
        ? `${others[0]} and ${others[1]} are typing...`
        : `${others[0]} and ${others.length - 1} others are typing...`;

  return (
    <div className="h-5 px-4">
      <span className="text-[10px] text-amber-500/40 animate-pulse">{text}</span>
    </div>
  );
}
