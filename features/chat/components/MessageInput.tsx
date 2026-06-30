"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Send, Smile } from "lucide-react";

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, disabled }) => {
  const t = useTranslations("chat");
  const locale = useLocale();
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isRtl = locale === "ar";

  // Auto-grow height of textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [text]);

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSendMessage(text);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full bg-stitch-surface border-t border-stitch-outline/10 px-4 py-3 md:px-6 md:py-4 shrink-0">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-end gap-3"
      >
        {/* Text Input area */}
        <div className="flex-1 bg-sand-low border border-stitch-outline/20 rounded-2xl flex items-end px-4.5 py-2.5 focus-within:ring-4 focus-within:ring-stitch-primary/10 focus-within:border-stitch-primary focus-within:bg-stitch-surface transition-all duration-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("inputPlaceholder")}
            disabled={disabled}
            className="flex-1 max-h-[120px] py-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-sm text-stitch-on-surface placeholder-stitch-on-surface-variant/40 resize-none min-h-[24px]"
          />
        </div>

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          className={`p-4 rounded-full bg-gradient-to-br from-stitch-primary to-stitch-primary/90 text-white hover:scale-105 active:scale-95 transition-all duration-300 shadow-md shadow-stitch-primary/20 disabled:bg-sand-high disabled:text-stitch-on-surface-variant/30 disabled:shadow-none disabled:transform-none disabled:cursor-not-allowed shrink-0 flex items-center justify-center ${
            isRtl ? "rotate-180" : ""
          }`}
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};
