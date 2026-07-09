"use client";

import React from "react";
import { useTranslations } from "next-intl";

interface ProgressStep {
  key: string;
  label: string;
  icon: string;
  completed: boolean;
  active: boolean;
}

function getRequestProgress(
  jobStatus: string,
  proposalsCount: number,
  hasAssignedCaregiver: boolean,
  t: any
): ProgressStep[] {
  const isCompleted  = jobStatus === "completed";
  const isInProgress = jobStatus === "in_progress";
  const isAssigned   = hasAssignedCaregiver || jobStatus === "filled" || jobStatus === "closed" || isInProgress || isCompleted;
  const hasApps      = proposalsCount > 0 || isAssigned || isCompleted;

  // Build flags array
  const flags = [
    true,           // Step 1: Request Created
    hasApps,        // Step 2: Applications Received
    isAssigned,     // Step 3: Caregiver Assigned
    isInProgress || isCompleted, // Step 4: Service Started
    isCompleted,    // Step 5: Completed
  ];

  const defs = [
    { key: "created",   label: t("timelineCreated"),   icon: "assignment" },
    { key: "applied",   label: t("timelineApplied"),   icon: "group" },
    { key: "assigned",  label: t("timelineAssigned"),  icon: "verified" },
    { key: "started",   label: t("timelineStarted"),   icon: "play_circle" },
    { key: "completed", label: t("timelineCompleted"), icon: "task_alt" },
  ];

  let lastTrue = 0;
  flags.forEach((f, i) => { if (f) lastTrue = i; });

  return defs.map((d, i) => ({
    ...d,
    completed: flags[i],
    active: i === lastTrue,
  }));
}

export default function Timeline({
  jobStatus,
  proposalsCount,
  hasAssignedCaregiver,
}: {
  jobStatus: string;
  proposalsCount: number;
  hasAssignedCaregiver: boolean;
}) {
  const t = useTranslations("jobPostDetails");
  const steps = getRequestProgress(jobStatus, proposalsCount, hasAssignedCaregiver, t);
  const activeIndex = steps.findIndex((s) => s.active);

  return (
    <div className="bg-white rounded-2xl border border-[#eae7e7] p-6">
      <h3 className="font-bold text-[#1b1c1c] text-base mb-6 rtl:text-right ltr:text-left">
        {t("requestProgress")}
      </h3>
      {/* We force dir="ltr" on the timeline container so progress always animates left-to-right correctly */}
      <div className="relative" dir="ltr">
        {/* Grey connector */}
        <div className="absolute top-5 left-5 right-5 h-0.5 bg-[#f0eded]" style={{ zIndex: 0 }} />
        {/* Teal progress fill */}
        <div
          className="absolute top-5 left-5 h-0.5 bg-[#1f8a8a] transition-all duration-700"
          style={{
            width: `${(activeIndex / (steps.length - 1)) * (100 - 8)}%`,
            zIndex: 1,
          }}
        />
        <div className="flex justify-between relative" style={{ zIndex: 2 }}>
          {steps.map((step) => (
            <div key={step.key} className="flex flex-col items-center gap-2 w-1/5">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  step.completed
                    ? step.active
                      ? "bg-[#1f8a8a] border-[#1f8a8a] ring-4 ring-[#1f8a8a]/20"
                      : "bg-[#1f8a8a] border-[#1f8a8a]"
                    : "bg-white border-[#bdc9c8]"
                }`}
              >
                <span
                  className={`material-symbols-outlined text-sm ${
                    step.completed ? "text-white" : "text-[#bdc9c8]"
                  }`}
                  style={{ fontVariationSettings: step.completed ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {step.completed && !step.active ? "task_alt" : step.icon}
                </span>
              </div>
              <p
                className={`text-[10px] font-semibold text-center leading-tight ${
                  step.active
                    ? "text-[#1f8a8a] font-bold"
                    : step.completed
                    ? "text-[#1f8a8a]"
                    : "text-[#bdc9c8]"
                }`}
              >
                {step.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
