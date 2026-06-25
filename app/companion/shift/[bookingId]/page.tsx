"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBookingRealtime } from "../../../../hooks/useBookingRealtime";
import { api } from "../../../../lib/services/api";
import { 
  CheckCircle, 
  MapPin, 
  Clock, 
  User as UserIcon, 
  ArrowLeft,
  Calendar, 
  Activity, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  Phone,
  Play,
  Square
} from "lucide-react";
import Link from "next/link";

export default function CompanionShiftPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;
  
  const { booking, isLoading, error, refresh, setBooking } = useBookingRealtime(bookingId);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showCashModal, setShowCashModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Periodically update current time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Find today's schedule slot or fallback to the first incomplete one
  const activeScheduleIndex = useMemo(() => {
    if (!booking || !booking.schedule || booking.schedule.length === 0) return -1;
    
    const todayStr = new Date().toDateString();
    
    // 1. Try to find a slot matching today's date
    const todayIndex = booking.schedule.findIndex(
      (item) => new Date(item.date).toDateString() === todayStr
    );
    if (todayIndex !== -1) return todayIndex;
    
    // 2. Fallback to the first incomplete slot (no checkout time)
    const incompleteIndex = booking.schedule.findIndex(
      (item) => !item.checkOutTime
    );
    if (incompleteIndex !== -1) return incompleteIndex;
    
    // 3. Absolute fallback to the last slot
    return booking.schedule.length - 1;
  }, [booking]);

  const activeSchedule = booking?.schedule?.[activeScheduleIndex];

  // Calculate task progress
  const taskStats = useMemo(() => {
    if (!activeSchedule || !activeSchedule.tasksList || activeSchedule.tasksList.length === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }
    const total = activeSchedule.tasksList.length;
    const completed = activeSchedule.tasksList.filter((t) => t.isCompleted).length;
    const percentage = Math.round((completed / total) * 100);
    return { completed, total, percentage };
  }, [activeSchedule]);

  // Determine if all tasks are completed
  const allTasksCompleted = useMemo(() => {
    if (!activeSchedule || !activeSchedule.tasksList || activeSchedule.tasksList.length === 0) return true;
    return activeSchedule.tasksList.every((t: any) => t.isCompleted);
  }, [activeSchedule]);

  // Combined slot Date & Time
  const slotStartDateTime = useMemo(() => {
    if (!activeSchedule) return null;
    try {
      const d = new Date(activeSchedule.date);
      const [hours, minutes] = activeSchedule.startTime.split(":").map(Number);
      d.setHours(hours, minutes, 0, 0);
      return d;
    } catch (e) {
      return null;
    }
  }, [activeSchedule]);

  // Validate check-in window (within 10 minutes, or anytime after slot has started)
  const checkInStatus = useMemo(() => {
    if (!slotStartDateTime || !activeSchedule) return { canCheckIn: false, message: "" };
    
    const diffMs = slotStartDateTime.getTime() - currentTime.getTime();
    const diffMins = diffMs / (60 * 1000);
    
    // If shift is more than 30 mins away
    if (diffMins > 30) {
      return {
        canCheckIn: false,
        message: `المناوبة تبدأ في: ${slotStartDateTime.toLocaleDateString("ar-EG")} الساعة ${activeSchedule.startTime}`
      };
    }
    
    // If shift starts in less than 30 mins, but more than 10 mins
    if (diffMins > 10) {
      return {
        canCheckIn: false,
        isApproaching: true,
        message: "موعد المناوبة اقترب (سيكون متاحاً لتسجيل الحضور قبل البداية بـ 10 دقائق)"
      };
    }
    
    // Within 10 minutes before start, or in the past (started/ongoing)
    return {
      canCheckIn: true,
      message: "شفتك متاح الآن للبدء. يرجى تسجيل الحضور (Check-In)."
    };
  }, [slotStartDateTime, currentTime, activeSchedule]);

  // Handle Companion Check-in
  const handleCheckIn = async () => {
    if (!booking || !activeSchedule) return;
    try {
      setActionLoading(true);
      setActionError(null);
      
      const res = await api.post(`/bookings/${bookingId}/check-in`, {
        scheduleId: activeSchedule._id
      });
      
      if (res.data && res.data.data) {
        setBooking(res.data.data.booking);
      }
    } catch (err: any) {
      console.error("Check-in error:", err);
      setActionError(err.response?.data?.message || err.message || "Failed to check in");
    } finally {
      setActionLoading(false);
    }
  };

  const checkOutBooking = async () => {
    try {
      setActionLoading(true);
      setActionError(null);
      
      const res = await api.post(`/bookings/${bookingId}/check-out`, {
        scheduleId: activeSchedule?._id
      });
      
      if (res.data && res.data.data) {
        setBooking(res.data.data.booking);
      }
    } catch (err: any) {
      console.error("Check-out error:", err);
      setActionError(err.response?.data?.message || err.message || "Failed to check out");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Companion Check-out
  const handleCheckOut = async () => {
    if (!booking || !activeSchedule) return;
    
    // Check if this is the final cash shift and is unpaid
    const isLastShift = booking.schedule && booking.schedule.filter(s => !s.checkOutTime).length <= 1;
    const isCashUnpaid = booking.paymentMethod === "cash" && booking.paymentStatus === "unpaid";
    
    if (isCashUnpaid && isLastShift) {
      setShowCashModal(true);
    } else {
      await checkOutBooking();
    }
  };

  const handleConfirmCashAndCheckout = async () => {
    try {
      setActionLoading(true);
      setActionError(null);
      
      // 1. Confirm cash payment
      await api.post("/payments/cash/confirm", { bookingId });
      
      // 2. Perform check-out
      const res = await api.post(`/bookings/${bookingId}/check-out`, {
        scheduleId: activeSchedule?._id
      });
      
      if (res.data && res.data.data) {
        setBooking(res.data.data.booking);
      }
      
      setShowCashModal(false);
    } catch (err: any) {
      console.error("Cash confirmation and check-out error:", err);
      setActionError(err.response?.data?.message || err.message || "Failed to confirm cash and check out");
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Task Status
  const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
    if (!booking || !activeSchedule) return;
    
    // Optimistic UI Update
    const originalBooking = { ...booking };
    setBooking((prevBooking) => {
      if (!prevBooking || !prevBooking.schedule) return prevBooking;
      const updatedSchedule = prevBooking.schedule.map((item, idx) => {
        if (idx === activeScheduleIndex) {
          const updatedTasks = item.tasksList.map((task: any) => {
            if (task._id === taskId) {
              return { ...task, isCompleted: !currentStatus };
            }
            return task;
          });
          return { ...item, tasksList: updatedTasks };
        }
        return item;
      });
      return { ...prevBooking, schedule: updatedSchedule };
    });

    try {
      await api.patch(`/bookings/${bookingId}/schedule/${activeSchedule._id}/tasks/${taskId}`, {
        isCompleted: !currentStatus
      });
    } catch (err: any) {
      console.error("Task status update error:", err);
      // Revert to original booking state if API call fails
      setBooking(originalBooking);
      setActionError("Failed to update task. Real-time update reverted.");
      setTimeout(() => setActionError(null), 4000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-sand text-stitch-on-surface flex flex-col items-center justify-center p-6">
        <Loader2 className="w-12 h-12 text-stitch-primary animate-spin mb-4" />
        <p className="text-stitch-on-surface-variant font-medium">Loading shift dashboard...</p>
      </div>
    );
  }

  if (error || !booking || !activeSchedule) {
    return (
      <div className="min-h-screen bg-sand text-stitch-on-surface flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Shift Load Error</h2>
        <p className="text-stitch-on-surface-variant max-w-md mb-6">{error || "No active schedule slot could be determined for this booking."}</p>
        <Link 
          href="/companion/bookings" 
          className="px-6 py-2.5 bg-stitch-primary hover:bg-stitch-primary/95 text-white rounded-xl font-medium transition-all shadow-soft"
        >
          Back to Bookings
        </Link>
      </div>
    );
  }

  const familyUser = typeof booking.familyId === "object" ? booking.familyId : null;

  return (
    <div className="min-h-screen text-stitch-on-surface p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex items-center space-x-4">
          <Link 
            href="/companion/bookings" 
            className="p-2 bg-white hover:bg-sand-low rounded-full border border-stitch-outline/20 transition-all text-stitch-on-surface-variant hover:text-stitch-on-surface shadow-soft"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-xs font-semibold text-stitch-primary uppercase tracking-widest">Companion Workspace</span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-stitch-on-surface">Active Shift Tracking</h1>
          </div>
        </div>

        {/* Global Action Warning/Error message */}
        {actionError && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm flex items-start space-x-3 shadow-soft">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Shift Status Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Booking Info Card */}
          <div className="bg-white border border-stitch-outline/10 shadow-soft rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-stitch-on-surface-variant flex items-center space-x-2">
              <UserIcon className="w-4 h-4 text-stitch-primary" />
              <span>Care Details</span>
            </h3>
            {familyUser && (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  {familyUser.avatar ? (
                    <img 
                      src={familyUser.avatar} 
                      alt={familyUser.name} 
                      className="w-10 h-10 rounded-full object-cover border border-stitch-outline/20"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-teal-50 text-stitch-primary flex items-center justify-center font-bold border border-teal-100">
                      {familyUser.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-stitch-on-surface">{familyUser.name}</h4>
                    <p className="text-xs text-stitch-on-surface-variant/80">Family Client</p>
                  </div>
                </div>

                {/* Beneficiary details card info */}
                {booking.beneficiary && (
                  <div className="p-3 bg-sand-low rounded-xl border border-stitch-outline/10 text-xs space-y-1.5 text-right" dir="rtl">
                    <div className="font-bold text-stitch-on-surface text-center pb-1 border-b border-stitch-outline/10">تفاصيل متلقي الرعاية</div>
                    <div><strong>الاسم:</strong> {booking.beneficiary.name}</div>
                    <div><strong>العمر:</strong> {booking.beneficiary.age} سنة ({booking.beneficiary.gender === 'male' ? 'ذكر' : 'أنثى'})</div>
                    <div><strong>الحالة الصحية:</strong> {booking.beneficiary.conditionDetails}</div>
                  </div>
                )}

                {familyUser.phone && (
                  <a 
                    href={`tel:${familyUser.phone}`}
                    className="flex items-center justify-center space-x-2 w-full py-2 bg-sand-low hover:bg-sand-high text-stitch-on-surface-variant hover:text-stitch-on-surface rounded-xl text-xs font-semibold transition-all border border-stitch-outline/20"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Family</span>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Location details card */}
          <div className="bg-white border border-stitch-outline/10 shadow-soft rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-stitch-on-surface-variant flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-stitch-primary" />
              <span>Location</span>
            </h3>
            <div className="space-y-2">
              <p className="text-stitch-on-surface font-semibold text-sm">
                {booking.location?.readableAddress || familyUser?.location?.readableAddress || "No address details available"}
              </p>
              <p className="text-xs text-stitch-on-surface-variant/80">
                {booking.location?.city || familyUser?.location?.city || "City"}, {booking.location?.governorate || familyUser?.location?.governorate || "Governorate"}
              </p>

              {/* View map redirection button using coordinates */}
              {(booking.location?.geo?.coordinates?.length === 2 || familyUser?.location?.geo?.coordinates?.length === 2) && (
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${
                    booking.location?.geo?.coordinates?.length === 2 
                      ? `${booking.location.geo.coordinates[1]},${booking.location.geo.coordinates[0]}`
                      : `${familyUser?.location?.geo?.coordinates?.[1]},${familyUser?.location?.geo?.coordinates?.[0]}`
                  }`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2 w-full py-2 bg-teal-50 hover:bg-teal-100 text-stitch-primary rounded-xl text-xs font-semibold transition-all border border-teal-100 mt-2"
                >
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>عرض الموقع على الخريطة</span>
                </a>
              )}
            </div>
          </div>

          {/* Timing details card */}
          <div className="bg-white border border-stitch-outline/10 shadow-soft rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-stitch-on-surface-variant flex items-center space-x-2">
              <Clock className="w-4 h-4 text-stitch-primary" />
              <span>Current Slot</span>
            </h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-stitch-on-surface text-sm font-semibold">
                <Calendar className="w-4 h-4 text-stitch-on-surface-variant/60" />
                <span>{new Date(activeSchedule.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
              </div>
              <div className="text-stitch-on-surface font-bold text-lg">
                {activeSchedule.startTime} - {activeSchedule.endTime}
              </div>
              <span className="inline-block text-[10px] bg-sand-low text-stitch-on-surface-variant border border-stitch-outline/20 px-2 py-0.5 rounded font-mono">
                Slot {activeScheduleIndex + 1} of {booking.schedule?.length || 0}
              </span>
            </div>
          </div>

        </div>

        {/* Shift Console */}
        <div className="bg-white border border-stitch-outline/10 shadow-soft rounded-3xl p-6 md:p-8 space-y-8 relative overflow-hidden">
          
          {/* Subtle glow background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-stitch-primary/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-stitch-outline/25 pb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold flex items-center space-x-2.5 text-stitch-on-surface">
                <Activity className="w-5 h-5 text-stitch-primary animate-pulse" />
                <span>Shift Status Console</span>
              </h2>
              <p className="text-xs text-stitch-on-surface-variant/80 mt-1">
                Your check-ins are verified and shared with the family in real-time.
              </p>
            </div>
            
            {/* Live Indicator Badges */}
            <div className="flex items-center space-x-2">
              {activeSchedule.checkInTime ? (
                activeSchedule.checkOutTime ? (
                  <span className="px-3 py-1 bg-sand-low text-stitch-on-surface-variant border border-stitch-outline/20 rounded-full text-xs font-semibold">
                    Shift Checked Out
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-teal-50 text-stitch-primary border border-teal-100 rounded-full text-xs font-semibold flex items-center space-x-1.5 animate-pulse">
                    <span className="w-2 bg-stitch-primary h-2 rounded-full" />
                    <span>Currently Active</span>
                  </span>
                )
              ) : (
                <span className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-xs font-semibold">
                  Awaiting Check-In
                </span>
              )}
            </div>
          </div>

          {/* Action Button Block */}
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-6">
            
            {/* Flow 1: Not Checked In Yet */}
            {!activeSchedule.checkInTime && (
              <div className="space-y-4 max-w-sm w-full">
                <div className="w-20 h-20 bg-teal-50 border border-teal-100 rounded-full flex items-center justify-center mx-auto text-stitch-primary shadow-soft">
                  <Play className="w-8 h-8 fill-stitch-primary translate-x-0.5" />
                </div>
                <div className="space-y-1.5 text-center">
                  <h4 className="font-bold text-lg text-stitch-on-surface">البدء في الشفت</h4>
                  <p className={`text-xs ${checkInStatus.isApproaching ? 'text-amber-600 font-semibold' : 'text-stitch-on-surface-variant/85'}`}>
                    {checkInStatus.message}
                  </p>
                </div>
                <button
                  onClick={handleCheckIn}
                  disabled={actionLoading || !checkInStatus.canCheckIn}
                  className="w-full py-4 bg-stitch-primary hover:bg-stitch-primary/95 text-white font-bold rounded-2xl shadow-soft hover:shadow-premium transition-all flex items-center justify-center space-x-2 text-base disabled:opacity-50 disabled:pointer-events-none"
                >
                  {actionLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>تسجيل الدخول (Check-In)</span>
                  )}
                </button>
              </div>
            )}

            {/* Flow 2: Checked In & In-Progress */}
            {activeSchedule.checkInTime && !activeSchedule.checkOutTime && (
              <div className="w-full space-y-8 text-left">
                
                {/* Check In info banner */}
                <div className="p-4 bg-sand-low rounded-2xl border border-stitch-outline/20 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2.5 text-stitch-on-surface-variant">
                    <Clock className="w-4 h-4 text-stitch-primary" />
                    <span>Checked In at:</span>
                    <strong className="text-stitch-on-surface">
                      {new Date(activeSchedule.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </strong>
                  </div>
                  <span className="text-[10px] text-stitch-primary font-semibold bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100">
                    GPS Logged
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-stitch-on-surface-variant">Shift Progress</span>
                    <span className="font-mono text-stitch-primary font-bold">
                      {taskStats.completed}/{taskStats.total} Tasks ({taskStats.percentage}%)
                    </span>
                  </div>
                  <div className="h-3 bg-sand-low rounded-full border border-stitch-outline/20 overflow-hidden">
                    <div 
                      className="h-full bg-stitch-primary transition-all duration-500 ease-out rounded-full"
                      style={{ width: `${taskStats.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Tasks List */}
                <div className="space-y-4">
                  <h3 className="font-bold text-stitch-on-surface text-sm tracking-wide uppercase">Interactive Tasks Checklist</h3>
                  {activeSchedule.tasksList && activeSchedule.tasksList.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                      {activeSchedule.tasksList.map((task: any) => (
                        <div 
                          key={task._id}
                          onClick={() => handleToggleTask(task._id, task.isCompleted)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center space-x-4 select-none ${
                            task.isCompleted 
                              ? "bg-sand-low border-stitch-outline/10 text-stitch-on-surface-variant/60" 
                              : "bg-white border-stitch-outline/20 hover:border-stitch-outline/40 hover:shadow-soft text-stitch-on-surface"
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                            task.isCompleted 
                              ? "bg-teal-50 border-stitch-primary text-stitch-primary" 
                              : "border-stitch-outline/35 bg-white"
                          }`}>
                            {task.isCompleted && <CheckCircle className="w-4 h-4 shrink-0" />}
                          </div>
                          <span className={`text-sm font-medium ${task.isCompleted ? "line-through" : ""}`}>
                            {task.title || task.taskDescription}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 bg-sand-low rounded-2xl border border-dashed border-stitch-outline/20 text-center text-stitch-on-surface-variant/60 text-sm">
                      No tasks assigned for this shift.
                    </div>
                  )}
                </div>

                {/* Check-Out Button Block */}
                <div className="border-t border-stitch-outline/25 pt-6 space-y-4 w-full">
                  <div className="space-y-1">
                    <h4 className="font-semibold text-stitch-on-surface text-sm">Ready to wrap up?</h4>
                    <p className="text-xs text-stitch-on-surface-variant/80">
                      Checking out submits the completed task checklist and records your departure time.
                    </p>
                    
                    {/* Tasks checklist warnings */}
                    {!allTasksCompleted && (
                      <p className="text-xs text-red-650 font-semibold pt-1 text-right" dir="rtl">
                        * يرجى إتمام جميع المهام المطلوبة لتسجيل الانصراف وإنهاء الشفت.
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={handleCheckOut}
                    disabled={actionLoading || !allTasksCompleted}
                    className="w-full py-4 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold rounded-2xl shadow-soft hover:shadow-premium active:scale-98 transition-all flex items-center justify-center space-x-2 text-base disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Square className="w-4 h-4 fill-white" />
                        <span>Check-Out & End Shift</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            )}

            {/* Flow 3: Checked Out / Finished */}
            {activeSchedule.checkInTime && activeSchedule.checkOutTime && (
              <div className="space-y-4 max-w-sm py-4">
                <div className="w-20 h-20 bg-teal-50 border border-teal-100 rounded-full flex items-center justify-center mx-auto text-stitch-primary shadow-soft">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-lg text-stitch-on-surface">Shift Completed!</h4>
                  <p className="text-xs text-stitch-on-surface-variant/80">
                    You have successfully completed this shift. Checkout was logged at {" "}
                    <strong>
                      {new Date(activeSchedule.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </strong>.
                  </p>
                </div>
                <Link
                  href="/companion/bookings"
                  className="inline-block px-6 py-2.5 bg-stitch-primary hover:bg-stitch-primary/95 text-white font-medium rounded-xl text-sm transition-all shadow-soft"
                >
                  Return to Dashboard
                </Link>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Cash Collection Modal */}
      {showCashModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in font-stitch-body">
          <div className="bg-white border border-stitch-outline/20 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-premium relative space-y-6 text-right" dir="rtl">
            <div className="w-16 h-16 bg-amber-550 border border-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            
            <div className="space-y-2 text-center">
              <h3 className="text-xl font-bold text-stitch-on-surface">
                تأكيد تحصيل المبلغ النقدي
              </h3>
              <p className="text-sm text-stitch-on-surface-variant leading-relaxed">
                هذا هو الشفت الأخير للحجز النقدي. يرجى تأكيد استلام إجمالي المبلغ المستحق من العائلة:
              </p>
              <div className="text-2xl font-black text-stitch-primary font-mono py-2 bg-sand-low rounded-2xl border border-stitch-outline/20">
                EGP {booking?.totalPrice}
              </div>
              <p className="text-xs text-red-650 font-medium leading-relaxed">
                * عند التأكيد، سيتم احتساب نسبة عمولة المنصة (10%) كمديونية على محفظتك الشخصية. يرجى التأكد من استلام كامل المبلغ قبل المتابعة.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowCashModal(false)}
                disabled={actionLoading}
                className="py-3 bg-sand-low hover:bg-sand-high text-stitch-on-surface-variant font-bold rounded-xl transition-all border border-stitch-outline/20 disabled:opacity-50 text-sm"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmCashAndCheckout}
                disabled={actionLoading}
                className="py-3 bg-stitch-primary hover:bg-stitch-primary/95 text-white font-bold rounded-xl transition-all shadow-soft disabled:opacity-50 flex items-center justify-center space-x-2 text-sm"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>تأكيد واستلام</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
