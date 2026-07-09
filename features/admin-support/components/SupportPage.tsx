"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { AdminSupportChat } from "./AdminSupportChat";

interface SupportPageProps {
  /** "family" | "companion" — used for contextual copy only */
  userRole?: "family" | "companion";
}

export const SupportPage: React.FC<SupportPageProps> = ({ userRole = "family" }) => {
  const t = useTranslations("supportPage");

  const infoCards = [
    { icon: "help", labelKey: "generalInquiries" as const, descKey: "generalInquiriesDesc" as const },
    { icon: "report_problem", labelKey: "complaints" as const, descKey: "complaintsDesc" as const },
    { icon: "info", labelKey: "accountSupport" as const, descKey: "accountSupportDesc" as const },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
            <span className="material-symbols-outlined text-teal-600 text-xl">support_agent</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>
            <p className="text-sm text-gray-500">
              {userRole === "family" ? t("familySubtitle") : t("companionSubtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {infoCards.map((item) => (
          <div
            key={item.labelKey}
            className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-teal-600 text-base">{item.icon}</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700">{t(item.labelKey)}</p>
              <p className="text-xs text-gray-400">{t(item.descKey)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chat — fills remaining space */}
      <div className="flex-1 min-h-0" style={{ minHeight: "420px" }}>
        <AdminSupportChat />
      </div>
    </div>
  );
};
