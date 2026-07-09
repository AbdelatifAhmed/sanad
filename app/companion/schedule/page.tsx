"use client";

import React, { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/services/api";
import { useTranslations, useLocale } from "next-intl";
import { Loader2 } from "lucide-react";
import CalendarGrid from "@/components/shared/schedule/CalendarGrid";
import DayShiftsList from "@/components/shared/schedule/DayShiftsList";
import AllShiftsList from "@/components/shared/schedule/AllShiftsList";
import type { ScheduleItem } from "@/components/shared/schedule/types";

export default function CompanionSchedule() {
  const t = useTranslations("schedule");
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [filterType, setFilterType] = useState<"upcoming" | "past">("upcoming");

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const res = await api.get("/bookings/my?limit=100");
        if (res.data && res.data.data && res.data.data.bookings) {
          setBookings(res.data.data.bookings);
        }
      } catch (err) {
        console.error("Error fetching companion bookings for calendar:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  // Map bookings to individual schedule items (shifts)
  const allShifts = useMemo(() => {
    const shifts: ScheduleItem[] = [];
    bookings.forEach((booking) => {
      // Skip cancelled bookings
      if (booking.status === "cancelled" || booking.status === "canceled") return;

      if (booking.schedule && Array.isArray(booking.schedule)) {
        booking.schedule.forEach((slot: any, idx: number) => {
          shifts.push({
            bookingId: booking._id,
            bookingStatus: booking.status,
            counterparty: typeof booking.familyId === "object" && booking.familyId
              ? booking.familyId
              : { _id: String(booking.familyId || ""), name: "عميل سند" },
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
    return shifts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [bookings]);

  // Check if a day has shifts
  const getShiftsForDay = (date: Date) => {
    const dateStr = date.toDateString();
    return allShifts.filter((shift) => new Date(shift.date).toDateString() === dateStr);
  };

  // Filter shifts for the upcoming vs past lists
  const filteredShiftsList = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return allShifts.filter((shift) => {
      const shiftDate = new Date(shift.date);
      shiftDate.setHours(0, 0, 0, 0);

      if (filterType === "upcoming") {
        return shiftDate >= today;
      } else {
        return shiftDate < today;
      }
    });
  }, [allShifts, filterType]);

  // Selected date shifts detail
  const selectedDayShifts = useMemo(() => {
    return getShiftsForDay(selectedDate);
  }, [selectedDate, allShifts]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbfaf7] text-[#1b1c1c] flex flex-col items-center justify-center p-6">
        <Loader2 className="w-12 h-12 text-[#1f8a8a] animate-spin mb-4" />
        <p className="text-[#3e4949] font-medium">{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-stitch-body p-4" dir={isRtl ? "rtl" : "ltr"}>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-[#1f8a8a] uppercase tracking-widest block mb-1">
            {t("subtitle")}
          </span>
          <h1 className="text-3xl font-stitch-display font-bold text-[#1b1c1c]">{t("title")}</h1>
        </div>

        {/* List filters */}
        <div className="flex bg-white border border-[#eae7e7] p-1 rounded-2xl shadow-sm self-start">
          <button
            onClick={() => setFilterType("upcoming")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === "upcoming"
                ? "bg-[#1f8a8a] text-white shadow-sm"
                : "text-[#3e4949] hover:text-[#1b1c1c]"
            }`}
          >
            {t("upcomingShifts")}
          </button>
          <button
            onClick={() => setFilterType("past")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === "past"
                ? "bg-[#1f8a8a] text-white shadow-sm"
                : "text-[#3e4949] hover:text-[#1b1c1c]"
            }`}
          >
            {t("pastShifts")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Calendar Grid */}
        <CalendarGrid
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          currentMonth={currentMonth}
          onChangeMonth={setCurrentMonth}
          allShifts={allShifts}
          locale={locale}
          isRtl={isRtl}
        />

        {/* Middle & Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Day shifts */}
          <DayShiftsList
            selectedDate={selectedDate}
            shifts={selectedDayShifts}
            locale={locale}
            isRtl={isRtl}
            role="companion"
          />

          {/* Complete filtered shifts list */}
          <AllShiftsList
            shifts={filteredShiftsList}
            filterType={filterType}
            locale={locale}
            role="companion"
          />
        </div>

      </div>

    </div>
  );
}
