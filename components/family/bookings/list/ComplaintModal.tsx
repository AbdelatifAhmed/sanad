"use client";

import React from "react";
import { useTranslations, useLocale } from "next-intl";
import { Loader2 } from "lucide-react";

interface ComplaintModalProps {
  isOpen: boolean;
  submitting: boolean;
  success: boolean;
  text: string;
  onChangeText: (text: string) => void;
  titleText?: string;
  onChangeTitleText?: (text: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export default function ComplaintModal({
  isOpen,
  submitting,
  success,
  text,
  onChangeText,
  titleText,
  onChangeTitleText,
  onSubmit,
  onClose
}: ComplaintModalProps) {
  const t = useTranslations("familyBookings");
  const locale = useLocale();
  const isRtl = locale === "ar";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#1b1c1c]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 space-y-6 shadow-soft relative animate-in fade-in zoom-in-95 duration-200">
        <div>
          <h3 className="text-xl font-bold text-[#1f8a8a]">{t("fileComplaint")}</h3>
          <p className="text-xs text-[#3e4949] mt-1">
            {t("complaintDesc")}
          </p>
        </div>

        {success ? (
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-xs font-semibold text-center animate-pulse">
            {t("complaintFiled")}
          </div>
        ) : (
          <div className="space-y-4">
            {onChangeTitleText && (
              <div className="space-y-1.5 text-right" dir={isRtl ? "rtl" : "ltr"}>
                <label className="text-xs font-bold text-[#3e4949]">
                  {isRtl ? "عنوان الشكوى" : "Complaint Title"}
                </label>
                <select
                  value={titleText || ""}
                  onChange={(e) => onChangeTitleText(e.target.value)}
                  className="w-full p-4 border border-[#bdc9c8] rounded-2xl text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none bg-white transition-all appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%233e4949' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                    backgroundPosition: isRtl ? 'left 1rem center' : 'right 1rem center',
                    backgroundSize: '1em',
                    backgroundRepeat: 'no-repeat',
                    paddingLeft: isRtl ? '2.5rem' : '1rem',
                    paddingRight: isRtl ? '1rem' : '2.5rem',
                  }}
                >
                  <option value="" disabled>
                    {isRtl ? "اختر عنواناً للشكوى" : "Select a complaint title"}
                  </option>
                  {(isRtl
                    ? [
                        { value: "تأخر المرافق عن الحضور", label: "تأخر المرافق عن الحضور" },
                        { value: "عدم حضور المرافق", label: "عدم حضور المرافق" },
                        { value: "جودة رعاية ضعيفة", label: "جودة رعاية ضعيفة" },
                        { value: "سلوك غير لائق", label: "سلوك غير لائق" },
                        { value: "أخرى", label: "أخرى" }
                      ]
                    : [
                        { value: "Late Arrival", label: "Late Arrival" },
                        { value: "No Show", label: "No Show" },
                        { value: "Poor Care Quality", label: "Poor Care Quality" },
                        { value: "Inappropriate Behavior", label: "Inappropriate Behavior" },
                        { value: "Other", label: "Other" }
                      ]
                  ).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-1.5 text-right" dir={isRtl ? "rtl" : "ltr"}>
              <label className="text-xs font-bold text-[#3e4949]">
                {isRtl ? "تفاصيل الشكوى" : "Complaint Details"}
              </label>
              <textarea
                value={text}
                onChange={(e) => onChangeText(e.target.value)}
                placeholder={t("complaintPlaceholder")}
                rows={4}
                className="w-full p-4 border border-[#bdc9c8] rounded-2xl text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all resize-none"
              />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={onClose}
                className="px-5 py-3 bg-[#f6f3f2] hover:bg-[#bdc9c8]/25 text-[#3e4949] font-bold text-xs rounded-xl cursor-pointer"
              >
                {isRtl ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={onSubmit}
                disabled={submitting || !text || (onChangeTitleText !== undefined && !titleText)}
                className="px-6 py-3 bg-[#1f8a8a] hover:bg-[#0d8282] disabled:bg-[#bdc9c8] disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl cursor-pointer shadow-md"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  isRtl ? "إرسال الشكوى" : "Submit Complaint"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
