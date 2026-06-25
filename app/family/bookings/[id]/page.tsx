"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBookingRealtime } from "../../../../hooks/useBookingRealtime";
import { PostShiftReviewModal } from "../../../../components/review/PostShiftReviewModal";
import { 
  Clock, 
  MapPin, 
  User as UserIcon, 
  ArrowLeft,
  Calendar, 
  Activity, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Phone,
  ShieldCheck,
  Star,
  MessageSquare
} from "lucide-react";
import Link from "next/link";

export default function FamilyTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const { booking, isLoading, error, refresh } = useBookingRealtime(id);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  // Find today's schedule slot or fallback to the first incomplete one
  const activeScheduleIndex = useMemo(() => {
    if (!booking || !booking.schedule || booking.schedule.length === 0) return -1;
    
    const todayStr = new Date().toDateString();
    
    // 1. Try to find a slot matching today's date
    const todayIndex = booking.schedule.findIndex(
      (item) => new Date(item.date).toDateString() === todayStr
    );
    if (todayIndex !== -1) return todayIndex;
    
    // 2. Fallback to the first incomplete slot
    const incompleteIndex = booking.schedule.findIndex(
      (item) => !item.checkOutTime
    );
    if (incompleteIndex !== -1) return incompleteIndex;
    
    // 3. Absolute fallback
    return booking.schedule.length - 1;
  }, [booking]);

  const activeSchedule = booking?.schedule?.[activeScheduleIndex];

  // Auto trigger the review modal once the booking is completed
  useEffect(() => {
    if (booking?.status === "completed" && !hasReviewed) {
      setIsReviewOpen(true);
    }
  }, [booking?.status, hasReviewed]);

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

  // Determine status badge info
  const liveBadge = useMemo(() => {
    if (!booking) return { text: "Unknown", color: "bg-sand-low text-stitch-on-surface-variant border border-stitch-outline/20" };
    
    if (booking.status === "cancelled") {
      return { text: "Shift Cancelled", color: "bg-red-50 text-red-650 border border-red-100" };
    }
    if (booking.status === "pending_payment") {
      return { text: "Pending Payment", color: "bg-amber-50 text-amber-600 border border-amber-100 animate-pulse" };
    }
    if (booking.status === "completed") {
      return { text: "Shift Ended", color: "bg-sand-low text-stitch-on-surface-variant border border-stitch-outline/20" };
    }

    if (activeSchedule) {
      if (activeSchedule.checkInTime && !activeSchedule.checkOutTime) {
        return { text: "Companion On Site", color: "bg-teal-50 text-stitch-primary border border-teal-100 animate-pulse" };
      }
      if (activeSchedule.checkOutTime) {
        return { text: "Shift Ended", color: "bg-sand-low text-stitch-on-surface-variant border border-stitch-outline/20" };
      }
    }

    // Default when approved but not checked in yet
    if (booking.status === "approved" || booking.status === "pending") {
      return { text: "Companion In Route", color: "bg-sky-50 text-sky-650 border border-sky-100 animate-pulse" };
    }

    return { text: "Inactive", color: "bg-sand-low text-stitch-on-surface-variant border border-stitch-outline/20" };
  }, [booking, activeSchedule]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-sand text-stitch-on-surface flex flex-col items-center justify-center p-6">
        <Loader2 className="w-12 h-12 text-stitch-primary animate-spin mb-4" />
        <p className="text-stitch-on-surface-variant font-medium">Loading tracking hub...</p>
      </div>
    );
  }

  if (error || !booking || !activeSchedule) {
    return (
      <div className="min-h-screen bg-sand text-stitch-on-surface flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Tracking Error</h2>
        <p className="text-stitch-on-surface-variant max-w-md mb-6">{error || "No active schedule slot could be determined for this booking."}</p>
        <Link 
          href="/family/bookings" 
          className="px-6 py-2.5 bg-stitch-primary hover:bg-stitch-primary/95 text-white rounded-xl font-medium transition-all shadow-soft"
        >
          Back to Bookings
        </Link>
      </div>
    );
  }

  const companionUser = typeof booking.companionId === "object" ? booking.companionId : null;

  return (
    <div className="min-h-screen text-stitch-on-surface p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              href="/family/bookings" 
              className="p-2 bg-white hover:bg-sand-low rounded-full border border-stitch-outline/20 transition-all text-stitch-on-surface-variant hover:text-stitch-on-surface shadow-soft"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <span className="text-xs font-semibold text-stitch-primary uppercase tracking-widest">Live Monitoring</span>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-stitch-on-surface font-stitch-display">Care Tracking Hub</h1>
            </div>
          </div>

          {booking.status === "completed" && (
            <button
              onClick={() => setIsReviewOpen(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stitch-on-surface font-bold rounded-xl text-xs transition-all flex items-center space-x-1.5 shadow-soft border border-amber-600/10"
            >
              <Star className="w-4 h-4 fill-stitch-on-surface text-stitch-on-surface" />
              <span>Review Shift</span>
            </button>
          )}
        </div>

        {/* Live Tracking Status Banner */}
        <div className="bg-white border border-stitch-outline/10 shadow-soft rounded-3xl p-6 md:p-8 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-stitch-primary/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-stitch-outline/25 pb-6">
            <div className="space-y-1.5 text-right">
              <span className="text-[10px] text-stitch-primary font-bold bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100 uppercase tracking-wider">
                Live Broadcast Connection Active
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-stitch-on-surface mt-1">Real-time Care Progress</h2>
            </div>
            
            <div className={`px-4 py-1.5 border rounded-full text-sm font-bold flex items-center space-x-2 ${liveBadge.color}`}>
              <Activity className="w-4 h-4" />
              <span>{liveBadge.text}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            
            {/* Left side: Timeline Progress */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-stitch-on-surface-variant uppercase tracking-wider">Shift Clocking Log</h3>
              
              <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stitch-outline/25">
                
                {/* Step 1: Checked In */}
                <div className="flex items-start space-x-4 relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border z-10 ${
                    activeSchedule.checkInTime 
                      ? "bg-teal-50 border-stitch-primary text-stitch-primary" 
                      : "bg-sand-low border-stitch-outline/20 text-stitch-on-surface-variant/50"
                  }`}>
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-stitch-on-surface">Arrival (Check-In)</h4>
                    <p className="text-xs text-stitch-on-surface-variant/80 mt-0.5">
                      {activeSchedule.checkInTime 
                        ? `Companion checked in at ${new Date(activeSchedule.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : "Awaiting companion check-in at site"}
                    </p>
                  </div>
                </div>

                {/* Step 2: Checked Out */}
                <div className="flex items-start space-x-4 relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border z-10 ${
                    activeSchedule.checkOutTime 
                      ? "bg-teal-50 border-stitch-primary text-stitch-primary" 
                      : "bg-sand-low border-stitch-outline/20 text-stitch-on-surface-variant/50"
                  }`}>
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-stitch-on-surface">Departure (Check-Out)</h4>
                    <p className="text-xs text-stitch-on-surface-variant/80 mt-0.5">
                      {activeSchedule.checkOutTime 
                        ? `Companion completed shift and checked out at ${new Date(activeSchedule.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : "Awaiting checkout confirmation"}
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Right side: Real-time progress stats */}
            <div className="flex flex-col justify-between space-y-6">
              <div>
                <h3 className="text-sm font-bold text-stitch-on-surface-variant uppercase tracking-wider mb-4">Task completion metric</h3>
                <div className="space-y-3 p-5 bg-sand-low rounded-2xl border border-stitch-outline/20">
                  <div className="flex items-center justify-between text-xs text-stitch-on-surface-variant font-semibold">
                    <span>Task Progress</span>
                    <span className="font-mono text-stitch-primary font-bold">
                      {taskStats.completed}/{taskStats.total} ({taskStats.percentage}%)
                    </span>
                  </div>
                  <div className="h-2.5 bg-white rounded-full border border-stitch-outline/10 overflow-hidden">
                    <div 
                      className="h-full bg-stitch-primary transition-all duration-500 ease-out"
                      style={{ width: `${taskStats.percentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {booking.status === "completed" && (
                <div className="p-4 bg-teal-50 border border-teal-100 rounded-2xl text-stitch-primary text-xs flex items-center space-x-2.5 shadow-soft">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <span>The booking has completed successfully. Escrow payouts are processed.</span>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Booking Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          
          {/* Beneficiary Info Card */}
          <div className="bg-white border border-stitch-outline/10 shadow-soft rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-stitch-on-surface-variant flex items-center space-x-2">
              <UserIcon className="w-4 h-4 text-stitch-primary" />
              <span>Care Details</span>
            </h3>
            {booking.beneficiary ? (
              <div className="p-3 bg-sand-low rounded-xl border border-stitch-outline/10 text-xs space-y-1.5 text-right" dir="rtl">
                <div className="font-bold text-stitch-on-surface text-center pb-1 border-b border-stitch-outline/10">تفاصيل متلقي الرعاية</div>
                <div><strong>الاسم:</strong> {booking.beneficiary.name}</div>
                <div><strong>العمر:</strong> {booking.beneficiary.age} سنة ({booking.beneficiary.gender === 'male' ? 'ذكر' : 'أنثى'})</div>
                <div className="leading-relaxed"><strong>الحالة الصحية:</strong> {booking.beneficiary.conditionDetails}</div>
              </div>
            ) : (
              <p className="text-xs text-stitch-on-surface-variant/80">No beneficiary details populated</p>
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
                {booking.location?.readableAddress || "No address details available"}
              </p>
              <p className="text-xs text-stitch-on-surface-variant/80">
                {booking.location?.city || "City"}, {booking.location?.governorate || "Governorate"}
              </p>

              {/* View map redirection button using coordinates */}
              {booking.location?.geo?.coordinates?.length === 2 && (
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${booking.location.geo.coordinates[1]},${booking.location.geo.coordinates[0]}`}
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

        {/* Live Tasks Checklist Panel */}
        <div className="bg-white border border-stitch-outline/10 shadow-soft rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-stitch-on-surface">Companion Tasks Checklist</h2>
            <span className="text-xs text-stitch-on-surface-variant/50">Read-Only View</span>
          </div>

          {activeSchedule.tasksList && activeSchedule.tasksList.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {activeSchedule.tasksList.map((task: any) => (
                <div 
                  key={task._id}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                    task.isCompleted 
                      ? "bg-sand-low border-stitch-outline/10 text-stitch-on-surface-variant/60" 
                      : "bg-white border-stitch-outline/20 text-stitch-on-surface"
                  }`}
                >
                  <div className="flex items-center space-x-3.5">
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                      task.isCompleted 
                        ? "bg-teal-50 border-stitch-primary text-stitch-primary" 
                        : "border-stitch-outline/35 bg-white text-transparent"
                    }`}>
                      <CheckCircle className="w-3.5 h-3.5" />
                    </div>
                    <span className={`text-sm font-medium ${task.isCompleted ? "line-through" : ""}`}>
                      {task.taskDescription}
                    </span>
                  </div>
                  
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                    task.isCompleted 
                      ? "bg-teal-50 text-stitch-primary border border-teal-100" 
                      : "bg-sand-low text-stitch-on-surface-variant/60 border border-stitch-outline/10"
                  }`}>
                    {task.isCompleted ? "Completed" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 bg-sand-low rounded-2xl border border-dashed border-stitch-outline/20 text-center text-stitch-on-surface-variant/60 text-sm">
              No tasks assigned for this shift.
            </div>
          )}
        </div>

        {/* Companion Profile Card */}
        {companionUser && (
          <div className="bg-white border border-stitch-outline/10 shadow-soft rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              {companionUser.avatar ? (
                <img 
                  src={companionUser.avatar} 
                  alt={companionUser.name} 
                  className="w-14 h-14 rounded-full object-cover border border-stitch-outline/25"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-teal-50 text-stitch-primary flex items-center justify-center font-bold text-lg border border-teal-100">
                  {companionUser.name.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="font-bold text-stitch-on-surface">{companionUser.name}</h3>
                <p className="text-xs text-stitch-on-surface-variant/80">Assigned Companion Caregiver</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-[10px] bg-teal-50 text-stitch-primary border border-teal-100 px-2 py-0.5 rounded font-semibold">
                    Verified ID
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {companionUser.phone && (
                <a 
                  href={`tel:${companionUser.phone}`}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-stitch-primary hover:bg-stitch-primary/95 text-white rounded-xl text-xs font-bold transition-all border border-stitch-primary/10 shadow-soft"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call Companion</span>
                </a>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Review Modal Trigger */}
      <PostShiftReviewModal
        bookingId={id}
        isOpen={isReviewOpen}
        onClose={() => {
          setIsReviewOpen(false);
          setHasReviewed(true);
        }}
        onSuccess={() => {
          setHasReviewed(true);
        }}
      />
    </div>
  );
}
