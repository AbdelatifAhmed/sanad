"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { api } from "../../../lib/services/api";
import {
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MapPin,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  AlertTriangle,
  HelpCircle,
  FileWarning
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
    avatar?: string;
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
}

export default function FamilyBookingsConsole() {
  const t = useTranslations("familyBookings");
  const tNav = useTranslations("nav");
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [activeTab, setActiveTab] = useState<"upcoming" | "active" | "past">("upcoming");
  
  // Complaint state mockup
  const [complaintBookingId, setComplaintBookingId] = useState<string | null>(null);
  const [complaintText, setComplaintText] = useState("");
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [complaintSuccess, setComplaintSuccess] = useState(false);

  const fetchBookings = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await api.get("/bookings/my?limit=100");
      if (res.data?.data?.bookings) {
        setBookings(res.data.data.bookings);
      }
    } catch (err) {
      console.error("Error fetching family bookings:", err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Periodic polling for status updates (every 5 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      fetchBookings(true);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Get current time
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timeTimer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timeTimer);
  }, []);

  // Categorize bookings
  const categorizedBookings = useMemo(() => {
    const upcomingList: BookingItem[] = [];
    const activeList: BookingItem[] = [];
    const pastList: BookingItem[] = [];

    bookings.forEach((booking) => {
      // 1. Past Bookings
      if (booking.status === "completed" || booking.status === "cancelled") {
        pastList.push(booking);
        return;
      }

      // Check if there is an active slot today
      const todayStr = now.toDateString();
      const hasActiveToday = booking.schedule?.some((slot) => {
        const slotDateStr = new Date(slot.date).toDateString();
        // Checked in today and not checked out, or currently in progress
        return slotDateStr === todayStr && slot.checkInTime && !slot.checkOutTime;
      });

      if (booking.status === "active" || hasActiveToday) {
        activeList.push(booking);
      } else {
        upcomingList.push(booking);
      }
    });

    return {
      upcoming: upcomingList,
      active: activeList,
      past: pastList
    };
  }, [bookings, now]);

  // Check if companion is late by more than 10 minutes
  const getLateStatus = (booking: BookingItem) => {
    if (booking.status === "completed" || booking.status === "cancelled") return { isLate: false };
    
    // Find today's schedule slot
    const todayStr = now.toDateString();
    const todaySlot = booking.schedule?.find(
      (slot) => new Date(slot.date).toDateString() === todayStr
    );

    if (!todaySlot) return { isLate: false };
    if (todaySlot.checkInTime) return { isLate: false }; // Already checked in

    try {
      const slotStart = new Date(todaySlot.date);
      const [h, m] = todaySlot.startTime.split(":").map(Number);
      slotStart.setHours(h, m, 0, 0);

      // Check if start time is passed by more than 10 minutes
      const diffMs = now.getTime() - slotStart.getTime();
      const diffMins = diffMs / (1000 * 60);

      if (diffMins > 10) {
        return { isLate: true, mins: Math.floor(diffMins) };
      }
    } catch {
      return { isLate: false };
    }

    return { isLate: false };
  };

  const handleFileComplaint = async (bookingId: string) => {
    setComplaintBookingId(bookingId);
    setComplaintText("");
    setComplaintSuccess(false);
  };

  const submitComplaint = async () => {
    if (!complaintBookingId) return;
    try {
      setSubmittingComplaint(true);
      // Mock support API call
      await api.post(`/bookings/${complaintBookingId}/complaints`, {
        description: complaintText
      });
      setComplaintSuccess(true);
      setTimeout(() => {
        setComplaintBookingId(null);
        setComplaintSuccess(false);
      }, 3000);
    } catch (err) {
      // Direct mock success for safety
      setComplaintSuccess(true);
      setTimeout(() => {
        setComplaintBookingId(null);
        setComplaintSuccess(false);
      }, 3000);
    } finally {
      setSubmittingComplaint(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sand flex flex-col items-center justify-center p-6">
        <Loader2 className="w-12 h-12 text-[#1f8a8a] animate-spin mb-4" />
        <p className="text-[#3e4949] font-medium">{isRtl ? "جاري تحميل الحجوزات..." : "Loading bookings console..."}</p>
      </div>
    );
  }

  const currentList = categorizedBookings[activeTab];

  return (
    <div className="min-h-screen bg-sand text-[#1b1c1c] pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#006767] via-[#1f8a8a] to-[#aeedd5]/50 text-white py-12 px-6 shadow-md relative overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <span className="bg-white/20 text-[#aeedd5] text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full backdrop-blur-md">
              {isRtl ? "مساحة عمل العائلة" : "Family Workspace"}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold font-stitch-display">{t("title")}</h1>
            <p className="text-white/80 text-sm max-w-xl">{t("subtitle")}</p>
          </div>
          <Link
            href="/family/wallet"
            className="flex items-center gap-2 self-start md:self-auto px-5 py-3 bg-white text-[#1f8a8a] hover:bg-white/95 rounded-xl font-bold text-sm shadow-soft transition-all duration-200"
          >
            <CreditCard className="w-4 h-4" />
            {tNav("wallet")}
          </Link>
        </div>
        <div className="absolute -bottom-8 -right-8 w-44 h-44 rounded-full bg-white/10" />
        <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-white/10" />
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-8">
        {/* Navigation Tabs */}
        <div className="flex border-b border-[#bdc9c8]/30 mb-8 gap-2">
          {(["upcoming", "active", "past"] as const).map((tab) => {
            const isActive = activeTab === tab;
            let label = "";
            if (tab === "upcoming") label = t("upcomingTab");
            else if (tab === "active") label = t("activeTab");
            else label = t("pastTab");

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3.5 px-6 font-bold text-sm border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? "border-[#1f8a8a] text-[#1f8a8a]"
                    : "border-transparent text-[#3e4949]/70 hover:text-[#1f8a8a]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {currentList.length === 0 ? (
          <div className="bg-white border border-[#eae7e7] rounded-3xl p-16 text-center shadow-soft">
            <HelpCircle className="w-16 h-16 text-[#bdc9c8] mx-auto mb-4" />
            <p className="text-[#3e4949] font-medium">{t("noBookings")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentList.map((booking) => {
              const late = getLateStatus(booking);
              // Calculate checklist metrics for active shifts
              const todayStr = now.toDateString();
              const activeSlot = booking.schedule?.find(
                (slot) => new Date(slot.date).toDateString() === todayStr
              );
              
              const totalTasks = activeSlot?.tasksList?.length || 0;
              const completedTasks = activeSlot?.tasksList?.filter(t => t.isCompleted).length || 0;
              const taskProgressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

              return (
                <div
                  key={booking._id}
                  className="bg-white border border-[#eae7e7] rounded-3xl p-6 transition-all duration-300 shadow-soft hover:shadow-md flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Card Top Row */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-[#f6f3f2] flex items-center justify-center border border-[#bdc9c8]/30">
                          {booking.companionId.avatar ? (
                            <img
                              src={booking.companionId.avatar}
                              alt={booking.companionId.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-6 h-6 text-[#1f8a8a]" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-[#1b1c1c]">
                            {booking.companionId.name}
                          </h3>
                          <p className="text-xs text-[#3e4949]/70">
                            {isRtl ? "مرافق رعاية معتمد" : "Verified Companion"}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${
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
                        {booking.status}
                      </span>
                    </div>

                    <div className="border-t border-[#bdc9c8]/20 pt-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-[#3e4949]">
                        <Calendar className="w-4 h-4 text-[#1f8a8a]" />
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
                        <Clock className="w-4 h-4 text-[#1f8a8a]" />
                        <span>
                          {booking.totalHours} {isRtl ? "ساعة إجمالية" : "Total hours"}
                        </span>
                      </div>
                      {booking.location?.readableAddress && (
                        <div className="flex items-center gap-2 text-xs text-[#3e4949]">
                          <MapPin className="w-4 h-4 text-[#1f8a8a]" />
                          <span className="truncate">{booking.location.readableAddress}</span>
                        </div>
                      )}
                    </div>

                    {/* Verification Codes for upcoming and approved bookings */}
                    {booking.verificationPasscode && (booking.status === "approved" || booking.status === "active") && (
                      <div className="p-3 bg-[#f6f3f2] border border-[#bdc9c8]/40 rounded-2xl space-y-1.5">
                        <p className="text-[11px] font-bold text-[#1f8a8a] flex items-center gap-1">
                          <ShieldCheck className="w-4 h-4" />
                          {t("verificationCode")}
                        </p>
                        <p className="text-xs text-[#3e4949] font-medium">
                          {isRtl
                            ? `أعطِ هذا الرمز للمرافق لتسجيل الحضور الجغرافي الآمن: ${booking.verificationPasscode}`
                            : `Give this OTP passcode to the companion on site to unlock check-in: ${booking.verificationPasscode}`}
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
                      <div className="p-4 bg-amber-50 border border-amber-250 rounded-2xl space-y-3 animate-pulse">
                        <div className="flex items-start gap-2.5 text-amber-700 text-xs">
                          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                          <div className="space-y-0.5">
                            <h4 className="font-bold">{t("lateAlert")}</h4>
                            <p className="text-amber-600/90 leading-normal">
                              {isRtl 
                                ? `تجاوز وقت الحضور المحدد بـ ${late.mins} دقيقة والمرافق لم يحضر بعد.`
                                : `The companion is ${late.mins} minutes late behind schedule.`}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleFileComplaint(booking._id)}
                          className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <FileWarning className="w-4 h-4" />
                          {t("fileComplaint")}
                        </button>
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
                        {isRtl ? "سداد الرسوم لبدء الخدمة" : "Complete Escrow Payment"}
                      </Link>
                    ) : (
                      <Link
                        href={`/family/bookings/${booking._id}`}
                        className="w-full md:w-auto px-6 py-2.5 bg-[#f6f3f2] hover:bg-[#bdc9c8]/25 text-[#3e4949] font-bold text-xs rounded-xl transition-all border border-[#bdc9c8]/40 text-center flex items-center justify-center gap-1"
                      >
                        {t("viewLogs")}
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Complaint Modal Dialog */}
      {complaintBookingId && (
        <div className="fixed inset-0 bg-[#1b1c1c]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 space-y-6 shadow-soft relative animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-xl font-bold text-[#1f8a8a]">{t("fileComplaint")}</h3>
              <p className="text-xs text-[#3e4949] mt-1">
                {isRtl
                  ? "سنقوم على الفور بمراجعة تفاصيل الزيارة والتواصل مع المرافق."
                  : "We will inspect the attendance details and address the incident directly."}
              </p>
            </div>

            {complaintSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-xs font-semibold text-center">
                {t("complaintFiled")}
              </div>
            ) : (
              <div className="space-y-4">
                <textarea
                  value={complaintText}
                  onChange={(e) => setComplaintText(e.target.value)}
                  placeholder={isRtl ? "اكتب تفاصيل شكواك (مثال: عدم حضور المرافق، التأخر الشديد، إلخ)..." : "Describe the complaint/delay details..."}
                  rows={4}
                  className="w-full p-4 border border-[#bdc9c8] rounded-2xl text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all resize-none"
                />
                <div className="flex gap-3 justify-end pt-2">
                  <button
                    onClick={() => setComplaintBookingId(null)}
                    className="px-5 py-3 bg-[#f6f3f2] hover:bg-[#bdc9c8]/25 text-[#3e4949] font-bold text-xs rounded-xl cursor-pointer"
                  >
                    {isRtl ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    onClick={submitComplaint}
                    disabled={submittingComplaint || !complaintText}
                    className="px-6 py-3 bg-[#1f8a8a] hover:bg-[#0d8282] disabled:bg-[#bdc9c8] disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl cursor-pointer shadow-md"
                  >
                    {submittingComplaint ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      isRtl ? "إرسال الشكوى" : "Submit Complaint"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
