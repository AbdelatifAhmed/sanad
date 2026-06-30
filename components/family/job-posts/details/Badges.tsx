"use client";

import React from "react";
import { useTranslations } from "next-intl";

export function JobStatusBadge({ status }: { status: string }) {
  const t = useTranslations("jobPostDetails");
  const tList = useTranslations("jobPostsList");
  const map: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    open:      { label: tList("open"), bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
    filled:    { label: tList("filled"), bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
    assigned:  { label: tList("assigned"), bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
    closed:    { label: tList("closed"), bg: "bg-[#f0eded]", text: "text-[#3e4949]", dot: "bg-[#bdc9c8]" },
    completed: { label: tList("completed"), bg: "bg-[#f0eded]", text: "text-[#3e4949]", dot: "bg-[#bdc9c8]" },
    canceled:  { label: tList("canceled"), bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  };
  const s = map[status] ?? map.open;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
      {t("status")}: {s.label}
    </span>
  );
}

export function ProposalStatusBadge({ status }: { status: string }) {
  const t = useTranslations("jobPostDetails");
  const map: Record<string, { label: string; bg: string; text: string }> = {
    pending:  { label: "Pending", bg: "bg-[#ebe1d4]", text: "text-[#615b51]" },
    accepted: { label: "Accepted", bg: "bg-green-100", text: "text-green-800" },
    rejected: { label: "Rejected", bg: "bg-red-100", text: "text-red-800" },
  };
  
  const label = status === "pending" 
    ? (t("pendingReview" as any) || "Pending Review") 
    : status === "rejected" 
    ? (t("rejected" as any) || "Rejected") 
    : t("accepted");

  const s = map[status] ?? map.pending;

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase ${s.bg} ${s.text}`}>
      {label}
    </span>
  );
}
