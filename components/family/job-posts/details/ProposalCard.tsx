"use client";

import React from "react";
import { useTranslations, useLocale } from "next-intl";
import { getAvatarUrl } from "@/lib/avatar";
import { Proposal } from "@/types";
import { ProposalStatusBadge } from "./Badges";

interface ProposalCardProps {
  proposal: Proposal;
  hasAccepted: boolean;
  onAccept: (p: Proposal) => void;
  onReject: (p: Proposal) => void;
  onViewProfile: (p: Proposal) => void;
  onMessage: (p: Proposal) => void;
}

export default function ProposalCard({
  proposal,
  hasAccepted,
  onAccept,
  onReject,
  onViewProfile,
  onMessage,
}: ProposalCardProps) {
  const t = useTranslations("jobPostDetails");
  const locale = useLocale();

  const companion = typeof proposal.companionId === "object" ? (proposal.companionId as any) : null;
  const name: string = companion?.name ?? (proposal.companionId as string) ?? "Caregiver";
  const avatar: string | null = companion ? getAvatarUrl(companion.avatar) : null;
  const rating: number = companion?.averageRating ?? companion?.rating ?? 0;
  const initials = name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  const isRejected = proposal.status === "rejected";
  const isAccepted = proposal.status === "accepted";

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
    ? companion.specialization && companion.specialization !== "none"
      ? companion.specialization.replace(/_/g, " ")
      : companion.companionType === "specialized"
      ? (locale === "ar" ? "مرافق رعاية متخصصة" : "Specialist")
      : (locale === "ar" ? "مرافق رعاية عامة" : "General")
    : "";

  return (
    <article
      className={`bg-white rounded-2xl shadow-sm border border-[#eae7e7] overflow-hidden transition-all group hover:shadow-md hover:-translate-y-0.5 ${
        isRejected ? "opacity-60 grayscale" : ""
      }`}
    >
      <div className="p-5 md:p-6 flex flex-col lg:flex-row gap-5">
        {/* Left: Profile & Stats */}
        <div className="flex flex-row lg:flex-col gap-4 items-center lg:items-start lg:w-52 shrink-0 border-b lg:border-b-0 lg:border-r rtl:lg:border-r-0 rtl:lg:border-l border-[#eae7e7]/60 pb-4 lg:pb-0 lg:pr-5 rtl:lg:pr-0 rtl:lg:pl-5">
          <div className="relative shrink-0">
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                className="w-20 h-20 rounded-2xl object-cover border border-[#eae7e7]"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-[#d1eeee] flex items-center justify-center border border-[#eae7e7]">
                <span className="text-xl font-bold text-[#1f8a8a]">{initials}</span>
              </div>
            )}
            {companion?.verificationStatus === "verified" && (
              <span className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-md border border-[#eae7e7]">
                <span className="material-symbols-outlined text-[#1f8a8a] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified
                </span>
              </span>
            )}
          </div>

          <div className="flex-1 lg:w-full">
            <div className="flex items-center gap-1 mb-1">
              <span className="material-symbols-outlined text-yellow-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="font-bold text-[#1b1c1c] text-sm">{rating > 0 ? rating.toFixed(1) : (locale === "ar" ? "جديد" : "New")}</span>
              {companion?.reviewCount > 0 && (
                <span className="text-[#3e4949] text-xs">({companion.reviewCount})</span>
              )}
            </div>
            <p className="text-[#3e4949] text-xs font-semibold leading-snug">
              {caregiverTypeLabel}
            </p>
            <div className="mt-3 p-2.5 bg-[#d1eeee]/30 rounded-xl border border-[#1f8a8a]/20">
              <p className="text-[10px] text-[#1f8a8a] font-bold uppercase tracking-wider">{t("proposedRate")}</p>
              <p className="text-[#1f8a8a] font-extrabold text-lg leading-tight">
                {locale === "ar" 
                  ? `${proposal.proposedRate} ج.م` 
                  : `${proposal.proposedRate} EGP`}
                <span className="text-xs font-medium opacity-80">/{locale === "ar" ? "ساعة" : "hr"}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Middle: Details & Proposal */}
        <div className="flex-1 space-y-4">
          <div className="flex flex-wrap justify-between items-start gap-2">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h4 className="font-bold text-[#1b1c1c] text-lg leading-tight">{name}</h4>
                <ProposalStatusBadge status={proposal.status} />
              </div>
              {companion?.bio && (
                <p className="text-[#3e4949] text-sm mt-1 line-clamp-2 leading-relaxed">{companion.bio}</p>
              )}
            </div>
            {proposal.createdAt && (
              <span className="text-xs text-[#3e4949]/60">
                {t("applied", { date: formatShortDate(proposal.createdAt) })}
              </span>
            )}
          </div>

          {/* Cover Letter */}
          {proposal.coverLetter && (
            <div className="bg-[#f6f3f2] p-4 rounded-xl border border-[#eae7e7]/40">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-[#1f8a8a] text-sm">format_quote</span>
                <p className="text-xs font-bold text-[#1f8a8a] uppercase tracking-widest">{t("proposalMsg")}</p>
              </div>
              <p className="text-[#3e4949] italic text-sm leading-relaxed whitespace-pre-line">
                "{proposal.coverLetter}"
              </p>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        {!isRejected && (
          <div className="lg:w-48 shrink-0 flex flex-col gap-2 justify-center pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l rtl:lg:border-l-0 rtl:lg:border-r border-[#eae7e7]/40 lg:pl-5 rtl:lg:pl-0 rtl:lg:pr-5">
            {!isAccepted && (
              <button
                onClick={() => onAccept(proposal)}
                disabled={hasAccepted}
                className="w-full bg-[#1f8a8a] text-white py-2.5 rounded-xl font-bold shadow-md hover:bg-[#0d8282] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#1f8a8a] disabled:active:scale-100 cursor-pointer text-sm"
              >
                {t("acceptApp")}
              </button>
            )}
            <button
              onClick={() => onViewProfile(proposal)}
              className="w-full border border-[#bdc9c8] text-[#1b1c1c] py-2.5 rounded-xl font-bold hover:bg-[#f0eded] transition-all cursor-pointer text-sm"
            >
              {t("viewProfile")}
            </button>
            <button
              onClick={() => onMessage(proposal)}
              className="w-full border border-[#bdc9c8] text-[#1b1c1c] py-2.5 rounded-xl font-bold hover:bg-[#f0eded] flex items-center justify-center gap-2 transition-all cursor-pointer text-sm"
            >
              <span className="material-symbols-outlined text-base">chat</span>
              {t("message")}
            </button>
            {!isAccepted && (
              <button
                onClick={() => onReject(proposal)}
                className="w-full text-red-600 text-sm font-bold hover:bg-red-50 py-2 rounded-xl transition-colors mt-1 cursor-pointer"
              >
                {t("rejectApp")}
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
