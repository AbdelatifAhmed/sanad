"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useGenerateCarePlan } from "@/lib/hooks";

interface CarePlanAssistantProps {
  description: string;
  onApply: (plan: { taskList: string[]; requiredSkills: string[] }) => void;
  className?: string;
}

export default function CarePlanAssistant({ description, onApply, className = "" }: CarePlanAssistantProps) {
  const locale = useLocale();
  const t = useTranslations("jobPostForm");
  const { execute, isLoading, error } = useGenerateCarePlan();
  const [summary, setSummary] = useState("");

  const placeholder = useMemo(() => {
    return locale === "ar"
      ? "اكتب وصف الحالة أو الاحتياجات اليومية..."
      : "Describe the care needs or medical context...";
  }, [locale]);

  const handleGenerate = async () => {
    if (!description.trim()) {
      setSummary(locale === "ar" ? "يرجى كتابة وصف الرعاية أولًا." : "Please describe the care needs first.");
      return;
    }

    try {
      const result = await execute({ description: description.trim() }, locale);
      const taskList = result?.tasksList ?? result?.taskList ?? [];
      const requiredSkills = result?.requiredSkills ?? [];
      onApply({ taskList, requiredSkills });
      setSummary(
        locale === "ar"
          ? `تم توليد ${taskList.length} مهمة و${requiredSkills.length} مهارة.`
          : `Generated ${taskList.length} tasks and ${requiredSkills.length} skill suggestions.`
      );
    } catch {
      setSummary(locale === "ar" ? "تعذر توليد الخطة الآن." : "The care plan assistant is unavailable right now.");
    }
  };

  return (
    <div className={`rounded-3xl border border-sand-high/60 bg-[#f7fcfa] p-4 shadow-soft ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-stitch-primary">AI Care Plan</p>
          <p className="text-xs text-stitch-on-surface-variant">{t("descriptionNeedsDesc")}</p>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isLoading}
          className="rounded-xl bg-stitch-primary px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? (locale === "ar" ? "جاري..." : "Generating...") : (locale === "ar" ? "إنشاء الخطة" : "Generate Plan")}
        </button>
      </div>

      <textarea
        rows={3}
        defaultValue={description}
        placeholder={placeholder}
        readOnly
        className="mt-3 w-full rounded-2xl border border-sand-high/70 bg-white px-3 py-2 text-sm text-stitch-on-surface outline-none"
      />

      {summary ? <p className="mt-3 text-sm text-stitch-on-surface-variant">{summary}</p> : null}
      {error ? <p className="mt-2 text-sm text-red-600">{locale === "ar" ? "تعذر الاتصال بالخادم." : "Could not contact the server."}</p> : null}
    </div>
  );
}
