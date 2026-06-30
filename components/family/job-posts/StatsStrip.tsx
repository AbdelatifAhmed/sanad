"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { JobPost } from "@/lib/types/care-request";

interface StatsStripProps {
  jobs: JobPost[];
  isLoading: boolean;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  open:     { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  filled:   { bg: "bg-blue-50",    text: "text-blue-700",   dot: "bg-blue-500" },
  closed:   { bg: "bg-[#f0eded]",  text: "text-[#3e4949]",  dot: "bg-[#bdc9c8]" },
  canceled: { bg: "bg-red-50",     text: "text-red-700",    dot: "bg-red-500" },
};

export default function StatsStrip({ jobs, isLoading }: StatsStripProps) {
  const tList = useTranslations("jobPostsList");

  if (isLoading || jobs.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {(["open", "filled", "closed"] as const).map((status) => {
        const count = jobs.filter((j) => 
          j.status === status || 
          (status === "filled" && j.status === "assigned") || 
          (status === "closed" && j.status === "completed")
        ).length;
        const style = STATUS_STYLES[status] ?? STATUS_STYLES.open;
        
        // Match descriptions based on status
        const descKey = `${status}Desc`;

        return (
          <div key={status} className={`${style.bg} rounded-2xl border border-sand-high/20 px-5 py-4 flex flex-col justify-between gap-1.5 shadow-sm`}>
            <div>
              <p className={`text-3xl font-extrabold ${style.text}`}>{count}</p>
              <p className={`text-sm font-bold ${style.text} mt-0.5`}>{tList(status)}</p>
            </div>
            <p className="text-[11px] text-[#3e4949]/70 font-semibold leading-relaxed">
              {tList(descKey as any)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
