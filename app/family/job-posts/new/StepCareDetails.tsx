"use client";

import { useState, useEffect } from "react";
import { CareRequestFormData, ServiceType, Beneficiary } from "@/lib/types/care-request";
import { useFamilyElderlyProfiles } from "@/lib/hooks";
import { useTranslations, useLocale } from "next-intl";
import { getAllSkills, SkillItem } from "@/lib/api/companion.api";

type Step1Data = Pick<CareRequestFormData, "title" | "beneficiaryId" | "serviceType" | "description" | "budgetPerHour" | "taskList" | "preferredGender" | "requiredSkills">;

interface StepCareDetailsProps {
  defaultValues: Partial<CareRequestFormData> & Step1Data;
  onNext: (data: Step1Data) => void;
}

const SERVICE_TYPES: { value: ServiceType; labelKey: "elderlyCare" | "companionCare" | "homeNursing" | "physicalTherapy" | "childCare"; icon: string }[] = [
  { value: "elderly_care", labelKey: "elderlyCare", icon: "elderly" },
  { value: "companionship", labelKey: "companionCare", icon: "volunteer_activism" },
  { value: "home_nursing", labelKey: "homeNursing", icon: "medical_services" },
  { value: "physical_therapy", labelKey: "physicalTherapy", icon: "accessible" },
  { value: "child_care", labelKey: "childCare", icon: "child_care" },
];

