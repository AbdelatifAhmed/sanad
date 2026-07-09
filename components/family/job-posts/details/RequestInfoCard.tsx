"use client";

import React from "react";
import { useTranslations, useLocale } from "next-intl";
import { JobPost } from "@/types";

interface RequestInfoCardProps {
  job: JobPost;
  beneficiary: any;
}

const SERVICE_LABELS: Record<string, string> = {
  elderly_care: "Elderly Care",
  child_care: "Child Care",
  home_nursing: "Home Nursing",
  physical_therapy: "Physical Therapy",
  companionship: "Companion Care",
};

export default function RequestInfoCard({ job, beneficiary }: RequestInfoCardProps) {
  const t = useTranslations("jobPostDetails");
  const tBooking = useTranslations("bookingForm");
  const locale = useLocale();

  const getEndDate = (startIso?: string | Date | null, weeks?: number) => {
    if (!startIso || !weeks) return "—";
    try {
      const d = new Date(startIso as string);
      d.setDate(d.getDate() + weeks * 7);
      return d.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "—";
    }
  };

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

  const formatTimeStr = (timeStr?: string | null) => {
    if (!timeStr) return "—";
    const parts = timeStr.split(":");
    if (parts.length < 2) return timeStr;
    let hour = parseInt(parts[0], 10);
    const minute = parts[1];
    const isAm = hour < 12;
    if (hour === 0) hour = 12;
    else if (hour > 12) hour -= 12;
    const suffix = isAm 
      ? (locale === "ar" ? "ص" : "AM") 
      : (locale === "ar" ? "م" : "PM");
    return `${hour}:${minute} ${suffix}`;
  };

  const serviceLabel = locale === "ar"
    ? tBooking(
        job.serviceType === "elderly_care" ? "elderlyCare" :
        job.serviceType === "companionship" ? "companionCare" :
        job.serviceType === "home_nursing" ? "homeNursing" :
        job.serviceType === "physical_therapy" ? "physicalTherapy" : "childCare"
      )
    : (SERVICE_LABELS[job.serviceType] ?? job.serviceType);

  const genderVal = job.preferredGender || job.preferredCaregiverGender;
  const preferredGenderLabel = genderVal
    ? genderVal === "male"
      ? t("male")
      : genderVal === "female"
      ? t("female")
      : t("anyGender")
    : null;

  const relationshipLabel = beneficiary
    ? beneficiary.relationship || (beneficiary.category === 'elderly' ? t("relationshipParent") : t("relationshipFamily"))
    : "";

  const beneficiaryGenderLabel = beneficiary
    ? beneficiary.gender === "male" 
      ? t("male") 
      : beneficiary.gender === "female" 
      ? t("female") 
      : beneficiary.gender
    : "";

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 1. Request Details */}
      <div className="bg-white p-6 rounded-2xl border border-[#eae7e7] flex flex-col gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#d1eeee]/50 flex items-center justify-center text-[#1f8a8a] shrink-0">
            <span className="material-symbols-outlined">assignment</span>
          </div>
          <h3 className="font-bold text-[#1b1c1c] text-base">{t("requestInfo")}</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <p className="text-[10px] text-[#3e4949] uppercase font-bold tracking-widest mb-1">{t("careType")}</p>
            <p className="font-bold text-[#1f8a8a] text-sm">{serviceLabel}</p>
          </div>

          {preferredGenderLabel && (
            <div>
              <p className="text-[10px] text-[#3e4949] uppercase font-bold tracking-widest mb-1">{t("preferredGender")}</p>
              <p className="font-semibold text-[#1b1c1c] text-sm capitalize">{preferredGenderLabel}</p>
            </div>
          )}

          {job.requiredSkills?.length > 0 && (
            <div>
              <p className="text-[10px] text-[#3e4949] uppercase font-bold tracking-widest mb-2">{t("requiredSkills")}</p>
              <div className="flex flex-wrap gap-1.5">
                {(job.requiredSkills as any[]).map((skill: any, i: number) => {
                  const skillName = typeof skill === "string" 
                    ? skill 
                    : locale === "ar" 
                    ? skill?.nameAr ?? skill?.nameEn ?? skill?.name 
                    : skill?.nameEn ?? skill?.nameAr ?? skill?.name ?? "Skill";
                  return (
                    <span
                      key={i}
                      className="bg-[#eae7e7] text-[#1b1c1c] px-2.5 py-1 rounded-full text-xs font-semibold"
                    >
                      {skillName}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {job.description && (
            <div>
              <p className="text-[10px] text-[#3e4949] uppercase font-bold tracking-widest mb-1">{t("description")}</p>
              <p className="text-sm text-[#3e4949] leading-relaxed whitespace-pre-line">{job.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* 2. Elderly Information */}
      <div className="bg-white p-6 rounded-2xl border border-[#eae7e7] flex flex-col gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#aeedd5]/50 flex items-center justify-center text-[#2c6956] shrink-0">
            <span className="material-symbols-outlined">elderly</span>
          </div>
          <h3 className="font-bold text-[#1b1c1c] text-base">{t("elderlyInfo")}</h3>
        </div>

        {beneficiary ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-[#3e4949] uppercase font-bold tracking-widest mb-1">{t("name")}</p>
                <p className="font-semibold text-[#1b1c1c] text-sm">{beneficiary.name}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#3e4949] uppercase font-bold tracking-widest mb-1">{t("relationship")}</p>
                <p className="font-semibold text-[#1b1c1c] text-sm">{relationshipLabel}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-[#3e4949] uppercase font-bold tracking-widest mb-1">{t("age")}</p>
                <p className="font-semibold text-[#1b1c1c] text-sm">{t("ageYears", { age: beneficiary.age })}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#3e4949] uppercase font-bold tracking-widest mb-1">{t("gender")}</p>
                <p className="font-semibold text-[#1b1c1c] text-sm capitalize">{beneficiaryGenderLabel}</p>
              </div>
            </div>

            {beneficiary.conditionDetails && (
              <div>
                <p className="text-[10px] text-[#3e4949] uppercase font-bold tracking-widest mb-1">{t("careNeedsSummary")}</p>
                <p className="text-sm text-[#3e4949] leading-relaxed bg-[#f6f3f2]/40 p-3 rounded-xl border border-[#eae7e7]/50 whitespace-pre-line">{beneficiary.conditionDetails}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center text-[#3e4949]">
            <span className="material-symbols-outlined text-3xl opacity-40 mb-2">person_off</span>
            <p className="text-sm font-semibold">{t("noProfile")}</p>
            <p className="text-xs opacity-70 mt-1">{t("profileId")}: {job.beneficiaryId}</p>
          </div>
        )}
      </div>

      {/* 3. Schedule & Location */}
      <div className="bg-white p-6 rounded-2xl border border-[#eae7e7] flex flex-col gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#aeedd5]/50 flex items-center justify-center text-[#2c6956] shrink-0">
            <span className="material-symbols-outlined">schedule</span>
          </div>
          <h3 className="font-bold text-[#1b1c1c] text-base">{t("scheduleLocation")}</h3>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex gap-2.5">
              <span className="material-symbols-outlined text-[#3e4949] text-lg shrink-0 mt-0.5">calendar_today</span>
              <div>
                <p className="text-[10px] text-[#3e4949] uppercase font-bold tracking-widest">{t("startDate")}</p>
                <p className="text-sm font-semibold text-[#1b1c1c]">{formatShortDate(job.startDate || job.createdAt)}</p>
              </div>
            </div>
            <div className="flex gap-2.5">
              <span className="material-symbols-outlined text-[#3e4949] text-lg shrink-0 mt-0.5">event_busy</span>
              <div>
                <p className="text-[10px] text-[#3e4949] uppercase font-bold tracking-widest">{t("endDate")}</p>
                <p className="text-sm font-semibold text-[#1b1c1c]">{getEndDate(job.startDate || job.createdAt, job.schedule?.durationInWeeks)}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2.5">
            <span className="material-symbols-outlined text-[#3e4949] text-lg shrink-0 mt-0.5">calendar_month</span>
            <div>
              <p className="text-[10px] text-[#3e4949] uppercase font-bold tracking-widest">{t("workingDays")}</p>
              <p className="text-sm font-semibold text-[#1b1c1c]">
                {job.schedule?.workingDays?.map(d => tBooking(`schedule.dayNames.${d}` as any)).join(", ") || "—"}
              </p>
              <p className="text-xs text-[#3e4949]/70 mt-0.5">{t("duration", { weeks: job.schedule?.durationInWeeks ?? "—" })}</p>
            </div>
          </div>

          {(job.schedule?.startTime || job.schedule?.endTime) && (
            <div className="flex gap-2.5">
              <span className="material-symbols-outlined text-[#3e4949] text-lg shrink-0 mt-0.5">timer</span>
              <div>
                <p className="text-[10px] text-[#3e4949] uppercase font-bold tracking-widest">{t("workingHours")}</p>
                <p className="text-sm font-semibold text-[#1b1c1c]">{formatTimeStr(job.schedule.startTime)} – {formatTimeStr(job.schedule.endTime)}</p>
              </div>
            </div>
          )}

          {job.location && (
            <div className="flex gap-2.5 pt-2 border-t border-[#eae7e7]/60">
              <span className="material-symbols-outlined text-[#3e4949] text-lg shrink-0 mt-0.5">location_on</span>
              <div className="space-y-1">
                <p className="text-[10px] text-[#3e4949] uppercase font-bold tracking-widest">{t("locationAddress")}</p>
                {job.location.readableAddress && (
                  <p className="text-sm font-semibold text-[#1b1c1c]">{job.location.readableAddress}</p>
                )}
                <p className="text-xs text-[#3e4949]/70">
                  {[job.location.city, job.location.governorate].filter(Boolean).join(", ")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Budget & Pricing */}
      <div className="bg-[#d1eeee]/30 p-6 rounded-2xl border border-[#1f8a8a]/20 flex flex-col gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#1f8a8a] flex items-center justify-center text-white shrink-0">
            <span className="material-symbols-outlined">payments</span>
          </div>
          <h3 className="font-bold text-[#1b1c1c] text-base">{t("budgetPricing")}</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-xl border border-[#1f8a8a]/10 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] text-[#3e4949] uppercase font-bold tracking-widest">{t("hourlyRate")}</p>
              <p className="text-lg font-bold text-[#1f8a8a]">
                {locale === "ar" ? `${job.budgetPerHour.toLocaleString("ar-EG")} ج.م/ساعة` : `${job.budgetPerHour.toLocaleString("en-US")} EGP/hr`}
              </p>
            </div>
            <span className="material-symbols-outlined text-[#1f8a8a] opacity-80">sell</span>
          </div>
          
          <div className="p-4 bg-white rounded-xl border border-[#1f8a8a]/10 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] text-[#3e4949] uppercase font-bold tracking-widest">{t("totalDuration")}</p>
              <p className="text-lg font-bold text-[#1b1c1c]">{t("weeksLabel", { count: job.schedule?.durationInWeeks ?? 0 })}</p>
            </div>
            <span className="material-symbols-outlined text-[#3e4949] opacity-80">timelapse</span>
          </div>

          {(() => {
            const [sh, sm] = (job.schedule?.startTime || "0:0").split(":").map(Number);
            const [eh, em] = (job.schedule?.endTime || "0:0").split(":").map(Number);
            const diff = (eh * 60 + em) - (sh * 60 + sm);
            const dailyHours = diff > 0 ? diff / 60 : 0;
            const daysPerWeek = job.schedule?.workingDays?.length || 0;
            const weeklyHours = dailyHours * daysPerWeek;
            const totalHours = weeklyHours * (job.schedule?.durationInWeeks || 0);
            const totalBudget = totalHours * job.budgetPerHour;

            return (
              <div className="p-4 bg-[#1f8a8a] rounded-xl text-white flex items-center justify-between shadow-md">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest opacity-80">{t("estimatedCost")}</p>
                  <p className="text-lg font-bold">
                    {totalBudget > 0 
                      ? (locale === "ar" ? `${totalBudget.toLocaleString("ar-EG")} ج.م` : `${totalBudget.toLocaleString("en-US")} EGP`) 
                      : t("flexible")}
                  </p>
                </div>
                <span className="material-symbols-outlined text-white opacity-90">calculate</span>
              </div>
            );
          })()}
        </div>
      </div>
    </section>
  );
}
