"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/services/api";
import { useTranslations, useLocale } from "next-intl";

interface ServiceRequest {
  id: string;
  type: "Medical" | "Companion" | "Personal Care";
  urgency: "High Urgency" | "Standard";
  title: string;
  location: string;
  rate: number;
  postedAgo: string;
  date: string;
  time: string;
  description: string;
  distance: number; // in km
}

export default function CompanionRequests() {
  const t = useTranslations("companionRequests");
  const locale = useLocale();

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return t("justNow");
    const diffMs = new Date().getTime() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return t("justNow");
    if (diffMins < 60) return t("minutesAgo", { mins: diffMins });
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return t("hoursAgo", { hours: diffHours });
    return t("daysAgo", { days: Math.floor(diffHours / 24) });
  };

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const [activeBookingsCount, setActiveBookingsCount] = useState(12);
  const [urgencyFilter, setUrgencyFilter] = useState<string>("All");
  const [distanceFilter, setDistanceFilter] = useState<number>(25);
  const [typeFilter, setTypeFilter] = useState<string>("All");

  // Toast notifications state
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info";
  } | null>(null);

  const getLocalizedTitle = (type: "Medical" | "Companion" | "Personal Care") => {
    if (type === "Medical") return t("medicalAssistance");
    if (type === "Personal Care") return t("personalCareHygiene");
    return t("companionCareTitle");
  };

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/bookings/companion/requests");
      const bookings = response.data?.data?.bookings || [];

      const mapped: ServiceRequest[] = bookings.map((b: any) => {
        const notesLower = (b.notes || "").toLowerCase();
        const tasksText = (b.schedule?.[0]?.tasksList || [])
          .map((t: any) => (t.taskDescription || "").toLowerCase())
          .join(" ");
        const combinedText = `${notesLower} ${tasksText}`;

        let type: "Medical" | "Companion" | "Personal Care" = "Companion";
        if (
          combinedText.includes("medicine") ||
          combinedText.includes("pill") ||
          combinedText.includes("injection") ||
          combinedText.includes("vital") ||
          combinedText.includes("nurse") ||
          combinedText.includes("surgery") ||
          combinedText.includes("post-op") ||
          combinedText.includes("clinical") ||
          combinedText.includes("medical")
        ) {
          type = "Medical";
        } else if (
          combinedText.includes("bath") ||
          combinedText.includes("dress") ||
          combinedText.includes("wash") ||
          combinedText.includes("toilet") ||
          combinedText.includes("hygiene") ||
          combinedText.includes("clean")
        ) {
          type = "Personal Care";
        }

        const isUrgent =
          combinedText.includes("urgent") ||
          combinedText.includes("asap") ||
          combinedText.includes("immediate") ||
          combinedText.includes("critical") ||
          combinedText.includes("emergency");

        const scheduleItem = (
          b.schedule as Array<{ date?: string | Date }> | undefined
        )?.[0];
        const dateObj = scheduleItem?.date
          ? new Date(scheduleItem.date)
          : new Date();
        const formattedDate = dateObj.toLocaleDateString(
          locale === "ar" ? "ar-EG" : "en-US",
          {
            month: "short",
            day: "numeric",
            year: "numeric",
          }
        );

        const familyLocation = (b.familyId as { location?: { city?: string } })
          ?.location;
        const distance = familyLocation?.city
          ? (Math.random() * 8 + 2).toFixed(1)
          : "4.5";

        return {
          id: b._id,
          type,
          urgency: isUrgent ? "High Urgency" : "Standard",
          title: getLocalizedTitle(type),
          location:
            b.familyId?.location?.readableAddress ||
            b.familyId?.location?.city ||
            "Client Residence",
          rate: b.hourlyRateAtBooking || 120,
          postedAgo: b.createdAt ? formatTimeAgo(b.createdAt) : t("justNow"),
          date: formattedDate,
          time: `${b.schedule?.[0]?.startTime || "09:00 AM"} - ${b.schedule?.[0]?.endTime || "05:00 PM"}`,
          description:
            b.notes || "No additional instructions provided by the family.",
          distance: parseFloat(distance),
        };
      });
      setRequests(mapped);
    } catch (err: any) {
      console.error("Failed to load requests", err);
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  // Auto-close toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleAccept = async (id: string) => {
    const request = requests.find((r) => r.id === id);
    if (!request) return;

    setAnimatingId(id);
    try {
      await api.put(`/bookings/${id}/respond`, { action: "accept" });
      setTimeout(() => {
        setRequests((prev) => prev.filter((r) => r.id !== id));
        setActiveBookingsCount((prev) => prev + 1);
        setToast({
          message: t("acceptedToast", { title: request.title }),
          type: "success",
        });
        setAnimatingId(null);
      }, 400);
    } catch (err: any) {
      setAnimatingId(null);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        t("acceptError");
      setToast({
        message: msg,
        type: "info",
      });
    }
  };

  const handleReject = async (id: string) => {
    const request = requests.find((r) => r.id === id);
    if (!request) return;

    setAnimatingId(id);
    try {
      await api.put(`/bookings/${id}/respond`, { action: "decline" });
      setTimeout(() => {
        setRequests((prev) => prev.filter((r) => r.id !== id));
        setToast({
          message: t("declinedToast", { title: request.title }),
          type: "info",
        });
        setAnimatingId(null);
      }, 400);
    } catch (err: any) {
      setAnimatingId(null);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        t("declineError");
      setToast({
        message: msg,
        type: "info",
      });
    }
  };

  // Filter logic
  const filteredRequests = requests.filter((req) => {
    const matchesUrgency =
      urgencyFilter === "All" || req.urgency === urgencyFilter;
    const matchesDistance = req.distance <= distanceFilter;
    const matchesType = typeFilter === "All" || req.type === typeFilter;
    return matchesUrgency && matchesDistance && matchesType;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "Medical":
        return "medical_services";
      case "Companion":
        return "elderly";
      case "Personal Care":
        return "clean_hands";
      default:
        return "pending_actions";
    }
  };

  const getIconClass = (type: string) => {
    switch (type) {
      case "Medical":
        return "bg-red-50 text-red-600";
      case "Companion":
        return "bg-amber-50 text-amber-700";
      case "Personal Care":
        return "bg-teal-50 text-teal-600";
      default:
        return "bg-slate-50 text-slate-600";
    }
  };

  return (
    <div className="relative font-stitch-body select-none">
      {/* Header section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-stitch-display font-bold text-[#012d1d]">
            {t("title")}
          </h2>
          <p className="text-stitch-on-surface-variant/70 mt-1.5 text-sm">
            {loading
              ? t("loadingDesc")
              : error
                ? error
                : filteredRequests.length > 0
                  ? t("countDesc", { count: filteredRequests.length })
                  : t("noMatchDesc")}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Urgency */}
          <div className="bg-white px-4 py-2.5 rounded-2xl shadow-soft flex items-center gap-2 border border-stitch-outline/10 text-stitch-on-surface-variant">
            <span className="material-symbols-outlined text-stitch-primary text-xl">
              filter_list
            </span>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold focus:ring-0 focus:outline-none p-0 cursor-pointer text-[#2b2b2b]"
            >
              <option value="All">{t("urgencyAll")}</option>
              <option value="High Urgency">{t("highUrgency")}</option>
              <option value="Standard">{t("standard")}</option>
            </select>
          </div>

          {/* Distance */}
          <div className="bg-white px-4 py-2.5 rounded-2xl shadow-soft flex items-center gap-2 border border-stitch-outline/10 text-stitch-on-surface-variant">
            <span className="material-symbols-outlined text-stitch-primary text-xl">
              near_me
            </span>
            <select
              value={distanceFilter}
              onChange={(e) => setDistanceFilter(Number(e.target.value))}
              className="bg-transparent border-none text-xs font-semibold focus:ring-0 focus:outline-none p-0 cursor-pointer text-[#2b2b2b]"
            >
              <option value={5}>{t("withinKm", { km: 5 })}</option>
              <option value={10}>{t("withinKm", { km: 10 })}</option>
              <option value={25}>{t("withinKm", { km: 25 })}</option>
            </select>
          </div>

          {/* Category */}
          <div className="bg-white px-4 py-2.5 rounded-2xl shadow-soft flex items-center gap-2 border border-stitch-outline/10 text-stitch-on-surface-variant">
            <span className="material-symbols-outlined text-stitch-primary text-xl">
              category
            </span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold focus:ring-0 focus:outline-none p-0 cursor-pointer text-[#2b2b2b]"
            >
              <option value="All">{t("categoryAll")}</option>
              <option value="Medical">{t("medicalCare")}</option>
              <option value="Companion">{t("companionCare")}</option>
              <option value="Personal Care">{t("personalCare")}</option>
            </select>
          </div>
        </div>
      </header>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="bg-white p-6 rounded-3xl shadow-soft border border-slate-100 flex flex-col gap-5 animate-pulse"
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-4 w-full">
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl shrink-0" />
                  <div className="w-2/3 space-y-2">
                    <div className="h-3 bg-slate-100 rounded w-1/4" />
                    <div className="h-5 bg-slate-100 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="w-20 h-6 bg-slate-100 rounded shrink-0" />
              </div>
              <div className="h-14 bg-slate-50/70 rounded-2xl" />
              <div className="h-16 bg-slate-100 rounded-xl" />
              <div className="flex gap-3 mt-4">
                <div className="flex-1 h-12 bg-slate-100 rounded-2xl" />
                <div className="flex-1 h-12 bg-slate-100 rounded-2xl" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grid List */}
      {!loading && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredRequests.map((req) => {
            const isAnimating = animatingId === req.id;
            return (
              <div
                key={req.id}
                className={`bg-white p-6 rounded-3xl shadow-soft border border-stitch-outline/10 flex flex-col gap-5 hover:shadow-premium hover:border-stitch-primary/25 transition-all duration-300 ${
                  isAnimating
                    ? "scale-95 opacity-0 translate-y-4"
                    : "scale-100 opacity-100 translate-y-0"
                }`}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex gap-4">
                    {/* Category icon */}
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${getIconClass(req.type)}`}
                    >
                      <span className="material-symbols-outlined text-3xl">
                        {getIcon(req.type)}
                      </span>
                    </div>
                    <div>
                      {/* Urgency Badge */}
                      <span
                        className={`inline-flex items-center gap-1 font-semibold text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-1.5 ${
                          req.urgency === "High Urgency"
                            ? "bg-red-50 text-red-600 border border-red-100"
                            : "bg-[#aeedd5]/60 text-[#1d503f] border border-[#96d3bd]/30"
                        }`}
                      >
                        {req.urgency === "High Urgency"
                          ? t("highUrgency")
                          : t("standard")}
                      </span>
                      <h3 className="font-stitch-display text-lg font-bold text-[#1b1c1c]">
                        {req.title}
                      </h3>
                      <p className="text-stitch-on-surface-variant/80 flex items-center gap-1 text-xs mt-1">
                        <span className="material-symbols-outlined text-sm text-stitch-primary">
                          location_on
                        </span>
                        {req.location} •{" "}
                        <span className="font-semibold text-stitch-primary">
                          {t("kmAway", { km: req.distance })}
                        </span>
                      </p>
                    </div>
                  </div>
                  {/* Rate and Time */}
                  <div className="text-right shrink-0">
                    <p className="font-bold text-[#1f8a8a] text-base font-stitch-display">
                      ${req.rate}/hr
                    </p>
                    <p className="text-stitch-on-surface-variant/60 text-[10px] mt-0.5">
                      {req.postedAgo}
                    </p>
                  </div>
                </div>

                {/* Date / Time highlight card */}
                <div className="flex gap-6 bg-slate-50/70 border border-slate-100 p-4 rounded-2xl text-xs">
                  <div className="flex flex-col">
                    <span className="text-stitch-on-surface-variant/50 font-bold uppercase tracking-wider text-[9px] mb-0.5">
                      {t("date")}
                    </span>
                    <span className="font-bold text-[#2b2b2b]">{req.date}</span>
                  </div>
                  <div className="w-px bg-slate-200" />
                  <div className="flex flex-col">
                    <span className="text-stitch-on-surface-variant/50 font-bold uppercase tracking-wider text-[9px] mb-0.5">
                      {t("time")}
                    </span>
                    <span className="font-bold text-[#2b2b2b]">{req.time}</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-stitch-on-surface-variant/80 text-sm leading-relaxed">
                  {req.description}
                </p>

                {/* Buttons */}
                <div className="flex gap-3 mt-auto pt-2">
                  <button
                    onClick={() => handleAccept(req.id)}
                    className="flex-1 bg-stitch-primary hover:bg-[#166f6f] text-white py-3.5 rounded-2xl font-bold transition-all shadow-soft hover:shadow-premium active:scale-[0.98] cursor-pointer"
                  >
                    {t("acceptRequest")}
                  </button>
                  <button
                    onClick={() => handleReject(req.id)}
                    className="flex-1 border border-stitch-outline/40 hover:bg-slate-50 text-stitch-on-surface py-3.5 rounded-2xl font-semibold transition-all active:scale-[0.98] cursor-pointer"
                  >
                    {t("decline")}
                  </button>
                </div>
              </div>
            );
          })}

          {/* Empty placeholder card */}
          {filteredRequests.length === 0 && (
            <div className="col-span-1 xl:col-span-2 border-2 border-dashed border-stitch-outline/20 p-12 rounded-3xl flex flex-col items-center justify-center text-center bg-white/40">
              <span className="material-symbols-outlined text-stitch-outline/60 text-5xl mb-3">
                cloud_off
              </span>
              <h3 className="font-stitch-display text-lg font-bold text-stitch-on-surface-variant/80">
                {t("noRequests")}
              </h3>
              <p className="text-stitch-on-surface-variant/60 text-sm max-w-sm mt-1">
                {requests.length === 0
                  ? t("allProcessedDesc")
                  : t("filterDesc")}
              </p>
              <button
                onClick={fetchRequests}
                className="mt-6 px-5 py-2.5 bg-stitch-primary hover:bg-[#166f6f] text-white text-xs font-bold rounded-xl shadow-soft hover:shadow-premium transition-all cursor-pointer flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">
                  refresh
                </span>
                {t("refreshList")}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="w-full py-8 mt-16 border-t border-stitch-outline/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-stitch-on-surface-variant/60">
        <div>
          <h4 className="font-stitch-display font-bold text-[#012d1d] text-sm mb-1"></h4>
          <p>
            © 2026 Dignified Care. All rights reserved. Compassionate elder
            support.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 justify-center sm:justify-end items-center">
          <a href="#" className="hover:text-stitch-primary transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-stitch-primary transition-colors">
            Terms of Service
          </a>
          <a href="#" className="hover:text-stitch-primary transition-colors">
            Cookie Policy
          </a>
        </div>
      </footer>

      {/* Floating dispatch status indicator */}
      <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 bg-white p-4 rounded-2xl shadow-premium border border-stitch-primary/10 z-40 hidden lg:flex flex-col gap-2 min-w-[160px] animate-fade-in">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-stitch-primary animate-pulse"></div>
          <span className="font-semibold text-[10px] text-stitch-on-surface-variant uppercase tracking-wider">
            {t("liveStatus")}
          </span>
        </div>
        <div className="flex gap-6 mt-1">
          <div>
            <p className="text-[9px] uppercase tracking-wider text-stitch-on-surface-variant/50">
              {t("newJobs")}
            </p>
            <p className="text-xl font-bold text-stitch-primary">
              {requests.length}
            </p>
          </div>
          <div className="border-l border-stitch-outline/20 h-8"></div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-stitch-on-surface-variant/50">
              {t("booked")}
            </p>
            <p className="text-xl font-bold text-stitch-on-surface">
              {activeBookingsCount}
            </p>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 bg-[#012d1d] text-white px-5 py-4 rounded-2xl shadow-premium border border-stitch-primary/20 z-50 flex items-center justify-between gap-4 max-w-md animate-slide-up">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#aeedd5]">
              check_circle
            </span>
            <p className="text-xs font-medium">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
