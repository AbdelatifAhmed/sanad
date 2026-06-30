"use client";

import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function EmptyApplications() {
  const t = useTranslations("jobPostDetails");

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-[#eae7e7]">
      <div className="w-20 h-20 bg-[#1f8a8a]/10 rounded-full flex items-center justify-center mb-5">
        <span className="material-symbols-outlined text-[#1f8a8a]" style={{ fontSize: "40px", fontVariationSettings: "'FILL' 1" }}>
          group
        </span>
      </div>
      <h3 className="text-lg font-bold text-[#1b1c1c] mb-2">{t("noAppsYet")}</h3>
      <p className="text-sm text-[#3e4949] max-w-sm px-4">
        {t("noAppsDesc")}
      </p>
      <Link
        href="/family/job-posts"
        className="mt-6 flex items-center gap-2 text-sm font-semibold text-[#1f8a8a] hover:underline"
      >
        <span className="material-symbols-outlined text-base rtl:rotate-180">arrow_back</span>
        {t("backBtn")}
      </Link>
    </div>
  );
}
