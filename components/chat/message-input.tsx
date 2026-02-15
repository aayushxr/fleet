"use client";

import { useState, useCallback, useRef } from "react";
import { SendHorizontal } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MAX_MESSAGE_LENGTH } from "@/server/constants";

interface MessageInputProps {
  onSend: (content: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, onTypingStart, onTypingStop, disabled }: MessageInputProps) {
  const [value, setValue] = useState("");
  const composingRef = useRef(false);

  const send = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
    onTypingStop();
  }, [value, onSend, onTypingStop]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !composingRef.current) {
      e.preventDefault();
      send();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    if (v.length > MAX_MESSAGE_LENGTH) return;
    setValue(v);
    if (v.trim()) onTypingStart();
    else onTypingStop();
  };

  return (
    <div className="border-t border-white/[0.06] px-4 py-3">
      <div className="flex items-end gap-2">
        <Textarea
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => (composingRef.current = true)}
          onCompositionEnd={() => (composingRef.current = false)}
          placeholder="Type a message..."
          disabled={disabled}
          className="min-h-[40px] max-h-[120px] resize-none border-white/[0.06] bg-white/[0.03] text-white/90 placeholder:text-white/20 focus-visible:border-white/15 focus-visible:ring-white/5"
          rows={1}
        />
        <Button
          size="icon"
          onClick={send}
          disabled={disabled || !value.trim()}
          className="shrink-0 bg-white/[0.08] text-white/70 hover:bg-white/[0.12] hover:text-white/90 border-0"
        >
          <SendHorizontal className="size-4" />
        </Button>
      </div>
      <div className="flex justify-end pt-1">
        <span className="text-[10px] text-white/20">
          {value.length}/{MAX_MESSAGE_LENGTH}
        </span>
      </div>
    </div>
  );
}
