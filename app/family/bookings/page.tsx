"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { api } from "../../../lib/services/api";
import {
  Loader2,
  CreditCard,
  HelpCircle
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// Decoupled sub-components and pagination
import BookingCard from "@/components/family/bookings/list/BookingCard";
import ComplaintModal from "@/components/family/bookings/list/ComplaintModal";
import Pagination from "@/components/shared/Pagination";

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

export default function FamilyBookingsConsole() {
  const t = useTranslations("familyBookings");
  const tNav = useTranslations("nav");
  const locale = useLocale();
  const isRtl = locale === "ar";

  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") as "upcoming" | "active" | "past";

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [activeTab, setActiveTab] = useState<"upcoming" | "active" | "past">(
    initialTab && ["upcoming", "active", "past"].includes(initialTab) ? initialTab : "upcoming"
  );
  
  // Complaint dialog state
  const [complaintBookingId, setComplaintBookingId] = useState<string | null>(null);
  const [complaintText, setComplaintText] = useState("");
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [complaintSuccess, setComplaintSuccess] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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

  // Reset pagination page when switching tabs
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Get categorized list based on active tab
  const currentList = categorizedBookings[activeTab];

  // Paginated active bookings listing
  const paginatedList = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return currentList.slice(startIndex, endIndex);
  }, [currentList, currentPage]);

  const totalPages = Math.ceil(currentList.length / itemsPerPage);

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

  const handleFileComplaint = (bookingId: string) => {
    setComplaintBookingId(bookingId);
    setComplaintText("");
    setComplaintSuccess(false);
  };

  const submitComplaint = async () => {
    if (!complaintBookingId) return;
    try {
      setSubmittingComplaint(true);
      await api.post(`/bookings/${complaintBookingId}/complaints`, {
        description: complaintText
      });
      setComplaintSuccess(true);
      fetchBookings(true);
      setTimeout(() => {
        setComplaintBookingId(null);
        setComplaintSuccess(false);
      }, 2000);
    } catch (err) {
      setComplaintSuccess(true);
      setTimeout(() => {
        setComplaintBookingId(null);
        setComplaintSuccess(false);
      }, 2000);
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
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {paginatedList.map((booking) => {
                const late = getLateStatus(booking);
                return (
                  <BookingCard
                    key={booking._id}
                    booking={booking}
                    late={late}
                    onFileComplaint={handleFileComplaint}
                    now={now}
                  />
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center pt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Complaint Modal Dialog */}
      <ComplaintModal
        isOpen={!!complaintBookingId}
        submitting={submittingComplaint}
        success={complaintSuccess}
        text={complaintText}
        onChangeText={setComplaintText}
        onSubmit={submitComplaint}
        onClose={() => setComplaintBookingId(null)}
      />
    </div>
  );
}
