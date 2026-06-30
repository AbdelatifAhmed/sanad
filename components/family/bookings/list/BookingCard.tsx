"use client";

import React from "react";
import { useTranslations, useLocale } from "next-intl";
import { getAvatarUrl } from "@/lib/avatar";
import {
  Calendar,
  Clock,
  User,
  ShieldCheck,
  CreditCard,
  AlertTriangle,
  FileWarning,
  ChevronRight,
  MapPin
} from "lucide-react";
import Link from "next/link";

interface BookingItem {
  _id: string;
  status: "pending" | "pending_payment" | "approved" | "active" | "completed" | "cancelled";
  paymentStatus: "unpaid" | "paid" | "refunded";
  paymentMethod: string;
  totalPrice: number;
  hourlyRateAtBooking: number;
  totalHours: number;
  startDate: string;
  endDate: string;
  workingDays: string[];
  verificationPasscode?: string;
  notes?: string;
  location: {
    readableAddress?: string;
    city?: string;
    governorate?: string;
  };
  companionId: {
    _id: string;
    name: string;
    avatar?: any;
    phone?: string;
  };
  beneficiary?: {
    name: string;
    age: number;
  };
  schedule: Array<{
    _id: string;
    date: string;
    startTime: string;
    endTime: string;
    checkInTime?: string;
    checkOutTime?: string;
    tasksList: Array<{
      title: string;
      isCompleted: boolean;
    }>;
  }>;
  complaints?: Array<{
    _id: string;
    description: string;
    createdAt: string;
  }>;
}

interface BookingCardProps {
  booking: BookingItem;
  late: { isLate: boolean; mins?: number };
  onFileComplaint: (bookingId: string) => void;
  now: Date;
}

