"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useSocket } from "@/components/providers/SocketProvider";
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification, 
  deleteAllNotifications 
} from "@/lib/API";
import type { NotificationItem } from "@/types";
import { 
  Bell, 
  Check, 
  Trash2, 
  Loader2, 
  CalendarDays, 
  MapPin, 
  Star, 
  CreditCard, 
  AlertCircle, 
  Briefcase, 
  FileText, 
  MessageSquare,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface NotificationsDashboardProps {
  role: "family" | "companion";
}

export default function NotificationsDashboard({ role }: NotificationsDashboardProps) {
  const t = useTranslations("notifications");
  const locale = useLocale();
  const router = useRouter();
  const isRtl = locale === "ar";
  const { socket } = useSocket();

  const getLocalizedNotification = (title: string, message: string) => {
    let localizedTitle = title;
    let localizedMessage = message;

    const titleLower = title.toLowerCase();
    
    // Title mapping
    if (titleLower.includes("booking request") || titleLower.includes("طلب حجز جديد")) {
      localizedTitle = t("notifTitle_bookingRequest");
    } else if (titleLower.includes("booking approved") || titleLower.includes("تم قبول الحجز")) {
      localizedTitle = t("notifTitle_bookingApproved");
    } else if (titleLower.includes("booking cancelled") || titleLower.includes("تم إلغاء الحجز")) {
      localizedTitle = t("notifTitle_bookingCancelled");
    } else if (titleLower.includes("booking completed") || titleLower.includes("تم إكمال الحجز") || titleLower.includes("booking status updated")) {
      localizedTitle = t("notifTitle_bookingStatusUpdated");
    } else if (titleLower.includes("proposal submitted") || titleLower.includes("تقديم عرض جديد")) {
      localizedTitle = t("notifTitle_proposalSubmitted");
    } else if (titleLower.includes("proposal accepted") || titleLower.includes("تم قبول العرض")) {
      localizedTitle = t("notifTitle_proposalAccepted");
    } else if (titleLower.includes("proposal rejected") || titleLower.includes("تم رفض العرض")) {
      localizedTitle = t("notifTitle_proposalRejected");
    } else if (titleLower.includes("payout released") || titleLower.includes("تم صرف المستحقات")) {
      localizedTitle = t("notifTitle_payoutReleased");
    } else if (titleLower.includes("companion checked in") || titleLower.includes("وصول المرافق للموقع")) {
      localizedTitle = t("notifTitle_companionCheckedIn");
    } else if (titleLower.includes("refund processed") || titleLower.includes("تم استرداد المبلغ")) {
      localizedTitle = t("notifTitle_refundProcessed");
    } else if (titleLower.includes("payment") || titleLower.includes("دفعة") || titleLower.includes("الدفع") || titleLower.includes("تحديث الدفع")) {
      localizedTitle = t("notifTitle_payment");
    } else if (titleLower.includes("message") || titleLower.includes("رسالة")) {
      localizedTitle = t("notifTitle_message");
    }

    // Message mapping
    const messageLower = message.toLowerCase();
    
    if (messageLower.includes("new booking request") || messageLower.includes("طلب حجز جديد") || messageLower.includes("حجز جديد من")) {
      const nameMatch = message.match(/from\s+([A-Za-z0-9\s\u0600-\u06FF]+)/i) || message.match(/من\s+([A-Za-z0-9\s\u0600-\u06FF]+)/);
      const name = nameMatch ? nameMatch[1].trim() : "";
      localizedMessage = name 
        ? t("notifDesc_bookingRequestWithName", { name }) 
        : t("notifDesc_bookingRequest");
    } else if (messageLower.includes("approved by") || messageLower.includes("قبول الحجز من قبل")) {
      const nameMatch = message.match(/by\s+([A-Za-z0-9\s\u0600-\u06FF]+)/i) || message.match(/قبل\s+([A-Za-z0-9\s\u0600-\u06FF]+)/);
      const name = nameMatch ? nameMatch[1].trim() : "";
      localizedMessage = name 
        ? t("notifDesc_bookingApprovedWithName", { name }) 
        : t("notifDesc_bookingApproved");
    } else if (messageLower.includes("proposal for your job post") || messageLower.includes("تقديم عرض على طلب العمل")) {
      const jobMatch = message.match(/post:\s*(.+)/i) || message.match(/العمل الخاص بك:\s*(.+)/);
      const jobTitle = jobMatch ? jobMatch[1].trim() : "";
      localizedMessage = jobTitle 
        ? t("notifDesc_proposalSubmittedWithTitle", { title: jobTitle }) 
        : t("notifDesc_proposalSubmitted");
    } else if (messageLower.includes("proposal for") || messageLower.includes("عرضك لطلب العمل")) {
      const jobMatch = message.match(/post\s+(.+)\s+has/i) || message.match(/العمل\s+(.+)\s+بـ/) || message.match(/العمل\s+(.+)\s+قد/);
      const jobTitle = jobMatch ? jobMatch[1].trim() : "";
      
      if (messageLower.includes("accepted") || messageLower.includes("قبول") || messageLower.includes("مقبول")) {
        localizedMessage = jobTitle 
          ? t("notifDesc_proposalAcceptedWithTitle", { title: jobTitle }) 
          : t("notifDesc_proposalAccepted");
      } else {
        localizedMessage = jobTitle 
          ? t("notifDesc_proposalRejectedWithTitle", { title: jobTitle }) 
          : t("notifDesc_proposalRejected");
      }
    } else if (messageLower.includes("payout for booking") || messageLower.includes("مستحقاتك للحجز")) {
      const bookingMatch = message.match(/booking\s+([A-Za-z0-9]+)/i) || message.match(/للحجز\s+([A-Za-z0-9]+)/);
      const bookingId = bookingMatch ? bookingMatch[1].trim() : "";
      localizedMessage = bookingId 
        ? t("notifDesc_bookingPayoutReleased", { bookingId }) 
        : t("notifDesc_payoutReleased");
    } else if (messageLower.includes("daily payout of") || messageLower.includes("مستحقات يومية بقيمة")) {
      const amountMatch = message.match(/of\s+(\$[0-9.,]+)/i) || message.match(/بقيمة\s+(\$[0-9.,]+)/) || message.match(/(\$[0-9.,]+)/);
      const amount = amountMatch ? amountMatch[1].trim() : "";
      localizedMessage = amount 
        ? t("notifDesc_dailyPayout", { amount }) 
        : t("notifDesc_dailyPayout", { amount: "" });
    } else if (messageLower.includes("checked in") || messageLower.includes("وصول المرافق")) {
      // e.g., "Amr Hegazi has checked in at the care site and started the session"
      const nameMatch = message.match(/^([A-Za-z0-9\s\u0600-\u06FF]+)\s+has checked in/i) || message.match(/وصل\s+([A-Za-z0-9\s\u0600-\u06FF]+)\s+إلى/);
      const name = nameMatch ? nameMatch[1].trim() : "";
      localizedMessage = name 
        ? t("notifDesc_companionCheckedIn", { name }) 
        : t("notifDesc_companionCheckedIn", { name: "" });
    } else if (messageLower.includes("payment of") && messageLower.includes("failed")) {
      // e.g. "Your payment of $792.00 for stroke recovery support has failed. Please verify your card details."
      const amountMatch = message.match(/payment of\s+(\$[0-9.,]+)/i);
      const amount = amountMatch ? amountMatch[1].trim() : "";
      const serviceMatch = message.match(/for\s+(.+?)\s+has failed/i);
      const service = serviceMatch ? serviceMatch[1].trim() : "";
      localizedMessage = t("notifDesc_paymentFailed", { amount, service });
    } else if (messageLower.includes("completed") || messageLower.includes("إكمال الحجز") || messageLower.includes("اكتمل الحجز") || messageLower.includes("إكمال الحجز بنجاح")) {
      localizedMessage = t("notifDesc_bookingCompleted");
    } else if (messageLower.includes("cancelled") || messageLower.includes("إلغاء الحجز") || messageLower.includes("تم إلغاء") || messageLower.includes("إلغاء الحجز")) {
      localizedMessage = t("notifDesc_bookingCancelled");
    } else if (messageLower.includes("refund") || messageLower.includes("استرداد")) {
      localizedMessage = t("notifDesc_refundProcessed");
    }

    return { title: localizedTitle, message: localizedMessage };
  };

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      setError(null);
      const data = await getUserNotifications(page, 15, unreadOnly);
      if (data) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
        setTotalPages(data.pagination.totalPages || 1);
      }
    } catch (err: any) {
      console.error("Error loading notifications:", err);
      setError(t("loadError"));
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [page, unreadOnly, t]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time socket updates
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (newNotif: any) => {
      if (page === 1) {
        setNotifications((prev) => {
          if (prev.some((n) => n._id === newNotif._id)) return prev;
          if (unreadOnly && newNotif.isRead) return prev;
          return [newNotif, ...prev].slice(0, 15);
        });
      }
      setUnreadCount((prev) => prev + 1);
    };

    socket.on("new_notification", handleNewNotification);
    return () => {
      socket.off("new_notification", handleNewNotification);
    };
  }, [socket, page, unreadOnly]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      fetchNotifications(true);
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setActionLoading(true);
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm(isRtl ? "هل أنت متأكد من حذف جميع الإشعارات؟" : "Are you sure you want to delete all notifications?")) return;
    try {
      setActionLoading(true);
      await deleteAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
      setPage(1);
      setTotalPages(1);
    } catch (err) {
      console.error("Failed to delete all notifications:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      await handleMarkAsRead(notif._id);
    }

    if (!notif.relatedId) return;

    // Handle intelligent redirect based on notification type and recipient role
    const type = notif.type;
    const id = notif.relatedId;

    if (type === "booking" || type === "tracking") {
      router.push(`/${role}/bookings/${id}`);
    } else if (type === "proposal") {
      if (role === "family") {
        router.push(`/family/job-posts`);
      } else {
        router.push(`/companion/applications`);
      }
    } else if (type === "jobpost") {
      if (role === "companion") {
        router.push(`/companion/bookings`); // Available posts dashboard
      } else {
        router.push(`/family/job-posts`);
      }
    } else if (type === "chat") {
      router.push(`/${role}/messages?bookingId=${id}`);
    } else if (type === "review") {
      router.push(`/${role}/profile`);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "booking":
        return <CalendarDays className="w-5 h-5 text-teal-600" />;
      case "tracking":
        return <MapPin className="w-5 h-5 text-sky-650" />;
      case "review":
        return <Star className="w-5 h-5 text-amber-500 fill-amber-400" />;
      case "payment":
        return <CreditCard className="w-5 h-5 text-emerald-600" />;
      case "proposal":
        return <Briefcase className="w-5 h-5 text-indigo-600" />;
      case "jobpost":
        return <FileText className="w-5 h-5 text-purple-600" />;
      case "chat":
        return <MessageSquare className="w-5 h-5 text-blue-600" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  const formatTimestamp = (dateInput?: string | Date) => {
    if (!dateInput) return "";
    const date = new Date(dateInput);
    
    // Check if valid date
    if (isNaN(date.getTime())) return "";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return isRtl ? "الآن" : "Just now";
    if (diffMins < 60) return isRtl ? `منذ ${diffMins} دقيقة` : `${diffMins}m ago`;
    if (diffHours < 24) return isRtl ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;

    // Otherwise format date nicely
    return date.toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4" dir={isRtl ? "rtl" : "ltr"}>
      
      {/* Title & Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-stitch-display font-bold text-stitch-on-surface">
            {t("title")}
          </h1>
          {unreadCount > 0 && (
            <span className="bg-teal-50 text-stitch-primary border border-teal-100 text-xs font-bold px-3 py-1 rounded-full">
              {t("unreadCount", { count: unreadCount })}
            </span>
          )}
        </div>

        {/* Global Controls */}
        {notifications.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleMarkAllRead}
              disabled={actionLoading || unreadCount === 0}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-soft"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{t("markAllRead")}</span>
            </button>
            <button
              onClick={handleDeleteAll}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-red-50 border border-slate-200 text-red-650 hover:text-red-700 text-xs font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-soft"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t("clearAll")}</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs / Filters */}
      <div className="flex bg-white border border-stitch-outline/15 p-1 rounded-2xl shadow-soft self-start inline-flex">
        <button
          onClick={() => {
            setUnreadOnly(false);
            setPage(1);
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            !unreadOnly
              ? "bg-[#1f8a8a] text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {t("all")}
        </button>
        <button
          onClick={() => {
            setUnreadOnly(true);
            setPage(1);
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            unreadOnly
              ? "bg-[#1f8a8a] text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {t("unread")}
        </button>
      </div>

      {/* Main List Area */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4 bg-white border border-stitch-outline/10 rounded-3xl shadow-soft">
            <Loader2 className="w-10 h-10 text-stitch-primary animate-spin" />
            <span className="text-sm text-slate-500 font-medium">{t("loading")}</span>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 border border-red-150 rounded-3xl text-red-650 text-sm text-center">
            {error}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 bg-white border border-stitch-outline/10 rounded-3xl shadow-soft text-center space-y-5">
            <div className="relative">
              <div className="absolute inset-0 bg-teal-50 rounded-full blur-xl scale-125 animate-pulse" />
              <div className="relative w-16 h-16 rounded-full bg-teal-50 border border-teal-100 text-stitch-primary flex items-center justify-center">
                <Bell className="w-7 h-7" />
              </div>
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h3 className="text-lg font-bold text-stitch-on-surface">
                {t("emptyTitle")}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t("emptyDesc")}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => {
              const sender = notif.senderId as any;
              const { title: displayTitle, message: displayMessage } = getLocalizedNotification(notif.title, notif.message);
              return (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`group relative flex gap-4 p-5 bg-white border border-stitch-outline/10 rounded-2xl shadow-soft hover:shadow-premium hover:border-[#1f8a8a]/30 transition-all duration-300 cursor-pointer ${
                    !notif.isRead ? "border-s-4 border-s-[#1f8a8a] bg-teal-50/5" : ""
                  }`}
                >
                  {/* Left Icon or Avatar */}
                  <div className="shrink-0">
                    {sender && sender.name ? (
                      sender.avatar && typeof sender.avatar === "object" && sender.avatar.url ? (
                        <img 
                          src={sender.avatar.url} 
                          alt={sender.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-100"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-teal-50 border border-teal-100 text-stitch-primary flex items-center justify-center font-bold text-sm">
                          {sender.name.slice(0, 2).toUpperCase()}
                        </div>
                      )
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-150 text-slate-650 flex items-center justify-center">
                        {getNotificationIcon(notif.type)}
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0 space-y-1.5 text-start">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`text-sm font-bold text-stitch-on-surface truncate ${
                        !notif.isRead ? "text-slate-900 font-extrabold" : "text-slate-700"
                      }`}>
                        {displayTitle}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-bold">
                        {formatTimestamp(notif.createdAt)}
                      </span>
                    </div>
                    <p className={`text-xs leading-relaxed ${
                      !notif.isRead ? "text-slate-800 font-medium" : "text-slate-500"
                    }`}>
                      {displayMessage}
                    </p>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 self-center">
                    {!notif.isRead && (
                      <button
                        onClick={(e) => handleMarkAsRead(notif._id, e)}
                        className="p-1.5 hover:bg-teal-50 rounded-lg text-slate-400 hover:text-stitch-primary transition-all cursor-pointer"
                        title={t("markAllRead")}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(notif._id, e)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-650 transition-all cursor-pointer"
                      title={t("delete")}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <button
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            disabled={page === 1}
            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shadow-soft"
          >
            {isRtl ? <ChevronRight className="w-4.5 h-4.5" /> : <ChevronLeft className="w-4.5 h-4.5" />}
          </button>
          <span className="text-xs font-bold text-slate-650">
            {isRtl 
              ? `صفحة ${page} من ${totalPages}` 
              : `Page ${page} of ${totalPages}`}
          </span>
          <button
            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shadow-soft"
          >
            {isRtl ? <ChevronLeft className="w-4.5 h-4.5" /> : <ChevronRight className="w-4.5 h-4.5" />}
          </button>
        </div>
      )}

    </div>
  );
}
