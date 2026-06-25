"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFamilyElderlyProfiles, useCreateCareRequest } from "@/lib/hooks";
import { ServiceType, WorkingDay, Beneficiary } from "@/lib/types/care-request";

const SERVICE_TYPES: { value: ServiceType; label: string; labelAr: string; icon: string }[] = [
  { value: "elderly_care", label: "Elderly Care", labelAr: "رعاية كبار السن", icon: "elderly" },
  { value: "companionship", label: "Companion Care", labelAr: "مرافقة مسن", icon: "volunteer_activism" },
  { value: "home_nursing", label: "Home Nursing", labelAr: "تمريض منزلي", icon: "medical_services" },
  { value: "physical_therapy", label: "Physical Therapy", labelAr: "علاج طبيعي", icon: "accessible" },
  { value: "child_care", label: "Child Care", labelAr: "رعاية أطفال", icon: "child_care" },
];

const WEEKDAYS: { value: WorkingDay; labelAr: string }[] = [
  { value: "Saturday", labelAr: "السبت" },
  { value: "Sunday", labelAr: "الأحد" },
  { value: "Monday", labelAr: "الإثنين" },
  { value: "Tuesday", labelAr: "الثلاثاء" },
  { value: "Wednesday", labelAr: "الأربعاء" },
  { value: "Thursday", labelAr: "الخميس" },
  { value: "Friday", labelAr: "الجمعة" },
];