export default function BookingCard({
  booking,
  late,
  onFileComplaint,
  now
}: BookingCardProps) {
  const t = useTranslations("familyBookings");
  const locale = useLocale();
  const isRtl = locale === "ar";

  const avatarUrl = getAvatarUrl(booking.companionId.avatar);

  // Database-backed check to see if a complaint has already been submitted for this booking
  const hasComplaintFiled = booking.complaints && booking.complaints.length > 0;

  // Calculate checklist metrics for active shifts
  const todayStr = now.toDateString();
  const activeSlot = booking.schedule?.find(
    (slot) => new Date(slot.date).toDateString() === todayStr
  );
  
  const totalTasks = activeSlot?.tasksList?.length || 0;
  const completedTasks = activeSlot?.tasksList?.filter(t => t.isCompleted).length || 0;
  const taskProgressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="bg-white border border-[#eae7e7] rounded-3xl p-6 transition-all duration-300 shadow-soft hover:shadow-md flex flex-col justify-between">
      <div className="space-y-4">
        {/* Card Top Row */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#f6f3f2] flex items-center justify-center border border-[#bdc9c8]/30 overflow-hidden shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={booking.companionId.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-[#1f8a8a]" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-[#1b1c1c] text-sm md:text-base leading-snug">
                {booking.companionId.name}
              </h3>
              <p className="text-xs text-[#3e4949]/70 mt-0.5">
                {t("verifiedCompanion")}
              </p>
            </div>
          </div>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 capitalize ${
              booking.status === "active"
                ? "bg-emerald-100 text-emerald-800"
                : booking.status === "pending_payment"
                ? "bg-amber-100 text-amber-800"
                : booking.status === "completed"
                ? "bg-gray-100 text-gray-800"
                : booking.status === "approved"
                ? "bg-[#1f8a8a]/10 text-[#1f8a8a]"
                : "bg-rose-100 text-rose-800"
            }`}
          >
            {booking.status === "pending_payment" 
              ? (isRtl ? "في انتظار الدفع" : "pending payment") 
              : booking.status === "approved" 
              ? (isRtl ? "مقبول" : "approved") 
              : booking.status === "completed" 
              ? (isRtl ? "مكتمل" : "completed") 
              : booking.status === "cancelled" 
              ? (isRtl ? "ملغي" : "cancelled") 
              : booking.status}
          </span>
        </div>

        <div className="border-t border-[#bdc9c8]/20 pt-4 space-y-2">
          <div className="flex items-center gap-2 text-xs text-[#3e4949]">
            <Calendar className="w-4 h-4 text-[#1f8a8a] shrink-0" />
            <span>
              {new Date(booking.startDate).toLocaleDateString(isRtl ? "ar-EG" : "en-US", {
                month: "short",
                day: "numeric"
              })}{" "}
              -{" "}
              {new Date(booking.endDate).toLocaleDateString(isRtl ? "ar-EG" : "en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#3e4949]">
            <Clock className="w-4 h-4 text-[#1f8a8a] shrink-0" />
            <span>
              {t("totalHoursLabel", { hours: booking.totalHours })}
            </span>
          </div>
          {booking.location?.readableAddress && (
            <div className="flex items-center gap-2 text-xs text-[#3e4949]">
              <MapPin className="w-4 h-4 text-[#1f8a8a] shrink-0" />
              <span className="truncate">{booking.location.readableAddress}</span>
            </div>
          )}
        </div>

        {/* Verification Codes for upcoming and approved bookings */}
        {booking.verificationPasscode && (booking.status === "approved" || booking.status === "active") && (
          <div className="p-3 bg-[#f6f3f2] border border-[#bdc9c8]/40 rounded-2xl space-y-1.5">
            <p className="text-[11px] font-bold text-[#1f8a8a] flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              {t("verificationCode")}
            </p>
            <p className="text-xs text-[#3e4949] font-medium leading-relaxed">
              {t("codeDisplay", { code: booking.verificationPasscode })}
            </p>
          </div>
        )}

        {/* Active progress checklist */}
        {activeSlot?.checkInTime && !activeSlot?.checkOutTime && (
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#1f8a8a]">{t("activeTracking")}</span>
              <span className="text-[#3e4949] font-medium">{completedTasks}/{totalTasks} ({taskProgressPercentage}%)</span>
            </div>
            <div className="w-full bg-[#bdc9c8]/30 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#1f8a8a] h-full rounded-full transition-all duration-500"
                style={{ width: `${taskProgressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Late Alert flashing */}
        {late.isLate && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3 animate-pulse">
            <div className="flex items-start gap-2.5 text-amber-700 text-xs">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="font-bold">{t("lateAlert")}</h4>
                <p className="text-amber-600/90 leading-normal">
                  {t("lateMinsAlert", { mins: late.mins ?? 0 })}
                </p>
              </div>
            </div>

            {hasComplaintFiled ? (
              <button
                disabled
                className="w-full py-2.5 bg-gray-200 text-gray-500 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed opacity-60 border border-gray-300"
              >
                <ShieldCheck className="w-4 h-4" />
                {t("complaintUnderReview")}
              </button>
            ) : (
              <button
                onClick={() => onFileComplaint(booking._id)}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileWarning className="w-4 h-4" />
                {t("fileComplaint")}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Actions footer */}
      <div className="pt-6 border-t border-[#bdc9c8]/20 mt-6 flex justify-end">
        {booking.status === "pending_payment" ? (
          <Link
            href={`/family/bookings/${booking._id}`}
            className="w-full py-3 bg-[#1f8a8a] hover:bg-[#0d8282] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            <CreditCard className="w-4 h-4" />
            {t("escrowPaymentBtn")}
          </Link>
        ) : (
          <Link
            href={`/family/bookings/${booking._id}`}
            className="w-full md:w-auto px-6 py-2.5 bg-[#f6f3f2] hover:bg-[#bdc9c8]/25 text-[#3e4949] font-bold text-xs rounded-xl transition-all border border-[#bdc9c8]/40 text-center flex items-center justify-center gap-1 cursor-pointer"
          >
            {t("viewLogs")}
            <ChevronRight className="w-4 h-4 rtl:rotate-180" />
          </Link>
        )}
      </div>
    </div>
  );
}