export default function StepCareDetails({ defaultValues, onNext }: StepCareDetailsProps) {
  const t = useTranslations("jobPostForm");
  const tBooking = useTranslations("bookingForm");
  const locale = useLocale();
  const { data: profileData, isLoading: profilesLoading } = useFamilyElderlyProfiles();
  const beneficiaries: Beneficiary[] = profileData?.beneficiaries ?? [];

  const [dbSkills, setDbSkills] = useState<SkillItem[]>([]);

  useEffect(() => {
    const loadSkills = async () => {
      try {
        const list = await getAllSkills();
        setDbSkills(list || []);
      } catch (err) {
        console.error("Failed to load skills from DB:", err);
      }
    };
    loadSkills();
  }, []);

  const [title, setTitle] = useState(defaultValues.title ?? "");
  const [beneficiaryId, setBeneficiaryId] = useState(defaultValues.beneficiaryId);
  const [serviceType, setServiceType] = useState<ServiceType>(defaultValues.serviceType);
  const [description, setDescription] = useState(defaultValues.description);
  
  // Storing formatted budget with commas in local input state
  const [budgetPerHourStr, setBudgetPerHourStr] = useState<string>(() => {
    const val = defaultValues.budgetPerHour;
    if (val === undefined || val === null || val === "") return "";
    return String(val).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  });

  const [taskList, setTaskList] = useState<string[]>(defaultValues.taskList || []);
  const [taskInput, setTaskInput] = useState("");
  const [preferredGender, setPreferredGender] = useState<"any gender" | "male" | "female">(
    defaultValues.preferredGender || "any gender"
  );
  const [requiredSkills, setRequiredSkills] = useState<string[]>(defaultValues.requiredSkills || []);
  const [skillInput, setSkillInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getNumericBudget = () => {
    const clean = budgetPerHourStr.replace(/,/g, "");
    return clean ? Number(clean) : "";
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = t("titleRequired");
    if (beneficiaries.length === 0)
      errs.beneficiary = t("beneficiaryRequired");
    if (!serviceType) errs.serviceType = t("careTypeRequired");
    if (!description.trim()) errs.description = t("descriptionRequired");
    
    const numericBudget = getNumericBudget();
    if (numericBudget === "" || numericBudget < 1)
      errs.budgetPerHour = t("budgetRequired");
    return errs;
  };

  const handleNext = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onNext({ 
      title, 
      beneficiaryId, 
      serviceType, 
      description, 
      budgetPerHour: getNumericBudget(), 
      taskList, 
      preferredGender, 
      requiredSkills 
    });
  };

  return (
    <div className="space-y-8">
      {/* Request Title */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-[#1b1c1c]" htmlFor="request_title">
          {t("requestTitle")} <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-[#3e4949]/70">
          {t("titleDescription")}
        </p>
        <input
          id="request_title"
          type="text"
          value={title}
          autoFocus
          onChange={(e) => { setTitle(e.target.value); setErrors((er) => ({ ...er, title: "" })); }}
          placeholder={t("titlePlaceholder")}
          className={`w-full h-14 bg-white border rounded-xl px-4 text-sm outline-none transition-all ${
            errors.title
              ? "border-red-400 focus:ring-2 focus:ring-red-200"
              : "border-[#bdc9c8] focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a]"
          }`}
        />
        {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
      </div>

      <div className="border-t border-[#bdc9c8]/30" />

      {/* Section header */}
      <div>
        <h3 className="text-xl font-bold text-[#1f8a8a] mb-1">{t("recipientInfo")}</h3>
        <p className="text-sm text-[#3e4949]">{t("recipientDesc")}</p>
      </div>

      {/* Beneficiary selector */}
      {profilesLoading ? (
        <div className="flex gap-3 animate-pulse">
          {[1, 2].map((i) => <div key={i} className="h-12 w-32 bg-[#f0eded] rounded-xl" />)}
        </div>
      ) : beneficiaries.length > 0 ? (
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-[#1b1c1c]">{t("selectBeneficiary")}</label>
          <div className="flex flex-wrap gap-3">
            {beneficiaries.map((b) => (
              <button
                key={b._id}
                type="button"
                onClick={() => { setBeneficiaryId(b._id); setErrors((e) => ({ ...e, beneficiary: "" })); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                  beneficiaryId === b._id
                    ? "border-[#1f8a8a] bg-[#1f8a8a]/5 text-[#1f8a8a]"
                    : "border-[#bdc9c8]/60 text-[#3e4949] hover:border-[#1f8a8a]/40"
                }`}
              >
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {b.category === "elderly" ? "elderly" : "accessibility_new"}
                </span>
                <span>{b.name}</span>
                <span className="text-xs opacity-60">({b.age} {tBooking("years")})</span>
              </button>
            ))}
          </div>
          {errors.beneficiary && <p className="text-xs text-red-500">{errors.beneficiary}</p>}
        </div>
      ) : (
        <div className="flex gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
          <span className="material-symbols-outlined text-red-500 shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
            warning
          </span>
          <div>
            <p className="text-sm font-semibold text-red-700">{t("noBeneficiaries")}</p>
            <p className="text-sm text-red-600 mt-0.5">
              {t("addFamilyMemberDesc").split("{profileLink}")[0]}
              <a href="/family/profile" className="font-bold underline">{t("profile")}</a>
              {t("addFamilyMemberDesc").split("{profileLink}")[1]}
            </p>
            {errors.beneficiary && <p className="text-xs text-red-600 mt-1 font-medium">{errors.beneficiary}</p>}
          </div>
        </div>
      )}

      <div className="border-t border-[#bdc9c8]/30" />

      {/* Care specifics */}
      <div>
        <h3 className="text-xl font-bold text-[#1f8a8a] mb-1">{t("careSpecifics")}</h3>
        <p className="text-sm text-[#3e4949]">{t("careSpecificsDesc")}</p>
      </div>

      {/* Service type cards */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-[#1b1c1c]">
          {t("careType")} <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {SERVICE_TYPES.map((ct) => {
            const isActive = serviceType === ct.value;
            return (
              <button
                key={ct.value}
                type="button"
                onClick={() => { setServiceType(ct.value); setErrors((e) => ({ ...e, serviceType: "" })); }}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all duration-200 ${
                  isActive
                    ? "border-[#1f8a8a] bg-[#1f8a8a]/5 text-[#1f8a8a]"
                    : "border-[#bdc9c8]/60 text-[#3e4949] hover:border-[#1f8a8a]/40"
                }`}
              >
                <span className="material-symbols-outlined text-3xl">{ct.icon}</span>
                <span className="text-xs font-semibold">{tBooking(ct.labelKey)}</span>
              </button>
            );
          })}
        </div>
        {errors.serviceType && <p className="text-xs text-red-500">{errors.serviceType}</p>}
      </div>


      {/* Description */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-[#1b1c1c]" htmlFor="needs_desc">
          {t("descriptionNeeds")} <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-[#3e4949]/70">
          {t("descriptionNeedsDesc")}
        </p>
        <textarea
          id="needs_desc"
          rows={4}
          value={description}
          onChange={(e) => { setDescription(e.target.value); setErrors((er) => ({ ...er, description: "" })); }}
          placeholder={t("descriptionPlaceholder")}
          className="w-full bg-white border border-[#bdc9c8] rounded-xl p-4 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all resize-none"
        />
        {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
      </div>

      {/* Budget per hour */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-[#1b1c1c]" htmlFor="budget">
          {t("budgetPerHour")} ({locale === "ar" ? "بالجنيه المصري" : "Egyptian Pounds"}) <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 text-[#3e4949] pointer-events-none">
            payments
          </span>
          <input
            id="budget"
            type="text"
            value={budgetPerHourStr}
            onChange={(e) => {
              const clean = e.target.value.replace(/\D/g, "");
              const formatted = clean ? Number(clean).toLocaleString("en-US") : "";
              setBudgetPerHourStr(formatted);
              setErrors((er) => ({ ...er, budgetPerHour: "" }));
            }}
            placeholder={t("budgetPlaceholder")}
            className="w-full h-14 bg-white border border-[#bdc9c8] rounded-xl pl-12 pr-24 rtl:pl-24 rtl:pr-12 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all"
          />
          <span className="absolute right-4 rtl:right-auto rtl:left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#1f8a8a] bg-[#1f8a8a]/5 px-2 py-1 rounded-lg">
            {locale === "ar" ? "جنيه مصري / ساعة" : "EGP / hr"}
          </span>
        </div>
        {errors.budgetPerHour && <p className="text-xs text-red-500">{errors.budgetPerHour}</p>}
      </div>

      {/* Preferred Gender */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-[#1b1c1c]">
          {t("preferredGender")}
        </label>
        <div className="grid grid-cols-3 gap-3">
          {(
            [
              { value: "any gender", key: "anyGender" },
              { value: "male", key: "male" },
              { value: "female", key: "female" },
            ] as const
          ).map((g) => {
            const isActive = preferredGender === g.value;
            return (
              <button
                key={g.value}
                type="button"
                onClick={() => setPreferredGender(g.value)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 text-center transition-all duration-200 ${
                  isActive
                    ? "border-[#1f8a8a] bg-[#1f8a8a]/5 text-[#1f8a8a]"
                    : "border-[#bdc9c8]/60 text-[#3e4949] hover:border-[#1f8a8a]/40"
                }`}
              >
                <span className="text-sm font-bold">{t(g.key)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Required Skills */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-[#1b1c1c]" htmlFor="skill_input">
          {t("requiredSkills")}
        </label>
        <div className="flex gap-2">
          <input
            id="skill_input"
            type="text"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (skillInput.trim()) {
                  if (!requiredSkills.includes(skillInput.trim())) {
                    setRequiredSkills((prev) => [...prev, skillInput.trim()]);
                  }
                  setSkillInput("");
                }
              }
            }}
            placeholder={t("skillsPlaceholder")}
            className="flex-1 h-12 bg-white border border-[#bdc9c8] rounded-xl px-4 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all"
          />
          <button
            type="button"
            onClick={() => {
              if (skillInput.trim()) {
                if (!requiredSkills.includes(skillInput.trim())) {
                  setRequiredSkills((prev) => [...prev, skillInput.trim()]);
                }
                setSkillInput("");
              }
            }}
            className="px-4 h-12 bg-[#1f8a8a] text-white rounded-xl text-sm font-bold hover:bg-[#0d8282] transition-all cursor-pointer"
          >
            {t("skillsAddButton")}
          </button>
        </div>

        {/* Predefined database skills suggestions */}
        {dbSkills.filter(s => {
          const name = locale === 'ar' ? s.nameAr : s.nameEn;
          const matchesQuery = name.toLowerCase().includes(skillInput.toLowerCase());
          const notSelected = !requiredSkills.includes(name);
          return matchesQuery && notSelected;
        }).length > 0 && (
          <div className="space-y-2 bg-[#eae7e7]/30 p-4 rounded-xl border border-[#bdc9c8]/20 mt-2">
            <p className="text-[10px] font-bold text-[#3e4949] uppercase tracking-wider">
              {locale === 'ar' ? "المهارات المقترحة" : "Suggested Skills"}
            </p>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {dbSkills.filter(s => {
                const name = locale === 'ar' ? s.nameAr : s.nameEn;
                const matchesQuery = name.toLowerCase().includes(skillInput.toLowerCase());
                const notSelected = !requiredSkills.includes(name);
                return matchesQuery && notSelected;
              }).map(s => {
                const name = locale === 'ar' ? s.nameAr : s.nameEn;
                return (
                  <button
                    type="button"
                    key={s._id}
                    onClick={() => {
                      setRequiredSkills((prev) => [...prev, name]);
                      setSkillInput("");
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-[#1f8a8a]/10 hover:text-[#1f8a8a] text-[#3e4949] rounded-full text-xs font-bold border border-[#bdc9c8]/50 transition-colors shadow-sm cursor-pointer"
                  >
                    + {name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {requiredSkills.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {requiredSkills.map((skill, index) => (
              <span
                key={index}
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#1f8a8a]/10 text-[#1f8a8a] text-xs font-bold border border-[#1f8a8a]/20"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => setRequiredSkills((prev) => prev.filter((_, i) => i !== index))}
                  className="hover:text-red-500 transition-colors focus:outline-none ml-1 text-xs"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Daily Care Tasks */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-[#1b1c1c]" htmlFor="task_input">
          {t("dailyCareTasks")}
        </label>
        <p className="text-xs text-[#3e4949]/70">
          {t("tasksDesc")}
        </p>
        <div className="flex gap-2">
          <input
            id="task_input"
            type="text"
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (taskInput.trim()) {
                  setTaskList((prev) => [...prev, taskInput.trim()]);
                  setTaskInput("");
                }
              }
            }}
            placeholder={t("tasksPlaceholder")}
            className="flex-1 h-12 bg-white border border-[#bdc9c8] rounded-xl px-4 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all"
          />
          <button
            type="button"
            onClick={() => {
              if (taskInput.trim()) {
                setTaskList((prev) => [...prev, taskInput.trim()]);
                setTaskInput("");
              }
            }}
            className="px-4 h-12 bg-[#1f8a8a] text-white rounded-xl text-sm font-bold hover:bg-[#0d8282] transition-all cursor-pointer"
          >
            {t("tasksAddButton")}
          </button>
        </div>
        {taskList.length > 0 && (
          <ul className="space-y-1.5 pt-1">
            {taskList.map((task, index) => (
              <li
                key={index}
                className="flex items-center justify-between p-2.5 bg-[#eae7e7]/40 border border-[#bdc9c8]/40 rounded-xl text-sm text-[#3e4949] font-medium"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#1f8a8a] text-base">task_alt</span>
                  <span>{task}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setTaskList((prev) => prev.filter((_, i) => i !== index))}
                  className="text-gray-400 hover:text-gray-600 p-1 flex items-center transition-colors"
                >
                  <span className="material-symbols-outlined text-sm font-bold">delete</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Info banner */}
      <div className="flex gap-3 p-4 bg-[#aeedd5]/20 rounded-xl border border-[#aeedd5]">
        <span className="material-symbols-outlined text-[#2c6956] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
          info
        </span>
        <p className="text-xs text-[#316d5b]">
          {t("infoBanner")}
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-4 border-t border-[#bdc9c8]/30">
        <button
          type="button"
          onClick={handleNext}
          disabled={!profilesLoading && beneficiaries.length === 0}
          className="flex items-center gap-2 px-8 h-14 rounded-xl bg-[#1f8a8a] text-white font-bold text-sm hover:bg-[#0d8282] transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t("next")}
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
