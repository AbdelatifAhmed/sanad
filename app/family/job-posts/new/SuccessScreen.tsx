"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface SuccessScreenProps {
  onPostAnother: () => void;
}

export default function SuccessScreen({ onPostAnother }: SuccessScreenProps) {
  const t = useTranslations("jobPostForm");
  const iconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!iconRef.current) return;
    const timer = setTimeout(() => {
      if (iconRef.current) {
        iconRef.current.classList.remove("animate-bounce");
        iconRef.current.classList.add("scale-110", "transition-transform", "duration-700");
        setTimeout(() => {
          iconRef.current?.classList.remove("scale-110");
        }, 300);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none -z-10 rounded-full"
        style={{
          background: "radial-gradient(circle at center, rgba(31,138,138,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Main card */}
      <div className="bg-white rounded-3xl shadow-soft border border-[#eae7e7] p-8 md:p-12 text-center relative overflow-hidden">
        {/* Decorative confetti accent */}
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <span
            className="material-symbols-outlined text-[#1f8a8a] rotate-12"
            style={{ fontSize: "120px", fontVariationSettings: "'FILL' 1" }}
          >
            celebration
          </span>
        </div>

        {/* Icon + headline */}
        <div className="mb-8 flex flex-col items-center">
          <div
            ref={iconRef}
            className="w-24 h-24 bg-[#1f8a8a]/10 rounded-full flex items-center justify-center mb-6 animate-bounce"
          >
            <span
              className="material-symbols-outlined text-[#1f8a8a]"
              style={{ fontSize: "64px", fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          </div>
          <h1 className="text-3xl font-bold text-[#1b1c1c] mb-3">
            {t("successTitle")}
          </h1>
          <p className="text-[#3e4949] text-lg max-w-lg mx-auto">
            {t("successDesc")}
          </p>
        </div>

        {/* What's Next timeline */}
        <div className="bg-[#f6f3f2] rounded-2xl p-6 text-start mb-8 border border-[#eae7e7]">
          <h2 className="text-xl font-bold text-[#1f8a8a] mb-6 px-2">
            {t("whatsNext")}
          </h2>

          <div className="space-y-6 relative before:content-[''] before:absolute before:left-[27px] rtl:before:left-auto rtl:before:right-[27px] before:top-4 before:bottom-4 before:w-[2px] before:bg-[#1f8a8a]/20">
            {/* Step 1 */}
            <div className="flex gap-4 relative">
              <div className="z-10 w-14 h-14 bg-[#1f8a8a] rounded-full flex items-center justify-center text-white shadow-lg ring-4 ring-[#f6f3f2] shrink-0">
                <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>
                  search_check
                </span>
              </div>
              <div className="pt-1">
                <h3 className="font-bold text-[#1b1c1c] mb-1">{t("step1Title")}</h3>
                <p className="text-sm text-[#3e4949]">
                  {t("step1Text")}
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4 relative">
              <div className="z-10 w-14 h-14 bg-white border-2 border-[#1f8a8a] rounded-full flex items-center justify-center text-[#1f8a8a] shadow-md ring-4 ring-[#f6f3f2] shrink-0">
                <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>
                  rate_review
                </span>
              </div>
              <div className="pt-1">
                <h3 className="font-bold text-[#1b1c1c] mb-1">{t("step2Title")}</h3>
                <p className="text-sm text-[#3e4949]">
                  {t("step2Text")}
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4 relative">
              <div className="z-10 w-14 h-14 bg-white border-2 border-[#bdc9c8] rounded-full flex items-center justify-center text-[#6e7979] shrink-0 ring-4 ring-[#f6f3f2]">
                <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>
                  handshake
                </span>
              </div>
              <div className="pt-1">
                <h3 className="font-bold text-[#1b1c1c] mb-1">{t("step3Title")}</h3>
                <p className="text-sm text-[#3e4949]">
                  {t("step3Text")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/family/job-posts"
            className="w-full sm:w-auto h-14 px-8 bg-[#1f8a8a] text-white font-bold rounded-full hover:bg-[#0d8282] transition-all active:scale-95 shadow-md text-center flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
              assignment
            </span>
            {t("viewRequests")}
          </Link>
          <button
            onClick={onPostAnother}
            className="w-full sm:w-auto h-14 px-8 border-2 border-[#1f8a8a] text-[#1f8a8a] font-bold rounded-full hover:bg-[#1f8a8a]/5 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
              add_circle
            </span>
            {t("postAnother")}
          </button>
        </div>

        {/* Trust note */}
        <p className="mt-6 text-xs text-[#3e4949]/70 flex items-center justify-center gap-1">
          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
            verified_user
          </span>
          {t("successTrustNote")}
        </p>
      </div>
    </div>
  );
}
