"use client";

import React from "react";
import { ChatUser } from "../types";
import { useTranslations, useLocale } from "next-intl";
import { ArrowLeft, ArrowRight, Calendar } from "lucide-react";
import Link from "next/link";

interface ChatHeaderProps {
  otherUser: ChatUser | null;
  startDate: string | null;
  endDate: string | null;
  bookingId: string;
  onBack: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  otherUser,
  startDate,
  endDate,
  bookingId,
  onBack,
}) => {
  const locale = useLocale();
  const t = useTranslations("chat");
  const isRtl = locale === "ar";

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const formatBookingDates = (start?: string | null, end?: string | null) => {
    if (!start || !end) return "";
    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
    const sDate = new Date(start).toLocaleDateString(locale, options);
    const eDate = new Date(end).toLocaleDateString(locale, options);
    return `${sDate} - ${eDate}`;
  };

  return (
    <div className="w-full sticky top-0 z-20 bg-stitch-surface/90 backdrop-blur-md border-b border-stitch-outline/10 px-4 py-3 md:px-6 md:py-4 flex items-center justify-between gap-4 shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
      {/* Left side: Avatar & User Info */}
      <div className="flex items-center gap-3.5 min-w-0">
        {/* Back button for mobile screens */}
        <button
          onClick={onBack}
          className="md:hidden p-2 -ms-2 rounded-xl text-stitch-on-surface-variant/70 hover:bg-sand-low transition-colors"
          aria-label={t("back")}
        >
          {isRtl ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
        </button>

        {/* Avatar */}
        <div className="relative shrink-0">
          {otherUser?.avatar?.url ? (
            <img
              src={otherUser.avatar.url}
              alt={otherUser.name}
              className="w-11 h-11 rounded-2xl object-cover ring-2 ring-stitch-outline/10 shadow-sm"
            />
          ) : (
            <div className="w-11 h-11 rounded-2xl bg-stitch-primary/10 text-stitch-primary font-semibold flex items-center justify-center text-sm ring-2 ring-stitch-outline/10 shadow-sm">
              {otherUser ? getInitials(otherUser.name) : "?"}
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="font-bold text-stitch-on-surface truncate text-base leading-snug">
              {otherUser ? otherUser.name : "User"}
            </h2>
          </div>
          
          {/* Subtext: Dates / Role */}
          {startDate && endDate && (
            <p className="text-xs text-stitch-on-surface-variant/70 flex items-center gap-1.5 truncate">
              <Calendar className="w-3.5 h-3.5 text-stitch-on-surface-variant/50" />
              <span>{formatBookingDates(startDate, endDate)}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
