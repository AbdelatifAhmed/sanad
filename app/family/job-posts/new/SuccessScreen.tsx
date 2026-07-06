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
    <div className="max-w-lg mx-auto">
      {/* Ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] pointer-events-none -z-10 rounded-full"
        style={{
          background: "radial-gradient(circle at center, rgba(31,138,138,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Main card */}
      <div className="bg-white rounded-3xl shadow-soft border border-[#eae7e7] p-6 md:p-8 text-center relative overflow-hidden">
        {/* Decorative confetti accent */}
        <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
          <span
            className="material-symbols-outlined text-[#1f8a8a] rotate-12"
            style={{ fontSize: "50px", fontVariationSettings: "'FILL' 1" }}
          >
            celebration
          </span>
        </div>

        {/* Icon + headline */}
        <div className="mb-5 flex flex-col items-center">
          <div
            ref={iconRef}
            className="w-14 h-14 bg-[#1f8a8a]/10 rounded-full flex items-center justify-center mb-3 animate-bounce"
          >
            <span
              className="material-symbols-outlined text-[#1f8a8a]"
              style={{ fontSize: "32px", fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#1b1c1c] mb-1.5">
            {t("successTitle")}
          </h1>
          <p className="text-[#3e4949] text-xs max-w-md mx-auto leading-relaxed">
            {t("successDesc")}
          </p>
        </div>

        {/* What's Next timeline */}
        <div className="bg-sand/20 rounded-2xl p-4.5 text-start mb-5 border border-sand-high/30">
          <h2 className="text-sm font-bold text-[#1f8a8a] mb-3.5 px-0.5">
            {t("whatsNext")}
          </h2>

          <div className="space-y-3.5 relative before:content-[''] before:absolute before:left-[17px] rtl:before:left-auto rtl:before:right-[17px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-[#1f8a8a]/20">
            {/* Step 1 */}
            <div className="flex gap-3 relative">
              <div className="z-10 w-9 h-9 bg-[#1f8a8a] rounded-full flex items-center justify-center text-white shadow-sm ring-4 ring-white shrink-0">
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                  search_check
                </span>
              </div>
              <div className="pt-0.5">
                <h3 className="font-bold text-xs text-[#1b1c1c] mb-0.5">{t("step1Title")}</h3>
                <p className="text-[11px] text-[#3e4949] leading-relaxed">
                  {t("step1Text")}
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-3 relative">
              <div className="z-10 w-9 h-9 bg-white border-2 border-[#1f8a8a] rounded-full flex items-center justify-center text-[#1f8a8a] shadow-sm ring-4 ring-white shrink-0">
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                  rate_review
                </span>
              </div>
              <div className="pt-0.5">
                <h3 className="font-bold text-xs text-[#1b1c1c] mb-0.5">{t("step2Title")}</h3>
                <p className="text-[11px] text-[#3e4949] leading-relaxed">
                  {t("step2Text")}
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-3 relative">
              <div className="z-10 w-9 h-9 bg-white border-2 border-[#bdc9c8] rounded-full flex items-center justify-center text-[#6e7979] shrink-0 ring-4 ring-white">
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                  handshake
                </span>
              </div>
              <div className="pt-0.5">
                <h3 className="font-bold text-xs text-[#1b1c1c] mb-0.5">{t("step3Title")}</h3>
                <p className="text-[11px] text-[#3e4949] leading-relaxed">
                  {t("step3Text")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <Link
            href="/family/job-posts"
            className="w-full sm:w-auto h-10 px-5 bg-[#1f8a8a] text-white font-bold rounded-full hover:bg-[#0d8282] transition-all active:scale-95 shadow-sm text-center flex items-center justify-center gap-1.5 text-xs"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
              assignment
            </span>
            {t("viewRequests")}
          </Link>
          <button
            onClick={onPostAnother}
            className="w-full sm:w-auto h-10 px-5 border-2 border-[#1f8a8a] text-[#1f8a8a] font-bold rounded-full hover:bg-[#1f8a8a]/5 transition-all active:scale-95 flex items-center justify-center gap-1.5 text-xs"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
              add_circle
            </span>
            {t("postAnother")}
          </button>
        </div>

        {/* Trust note */}
        <p className="mt-4 text-[9px] text-[#3e4949]/70 flex items-center justify-center gap-1">
          <span className="material-symbols-outlined" style={{ fontSize: "11px" }}>
            verified_user
          </span>
          {t("successTrustNote")}
        </p>
      </div>
    </div>
  );
}
