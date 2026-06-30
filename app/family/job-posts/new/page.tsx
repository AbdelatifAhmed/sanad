"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CareRequestFormData } from "@/lib/types/care-request";
import { useCreateCareRequest } from "@/lib/hooks";
import { useAuthStore } from "@/store/authStore";
import WizardStepper from "./WizardStepper";
import StepCareDetails from "./StepCareDetails";
import StepScheduling from "./StepScheduling";
import StepLocation from "./StepLocation";
import SuccessScreen from "./SuccessScreen";
import { useTranslations } from "next-intl";

const INITIAL_FORM: CareRequestFormData = {
  title: "",
  beneficiaryId: "",
  serviceType: "elderly_care",
  description: "",
  budgetPerHour: "",
  taskList: [],
  preferredGender: "any gender",
  requiredSkills: [],
  scheduleData: {
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    startTime: "08:00",
    endTime: "16:00",
    durationInWeeks: 4,
  },
  locationData: {
    city: "",
    governorate: "",
    readableAddress: "",
    notes: "",
    coordinates: [46.6753, 24.7136], // Default coordinates to Riyadh [longitude, latitude]
  },
};

export default function NewCareRequestPage() {
  const t = useTranslations("jobPostForm");
  const { execute: createRequest, isLoading: submitting } = useCreateCareRequest();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState<CareRequestFormData>(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const hero = {
    title: t(`hero${step}Title`),
    subtitle: t(`hero${step}Subtitle`),
    badge: t(`hero${step}Badge`),
    badgeIcon: step === 1 ? "verified" : step === 2 ? "calendar_today" : "location_on",
  };

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  /* ---------- Step handlers ---------- */
  const handleStep1Next = (
    data: Pick<CareRequestFormData, "title" | "beneficiaryId" | "serviceType" | "description" | "budgetPerHour" | "taskList" | "preferredGender" | "requiredSkills">
  ) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep(2);
    scrollTop();
  };

  const handleStep2Next = (data: Pick<CareRequestFormData, "scheduleData">) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep(3);
    scrollTop();
  };

  const handleStep3Submit = async (data: Pick<CareRequestFormData, "locationData">) => {
    const final = { ...formData, ...data };
    setFormData(final);
    setSubmitError(null);

    // Build the exact payload the backend expects
    const payload = {
      // Required by backend
      title: final.title || t("defaultTitle"),
      description: final.description,
      serviceType: final.serviceType,
      budgetPerHour: Number(final.budgetPerHour),
      beneficiaryId: final.beneficiaryId || undefined,
      requiredSkills: final.requiredSkills || [],
      taskList: final.taskList || [],
      preferredGender: final.preferredGender || "any gender",
      // Schedule
      schedule: {
        workingDays: final.scheduleData.workingDays,
        startTime: final.scheduleData.startTime,
        endTime: final.scheduleData.endTime,
        durationInWeeks: Number(final.scheduleData.durationInWeeks),
      },
      // Location — coordinates mapped dynamically from map interaction
      location: {
        coordinates: final.locationData.coordinates || [46.6753, 24.7136],
        readableAddress: final.locationData.readableAddress,
        city: final.locationData.city,
        governorate: final.locationData.governorate,
      },
    };

    try {
      await createRequest(payload);
      setSubmitted(true);
      scrollTop();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to submit. Please try again.";
      setSubmitError(msg);
    }
  };

  const handlePostAnother = () => {
    setFormData(INITIAL_FORM);
    setSubmitted(false);
    setStep(1);
    scrollTop();
  };

  /* ---------- Success ---------- */
  if (submitted) {
    return (
      <div className="max-w-6xl w-full mx-auto py-8 relative">
        <SuccessScreen onPostAnother={handlePostAnother} />
      </div>
    );
  }

  /* ---------- Wizard ---------- */
  return (
    <div className="max-w-6xl w-full mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column: hero + stepper */}
        <div className="lg:col-span-4">
          <div className="sticky top-6 space-y-5">
            <h2 className="text-xl font-bold text-[#1b1c1c]">{hero.title}</h2>
            <p className="text-sm text-[#3e4949]">{hero.subtitle}</p>

            {/* Hero card */}
            <div className="relative rounded-2xl overflow-hidden h-44 shadow-soft">
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(135deg, #006767, #1f8a8a, #aeedd5)", opacity: 0.85 }}
              />
              <div className="absolute inset-0 flex items-end p-5">
                <span className="text-white text-sm font-semibold flex items-center gap-1.5">
                  <span className="material-symbols-outlined" style={{ fontSize: "18px", fontVariationSettings: "'FILL' 1" }}>
                    {hero.badgeIcon}
                  </span>
                  {hero.badge}
                </span>
              </div>
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
              <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/10" />
            </div>

            <WizardStepper currentStep={step} />
          </div>
        </div>

        {/* Right column: form card */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-3xl p-6 md:p-10 shadow-soft border border-[#eae7e7]">
            {submitError && (
              <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                <span className="material-symbols-outlined shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                  error
                </span>
                <p className="text-sm font-medium">{submitError}</p>
              </div>
            )}

            {step === 1 && (
              <StepCareDetails
                defaultValues={{
                  title: formData.title,
                  beneficiaryId: formData.beneficiaryId,
                  serviceType: formData.serviceType,
                  description: formData.description,
                  budgetPerHour: formData.budgetPerHour,
                  taskList: formData.taskList || [],
                  preferredGender: formData.preferredGender || "any gender",
                  requiredSkills: formData.requiredSkills || [],
                }}
                onNext={handleStep1Next}
              />
            )}

            {step === 2 && (
              <StepScheduling
                defaultValues={{ scheduleData: formData.scheduleData }}
                onNext={handleStep2Next}
                onBack={() => setStep(1)}
              />
            )}

            {step === 3 && (
              <StepLocation
                defaultValues={{ locationData: formData.locationData }}
                onSubmit={handleStep3Submit}
                onBack={() => setStep(2)}
                isSubmitting={submitting}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
