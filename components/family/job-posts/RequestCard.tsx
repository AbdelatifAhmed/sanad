"use client";

import React from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { JobPost } from "@/lib/types/care-request";

const SERVICE_ICONS: Record<string, string> = {
  elderly_care: "elderly",
  child_care: "child_care",
  home_nursing: "medical_services",
  physical_therapy: "accessible",
  companionship: "volunteer_activism",
};

const getServiceLabelKey = (type: string) => {
  switch (type) {
    case "elderly_care": return "elderlyCare";
    case "child_care": return "childCare";
    case "home_nursing": return "homeNursing";
    case "physical_therapy": return "physicalTherapy";
    case "companionship": return "companionCare";
    default: return "";
  }
};

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  open:      { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  filled:    { bg: "bg-blue-50",    text: "text-blue-700",   dot: "bg-blue-500" },
  assigned:  { bg: "bg-blue-50",    text: "text-blue-700",   dot: "bg-blue-500" },
  closed:    { bg: "bg-[#f0eded]",  text: "text-[#3e4949]",  dot: "bg-[#bdc9c8]" },
  completed: { bg: "bg-[#f0eded]",  text: "text-[#3e4949]",  dot: "bg-[#bdc9c8]" },
  canceled:  { bg: "bg-red-50",     text: "text-red-700",    dot: "bg-red-500" },
};

function formatDate(iso: string, locale: string) {
  try {
    return new Date(iso).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

function formatTimeStr(timeStr: string, locale: string) {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  if (parts.length < 2) return timeStr;
  const hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  if (isNaN(hours)) return timeStr;

  const ampm = hours >= 12 ? (locale === "ar" ? "م" : "PM") : (locale === "ar" ? "ص" : "AM");
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes} ${ampm}`;
}

export default function RequestCard({ job }: { job: JobPost }) {
  const tList = useTranslations("jobPostsList");
  const tBooking = useTranslations("bookingForm");
  const tForm = useTranslations("jobPostForm");
  const locale = useLocale();

  const statusStyle = STATUS_STYLES[job.status] ?? STATUS_STYLES.open;
  const icon = SERVICE_ICONS[job.serviceType] ?? "assignment";
  
  const serviceKey = getServiceLabelKey(job.serviceType);
  const label = serviceKey ? tBooking(serviceKey) : job.serviceType;

  return (
    <div className="bg-white rounded-2xl border border-[#eae7e7] p-5 hover:shadow-soft transition-all duration-200 group">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-[#1f8a8a]/10 flex items-center justify-center shrink-0 group-hover:bg-[#1f8a8a]/15 transition-colors">
          <span className="material-symbols-outlined text-[#1f8a8a]">{icon}</span>
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-[#1b1c1c] text-base leading-tight">
                {job.title || tForm("defaultTitle")}
              </h3>
              <p className="text-xs text-[#3e4949] mt-0.5">{label}</p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${statusStyle.bg} ${statusStyle.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
              {tList(job.status)}
            </span>
          </div>

          {/* Description excerpt */}
          {job.description && (
            <p className="text-xs text-[#3e4949]/80 mt-2 line-clamp-2">{job.description}</p>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 mt-3.5 text-xs text-[#3e4949]/70">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>calendar_today</span>
              {formatDate(job.createdAt, locale)}
            </span>
            {job.location?.city && (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>location_on</span>
                {tForm.has(`cities.${job.location.city}` as any) ? tForm(`cities.${job.location.city}` as any) : job.location.city}
              </span>
            )}
            {job.schedule?.workingDays?.length > 0 && (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>event_repeat</span>
                {tList("daysPerWeek", { count: job.schedule.workingDays.length })}
              </span>
            )}
            <span className="flex items-center gap-1 font-semibold text-[#1f8a8a]">
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>payments</span>
              {locale === "ar" ? tList("perHourAr", { count: job.budgetPerHour }) : tList("perHour", { count: job.budgetPerHour })}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#f0eded]">
        <div className="flex items-center gap-1.5 text-xs text-[#3e4949]">
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>schedule</span>
          <span>{tList("weeks", { count: job.schedule?.durationInWeeks ?? 0 })}</span>
          {job.schedule?.startTime && job.schedule?.endTime && (
            <span className="text-[#3e4949]/60">
              · {formatTimeStr(job.schedule.startTime, locale)}–{formatTimeStr(job.schedule.endTime, locale)}
            </span>
          )}
        </div>
        <Link
          href={`/family/job-posts/${job._id}`}
          className="flex items-center gap-1 text-xs font-semibold text-[#1f8a8a] hover:underline cursor-pointer"
        >
          {tList("viewDetails")}
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>chevron_right</span>
        </Link>
      </div>
    </div>
  );
}
