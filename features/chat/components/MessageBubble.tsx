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

  if (message.isSystemAlert) {
    return (
      <div className="flex w-full justify-center my-3 animate-fade-in">
        <div className="max-w-[85%] bg-amber-500/10 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-500/25 px-5 py-3 rounded-2xl text-xs flex items-start gap-2.5 shadow-soft">
          <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5 select-none">
            security
          </span>
          <div className="space-y-1 text-start leading-relaxed">
            <span className="font-bold block">
              {locale === "ar" ? "تنبيه أمني للمحادثة" : "Security Chat Alert"}
            </span>
            <span className="block font-medium">
              {message.messageText}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex w-full ${isSelf ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[70%] sm:max-w-[60%] flex flex-col ${isSelf ? "items-end" : "items-start"}`}>
        {/* Message Card */}
        <div
          className={`px-5 py-3.5 rounded-3xl text-sm leading-relaxed break-words [overflow-wrap:anywhere] shadow-sm transition-all duration-300 hover:shadow-soft ${
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
