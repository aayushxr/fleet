"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNowStrict } from "date-fns";

export function useRelativeTime(timestamp: number, intervalMs = 10_000): string {
  const [relative, setRelative] = useState(() =>
    formatDistanceToNowStrict(timestamp, { addSuffix: true })
  );

  useEffect(() => {
    const id = setInterval(() => {
      setRelative(formatDistanceToNowStrict(timestamp, { addSuffix: true }));
    }, intervalMs);
    return () => clearInterval(id);
  }, [timestamp, intervalMs]);

  return relative;
}
