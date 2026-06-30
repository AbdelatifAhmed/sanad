"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { api } from "../../../lib/services/api";
import {
  Clock,
  Calendar,
  MapPin,
  Lock,
  Unlock,
  AlertCircle,
  Loader2,
  ChevronRight,
  User,
  CheckCircle,
  Activity
} from "lucide-react";
import Link from "next/link";

interface ShiftSlot {
  bookingId: string;
  bookingStatus: string;
  familyId: {
    _id: string;
    name: string;
    avatar?: string;
    phone?: string;
  };
  beneficiaryId: string;
  location: any;
  date: string;
  startTime: string;
  endTime: string;
  checkInTime?: string;
  checkOutTime?: string;
  tasksList: any[];
  slotIndex: number;
}

export default function CompanionShiftsHub() {
  const t = useTranslations("shiftsHub");
  const tNav = useTranslations("nav");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const res = await api.get("/bookings/my?limit=100");
        if (res.data?.data?.bookings) {
          setBookings(res.data.data.bookings);
        }
      } catch (err) {
        console.error("Error fetching bookings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  // Update current time every second for active timers
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Flatten bookings into individual daily slots (shifts)
  const allShifts = useMemo(() => {
    const list: ShiftSlot[] = [];
    bookings.forEach((booking) => {
      if (booking.status === "cancelled") return;
      if (booking.schedule && Array.isArray(booking.schedule)) {
        booking.schedule.forEach((slot: any, idx: number) => {
          list.push({
            bookingId: booking._id,
            bookingStatus: booking.status,
            familyId: typeof booking.familyId === "object" ? booking.familyId : { _id: String(booking.familyId), name: "عميل سند" },
            beneficiaryId: booking.beneficiaryId,
            location: booking.location,
            date: slot.date,
            startTime: slot.startTime,
            endTime: slot.endTime,
            checkInTime: slot.checkInTime,
            checkOutTime: slot.checkOutTime,
            tasksList: slot.tasksList || [],
            slotIndex: idx
          });
        });
      }
    });

    // Sort shifts chronologically
    return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [bookings]);

  // Separate upcoming and past shifts
  const sortedShifts = useMemo(() => {
    const upcoming: ShiftSlot[] = [];
    const past: ShiftSlot[] = [];

    allShifts.forEach((shift) => {
      if (shift.checkOutTime) {
        past.push(shift);
      } else {
        // Compute end datetime of the shift slot
        try {
          const shiftEndDate = new Date(shift.date);
          const [endH, endM] = shift.endTime.split(":").map(Number);
          shiftEndDate.setHours(endH, endM, 0, 0);

          if (now > shiftEndDate && !shift.checkInTime) {
            // Expired/missed shift
            past.push(shift);
          } else {
            upcoming.push(shift);
          }
        } catch {
          upcoming.push(shift);
        }
      }
    });

    // Reverse past shifts so the most recent is first
    return {
      upcoming,
      past: past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    };
  }, [allShifts, now]);

  // Format countdown text
  const getCountdownText = (shiftDate: string, startTime: string) => {
    try {
      const start = new Date(shiftDate);
      const [h, m] = startTime.split(":").map(Number);
      start.setHours(h, m, 0, 0);

      const diffMs = start.getTime() - now.getTime();
      if (diffMs <= 0) return isRtl ? "الموعد بدأ بالفعل" : "Shift has started";

      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      const daysVal = diffDays;
      const hoursVal = diffHours % 24;
      const minsVal = diffMins % 60;
      const secsVal = diffSecs % 60;

      if (daysVal > 0) {
        return isRtl
          ? `متبقي ${daysVal} يوم و ${hoursVal} ساعة`
          : `Remaining ${daysVal}d ${hoursVal}h`;
      }
      if (hoursVal > 0) {
        return isRtl
          ? `متبقي ${hoursVal} ساعة و ${minsVal} دقيقة`
          : `Remaining ${hoursVal}h ${minsVal}m`;
      }
      return isRtl
        ? `متبقي ${minsVal} دقيقة و ${secsVal} ثانية`
        : `Remaining ${minsVal}m ${secsVal}s`;
    } catch {
      return "";
    }
  };

  // Helper to determine access status
  const getShiftAccessStatus = (shift: ShiftSlot) => {
    if (shift.checkInTime && !shift.checkOutTime) {
      return { allowed: true, message: isRtl ? "مناوبة جارية حالياً" : "Shift is ongoing" };
    }

    try {
      const start = new Date(shift.date);
      const [h, m] = shift.startTime.split(":").map(Number);
      start.setHours(h, m, 0, 0);

      const diffMs = start.getTime() - now.getTime();
      const diffMins = diffMs / (60 * 1000);

      if (diffMins <= 10) {
        return { allowed: true, message: isRtl ? "متاح للدخول الآن" : "Available to check-in now" };
      }

      if (diffMins <= 30) {
        return {
          allowed: false,
          isApproaching: true,
          message: isRtl ? "الموعد اقترب، متاح للتسجيل خلال دقائق" : "Starting soon, check-in available shortly"
        };
      }

      return { allowed: false, message: isRtl ? "الموعد ما زال بعيداً، برجاء الانتظار" : "The shift is far, please wait" };
    } catch {
      return { allowed: false, message: isRtl ? "الموعد ما زال بعيداً، برجاء الانتظار" : "The shift is far, please wait" };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sand flex flex-col items-center justify-center p-6">
        <Loader2 className="w-12 h-12 text-[#1f8a8a] animate-spin mb-4" />
        <p className="text-[#3e4949] font-medium">{isRtl ? "جاري تحميل جدول المناوبات..." : "Loading shifts hub..."}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand text-[#1b1c1c] pb-12">
      {/* Upper Glassmorphic Header Banner */}
      <div className="bg-gradient-to-r from-[#006767] via-[#1f8a8a] to-[#aeedd5]/60 text-white py-12 px-6 shadow-md relative overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <span className="bg-white/20 text-[#aeedd5] text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full backdrop-blur-md">
              {isRtl ? "مساحة عمل المرافق" : "Companion Hub"}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold font-stitch-display">{t("title")}</h1>
            <p className="text-white/80 text-sm max-w-xl">{t("subtitle")}</p>
          </div>
          <Link
            href="/companion/schedule"
            className="flex items-center gap-2 self-start md:self-auto px-5 py-3 bg-white text-[#1f8a8a] hover:bg-white/95 rounded-xl font-bold text-sm shadow-soft transition-all duration-200"
          >
            <Calendar className="w-4 h-4" />
            {tNav("calendar")}
          </Link>
        </div>
        <div className="absolute -bottom-8 -right-8 w-44 h-44 rounded-full bg-white/10" />
        <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-white/10" />
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-8">
        {/* Dynamic Shift sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Upcoming Shifts list */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#1f8a8a] flex items-center gap-2">
                <Activity className="w-5 h-5" />
                {t("upcoming")}
              </h2>
              <span className="bg-[#1f8a8a]/10 text-[#1f8a8a] text-xs font-bold px-2.5 py-1 rounded-full">
                {sortedShifts.upcoming.length} {isRtl ? "زيارة قادمة" : "Upcoming Visits"}
              </span>
            </div>

            {sortedShifts.upcoming.length === 0 ? (
              <div className="bg-white border border-[#eae7e7] rounded-3xl p-10 text-center shadow-soft">
                <AlertCircle className="w-12 h-12 text-[#bdc9c8] mx-auto mb-4" />
                <p className="text-[#3e4949] font-medium">{t("noShifts")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedShifts.upcoming.map((shift, idx) => {
                  const access = getShiftAccessStatus(shift);
                  const countdown = getCountdownText(shift.date, shift.startTime);
                  
                  return (
                    <div
                      key={`${shift.bookingId}_${shift.slotIndex}_${idx}`}
                      className={`bg-white border rounded-3xl p-5 md:p-6 transition-all duration-300 shadow-soft hover:shadow-md ${
                        access.allowed 
                          ? "border-[#1f8a8a] ring-2 ring-[#1f8a8a]/5" 
                          : "border-[#eae7e7]"
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-3">
                          {/* Top Badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-[#1f8a8a] px-3 py-1 bg-[#1f8a8a]/10 rounded-full">
                              {new Date(shift.date).toLocaleDateString(isRtl ? "ar-EG" : "en-US", {
                                weekday: "long",
                                month: "short",
                                day: "numeric"
                              })}
                            </span>
                            <span className="text-xs text-[#3e4949]/70 px-2.5 py-1 bg-[#f6f3f2] rounded-full flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {shift.startTime} - {shift.endTime}
                            </span>
                            {shift.checkInTime && (
                              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full animate-pulse">
                                {isRtl ? "شفت نشط الآن" : "Active Shift Now"}
                              </span>
                            )}
                          </div>

                          {/* Family Details */}
                          <div>
                            <h3 className="text-lg font-bold text-[#1b1c1c]">
                              {shift.familyId.name}
                            </h3>
                            <p className="text-xs text-[#3e4949] flex items-center gap-1 mt-1">
                              <MapPin className="w-3.5 h-3.5 text-[#1f8a8a]" />
                              {shift.location?.readableAddress || shift.location?.city || (isRtl ? "موقع محدد مسبقاً" : "Pre-defined location")}
                            </p>
                          </div>

                          {/* Countdown Badge */}
                          {!shift.checkInTime && (
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#f6f3f2] border border-[#bdc9c8]/30">
                              <span className="w-2 h-2 rounded-full bg-[#1f8a8a] animate-ping" />
                              <span className="text-xs font-bold text-[#1f8a8a]">{countdown}</span>
                            </div>
                          )}
                        </div>

                        {/* Right side check-in access action */}
                        <div className="flex flex-col items-start md:items-end justify-center gap-2 shrink-0">
                          {access.allowed ? (
                            <Link
                              href={`/companion/shift/${shift.bookingId}`}
                              className="w-full md:w-auto px-6 py-3 bg-[#1f8a8a] hover:bg-[#0d8282] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                            >
                              <Unlock className="w-4 h-4" />
                              {isRtl ? "دخول لوحة التحكم بالزيارة" : "Open Visit Dashboard"}
                            </Link>
                          ) : (
                            <div className="w-full space-y-1">
                              <button
                                disabled
                                className="w-full md:w-auto px-6 py-3 bg-[#bdc9c8]/50 text-[#3e4949]/60 font-semibold text-sm rounded-xl flex items-center justify-center gap-2 cursor-not-allowed border border-[#bdc9c8]/30"
                              >
                                <Lock className="w-4 h-4" />
                                {isRtl ? "المناوبة مغلقة" : "Shift Locked"}
                              </button>
                              <p className="text-[11px] text-amber-600 font-bold max-w-[200px] text-start md:text-end leading-relaxed">
                                {access.message}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Past Shifts list */}
          <div className="lg:col-span-4 space-y-6">
            <h2 className="text-xl font-bold text-[#3e4949] flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[#bdc9c8]" />
              {t("past")}
            </h2>

            {sortedShifts.past.length === 0 ? (
              <div className="bg-[#f6f3f2]/50 border border-[#bdc9c8]/20 rounded-3xl p-8 text-center text-xs text-[#3e4949]/60">
                {isRtl ? "لا توجد مناوبات سابقة مسجلة" : "No past shifts recorded"}
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {sortedShifts.past.map((shift, idx) => (
                  <div
                    key={`past_${shift.bookingId}_${shift.slotIndex}_${idx}`}
                    className="bg-[#f6f3f2]/40 border border-[#bdc9c8]/30 rounded-2xl p-4 space-y-2.5 hover:bg-white hover:border-[#bdc9c8] transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#3e4949]/70">
                        {new Date(shift.date).toLocaleDateString(isRtl ? "ar-EG" : "en-US", {
                          month: "short",
                          day: "numeric",
                          year: "2-digit"
                        })}
                      </span>
                      <span className="text-[10px] font-bold bg-[#bdc9c8]/20 text-[#3e4949] px-2 py-0.5 rounded-full">
                        {isRtl ? "مكتملة" : "Completed"}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#1b1c1c]">{shift.familyId.name}</h4>
                      <p className="text-[11px] text-[#3e4949]/70 mt-0.5">
                        {shift.startTime} - {shift.endTime}
                      </p>
                    </div>
                    {shift.checkInTime && shift.checkOutTime && (
                      <div className="pt-2 border-t border-[#bdc9c8]/20 flex items-center justify-between text-[10px] text-[#3e4949]/80 font-medium">
                        <span>{isRtl ? "الدخول:" : "Check-in:"} {new Date(shift.checkInTime).toLocaleTimeString(isRtl ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                        <span>{isRtl ? "الانصراف:" : "Check-out:"} {new Date(shift.checkOutTime).toLocaleTimeString(isRtl ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
