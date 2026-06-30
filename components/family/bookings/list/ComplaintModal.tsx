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
  onSubmit: () => void;
  onClose: () => void;
}

export default function ComplaintModal({
  isOpen,
  submitting,
  success,
  text,
  onChangeText,
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
            <textarea
              value={text}
              onChange={(e) => onChangeText(e.target.value)}
              placeholder={t("complaintPlaceholder")}
              rows={4}
              className="w-full p-4 border border-[#bdc9c8] rounded-2xl text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all resize-none"
            />
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={onClose}
                className="px-5 py-3 bg-[#f6f3f2] hover:bg-[#bdc9c8]/25 text-[#3e4949] font-bold text-xs rounded-xl cursor-pointer"
              >
                {isRtl ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={onSubmit}
                disabled={submitting || !text}
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
