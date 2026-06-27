"use client";

import Link from "next/link";
import { useFamilyCareRequests } from "@/lib/hooks";
import { JobPost } from "@/lib/types/care-request";
import { useTranslations, useLocale } from "next-intl";

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
  open:   { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  filled: { bg: "bg-blue-50",    text: "text-blue-700",   dot: "bg-blue-500" },
  closed: { bg: "bg-[#f0eded]",  text: "text-[#3e4949]",  dot: "bg-[#bdc9c8]" },
};

function formatDate(iso: string, locale: string) {
  try {
    return new Date(iso).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

function RequestCard({ job }: { job: JobPost }) {
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
          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-[#3e4949]/70">
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
              · {job.schedule.startTime}–{job.schedule.endTime}
            </span>
          )}
        </div>
        <Link
          href={`/family/job-posts/${job._id}`}
          className="flex items-center gap-1 text-xs font-semibold text-[#1f8a8a] hover:underline"
        >
          {tList("viewDetails")}
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>chevron_right</span>
        </Link>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#eae7e7] p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#f0eded] shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="flex justify-between">
            <div className="h-5 w-40 bg-[#f0eded] rounded-lg" />
            <div className="h-6 w-16 bg-[#f0eded] rounded-full" />
          </div>
          <div className="h-3 w-full bg-[#f0eded] rounded-lg" />
          <div className="h-3 w-3/4 bg-[#f0eded] rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  const tList = useTranslations("jobPostsList");

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-24 h-24 bg-[#1f8a8a]/10 rounded-full flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-[#1f8a8a]" style={{ fontSize: "48px", fontVariationSettings: "'FILL' 1" }}>
          assignment
        </span>
      </div>
      <h3 className="text-xl font-bold text-[#1b1c1c] mb-2">{tList("noRequestsTitle")}</h3>
      <p className="text-sm text-[#3e4949] max-w-sm mb-8">
        {tList("noRequestsDesc")}
      </p>
      <Link
        href="/family/job-posts/new"
        className="flex items-center gap-2 px-6 py-3 bg-[#1f8a8a] text-white font-bold rounded-xl hover:bg-[#0d8282] transition-all shadow-md active:scale-95"
      >
        <span className="material-symbols-outlined">add_circle</span>
        {tList("postRequestBtn")}
      </Link>
    </div>
  );
}

export default function FamilyRequestsPage() {
  const tList = useTranslations("jobPostsList");
  const locale = useLocale();
  const isRtl = locale === "ar";

  const { data, isLoading, error, refetch } = useFamilyCareRequests();

  const jobs: JobPost[] = Array.isArray(data?.jobPosts)
    ? data.jobPosts
    : Array.isArray(data)
    ? data
    : [];

  return (
    <div className="max-w-5xl w-full mx-auto space-y-6" dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1b1c1c]">{tList("title")}</h1>
        </div>
        <Link
          href="/family/job-posts/new"
          className="flex items-center gap-2 px-5 py-3 bg-[#1f8a8a] text-white font-bold text-sm rounded-xl hover:bg-[#0d8282] transition-all shadow-md active:scale-95"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>add</span>
          {tList("postNewRequest")}
        </Link>
      </div>

      {/* Stats strip */}
      {!isLoading && jobs.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {(["open", "filled", "closed"] as const).map((status) => {
            const count = jobs.filter((j) => j.status === status).length;
            return (
              <div key={status} className={`${STATUS_STYLES[status].bg} rounded-xl px-4 py-3`}>
                <p className={`text-2xl font-bold ${STATUS_STYLES[status].text}`}>{count}</p>
                <p className={`text-xs font-medium ${STATUS_STYLES[status].text} opacity-80 mt-0.5`}>{tList(status)}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <span className="material-symbols-outlined shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
          <div>
            <p className="text-sm font-semibold">{tList("failedLoad")}</p>
            <p className="text-xs mt-0.5">{error?.response?.data?.message ?? tList("pleaseTryAgain")}</p>
            <button onClick={refetch} className="mt-2 text-xs font-bold underline">{tList("retry")}</button>
          </div>
        </div>
      )}

      {/* Skeletons */}
      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} />)}
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && jobs.length === 0 && <EmptyState />}

      {/* List */}
      {!isLoading && jobs.length > 0 && (
        <div className="space-y-4">
          {jobs.map((job) => <RequestCard key={job._id} job={job} />)}
        </div>
      )}
    </div>
  );
}
