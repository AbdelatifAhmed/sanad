"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Calendar, MessageSquare, Briefcase, ArrowRight, Info, User } from "lucide-react";
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
    <div className="bg-white p-6 md:p-8 rounded-3xl border border-sand-high/60 shadow-soft space-y-6">
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-display text-xl font-bold text-[#012d1d]">
            {t("currentCaregiversTitle")}
          </h2>
          <Link 
            href="/family/companions" 
            className="text-xs font-bold text-[#1f8a8a] flex items-center gap-1 hover:underline transition-all"
          >
            {t("viewAll")} <ArrowRight className="w-3 h-3 rtl:rotate-180" />
          </Link>
        </div>

        <p className="text-xs text-gray-400 font-semibold">
          {t("currentCaregiversDesc")}
        </p>
      </div>

      {caregivers.length === 0 ? (
        <div className="p-8 rounded-2xl bg-gray-50 border border-sand-high/40 text-center text-gray-500 text-sm font-medium">
          {t("noCaregivers")}
        </div>
      ) : (
        <div className="space-y-4">
          {caregivers.map((caregiver) => {
            const isPending = caregiver.status === "pending";

            return (
              <div 
                key={caregiver.id} 
                className="p-5 rounded-2xl border border-sand-high/60 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300 hover:shadow-sm"
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
                  <div className="flex gap-2 self-end sm:self-center">
                    {caregiver.companionId && (
                      <Link 
                        href={`/family/companions/${caregiver.companionId}`}
                        title="View Profile"
                        className="w-10 h-10 rounded-full bg-gray-50 hover:bg-[#e6f4f2] hover:text-[#015347] flex items-center justify-center text-gray-400 transition-colors border border-sand-high cursor-pointer"
                      >
                        <User className="w-4 h-4" />
                      </Link>
                    )}
                    <Link 
                      href={`/family/messages?bookingId=${caregiver.id}`}
                      className="w-10 h-10 rounded-full bg-gray-50 hover:bg-[#e6f4f2] hover:text-[#015347] flex items-center justify-center text-gray-400 transition-colors border border-sand-high cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
