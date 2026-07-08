"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { JobPost } from "@/lib/types/care-request";

interface StatsStripProps {
  jobs: JobPost[];
  isLoading: boolean;
}

const STATUS_STYLES: Record<string, { border: string; number: string; label: string }> = {
  open:      { border: "border-emerald-400", number: "text-emerald-600", label: "text-emerald-600" },
  filled:    { border: "border-blue-400",    number: "text-blue-600",    label: "text-blue-600"    },
  completed: { border: "border-gray-400",    number: "text-gray-600",    label: "text-gray-600"    },
  canceled:  { border: "border-red-400",     number: "text-red-500",     label: "text-red-500"     },
};

export default function StatsStrip({ jobs, isLoading }: StatsStripProps) {
  const tList = useTranslations("jobPostsList");

  if (isLoading || jobs.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {(["open", "filled", "completed", "canceled"] as const).map((status) => {
        const count = jobs.filter((j) => 
          j.status === status || 
          (status === "filled" && j.status === "assigned") ||
          (status === "completed" && j.status === "completed") ||
          (status === "canceled" && j.status === "canceled")
        ).length;
        const style = STATUS_STYLES[status] ?? STATUS_STYLES.open;
        const descKey = `${status}Desc`;

        return (
          <div
            key={status}
            className={`bg-white rounded-2xl border-2 ${style.border} px-5 py-4 flex flex-col justify-between gap-1.5 shadow-sm`}
          >
            <div>
              <p className={`text-3xl font-extrabold ${style.number}`}>{count}</p>
              <p className={`text-sm font-bold ${style.label} mt-0.5`}>{tList(status)}</p>
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
