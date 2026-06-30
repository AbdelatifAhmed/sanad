"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Calendar, MessageSquare, Briefcase, ArrowRight, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { getAvatarUrl } from "@/lib/avatar";

interface CaregiverItem {
  id: string;
  name: string;
  avatar: any;
  role: string;
  subtext: string;
  status: string;
  scheduleText: string;
  companionId: string | null;
}

interface CurrentCaregiversProps {
  caregivers: CaregiverItem[];
}

export default function CurrentCaregivers({ caregivers }: CurrentCaregiversProps) {
  const t = useTranslations("familyDashboard");
  const [tooltipVisible, setTooltipVisible] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-xl font-bold text-[#012d1d]">
            {t("currentCaregiversTitle")}
          </h2>
          <div className="relative">
            <button
              type="button"
              onMouseEnter={() => setTooltipVisible(true)}
              onMouseLeave={() => setTooltipVisible(false)}
              onFocus={() => setTooltipVisible(true)}
              onBlur={() => setTooltipVisible(false)}
              className="text-stitch-on-surface-variant/40 hover:text-stitch-primary transition-colors cursor-pointer"
              aria-label={t("currentCaregiversTooltip")}
            >
              <Info className="w-4 h-4" />
            </button>
            {tooltipVisible && (
              <div 
                className="absolute top-full mt-2 start-0 w-64 bg-stitch-surface border border-stitch-outline/20 rounded-2xl p-3 shadow-premium z-50 animate-fade-in"
                role="tooltip"
              >
                <p className="text-xs text-stitch-on-surface-variant leading-relaxed">
                  {t("currentCaregiversTooltip")}
                </p>
              </div>
            )}
          </div>
        </div>
        <Link 
          href="/family/companions" 
          className="text-xs font-bold text-[#1f8a8a] flex items-center gap-1 hover:underline transition-all"
        >
          {t("viewAll")} <ArrowRight className="w-3 h-3 rtl:rotate-180" />
        </Link>
      </div>

      <p className="text-xs text-gray-400 font-medium -mt-2">
        {t("currentCaregiversDesc")}
      </p>

      {caregivers.length === 0 ? (
        <div className="bg-white p-8 rounded-3xl border border-sand-high/60 shadow-soft text-center text-gray-500 text-sm font-medium">
          {t("noCaregivers")}
        </div>
      ) : (
        <div className="space-y-4">
          {caregivers.map((caregiver) => {
            const isPending = caregiver.status === "pending";

            return (
              <div 
                key={caregiver.id} 
                className="bg-white p-5 rounded-3xl border border-sand-high shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300 hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  {isPending ? (
                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 border border-sand-high shrink-0">
                      <Briefcase className="w-5 h-5 stroke-[2]" />
                    </div>
                  ) : (
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-sand-high">
                        <img 
                          src={getAvatarUrl(caregiver.avatar, "/avatar_2.jpg") || "/avatar_2.jpg"} 
                          alt={caregiver.name} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <span className="absolute bottom-0 end-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-body font-bold text-sm text-gray-900">
                        {caregiver.name}
                      </h4>
                      {!isPending && caregiver.role && (
                        <span className="text-[10px] font-extrabold text-gray-500 bg-gray-100 border border-gray-200/50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {caregiver.role}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 font-semibold mt-0.5">
                      {caregiver.subtext}
                    </p>
                    {caregiver.scheduleText && (
                      <div className="flex items-center gap-1.5 text-xs text-[#2e7d32] font-semibold mt-2 bg-[#e8f5e9]/70 px-2.5 py-1 rounded-lg w-fit border border-[#c8e6c9]/30">
                        <Calendar className="w-3.5 h-3.5 text-[#2e7d32]/80" />
                        <span>{caregiver.scheduleText}</span>
                      </div>
                    )}
                  </div>
                </div>

                {isPending ? (
                  <div className="self-end sm:self-center px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-wide bg-[#fff3cd] text-[#856404] border border-[#ffeeba]/50">
                    ⏳ {t("pendingConfirmation")}
                  </div>
                ) : (
                  <Link 
                    href="/family/messages"
                    className="self-end sm:self-center w-10 h-10 rounded-full bg-gray-50 hover:bg-[#e6f4f2] hover:text-[#015347] flex items-center justify-center text-gray-400 transition-colors border border-sand-high cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