export default function CreateJobPostPage() {
  const router = useRouter();
  const { data: profileData, isLoading: profilesLoading } = useFamilyElderlyProfiles();
  const { execute: createRequest, isLoading: submitting } = useCreateCareRequest();

  const beneficiaries = profileData?.beneficiaries ?? [];

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
  const [coordinates, setCoordinates] = useState<[number, number]>([46.6753, 24.7136]); // Default Riyadh

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

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
    if (!beneficiaryId) errs.beneficiaryId = "الرجاء اختيار المستفيد من الرعاية";
    if (!title.trim()) errs.title = "عنوان الطلب مطلوب";
    if (!description.trim()) errs.description = "تفاصيل الطلب مطلوبة";
    if (budgetPerHour === "" || Number(budgetPerHour) < 1) {
      errs.budgetPerHour = "السعر المقترح يجب أن يكون أكبر من 0";
    }
    if (workingDays.length === 0) errs.workingDays = "الرجاء تحديد أيام العمل";
    if (!startTime) errs.startTime = "وقت بدء العمل مطلوب";
    if (!endTime) errs.endTime = "وقت انتهاء العمل مطلوب";
    if (durationInWeeks === "" || Number(durationInWeeks) < 1) {
      errs.durationInWeeks = "المدة المطلوبة بالأسابيع يجب أن تكون أسبوع على الأقل";
    }
    if (!city.trim()) errs.city = "المدينة مطلوبة";
    if (!governorate.trim()) errs.governorate = "المحافظة مطلوبة";
    if (!readableAddress.trim()) errs.readableAddress = "العنوان بالتفصيل مطلوب";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitError(null);

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

    try {
      await createRequest(payload);
      router.push("/family/requests");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "فشلت عملية إنشاء طلب العمل.";
      setSubmitError(msg);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4" dir="rtl">
      <div className="bg-white rounded-3xl p-6 md:p-10 shadow-soft border border-[#eae7e7]">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-[#1f8a8a] mb-2">إنشاء طلب عمل جديد</h1>
          <p className="text-sm text-[#3e4949]">يرجى ملء البيانات التالية للبحث عن مقدم الرعاية المناسب لعائلتك.</p>
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
            <label className="block text-sm font-bold text-[#1b1c1c]">اختيار المستفيد من الرعاية *</label>
            {profilesLoading ? (
              <div className="h-12 bg-gray-100 animate-pulse rounded-xl" />
            ) : beneficiaries.length > 0 ? (
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
                    <span className="text-xs opacity-60">({b.age} سنة)</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-700 text-sm">
                لم يتم العثور على أفراد عائلة مسجلين. يرجى إضافة مستفيد في صفحة الملف الشخصي أولاً.
              </div>
            )}
            {errors.beneficiaryId && <p className="text-xs text-red-500">{errors.beneficiaryId}</p>}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#1b1c1c]" htmlFor="title">عنوان الطلب *</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setErrors((prev) => ({ ...prev, title: "" }));
              }}
              placeholder="مثال: ممرض منزلي لرعاية مسن يعاني من السكري"
              className="w-full h-12 bg-white border border-[#bdc9c8] rounded-xl px-4 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all"
            />
            {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
          </div>

          {/* Service Type */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#1b1c1c]">نوع الخدمة المطلوبة *</label>
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
                  <span className="text-xs font-bold">{ct.labelAr}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#1b1c1c]" htmlFor="description">تفاصيل الحالة الطبية والاحتياجات *</label>
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setErrors((prev) => ({ ...prev, description: "" }));
              }}
              placeholder="اكتب بالتفصيل متطلبات الحالة، الأدوية، القيود الغذائية..."
              className="w-full bg-white border border-[#bdc9c8] rounded-xl p-4 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all resize-none"
            />
            {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Budget Per Hour */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1b1c1c]" htmlFor="budget">الميزانية المقترحة لكل ساعة (ريال سعودي) *</label>
              <input
                id="budget"
                type="number"
                min={1}
                value={budgetPerHour}
                onChange={(e) => {
                  setBudgetPerHour(e.target.value === "" ? "" : Number(e.target.value));
                  setErrors((prev) => ({ ...prev, budgetPerHour: "" }));
                }}
                placeholder="مثال: 60"
                className="w-full h-12 bg-white border border-[#bdc9c8] rounded-xl px-4 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all"
              />
              {errors.budgetPerHour && <p className="text-xs text-red-500">{errors.budgetPerHour}</p>}
            </div>

            {/* Preferred Gender */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1b1c1c]">الجنس المفضل لمقدم الخدمة</label>
              <select
                value={preferredGender}
                onChange={(e) => setPreferredGender(e.target.value as any)}
                className="w-full h-12 bg-white border border-[#bdc9c8] rounded-xl px-4 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all"
              >
                <option value="any gender">لا يهم (أي جنس)</option>
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </div>
          </div>

          {/* Required Skills Tags */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#1b1c1c]" htmlFor="skill_input">المهارات والشهادات المطلوبة</label>
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
                placeholder="مثال: قياس الضغط، شهادة CPR، رعاية مرضى السكري"
                className="flex-1 h-12 bg-white border border-[#bdc9c8] rounded-xl px-4 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 h-12 bg-[#1f8a8a] text-white rounded-xl text-sm font-bold hover:bg-[#0d8282] transition-all"
              >
                إضافة
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
                      className="hover:text-red-500 transition-colors focus:outline-none mr-1"
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
            <label className="block text-sm font-bold text-[#1b1c1c]" htmlFor="task_input">قائمة المهام اليومية المطلوبة من المرافق</label>
            <p className="text-xs text-[#3e4949]/70">أضف قائمة بالمهام المحددة ليقوم المرافق بالتشيك عليها يومياً (مثل: إعطاء الدواء في الساعة 2، فحص السكري، مساعدة في الغداء).</p>
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
                placeholder="أدخل مهمة جديدة..."
                className="flex-1 h-12 bg-white border border-[#bdc9c8] rounded-xl px-4 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all"
              />
              <button
                type="button"
                onClick={handleAddTask}
                className="px-4 h-12 bg-[#1f8a8a] text-white rounded-xl text-sm font-bold hover:bg-[#0d8282] transition-all"
              >
                إضافة
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
                      className="text-red-500 hover:text-red-700 p-1 flex items-center"
                    >
                      <span className="material-symbols-outlined text-sm font-bold">delete</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-[#bdc9c8]/30 pt-6">
            <h3 className="text-lg font-bold text-[#1f8a8a] mb-4">تفاصيل جدول العمل والزيارات</h3>
            
            {/* Weekdays */}
            <div className="space-y-2 mb-4">
              <label className="block text-sm font-bold text-[#1b1c1c]">أيام العمل المطلوبة في الأسبوع *</label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((day) => {
                  const isSelected = workingDays.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => {
                        toggleDay(day.value);
                        setErrors((prev) => ({ ...prev, workingDays: "" }));
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                        isSelected
                          ? "border-[#1f8a8a] bg-[#1f8a8a]/5 text-[#1f8a8a]"
                          : "border-[#bdc9c8]/60 text-[#3e4949] hover:border-[#1f8a8a]/40"
                      }`}
                    >
                      {day.labelAr}
                    </button>
                  );
                })}
              </div>
              {errors.workingDays && <p className="text-xs text-red-500">{errors.workingDays}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Start Time */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-[#1b1c1c]" htmlFor="start_time">وقت البدء *</label>
                <input
                  id="start_time"
                  type="time"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    setErrors((prev) => ({ ...prev, startTime: "" }));
                  }}
                  className="w-full h-12 bg-white border border-[#bdc9c8] rounded-xl px-4 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all text-right"
                />
                {errors.startTime && <p className="text-xs text-red-500">{errors.startTime}</p>}
              </div>

              {/* End Time */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-[#1b1c1c]" htmlFor="end_time">وقت الانتهاء *</label>
                <input
                  id="end_time"
                  type="time"
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    setErrors((prev) => ({ ...prev, endTime: "" }));
                  }}
                  className="w-full h-12 bg-white border border-[#bdc9c8] rounded-xl px-4 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all text-right"
                />
                {errors.endTime && <p className="text-xs text-red-500">{errors.endTime}</p>}
              </div>

              {/* Duration Weeks */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-[#1b1c1c]" htmlFor="duration">المدة (بالأسابيع) *</label>
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
            <h3 className="text-lg font-bold text-[#1f8a8a] mb-4">الموقع الجغرافي للخدمة</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              {/* City */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-[#1b1c1c]" htmlFor="city">المدينة *</label>
                <input
                  id="city"
                  type="text"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setErrors((prev) => ({ ...prev, city: "" }));
                  }}
                  placeholder="مثال: الرياض"
                  className="w-full h-12 bg-white border border-[#bdc9c8] rounded-xl px-4 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all"
                />
                {errors.city && <p className="text-xs text-red-500">{errors.city}</p>}
              </div>

              {/* Governorate */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-[#1b1c1c]" htmlFor="gov">المحافظة / المنطقة *</label>
                <input
                  id="gov"
                  type="text"
                  value={governorate}
                  onChange={(e) => {
                    setGovernorate(e.target.value);
                    setErrors((prev) => ({ ...prev, governorate: "" }));
                  }}
                  placeholder="مثال: منطقة الرياض"
                  className="w-full h-12 bg-white border border-[#bdc9c8] rounded-xl px-4 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all"
                />
                {errors.governorate && <p className="text-xs text-red-500">{errors.governorate}</p>}
              </div>
            </div>

            {/* Readable Address */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1b1c1c]" htmlFor="address">العنوان بالتفصيل *</label>
              <input
                id="address"
                type="text"
                value={readableAddress}
                onChange={(e) => {
                  setReadableAddress(e.target.value);
                  setErrors((prev) => ({ ...prev, readableAddress: "" }));
                }}
                placeholder="مثال: حي الياسمين، شارع الملقا، عمارة 14 شقة 5"
                className="w-full h-12 bg-white border border-[#bdc9c8] rounded-xl px-4 text-sm focus:ring-2 focus:ring-[#1f8a8a]/20 focus:border-[#1f8a8a] outline-none transition-all"
              />
              {errors.readableAddress && <p className="text-xs text-red-500">{errors.readableAddress}</p>}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-[#bdc9c8]/30">
            <button
              type="button"
              onClick={() => router.push("/family/requests")}
              className="px-6 h-12 rounded-xl border border-[#bdc9c8] text-[#3e4949] font-bold text-sm hover:bg-[#eae7e7]/30 transition-all"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 px-8 h-12 rounded-xl bg-[#1f8a8a] text-white font-bold text-sm hover:bg-[#0d8282] transition-all disabled:opacity-50"
            >
              {submitting ? "جاري الحفظ..." : "نشر طلب العمل"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
