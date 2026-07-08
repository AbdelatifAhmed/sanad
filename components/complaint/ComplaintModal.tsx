"use client";

import React, { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Loader2, X, AlertCircle } from "lucide-react";
import { api } from "../../lib/services/api";

interface ComplaintModalProps {
  bookingId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ComplaintModal({
  bookingId,
  isOpen,
  onClose,
  onSuccess,
}: ComplaintModalProps) {
  const t = useTranslations("familyBookings");
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset states when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDescription("");
      setSuccess(false);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!description || !title) return;
    try {
      setSubmitting(true);
      setError(null);
      await api.post(`/bookings/${bookingId}/complaints`, {
        title,
        description,
      });
      setSuccess(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error("Error submitting complaint:", err);
      const errMsg = err.response?.data?.message || err.message || (isRtl ? "فشل تقديم الشكوى، يرجى المحاولة لاحقاً." : "Failed to submit complaint, please try again.");
      setError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#1b1c1c]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir={isRtl ? "rtl" : "ltr"}>
      <div className={`bg-white rounded-3xl max-w-md w-full p-6 md:p-8 space-y-6 shadow-soft relative animate-in fade-in zoom-in-95 duration-200 ${isRtl ? "text-right" : "text-left"}`}>
        
        {/* Close button */}
        {!submitting && !success && (
          <button 
            onClick={onClose}
            className={`absolute top-4 p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full border border-stitch-outline/20 transition-all text-slate-500 hover:text-slate-800 ${
              isRtl ? "left-4" : "right-4"
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div>
          <h3 className={`text-xl font-bold text-[#1f8a8a] text-center ${isRtl ? "md:text-right" : "md:text-left"}`}>{t("fileComplaint")}</h3>
          <p className={`text-xs text-[#3e4949] mt-1 text-center ${isRtl ? "md:text-right" : "md:text-left"}`}>
            {t("complaintDesc")}
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-650 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-xs font-semibold text-center animate-pulse">
            {t("complaintFiled")}
          </div>
        ) : (
          <div className="space-y-4">
            <div className={`space-y-1.5 ${isRtl ? "text-right" : "text-left"}`} dir={isRtl ? "rtl" : "ltr"}>
              <label className="text-xs font-bold text-[#3e4949]">
                {isRtl ? "عنوان الشكوى" : "Complaint Title"}
              </label>
              <select
                value={title}
                onChange={(e) => setTitle(e.target.value)}
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
            
            <div className={`space-y-1.5 ${isRtl ? "text-right" : "text-left"}`} dir={isRtl ? "rtl" : "ltr"}>
              <label className="text-xs font-bold text-[#3e4949]">
                {isRtl ? "تفاصيل الشكوى" : "Complaint Details"}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("complaintPlaceholder")}
                rows={4}
                className="w-full p-4 border border-[#bdc9c8] rounded-2xl text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all resize-none"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 bg-[#f6f3f2] hover:bg-[#bdc9c8]/25 text-[#3e4949] font-bold text-xs rounded-xl cursor-pointer"
              >
                {isRtl ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !description || !title}
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
