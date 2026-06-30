"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../lib/services/api";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User, 
  CheckCircle2, 
  MapPin, 
  Loader2, 
  AlertCircle,
  ArrowRight,
  Sparkles
} from "lucide-react";
import Link from "next/link";

interface ScheduleItem {
  bookingId: string;
  bookingStatus: string;
  familyId: {
    _id: string;
    name: string;
    avatar?: string;
    phone?: string;
  };
  location: any;
  date: string;
  startTime: string;
  endTime: string;
  checkInTime?: string;
  checkOutTime?: string;
  tasksList: any[];
  slotIndex: number;
}

export default function CompanionSchedule() {
  const router = useRouter();
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
        console.error("Error fetching bookings for calendar:", err);
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
      if (booking.status === "cancelled") return;

      if (booking.schedule && Array.isArray(booking.schedule)) {
        booking.schedule.forEach((slot: any, idx: number) => {
          shifts.push({
            bookingId: booking._id,
            bookingStatus: booking.status,
            familyId: typeof booking.familyId === "object" ? booking.familyId : { _id: String(booking.familyId), name: "عميل سند" },
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

  // Generate calendar days for current month view
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // First day of the month
    const firstDayOfMonth = new Date(year, month, 1);
    // Day of the week of the first day (0 = Sunday, ..., 6 = Saturday)
    const startDayOfWeek = firstDayOfMonth.getDay();

    // Number of days in the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Create array of days
    const days: (Date | null)[] = [];

    // Pad starting empty slots
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [currentMonth]);

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

  // Navigate months
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthNamesAr = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];

  const weekdayNamesAr = ["ح", "ن", "ث", "ر", "خ", "ج", "س"];

  if (loading) {
    return (
      <div className="min-h-screen bg-sand text-stitch-on-surface flex flex-col items-center justify-center p-6">
        <Loader2 className="w-12 h-12 text-stitch-primary animate-spin mb-4" />
        <p className="text-stitch-on-surface-variant font-medium">جاري تحميل جدول مواعيدك...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-stitch-body p-4 text-right animate-fade-in" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-stitch-primary uppercase tracking-widest block mb-1">تنظيم ومتابعة المواعيد</span>
          <h1 className="text-3xl font-stitch-display font-bold text-stitch-on-surface">جدول نوبات الرعاية</h1>
        </div>

        {/* List filters */}
        <div className="flex bg-white border border-stitch-outline/20 p-1 rounded-2xl shadow-soft self-start">
          <button
            onClick={() => setFilterType("upcoming")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterType === "upcoming"
                ? "bg-stitch-primary text-white shadow-soft"
                : "text-stitch-on-surface-variant hover:text-stitch-on-surface"
            }`}
          >
            المناوبات القادمة
          </button>
          <button
            onClick={() => setFilterType("past")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterType === "past"
                ? "bg-stitch-primary text-white shadow-soft"
                : "text-stitch-on-surface-variant hover:text-stitch-on-surface"
            }`}
          >
            السجل والمناوبات السابقة
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Interactive Month Calendar */}
        <div className="lg:col-span-1 bg-white border border-stitch-outline/10 shadow-soft rounded-3xl p-5 md:p-6 space-y-6 h-fit">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-stitch-on-surface">تقويم المواعيد</h3>
            <div className="flex items-center space-x-1 space-x-reverse">
              <button onClick={prevMonth} className="p-1.5 hover:bg-sand-low rounded-lg border border-stitch-outline/20 transition-all">
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold text-stitch-on-surface min-w-[90px] text-center">
                {monthNamesAr[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <button onClick={nextMonth} className="p-1.5 hover:bg-sand-low rounded-lg border border-stitch-outline/20 transition-all">
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 text-center">
            {/* Weekdays */}
            {weekdayNamesAr.map((day, idx) => (
              <span key={idx} className="text-xs font-bold text-stitch-on-surface-variant/60 py-1">
                {day}
              </span>
            ))}

            {/* Days */}
            {calendarDays.map((day, idx) => {
              if (!day) return <div key={idx} className="aspect-square" />;

              const isSelected = selectedDate.toDateString() === day.toDateString();
              const isToday = new Date().toDateString() === day.toDateString();
              const shifts = getShiftsForDay(day);
              const hasShifts = shifts.length > 0;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={`aspect-square flex flex-col items-center justify-center rounded-xl relative transition-all border ${
                    isSelected
                      ? "bg-stitch-primary border-stitch-primary text-white shadow-soft font-bold scale-105"
                      : isToday
                      ? "bg-teal-50/50 border-stitch-primary/30 text-stitch-primary font-bold"
                      : "bg-white border-transparent hover:bg-sand-low hover:border-stitch-outline/20 text-stitch-on-surface"
                  }`}
                >
                  <span className="text-xs">{day.getDate()}</span>
                  {hasShifts && (
                    <span className={`w-1.5 h-1.5 rounded-full absolute bottom-1.5 ${
                      isSelected ? "bg-white" : "bg-stitch-primary animate-pulse"
                    }`} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center space-x-4 space-x-reverse text-[11px] text-stitch-on-surface-variant/80 border-t border-stitch-outline/10 pt-4">
            <div className="flex items-center space-x-1.5 space-x-reverse">
              <span className="w-2 h-2 rounded-full bg-stitch-primary" />
              <span>أيام بها مناوبات</span>
            </div>
            <div className="flex items-center space-x-1.5 space-x-reverse">
              <span className="w-2 h-2 rounded-full bg-teal-50 border border-stitch-primary/30" />
              <span>اليوم الحالي</span>
            </div>
          </div>
        </div>

        {/* Middle & Right Column: Shifts Details / Selected Day Listing */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Detailed View for selected date */}
          <div className="bg-white border border-stitch-outline/10 shadow-soft rounded-3xl p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-stitch-outline/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-stitch-on-surface">جدول نوبات اليوم المحدد</h3>
                <p className="text-xs text-stitch-on-surface-variant/80 mt-1">
                  {selectedDate.toLocaleDateString("ar-EG", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <span className="text-xs bg-teal-50 text-stitch-primary border border-teal-100 px-3 py-1 rounded-full font-bold">
                {selectedDayShifts.length} مناوبات
              </span>
            </div>

            {selectedDayShifts.length > 0 ? (
              <div className="space-y-4">
                {selectedDayShifts.map((shift, idx) => {
                  const checkInTimeStr = shift.checkInTime ? new Date(shift.checkInTime).toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' }) : null;
                  const checkOutTimeStr = shift.checkOutTime ? new Date(shift.checkOutTime).toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' }) : null;
                  
                  return (
                    <div key={idx} className="p-5 bg-sand-low/60 border border-stitch-outline/15 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-soft transition-all">
                      <div className="flex items-start gap-4">
                        {/* Family Avatar */}
                        {shift.familyId.avatar ? (
                          <img src={shift.familyId.avatar} alt={shift.familyId.name} className="w-12 h-12 rounded-full object-cover border border-stitch-outline/25" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-teal-50 text-stitch-primary flex items-center justify-center font-black border border-teal-100 text-lg shrink-0">
                            {shift.familyId.name.charAt(0)}
                          </div>
                        )}

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-stitch-on-surface text-base">{shift.familyId.name}</h4>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-white border border-stitch-outline/20 text-stitch-on-surface-variant font-mono">
                              نوبة #{shift.slotIndex + 1}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stitch-on-surface-variant/90">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-stitch-primary" />
                              <span>{shift.startTime} - {shift.endTime}</span>
                            </span>
                            {shift.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-stitch-primary" />
                                <span className="truncate max-w-[200px]">{shift.location.readableAddress || shift.location.city}</span>
                              </span>
                            )}
                          </div>

                          {/* Clock logs */}
                          {(checkInTimeStr || checkOutTimeStr) && (
                            <div className="text-[10px] text-stitch-on-surface-variant/70 pt-1 flex gap-3">
                              {checkInTimeStr && <span>✓ الحضور: {checkInTimeStr}</span>}
                              {checkOutTimeStr && <span>✓ المغادرة: {checkOutTimeStr}</span>}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Link
                          href={`/companion/shift/${shift.bookingId}`}
                          className="px-4 py-2 bg-stitch-primary hover:bg-stitch-primary/95 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-soft border border-stitch-primary/10"
                        >
                          <span>عرض نوبة العمل</span>
                          <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-stitch-on-surface-variant/60 text-sm bg-sand-low/30 border border-dashed border-stitch-outline/20 rounded-2xl space-y-2">
                <CalendarIcon className="w-12 h-12 mx-auto text-stitch-on-surface-variant/30" />
                <p>لا توجد مناوبات مسجلة في هذا اليوم.</p>
                <p className="text-xs">اختر يوماً آخر من التقويم الجانبي لمطالعة تفاصيله.</p>
              </div>
            )}
          </div>

          {/* Section 2: Complete filter list view */}
          <div className="bg-white border border-stitch-outline/10 shadow-soft rounded-3xl p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-stitch-outline/10 pb-4">
              <h3 className="text-lg font-bold text-stitch-on-surface">
                {filterType === "upcoming" ? "قائمة المناوبات القادمة" : "سجل المناوبات السابقة"}
              </h3>
              <span className="text-xs bg-sand-low text-stitch-on-surface-variant border border-stitch-outline/15 px-2.5 py-1 rounded-lg font-mono">
                {filteredShiftsList.length} إجمالي
              </span>
            </div>

            {filteredShiftsList.length > 0 ? (
              <div className="divide-y divide-stitch-outline/10">
                {filteredShiftsList.map((shift, idx) => {
                  const dateObj = new Date(shift.date);
                  const dateStr = dateObj.toLocaleDateString("ar-EG", { weekday: 'short', month: 'short', day: 'numeric' });
                  
                  return (
                    <div key={idx} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                      <div className="space-y-1 text-right">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-stitch-on-surface text-sm">{shift.familyId.name}</h4>
                          <span className="text-[10px] bg-sand-low border border-stitch-outline/25 text-stitch-on-surface-variant px-2 py-0.5 rounded font-bold">
                            {dateStr}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-stitch-on-surface-variant/80">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-stitch-primary" />
                            <span>{shift.startTime} - {shift.endTime}</span>
                          </span>
                          {shift.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-stitch-primary" />
                              <span className="truncate max-w-[150px]">{shift.location.readableAddress || shift.location.city}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <Link
                        href={`/companion/shift/${shift.bookingId}`}
                        className="px-3.5 py-1.5 bg-sand-low hover:bg-sand-high text-stitch-on-surface-variant font-semibold rounded-xl text-xs transition-all border border-stitch-outline/20"
                      >
                        تفاصيل
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-stitch-on-surface-variant/50 text-sm">
                لا توجد مناوبات مطابقة حالياً.
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
