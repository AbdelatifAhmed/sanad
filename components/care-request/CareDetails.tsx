import React from "react";
import { useTranslations } from "next-intl";
import { HeartHandshake, AlertCircle } from "lucide-react";

interface CareDetailsProps {
  careType: string;
  notes: string;
  onChangeCareType: (val: string) => void;
  onChangeNotes: (val: string) => void;
  error?: string;
}

export default function CareDetails({
  careType,
  notes,
  onChangeCareType,
  onChangeNotes,
  error,
}: CareDetailsProps) {
  const t = useTranslations("bookingForm");

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl border border-sand-high/60 shadow-soft space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-2 border-b border-sand-high/60">
        <HeartHandshake className="w-5 h-5 text-[#005c53]" />
        <h3 className="font-display font-bold text-[#012d1d] text-lg">
          {t("careDetails")}
        </h3>
      </div>

      {/* Fields */}
      <div className="space-y-4">
        {/* Type of Care Select */}
        <div className="space-y-1.5 flex flex-col">
          <label className="text-xs font-bold text-gray-500">
            {t("careTypeRequired")} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={careType}
              onChange={(e) => onChangeCareType(e.target.value)}
              className={`w-full bg-[#fcf9f6] border rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 outline-none focus:border-[#1f8a8a] focus:ring-1 focus:ring-[#1f8a8a] transition-all cursor-pointer appearance-none ${
                error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-sand-highest"
              }`}
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
                backgroundPosition: 'right 0.75rem center',
                backgroundSize: '1.25rem',
                backgroundRepeat: 'no-repeat',
                paddingRight: '2.5rem'
              }}
            >
              <option value="" disabled>{t("selectCareType")}</option>
              <option value="elderly_care">{t("elderlyCare")}</option>
              <option value="companionship">{t("companionCare")}</option>
              <option value="home_nursing">{t("homeNursing")}</option>
              <option value="physical_therapy">{t("physicalTherapy")}</option>
              <option value="child_care">{t("childCare")}</option>
            </select>
          </div>
          {error && (
            <p className="text-xs text-red-500 flex items-center gap-1 font-medium mt-1">
              <AlertCircle className="w-3 h-3" /> {error}
            </p>
          )}
        </div>

        {/* Additional Notes Textarea */}
        <div className="space-y-1.5 flex flex-col">
          <label className="text-xs font-bold text-gray-500">
            {t("additionalNotes")}
          </label>
          <textarea
            value={notes}
            onChange={(e) => onChangeNotes(e.target.value)}
            placeholder={t("placeholderNotes")}
            rows={4}
            className="w-full bg-[#fcf9f6] border border-sand-highest rounded-xl px-4 py-3.5 text-sm font-semibold text-gray-700 outline-none focus:border-[#1f8a8a] focus:ring-1 focus:ring-[#1f8a8a] transition-all resize-y min-h-[100px]"
          />
        </div>
      </div>
    </div>
  );
}

