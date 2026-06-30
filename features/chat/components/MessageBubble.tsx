"use client";

import React from "react";
import { ChatMessage } from "../types";
import { useLocale } from "next-intl";

interface MessageBubbleProps {
  message: ChatMessage;
  isSelf: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isSelf }) => {
  const locale = useLocale();

  const formatMsgTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  return (
    <div className={`flex w-full ${isSelf ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[70%] sm:max-w-[60%] flex flex-col ${isSelf ? "items-end" : "items-start"}`}>
        {/* Message Card */}
        <div
          className={`px-5 py-3.5 rounded-3xl text-sm leading-relaxed break-words shadow-sm transition-all duration-300 hover:shadow-soft ${
            isSelf
              ? "bg-gradient-to-br from-stitch-primary to-stitch-primary/85 text-white rounded-tr-sm font-medium"
              : "bg-stitch-surface text-stitch-on-surface rounded-tl-sm border border-stitch-outline/15"
          }`}
        >
          {message.messageText}
        </div>

        {/* Message Timestamp */}
        <span className="text-[10px] text-stitch-on-surface-variant/40 mt-1.5 px-2 whitespace-nowrap font-medium">
          {formatMsgTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
};
