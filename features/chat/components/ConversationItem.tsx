"use client";

import React from "react";
import { Conversation } from "../types";
import { useLocale, useTranslations } from "next-intl";

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  currentUserId: string | null;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  onClick,
  currentUserId,
}) => {
  const locale = useLocale();
  const t = useTranslations("chat");
  const { otherUser, lastMessage, unreadCount, bookingStatus } = conversation;

  // Formatting helpers
  const formatMsgTime = (isoString?: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const now = new Date();
    
    // If today, show time. If earlier, show date
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", hour12: true });
    }
    return date.toLocaleDateString(locale, { month: "short", day: "numeric" });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "approved":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "completed":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
      case "pending":
      case "pending_payment":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      default:
        return "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20";
    }
  };

  const isRtl = locale === "ar";

  return (
    <button
      onClick={onClick}
      className={`w-full text-start flex items-center gap-4 p-4 transition-all duration-300 rounded-2xl border relative overflow-hidden group ${
        isActive
          ? "bg-stitch-secondary-container/15 border-stitch-primary/30 shadow-soft"
          : "bg-transparent border-transparent hover:bg-sand-low"
      }`}
    >
      {/* Active Left Indicator Line */}
      {isActive && (
        <div className="absolute top-0 bottom-0 start-0 w-1 bg-stitch-primary rounded-e-lg" />
      )}
      {/* Avatar Container */}
      <div className="relative shrink-0">
        {otherUser?.avatar?.url ? (
          <img
            src={otherUser.avatar.url}
            alt={otherUser.name}
            className="w-12 h-12 rounded-2xl object-cover ring-2 ring-stitch-surface shadow-sm"
          />
        ) : (
          <div className="w-12 h-12 rounded-2xl bg-stitch-primary/10 text-stitch-primary font-semibold flex items-center justify-center text-sm ring-2 ring-stitch-surface shadow-sm">
            {otherUser ? getInitials(otherUser.name) : "?"}
          </div>
        )}
        
        {/* Connection status or Active indicator */}
        <div className={`absolute -bottom-1 -end-1 w-3.5 h-3.5 rounded-full border-2 border-stitch-surface ${
          bookingStatus === "active" ? "bg-emerald-500" : "bg-neutral-400"
        }`} />
      </div>

      {/* Info Container */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-1">
          <h3 className="font-semibold text-stitch-on-surface truncate">
            {otherUser ? otherUser.name : "User"}
          </h3>
          <span className="text-xs text-stitch-on-surface-variant/60 whitespace-nowrap">
            {lastMessage ? formatMsgTime(lastMessage.createdAt) : ""}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          {/* Last message preview */}
          <p className={`text-sm truncate flex-1 ${
            unreadCount > 0
              ? "text-stitch-on-surface font-semibold"
              : "text-stitch-on-surface-variant/70"
          }`}>
            {lastMessage ? (
              <>
                {lastMessage.senderId === currentUserId && (
                  <span className="text-stitch-on-surface-variant/50 font-normal me-1">
                    {isRtl ? "أنت:" : "You:"}
                  </span>
                )}
                {lastMessage.messageText}
              </>
            ) : (
              <span className="italic text-stitch-on-surface-variant/40 text-xs">
                {isRtl ? "لا توجد رسائل بعد" : "No messages yet"}
              </span>
            )}
          </p>

          {/* Badges Container */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Booking status badge */}
            <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border ${getStatusColor(bookingStatus)}`}>
              {t(`bookingStatus_${bookingStatus}` as any) || bookingStatus}
            </span>

            {/* Unread badge */}
            {unreadCount > 0 && (
              <span className="bg-stitch-primary text-white text-[10px] font-bold min-w-5 h-5 rounded-full flex items-center justify-center px-1 border border-stitch-surface animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};
