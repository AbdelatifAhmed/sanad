"use client";

import { useTranslations } from "next-intl";

interface WizardStepperProps {
  currentStep: 1 | 2 | 3;
}

export default function WizardStepper({ currentStep }: WizardStepperProps) {
  const t = useTranslations("jobPostForm");

  const steps = [
    { number: 1, labelKey: "stepDetails" },
    { number: 2, labelKey: "stepScheduling" },
    { number: 3, labelKey: "stepLocation" },
  ];

  return (
    <nav className="space-y-1 bg-[#f6f3f2] p-6 rounded-2xl border border-[#bdc9c8]/30">
      {steps.map((step) => {
        const isCompleted = step.number < currentStep;
        const isActive = step.number === currentStep;

        return (
          <div
            key={step.number}
            className={`flex items-center gap-3 py-2 px-3 rounded-xl transition-all duration-200 ${
              isActive ? "bg-[#1f8a8a]/10" : ""
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                isCompleted
                  ? "bg-[#1f8a8a]/20 text-[#1f8a8a]"
                  : isActive
                  ? "bg-[#1f8a8a] text-white shadow-md shadow-[#1f8a8a]/30"
                  : "bg-[#bdc9c8]/50 text-[#3e4949]/60"
              }`}
            >
              {isCompleted ? (
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                  check
                </span>
              ) : (
                step.number
              )}
            </div>
            <span
              className={`text-sm font-medium transition-colors ${
                isActive
                  ? "text-[#1f8a8a] font-bold"
                  : isCompleted
                  ? "text-[#3e4949]/70"
                  : "text-[#3e4949]/50"
              }`}
            >
              {t(step.labelKey as any)}
            </span>
            {isActive && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#1f8a8a]" />
            )}
          </div>
        );
      })}
    </nav>
  );
}
