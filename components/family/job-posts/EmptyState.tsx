"use client";

import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function EmptyState() {
  const tList = useTranslations("jobPostsList");

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-24 h-24 bg-[#1f8a8a]/10 rounded-full flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-[#1f8a8a]" style={{ fontSize: "48px", fontVariationSettings: "'FILL' 1" }}>
          assignment
        </span>
      </div>
      <h3 className="text-xl font-bold text-[#1b1c1c] mb-2">{tList("noRequestsTitle")}</h3>
      <p className="text-sm text-[#3e4949] max-w-sm mb-8">
        {tList("noRequestsDesc")}
      </p>
      <Link
        href="/family/job-posts/new"
        className="flex items-center gap-2 px-6 py-3 bg-[#1f8a8a] text-white font-bold rounded-xl hover:bg-[#0d8282] transition-all shadow-md active:scale-95 cursor-pointer"
      >
        <span className="material-symbols-outlined">add_circle</span>
        {tList("postRequestBtn")}
      </Link>
    </div>
  );
}
