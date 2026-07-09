"use client";

import React, { useEffect, useRef } from "react";
import { ChatMessage } from "../types";
import { MessageBubble } from "./MessageBubble";
import { useTranslations, useLocale } from "next-intl";

interface MessagesListProps {
  messages: ChatMessage[];
  currentUserId: string | null;
  isLoading: boolean;
  error: string | null;
}

export const MessagesList: React.FC<MessagesListProps> = ({
  messages,
  currentUserId,
  isLoading,
  error,
}) => {
  const t = useTranslations("chat");
  const locale = useLocale();
  const listEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Group messages by day
  const groupMessagesByDate = (msgList: ChatMessage[]) => {
    const groups: { [key: string]: ChatMessage[] } = {};
    
    msgList.forEach((msg) => {
      const dateKey = new Date(msg.createdAt).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(msg);
    });

    return groups;
  };

  const getDayDividerText = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return locale === "ar" ? "اليوم" : "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return locale === "ar" ? "أمس" : "Yesterday";
    }

    return date.toLocaleDateString(locale, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-3 bg-sand/30">
        <div className="w-9 h-9 border-3 border-stitch-primary/20 border-t-stitch-primary rounded-full animate-spin" />
        <span className="text-xs text-stitch-on-surface-variant/50">
          {t("loading")}
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-sand/30">
        <p className="text-sm font-semibold text-red-500 mb-1">{t("errorLoading")}</p>
        <p className="text-xs text-stitch-on-surface-variant/60 max-w-[240px]">{error}</p>
      </div>
    );
  }

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 space-y-6 bg-sand/10">
      {Object.keys(groupedMessages).map((dateKey) => (
        <div key={dateKey} className="space-y-4">
          {/* Day Divider */}
          <div className="flex justify-center my-4">
            <span className="px-3.5 py-1 rounded-full bg-sand-high text-[10px] font-bold text-stitch-on-surface-variant/75 shadow-sm border border-stitch-outline/20">
              {getDayDividerText(dateKey)}
            </span>
          </div>

          {/* Group Messages */}
          {groupedMessages[dateKey].map((msg) => (
            <MessageBubble
              key={msg._id}
              message={msg}
              isSelf={msg.senderId === currentUserId}
            />
          ))}
        </div>
      ))}
      <div ref={listEndRef} />
    </div>
  );
};
