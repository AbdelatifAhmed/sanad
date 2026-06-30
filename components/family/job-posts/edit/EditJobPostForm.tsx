"use client";

import React, { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ServiceType, WorkingDay, Beneficiary } from "@/lib/types/care-request";

interface EditJobPostFormProps {
  jobData: any;
  beneficiaries: Beneficiary[];
  submitting: boolean;
  submitError: string | null;
  onSubmit: (payload: any) => Promise<void>;
  onCancel: () => void;
}

const SERVICE_TYPES: { value: ServiceType; labelKey: "elderlyCare" | "companionCare" | "homeNursing" | "physicalTherapy" | "childCare"; icon: string }[] = [
  { value: "elderly_care", labelKey: "elderlyCare", icon: "elderly" },
  { value: "companionship", labelKey: "companionCare", icon: "volunteer_activism" },
  { value: "home_nursing", labelKey: "homeNursing", icon: "medical_services" },
  { value: "physical_therapy", labelKey: "physicalTherapy", icon: "accessible" },
  { value: "child_care", labelKey: "childCare", icon: "child_care" },
];

const WEEKDAYS: WorkingDay[] = [
  "Saturday",
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

export default function EditJobPostForm({
  jobData,
  beneficiaries,
  submitting,
  submitError,
  onSubmit,
  onCancel,
}: EditJobPostFormProps) {
  const t = useTranslations("jobPostForm");
  const tBooking = useTranslations("bookingForm");
  const locale = useLocale();
  const isRtl = locale === "ar";

  // Form states
  const [beneficiaryId, setBeneficiaryId] = useState("");
  const [title, setTitle] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType>("elderly_care");
  const [description, setDescription] = useState("");
  const [budgetPerHour, setBudgetPerHour] = useState<number | "">("");
  const [preferredGender, setPreferredGender] = useState<"any gender" | "male" | "female">("any gender");
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [taskList, setTaskList] = useState<string[]>([]);
  const [taskInput, setTaskInput] = useState("");

  // Schedule states
  const [workingDays, setWorkingDays] = useState<WorkingDay[]>([]);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("16:00");
  const [durationInWeeks, setDurationInWeeks] = useState<number | "">(4);

  // Location states
  const [city, setCity] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [readableAddress, setReadableAddress] = useState("");
  const [coordinates, setCoordinates] = useState<[number, number]>([46.6753, 24.7136]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Prefill states when jobData loads
  useEffect(() => {
    if (jobData) {
      setBeneficiaryId(jobData.beneficiaryId || "");
      setTitle(jobData.title || "");
      setServiceType(jobData.serviceType || "elderly_care");
      setDescription(jobData.description || "");
      setBudgetPerHour(jobData.budgetPerHour || "");
      setPreferredGender(jobData.preferredGender || "any gender");
      setRequiredSkills(jobData.requiredSkills || []);
      setTaskList(jobData.taskList || []);

      if (jobData.schedule) {
        setWorkingDays(jobData.schedule.workingDays || []);
        setStartTime(jobData.schedule.startTime || "08:00");
        setEndTime(jobData.schedule.endTime || "16:00");
        setDurationInWeeks(jobData.schedule.durationInWeeks || 4);
      }

      if (jobData.location) {
        setCity(jobData.location.city || "");
        setGovernorate(jobData.location.governorate || "");
        setReadableAddress(jobData.location.readableAddress || "");
        if (jobData.location.geo?.coordinates) {
          setCoordinates(jobData.location.geo.coordinates as [number, number]);
        }
      }
    }
  }, [jobData]);

  const toggleDay = (day: WorkingDay) => {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !requiredSkills.includes(skillInput.trim())) {
      setRequiredSkills((prev) => [...prev, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const handleAddTask = () => {
    if (taskInput.trim()) {
      setTaskList((prev) => [...prev, taskInput.trim()]);
      setTaskInput("");
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!beneficiaryId) errs.beneficiaryId = t("beneficiaryRequired");
    if (!title.trim()) errs.title = t("titleRequired");
    if (!description.trim()) errs.description = t("descriptionRequired");
    if (budgetPerHour === "" || Number(budgetPerHour) < 1) {
      errs.budgetPerHour = t("budgetRequired");
    }
    if (workingDays.length === 0) errs.workingDays = tBooking("validation.workingDaysRequired");
    if (!startTime) errs.startTime = tBooking("validation.startRequired");
    if (!endTime) errs.endTime = tBooking("validation.endRequired");
    if (durationInWeeks === "" || Number(durationInWeeks) < 1) {
      errs.durationInWeeks = tBooking("validation.durationRequired");
    }
    if (!city.trim()) errs.city = tBooking("validation.cityRequired");
    if (!governorate.trim()) errs.governorate = tBooking("validation.governorateRequired");
    if (!readableAddress.trim()) errs.readableAddress = tBooking("validation.addressRequired");
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const payload = {
      title,
      description,
      serviceType,
      budgetPerHour: Number(budgetPerHour),
      beneficiaryId,
      requiredSkills,
      taskList,
      preferredGender,
      schedule: {
        workingDays,
        startTime,
        endTime,
        durationInWeeks: Number(durationInWeeks),
      },
      location: {
        coordinates,
        readableAddress,
        city,
        governorate,
      },
    };

    onSubmit(payload);
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-10 shadow-soft border border-[#eae7e7]">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-[#1f8a8a] mb-2">{t("editTitle")}</h1>
        <p className="text-sm text-[#3e4949]">{t("editSubtitle")}</p>
      </div>

      {submitError && (
        <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <span className="material-symbols-outlined shrink-0">error</span>
          <p className="text-sm font-medium">{submitError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Recipient Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-bold text-[#1b1c1c]">{t("recipientInfo")} *</label>
          {beneficiaries.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {beneficiaries.map((b: Beneficiary) => (
                <button
                  key={b._id}
                  type="button"
                  onClick={() => {
                    setBeneficiaryId(b._id);
                    setErrors((prev) => ({ ...prev, beneficiaryId: "" }));
                  }}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                    beneficiaryId === b._id
                      ? "border-[#1f8a8a] bg-[#1f8a8a]/5 text-[#1f8a8a]"
                      : "border-[#bdc9c8]/60 text-[#3e4949] hover:border-[#1f8a8a]/40"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {b.category === "elderly" ? "elderly" : "accessibility_new"}
                  </span>
                  <span>{b.name}</span>
                  <span className="text-xs opacity-60">({b.age} {tBooking("years")})</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-700 text-sm">
              {t("noBeneficiaries")}
            </div>
          )}
          {errors.beneficiaryId && <p className="text-xs text-red-500">{errors.beneficiaryId}</p>}
        </div>

        {/* Title */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-[#1b1c1c]" htmlFor="title">{t("requestTitle")} *</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setErrors((prev) => ({ ...prev, title: "" }));
            }}
            placeholder={t("titlePlaceholder")}
            className="w-full h-12 bg-white border border-[#bdc9c8] rounded-xl px-4 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all"
          />
          {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
        </div>

        {/* Service Type */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-[#1b1c1c]">{t("careType")} *</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {SERVICE_TYPES.map((ct) => (
              <button
                key={ct.value}
                type="button"
                onClick={() => setServiceType(ct.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all duration-200 ${
                  serviceType === ct.value
                    ? "border-[#1f8a8a] bg-[#1f8a8a]/5 text-[#1f8a8a]"
                    : "border-[#bdc9c8]/60 text-[#3e4949] hover:border-[#1f8a8a]/40"
                }`}
              >
                <span className="material-symbols-outlined text-2xl">{ct.icon}</span>
                <span className="text-xs font-bold">{tBooking(ct.labelKey)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-[#1b1c1c]" htmlFor="description">{t("descriptionNeeds")} *</label>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setErrors((prev) => ({ ...prev, description: "" }));
            }}
            placeholder={t("descriptionPlaceholder")}
            className="w-full bg-white border border-[#bdc9c8] rounded-xl p-4 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all resize-none"
          />
          {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Budget Per Hour */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#1b1c1c]" htmlFor="budget">
              {t("budgetPerHour")} ({isRtl ? "ج.م" : "EGP"}) *
            </label>
            <input
              id="budget"
              type="number"
              min={1}
              value={budgetPerHour}
              onChange={(e) => {
                setBudgetPerHour(e.target.value === "" ? "" : Number(e.target.value));
                setErrors((prev) => ({ ...prev, budgetPerHour: "" }));
              }}
              placeholder={t("budgetPlaceholder")}
              className="w-full h-12 bg-white border border-[#bdc9c8] rounded-xl px-4 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all"
            />
            {errors.budgetPerHour && <p className="text-xs text-red-500">{errors.budgetPerHour}</p>}
          </div>

          {/* Preferred Gender */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#1b1c1c]">{t("preferredGender")}</label>
            <select
              value={preferredGender}
              onChange={(e) => setPreferredGender(e.target.value as any)}
              className="w-full h-12 bg-white border border-[#bdc9c8] rounded-xl px-4 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all"
            >
              <option value="any gender">{t("anyGender")}</option>
              <option value="male">{t("male")}</option>
              <option value="female">{t("female")}</option>
            </select>
          </div>
        </div>

        {/* Required Skills Tags */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-[#1b1c1c]" htmlFor="skill_input">{t("requiredSkills")}</label>
          <div className="flex gap-2">
            <input
              id="skill_input"
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
              placeholder={t("skillsPlaceholder")}
              className="flex-1 h-12 bg-white border border-[#bdc9c8] rounded-xl px-4 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="px-4 h-12 bg-[#1f8a8a] text-white rounded-xl text-sm font-bold hover:bg-[#0d8282] transition-all cursor-pointer"
            >
              {t("skillsAddButton")}
            </button>
          </div>
          {requiredSkills.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {requiredSkills.map((skill, index) => (
                <span
                  key={index}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#1f8a8a]/10 text-[#1f8a8a] text-xs font-bold border border-[#1f8a8a]/20 animate-fade-in"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => setRequiredSkills((prev) => prev.filter((_, i) => i !== index))}
                    className="hover:text-red-500 transition-colors focus:outline-none ml-1 cursor-pointer"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Task List Checklist */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-[#1b1c1c]" htmlFor="task_input">{t("dailyCareTasks")}</label>
          <p className="text-xs text-[#3e4949]/70">{t("tasksDesc")}</p>
          <div className="flex gap-2">
            <input
              id="task_input"
              type="text"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTask();
                }
              }}
              placeholder={t("tasksPlaceholder")}
              className="flex-1 h-12 bg-white border border-[#bdc9c8] rounded-xl px-4 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all"
            />
            <button
              type="button"
              onClick={handleAddTask}
              className="px-4 h-12 bg-[#1f8a8a] text-white rounded-xl text-sm font-bold hover:bg-[#0d8282] transition-all cursor-pointer"
            >
              {t("tasksAddButton")}
            </button>
          </div>
          {taskList.length > 0 && (
            <ul className="space-y-2 pt-1">
              {taskList.map((task, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between p-3 bg-[#eae7e7]/40 border border-[#bdc9c8]/40 rounded-xl text-sm text-[#3e4949] font-medium"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#1f8a8a] text-base">task_alt</span>
                    <span>{task}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTaskList((prev) => prev.filter((_, i) => i !== index))}
                    className="text-red-500 hover:text-red-700 p-1 flex items-center cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm font-bold">delete</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-[#bdc9c8]/30 pt-6">
          <h3 className="text-lg font-bold text-[#1f8a8a] mb-4">{t("workingHours")}</h3>
          
          {/* Weekdays */}
          <div className="space-y-2 mb-4">
            <label className="block text-sm font-bold text-[#1b1c1c]">{t("workingDays")} *</label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((day) => {
                const isSelected = workingDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      toggleDay(day);
                      setErrors((prev) => ({ ...prev, workingDays: "" }));
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#1f8a8a] bg-[#1f8a8a]/5 text-[#1f8a8a]"
                        : "border-[#bdc9c8]/60 text-[#3e4949] hover:border-[#1f8a8a]/40"
                    }`}
                  >
                    {tBooking(`schedule.dayNames.${day}` as any)}
                  </button>
                );
              })}
            </div>
            {errors.workingDays && <p className="text-xs text-red-500">{errors.workingDays}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Start Time */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1b1c1c]" htmlFor="start_time">{t("startTime")} *</label>
              <input
                id="start_time"
                type="time"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  setErrors((prev) => ({ ...prev, startTime: "" }));
                }}
                className="w-full h-12 bg-white border border-[#bdc9c8] rounded-xl px-4 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all text-center"
              />
              {errors.startTime && <p className="text-xs text-red-500">{errors.startTime}</p>}
            </div>

            {/* End Time */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1b1c1c]" htmlFor="end_time">{t("endTime")} *</label>
              <input
                id="end_time"
                type="time"
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  setErrors((prev) => ({ ...prev, endTime: "" }));
                }}
                className="w-full h-12 bg-white border border-[#bdc9c8] rounded-xl px-4 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all text-center"
              />
              {errors.endTime && <p className="text-xs text-red-500">{errors.endTime}</p>}
            </div>

            {/* Duration Weeks */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1b1c1c]" htmlFor="duration">{t("duration")} ({t("weeks")}) *</label>
              <input
                id="duration"
                type="number"
                min={1}
                value={durationInWeeks}
                onChange={(e) => {
                  setDurationInWeeks(e.target.value === "" ? "" : Number(e.target.value));
                  setErrors((prev) => ({ ...prev, durationInWeeks: "" }));
                }}
                className="w-full h-12 bg-white border border-[#bdc9c8] rounded-xl px-4 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all"
              />
              {errors.durationInWeeks && <p className="text-xs text-red-500">{errors.durationInWeeks}</p>}
            </div>
          </div>
        </div>

        <div className="border-t border-[#bdc9c8]/30 pt-6">
          <h3 className="text-lg font-bold text-[#1f8a8a] mb-4">{t("whereCare")}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            {/* City */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1b1c1c]" htmlFor="city">{t("city")} *</label>
              <input
                id="city"
                type="text"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setErrors((prev) => ({ ...prev, city: "" }));
                }}
                placeholder={t("selectCity")}
                className="w-full h-12 bg-white border border-[#bdc9c8] rounded-xl px-4 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all"
              />
              {errors.city && <p className="text-xs text-red-500">{errors.city}</p>}
            </div>

            {/* Governorate */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1b1c1c]" htmlFor="gov">{t("regionGov")} *</label>
              <input
                id="gov"
                type="text"
                value={governorate}
                onChange={(e) => {
                  setGovernorate(e.target.value);
                  setErrors((prev) => ({ ...prev, governorate: "" }));
                }}
                placeholder={t("selectRegion")}
                className="w-full h-12 bg-white border border-[#bdc9c8] rounded-xl px-4 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all"
              />
              {errors.governorate && <p className="text-xs text-red-500">{errors.governorate}</p>}
            </div>
          </div>

          {/* Readable Address */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#1b1c1c]" htmlFor="address">{t("streetAddress")} *</label>
            <input
              id="address"
              type="text"
              value={readableAddress}
              onChange={(e) => {
                setReadableAddress(e.target.value);
                setErrors((prev) => ({ ...prev, readableAddress: "" }));
              }}
              placeholder={t("streetAddressPlaceholder")}
              className="w-full h-12 bg-white border border-[#bdc9c8] rounded-xl px-4 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all"
            />
            {errors.readableAddress && <p className="text-xs text-red-500">{errors.readableAddress}</p>}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-[#bdc9c8]/30">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 h-12 rounded-xl border border-[#bdc9c8] text-[#3e4949] font-bold text-sm hover:bg-[#eae7e7]/30 transition-all cursor-pointer"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-2 px-8 h-12 rounded-xl bg-[#1f8a8a] text-white font-bold text-sm hover:bg-[#0d8282] transition-all disabled:opacity-50 cursor-pointer"
          >
            {submitting ? t("saving") : t("save")}
          </button>
        </div>
      </form>
    </div>
  );
}
