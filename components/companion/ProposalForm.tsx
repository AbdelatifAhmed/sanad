"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { sendProposal } from "@/lib/API";

interface ProposalFormProps {
  jobId: string;
  jobStatus: string;
  hasApplied?: boolean;
  appliedProposalStatus?: string | null;
}

export default function ProposalForm({ 
  jobId, 
  jobStatus,
  hasApplied = false,
  appliedProposalStatus = null
}: ProposalFormProps) {
  const t = useTranslations("companionBookingDetails");
  const locale = useLocale();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [coverMessage, setCoverMessage] = useState("");
  const [expectedRate, setExpectedRate] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Role guard check
  if (isAuthenticated && user && user.role !== "companion") {
    return (
      <div className="bg-yellow-50/60 border border-yellow-100 p-6 rounded-3xl text-center space-y-3">
        <span className="material-symbols-outlined text-yellow-600 text-3xl">warning</span>
        <h3 className="text-sm font-extrabold text-gray-800">
          {locale === "ar" ? "تقديم العروض مخصص للمرافقين فقط" : "Proposals are for Companions Only"}
        </h3>
        <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
          {locale === "ar" 
            ? "لقد قمت بتسجيل الدخول بحساب عائلة. لا يمكنك تقديم عروض عمل على هذا الطلب." 
            : "You are logged in with a Family or Admin account. Only registered companions can apply to job posts."}
        </p>
      </div>
    );
  }

  // Already Applied guard check
  if (hasApplied) {
    const status = appliedProposalStatus || "pending";
    
    // Define styles and icons based on proposal status
    let cardBg = "bg-amber-50/70 border-amber-100/80";
    let iconColor = "text-amber-600";
    let iconName = "hourglass_empty";
    let statusTitleEn = "Proposal Submitted";
    let statusTitleAr = "تم تقديم العرض";
    let statusDescEn = "Your proposal is under review by the family. They will contact you if you are a good match.";
    let statusDescAr = "عرضك قيد المراجعة من قبل العائلة حالياً. سيتواصلون معك في حال القبول.";

    if (status === "accepted") {
      cardBg = "bg-[#005f56]/5 border-[#005f56]/15";
      iconColor = "text-[#005f56]";
      iconName = "check_circle";
      statusTitleEn = "Proposal Accepted!";
      statusTitleAr = "تم قبول العرض!";
      statusDescEn = "Congratulations! The family has accepted your proposal. Check your schedule or active bookings.";
      statusDescAr = "تهانينا! لقد تم قبول عرضك من قبل العائلة. يرجى مراجعة جدولك أو حجوزاتك النشطة.";
    } else if (status === "rejected") {
      cardBg = "bg-red-50/70 border-red-100/80";
      iconColor = "text-red-600";
      iconName = "cancel";
      statusTitleEn = "Proposal Declined";
      statusTitleAr = "تم رفض العرض";
      statusDescEn = "This proposal was not selected. Don't worry, you can apply for other available jobs.";
      statusDescAr = "عذراً، لم يتم اختيار عرضك لهذا الطلب. يمكنك التقديم على الفرص الأخرى المتاحة.";
    }

    return (
      <div className={`border p-8 rounded-3xl ${cardBg} shadow-soft space-y-6 relative overflow-hidden animate-fade-in`}>
        {/* Background Watermark */}
        <div className="absolute top-0 right-0 opacity-[0.03] pointer-events-none p-4 rtl:left-0 rtl:right-auto">
          <span className="material-symbols-outlined text-[140px]">check_circle</span>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white shadow-sm">
            <span className={`material-symbols-outlined text-3xl ${iconColor}`}>{iconName}</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-extrabold text-stitch-on-surface">
              {locale === "ar" ? statusTitleAr : statusTitleEn}
            </h3>
            <p className="text-sm text-stitch-on-surface-variant/80 max-w-md mx-auto leading-relaxed">
              {locale === "ar" ? statusDescAr : statusDescEn}
            </p>
          </div>
          
          <div className="pt-2 flex flex-wrap justify-center gap-3 w-full max-w-xs">
            <Link
              href="/companion/bookings"
              className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-stitch-on-surface-variant font-extrabold py-3 px-4 rounded-2xl shadow-sm transition-all text-xs text-center cursor-pointer"
            >
              {locale === "ar" ? "تصفح الطلبات الأخرى" : "Browse Other Jobs"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Job Status guard check
  if (jobStatus !== "open") {
    return (
      <div className="bg-gray-50/60 border border-gray-100 p-6 rounded-3xl text-center space-y-3">
        <span className="material-symbols-outlined text-gray-400 text-3xl">lock</span>
        <h3 className="text-sm font-extrabold text-gray-800">
          {locale === "ar" ? "هذا الطلب لم يعد متاحاً" : "This request is no longer available"}
        </h3>
        <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
          {locale === "ar" 
            ? "تم إغلاق هذا الطلب أو تعيين مرافق له بالفعل. لا يمكن قبول عروض جديدة." 
            : "This job post has been filled or closed. We are no longer accepting new proposals for it."}
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!coverMessage.trim()) {
      newErrors.coverMessage = locale === "ar" ? "يرجى كتابة رسالة التغطية" : "Please introduce yourself first.";
    }
    if (!expectedRate.trim()) {
      newErrors.expectedRate = locale === "ar" ? "يرجى تحديد السعر المتوقع" : "Expected hourly rate is required.";
    } else {
      const rateNum = Number(expectedRate);
      if (isNaN(rateNum) || rateNum <= 0) {
        newErrors.expectedRate = locale === "ar" ? "يرجى إدخال سعر ساعة صحيح" : "Please enter a valid hourly rate.";
      }
    }
    if (!isConfirmed) {
      newErrors.confirm = locale === "ar" ? "يرجى تأكيد توافرك في هذه المواعيد" : "You must confirm availability.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await sendProposal({
        jobPostId: jobId,
        proposedRate: Number(expectedRate),
        coverLetter: coverMessage,
      });
      setIsSuccess(true);
    } catch (err: any) {
      console.error("Failed to submit proposal:", err);
      const backendMessage = err.response?.data?.message;
      setErrors({
        apiError: backendMessage || (locale === "ar" ? "حدث خطأ غير متوقع أثناء تقديم العرض. يرجى المحاولة لاحقاً." : "An unexpected error occurred while submitting. Please try again later.")
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-white p-8 sm:p-12 rounded-3xl border border-stitch-outline/10 shadow-soft text-center flex flex-col items-center gap-6 max-w-lg mx-auto w-full animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-[#005f56]/15 flex items-center justify-center text-[#005f56]">
          <span className="material-symbols-outlined text-4xl">check_circle</span>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-stitch-on-surface">
            {t("proposalSuccessTitle")}
          </h2>
          <p className="text-sm text-stitch-on-surface-variant/75 leading-relaxed">
            {t("proposalSuccessDesc")}
          </p>
        </div>
        <Link
          href="/companion/bookings"
          className="w-full bg-[#005f56] hover:bg-[#004e46] text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-sm transition-colors text-sm text-center block cursor-pointer"
        >
          {t("backToBookings")}
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#005f56]/5 p-6 sm:p-8 rounded-3xl border border-[#005f56]/15 shadow-soft space-y-6 relative overflow-hidden">
      {/* SVG Watermark illustration in background */}
      <div className="absolute top-0 right-0 opacity-[0.03] pointer-events-none p-4 rtl:left-0 rtl:right-auto">
        <span className="material-symbols-outlined text-[140px] text-[#005f56]">description</span>
      </div>

      <div className="relative z-10 space-y-6">
        <div className="border-b border-[#005f56]/10 pb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#005f56]">send</span>
          <h2 className="text-lg font-extrabold text-stitch-on-surface">
            {t("submitProposal")}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Cover Message */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stitch-on-surface-variant/80">
              {t("coverMessage")}
            </label>
            <textarea
              value={coverMessage}
              onChange={(e) => setCoverMessage(e.target.value)}
              placeholder={t("coverMessagePlaceholder")}
              rows={5}
              className={`w-full p-4 bg-white rounded-2xl border text-sm focus:ring-1 focus:ring-[#005f56] focus:border-[#005f56] outline-none transition-all placeholder:text-gray-400 text-stitch-on-surface font-semibold ${
                errors.coverMessage ? "border-red-500 ring-1 ring-red-500/20" : "border-gray-200"
              }`}
            />
            {errors.coverMessage && (
              <span className="text-xs text-red-500 font-bold block">{errors.coverMessage}</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
            {/* Hourly rate input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stitch-on-surface-variant/80">
                {t("expectedHourlyRate")}
              </label>
              <input
                type="text"
                value={expectedRate}
                onChange={(e) => setExpectedRate(e.target.value)}
                placeholder={t("ratePlaceholder")}
                className={`w-full p-4 bg-white rounded-2xl border text-sm focus:ring-1 focus:ring-[#005f56] focus:border-[#005f56] outline-none transition-all placeholder:text-gray-400 text-stitch-on-surface font-semibold ${
                  errors.expectedRate ? "border-red-500 ring-1 ring-red-500/20" : "border-gray-200"
                }`}
              />
              {errors.expectedRate && (
                <span className="text-xs text-red-500 font-bold block">{errors.expectedRate}</span>
              )}
            </div>

            {/* Checkbox confirmation */}
            <div className="h-full flex items-center pt-2 sm:pt-8">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isConfirmed}
                  onChange={(e) => setIsConfirmed(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-[#005f56] focus:ring-[#005f56]/30 cursor-pointer mt-0.5"
                />
                <div className="flex-1">
                  <span className="text-xs font-bold text-stitch-on-surface-variant/80">
                    {t("confirmAvailability")}
                  </span>
                  {errors.confirm && (
                    <span className="text-xs text-red-500 font-bold block mt-1">{errors.confirm}</span>
                  )}
                </div>
              </label>
            </div>
          </div>

          {errors.apiError && (
            <div className="bg-red-50 text-red-600 border border-red-100 p-4 rounded-2xl text-xs font-bold flex items-start gap-2 animate-fade-in">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{errors.apiError}</span>
            </div>
          )}

          {/* Action row */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#005f56] hover:bg-[#004e46] disabled:opacity-80 text-white font-extrabold py-3.5 px-8 rounded-2xl shadow-md hover:shadow-lg transition-all text-sm flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>{t("submitting")}</span>
                </>
              ) : (
                <>
                  <span>{t("submitProposalBtn")}</span>
                  <span className="material-symbols-outlined text-base rtl:rotate-180">send</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
