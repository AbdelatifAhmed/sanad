"use client";

import React from "react";
import { ChatUser } from "../types";
import { BookingStatus, Weekday } from "../../../types";
import { useTranslations, useLocale } from "next-intl";
import { ArrowLeft, ArrowRight, Calendar, ExternalLink } from "lucide-react";
import Link from "next/link";

interface ChatHeaderProps {
  otherUser: ChatUser | null;
  bookingStatus: BookingStatus | null;
  startDate: string | null;
  endDate: string | null;
  bookingId: string;
  onBack: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  otherUser,
  bookingStatus,
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

  const formatBookingDates = (start?: string | null, end?: string | null) => {
    if (!start || !end) return "";
    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
    const sDate = new Date(start).toLocaleDateString(locale, options);
    const eDate = new Date(end).toLocaleDateString(locale, options);
    return `${sDate} - ${eDate}`;
  };

  const userRolePath = otherUser?.role === "companion" ? "family" : "companion";

  return (
    <div className="w-full sticky top-0 z-20 bg-stitch-surface/90 backdrop-blur-md border-b border-stitch-outline/10 px-6 py-4 flex items-center justify-between gap-4 shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
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
            {bookingStatus && (
              <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border shrink-0 ${getStatusColor(bookingStatus)}`}>
                {t(`bookingStatus_${bookingStatus}` as any) || bookingStatus}
              </span>
            )}
          </div>
          
          {/* Subtext: Dates / Role */}
          <p className="text-xs text-stitch-on-surface-variant/70 flex items-center gap-1.5 truncate">
            <Calendar className="w-3.5 h-3.5 text-stitch-on-surface-variant/50" />
            <span>{formatBookingDates(startDate, endDate)}</span>
          </p>
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href={`/${userRolePath}/bookings/${bookingId}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-sand-low hover:bg-stitch-secondary-container/15 hover:text-stitch-on-secondary-container text-stitch-on-surface-variant border border-stitch-outline/20 transition-all shadow-sm"
        >
          <span>{t("bookingDetails")}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
