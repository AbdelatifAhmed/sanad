"use client";

import Link from "next/link";
import { useFamilyCareRequests } from "@/lib/hooks";
import { JobPost } from "@/lib/types/care-request";

const SERVICE_LABELS: Record<string, string> = {
  elderly_care: "Elderly Care",
  child_care: "Child Care",
  home_nursing: "Home Nursing",
  physical_therapy: "Physical Therapy",
  companionship: "Companion Care",
};

const SERVICE_ICONS: Record<string, string> = {
  elderly_care: "elderly",
  child_care: "child_care",
  home_nursing: "medical_services",
  physical_therapy: "accessible",
  companionship: "volunteer_activism",
};

const STATUS_STYLES: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  open:   { label: "Open",   bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  filled: { label: "Filled", bg: "bg-blue-50",    text: "text-blue-700",   dot: "bg-blue-500" },
  closed: { label: "Closed", bg: "bg-[#f0eded]",  text: "text-[#3e4949]", dot: "bg-[#bdc9c8]" },
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

function RequestCard({ job }: { job: JobPost }) {
  const statusStyle = STATUS_STYLES[job.status] ?? STATUS_STYLES.open;
  const icon = SERVICE_ICONS[job.serviceType] ?? "assignment";
  const label = SERVICE_LABELS[job.serviceType] ?? job.serviceType;

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
              <h3 className="font-bold text-[#1b1c1c] text-base leading-tight">{job.title}</h3>
              <p className="text-xs text-[#3e4949] mt-0.5">{label}</p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${statusStyle.bg} ${statusStyle.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
              {statusStyle.label}
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
              {formatDate(job.createdAt)}
            </span>
            {job.location?.city && (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>location_on</span>
                {job.location.city}
              </span>
            )}
            {job.schedule?.workingDays?.length > 0 && (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>event_repeat</span>
                {job.schedule.workingDays.length}d/week
              </span>
            )}
            <span className="flex items-center gap-1 font-semibold text-[#1f8a8a]">
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>payments</span>
              {job.budgetPerHour} SAR/h
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#f0eded]">
        <div className="flex items-center gap-1.5 text-xs text-[#3e4949]">
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>schedule</span>
          <span>{job.schedule?.durationInWeeks ?? "?"} weeks</span>
          {job.schedule?.startTime && job.schedule?.endTime && (
            <span className="text-[#3e4949]/60">
              · {job.schedule.startTime}–{job.schedule.endTime}
            </span>
          )}
        </div>
        <Link
          href={`/family/requests/${job._id}`}
          className="flex items-center gap-1 text-xs font-semibold text-[#1f8a8a] hover:underline"
        >
          View Details
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
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-24 h-24 bg-[#1f8a8a]/10 rounded-full flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-[#1f8a8a]" style={{ fontSize: "48px", fontVariationSettings: "'FILL' 1" }}>
          assignment
        </span>
      </div>
      <h3 className="text-xl font-bold text-[#1b1c1c] mb-2">No Care Requests Yet</h3>
      <p className="text-sm text-[#3e4949] max-w-sm mb-8">
        Post your first care request to connect with verified caregivers who match your family&apos;s needs.
      </p>
      <Link
        href="/family/requests/new"
        className="flex items-center gap-2 px-6 py-3 bg-[#1f8a8a] text-white font-bold rounded-xl hover:bg-[#0d8282] transition-all shadow-md active:scale-95"
      >
        <span className="material-symbols-outlined">add_circle</span>
        Post a Care Request
      </Link>
    </div>
  );
}

export default function FamilyRequestsPage() {
  const { data, isLoading, error, refetch } = useFamilyCareRequests();

  const jobs: JobPost[] = Array.isArray(data?.jobPosts)
    ? data.jobPosts
    : Array.isArray(data)
    ? data
    : [];

  return (
    <div className="max-w-5xl w-full mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1b1c1c]">My Care Requests</h1>
          <p className="text-sm text-[#3e4949] mt-1">
            {isLoading ? "Loading..." : `${jobs.length} request${jobs.length !== 1 ? "s" : ""} posted`}
          </p>
        </div>
        <Link
          href="/family/requests/new"
          className="flex items-center gap-2 px-5 py-3 bg-[#1f8a8a] text-white font-bold text-sm rounded-xl hover:bg-[#0d8282] transition-all shadow-md active:scale-95"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>add</span>
          Post New Request
        </Link>
      </div>

      {/* Stats strip */}
      {!isLoading && jobs.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {(["open", "filled", "closed"] as const).map((status) => {
            const count = jobs.filter((j) => j.status === status).length;
            const s = STATUS_STYLES[status];
            return (
              <div key={status} className={`${s.bg} rounded-xl px-4 py-3`}>
                <p className={`text-2xl font-bold ${s.text}`}>{count}</p>
                <p className={`text-xs font-medium ${s.text} opacity-80 mt-0.5`}>{s.label}</p>
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
            <p className="text-sm font-semibold">Failed to load requests</p>
            <p className="text-xs mt-0.5">{error?.response?.data?.message ?? "Please try again."}</p>
            <button onClick={refetch} className="mt-2 text-xs font-bold underline">Retry</button>
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
