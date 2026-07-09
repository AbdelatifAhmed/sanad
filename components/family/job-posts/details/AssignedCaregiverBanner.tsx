"use client";

import React from "react";
import { useTranslations, useLocale } from "next-intl";
import { getAvatarUrl } from "@/lib/avatar";
import { Proposal } from "@/types";

interface AssignedCaregiverBannerProps {
  proposal: Proposal;
  onMessage: () => void;
  onViewProfile: () => void;
}

export default function AssignedCaregiverBanner({
  proposal,
  onMessage,
  onViewProfile,
}: AssignedCaregiverBannerProps) {
  const t = useTranslations("jobPostDetails");
  const locale = useLocale();

  const companion = typeof proposal.companionId === "object" ? proposal.companionId : null;
  const name: string = companion ? (companion as any).name ?? "Caregiver" : "Caregiver";
  const avatar: string | null = companion ? getAvatarUrl((companion as any).avatar) : null;
  const initials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  const formatShortDate = (iso?: string | Date | null) => {
    if (!iso) return "—";
    try {
      return new Date(iso as string).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return String(iso);
    }
  };

  const caregiverTypeLabel = companion 
    ? (companion as any).companionType === "specialized" 
      ? (locale === "ar" ? "مرافق رعاية متخصصة" : "Specialist Caregiver") 
      : (locale === "ar" ? "مرافق رعاية عامة" : "General Caregiver")
    : "";

  return (
    <article className="bg-[#d1eeee]/30 border-2 border-[#1f8a8a] rounded-2xl overflow-hidden shadow-sm">
      {/* Header banner */}
      <div className="bg-[#1f8a8a] text-white px-6 py-2.5 flex items-center justify-between flex-wrap gap-2">
        <span className="font-bold text-sm uppercase tracking-widest flex items-center gap-2">
          <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
            verified
          </span>
          {t("assignedCaregiver")}
        </span>
        {proposal.createdAt && (
          <span className="text-xs opacity-80">
            {t("selectedOn", { date: formatShortDate(proposal.createdAt) })}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center">
        {/* Avatar */}
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="w-24 h-24 rounded-2xl object-cover shrink-0 border-2 border-[#1f8a8a] shadow-sm"
          />
        ) : (
          <div className="w-24 h-24 rounded-2xl bg-[#d1eeee] flex items-center justify-center shrink-0 border-2 border-[#1f8a8a] shadow-sm">
            <span className="text-2xl font-bold text-[#1f8a8a]">{initials}</span>
          </div>
        )}

        {/* Info */}
        <div className="flex-1 text-center md:text-left rtl:md:text-right space-y-1.5 min-w-0">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <h4 className="text-xl font-bold text-[#1b1c1c] truncate">{name}</h4>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold w-fit mx-auto md:mx-0">
              {t("accepted")}
            </span>
          </div>
          <p className="text-[#3e4949] font-medium text-sm">
            {caregiverTypeLabel}
            {(companion as any)?.bio ? ` · ${(companion as any).bio.slice(0, 60)}…` : ""}
          </p>
          <div className="flex items-center gap-4 justify-center md:justify-start">
            {((companion as any)?.averageRating ?? (companion as any)?.rating) && (
              <span className="flex items-center gap-1 text-sm font-semibold">
                <span className="material-symbols-outlined text-yellow-500 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                  star
                </span>
                {(((companion as any).averageRating ?? (companion as any).rating) as number).toFixed(1)}
              </span>
            )}
            <span className="text-[#3e4949] text-sm font-semibold">
              {locale === "ar" ? `${proposal.proposedRate} ج.م/ساعة` : `${proposal.proposedRate} EGP/hr`}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 w-full md:w-auto shrink-0">
          <button
            onClick={onMessage}
            className="flex items-center justify-center gap-2 bg-[#1f8a8a] text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-[#0d8282] active:scale-95 transition-all cursor-pointer text-sm"
          >
            <span className="material-symbols-outlined text-base">chat</span>
            {t("message")}
          </button>
          <button
            onClick={onViewProfile}
            className="flex items-center justify-center gap-2 border border-[#1f8a8a] text-[#1f8a8a] px-6 py-3 rounded-xl font-bold hover:bg-[#d1eeee]/30 transition-all cursor-pointer text-sm"
          >
            <span className="material-symbols-outlined text-base">person</span>
            {t("viewProfile")}
          </button>
        </div>
      </div>
    </article>
  );
}
