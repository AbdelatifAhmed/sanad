"use client";

import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { useRegisterStore } from "@/store/registerStore";
import { useTranslations, useLocale } from "next-intl";
import { useGoogleLogin } from "@react-oauth/google";

const basicInfoSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب بالكامل"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z
    .string()
    .min(8, "كلمة المرور يجب أن لا تقل عن 8 أحرف / Password must be at least 8 characters")
    .regex(/[a-z]/, "يجب أن تحتوي كلمة المرور على حرف صغير واحد على الأقل / Must contain at least one lowercase letter")
    .regex(/[A-Z]/, "يجب أن تحتوي كلمة المرور على حرف كبير واحد على الأقل / Must contain at least one uppercase letter")
    .regex(/[0-9]/, "يجب أن تحتوي كلمة المرور على رقم واحد على الأقل / Must contain at least one number")
    .regex(/[^a-zA-Z0-9]/, "يجب أن تحتوي كلمة المرور على رمز خاص واحد على الأقل / Must contain at least one special character"),
  phone: z.string().regex(/^01[0125][0-9]{8}$/, "رقم الهاتف المصري غير صالح (يجب أن يبدأ بـ 010 أو 011 أو 012 أو 015 ومكون من 11 رقم)"),
});

type BasicInfoData = z.infer<typeof basicInfoSchema>;

export default function BasicInfoStep() {
  const t = useTranslations("validation");
  const locale = useLocale();
  const isAr = locale === "ar";
  const { name, email, password, phone, updateBasicInfo, nextStep, prevStep } = useRegisterStore();
  const [showPassword, setShowPassword] = React.useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");

  const basicInfoSchema = useMemo(() => z.object({
    name: z.string().min(1, t("nameRequired")),
    email: z.string().email(t("emailInvalid")),
    password: z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, t("passwordMin")),
    phone: z.string().regex(/^01[0125][0-9]{8}$/, t("phoneInvalid")),
  }), [t]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    clearErrors,
    setFocus,
    formState: { errors },
  } = useForm<BasicInfoData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: { name, email, password, phone },
  });

  const passwordValue = watch("password") || "";

  // Password requirements checklist calculation
  const hasMinLength = passwordValue.length >= 8;
  const hasLowercase = /[a-z]/.test(passwordValue);
  const hasUppercase = /[A-Z]/.test(passwordValue);
  const hasNumber = /[0-9]/.test(passwordValue);
  const hasSymbol = /[^a-zA-Z0-9]/.test(passwordValue);

  const strengthScore = [
    hasMinLength,
    hasLowercase,
    hasUppercase,
    hasNumber,
    hasSymbol
  ].filter(Boolean).length;

  const handleGoogleProfile = async (accessToken: string) => {
    const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Unable to fetch Google profile.");
    }

    return response.json();
  };

  const applyGoogleProfile = async (accessToken: string) => {
    setGoogleLoading(true);
    setGoogleError("");

    try {
      const profile = await handleGoogleProfile(accessToken);
      const resolvedName = profile?.name || profile?.given_name || profile?.email?.split("@")?.[0] || "";
      const resolvedEmail = profile?.email || "";

      if (!resolvedName || !resolvedEmail) {
        throw new Error("Google account did not return a usable name or email.");
      }

      updateBasicInfo({ name: resolvedName, email: resolvedEmail });
      setValue("name", resolvedName, { shouldDirty: true, shouldValidate: true });
      setValue("email", resolvedEmail, { shouldDirty: true, shouldValidate: true });
      clearErrors(["name", "email"]);
      setFocus("phone");
    } catch (error: unknown) {
      setGoogleError(error instanceof Error ? error.message : "Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    scope: "profile email",
    onSuccess: async (tokenResponse) => {
      await applyGoogleProfile(tokenResponse.access_token);
    },
    onError: () => {
      setGoogleError("Google sign-in failed. Please try again.");
    },
  });

  const onSubmit = (data: BasicInfoData) => {
    updateBasicInfo(data);
    nextStep();
  };

  const labels = {
    name: isAr ? "الاسم الكامل" : "Full Name",
    namePlaceholder: isAr ? "مثال: فاطمة الزهراء" : "e.g. Fatima Al-Zahra",
    email: isAr ? "البريد الإلكتروني" : "Email Address",
    phone: isAr ? "رقم الهاتف" : "Phone Number",
    password: isAr ? "كلمة المرور" : "Password",
    back: isAr ? "رجوع" : "Back",
    next: isAr ? "الخطوة التالية" : "Next Step",
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" dir={isAr ? "rtl" : "ltr"}>
      <div className="space-y-3 rounded-2xl border border-dashed border-outline-variant bg-sand-low/40 p-4">
        <div className={`flex items-center justify-between gap-3 ${isAr ? "flex-row-reverse" : ""}`}>
          <div className={`space-y-1 ${isAr ? "text-right" : "text-left"}`}>
            <p className="text-sm font-bold text-gray-800">
              {isAr ? "التعبئة التلقائية من Google" : "Fill details with Google"}
            </p>
            <p className="text-xs text-gray-500 font-medium">
              {isAr
                ? "سنملأ الاسم والبريد الإلكتروني تلقائيًا، وباقي البيانات تكتبها يدويًا."
                : "We will fill your name and email automatically, and you complete the rest manually."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleGoogleLogin()}
            disabled={googleLoading}
            className="flex items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-sand-low disabled:cursor-not-allowed disabled:opacity-60"
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
            ) : (
              <svg className="h-4.5 w-4.5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
              </svg>
            )}
            {isAr ? "استكمال عبر Google" : "Continue with Google"}
          </button>
        </div>
        {googleError && <p className={`text-xs font-semibold text-red-500 ${isAr ? "text-right" : "text-left"}`}>{googleError}</p>}
      </div>

      <div className="space-y-3">
        {/* Name */}
        <div className="space-y-1">
          <label className={`block text-xs font-bold text-gray-700 ${isAr ? "text-right" : "text-left"}`}>{labels.name}</label>
          <div className="relative">
            <User className={`absolute ${isAr ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5`} />
            <input
              {...register("name")}
              type="text"
              className={`w-full py-2.5 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-gray-400 text-sm ${isAr ? "pr-12 pl-4 text-right" : "pl-12 pr-4 text-left"}`}
              placeholder={labels.namePlaceholder}
            />
          </div>
          {errors.name && <p className={`text-red-500 text-[11px] font-semibold ${isAr ? "text-right" : "text-left"}`}>{errors.name.message}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label className={`block text-xs font-bold text-gray-700 ${isAr ? "text-right" : "text-left"}`}>{labels.email}</label>
          <div className="relative">
            <Mail className={`absolute ${isAr ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5`} />
            <input
              {...register("email")}
              type="email"
              className={`w-full py-2.5 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-gray-400 text-sm ${isAr ? "pr-12 pl-4 text-right" : "pl-12 pr-4 text-left"}`}
              placeholder="name@example.com"
            />
          </div>
          {errors.email && <p className={`text-red-500 text-[11px] font-semibold ${isAr ? "text-right" : "text-left"}`}>{errors.email.message}</p>}
        </div>

        {/* Phone */}
        <div className="space-y-1">
          <label className={`block text-xs font-bold text-gray-700 ${isAr ? "text-right" : "text-left"}`}>{labels.phone}</label>
          <div className="relative">
            <Phone className={`absolute ${isAr ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5`} />
            <input
              {...register("phone")}
              type="tel"
              className={`w-full py-2.5 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-gray-400 text-sm ${isAr ? "pr-12 pl-4 text-right" : "pl-12 pr-4 text-left"}`}
              placeholder="01XXXXXXXXX"
            />
          </div>
          {errors.phone && <p className={`text-red-500 text-[11px] font-semibold ${isAr ? "text-right" : "text-left"}`}>{errors.phone.message}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label className={`block text-xs font-bold text-gray-700 ${isAr ? "text-right" : "text-left"}`}>{labels.password}</label>
          <div className="relative">
            <Lock className={`absolute ${isAr ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5`} />
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              className={`w-full py-2.5 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-gray-400 text-sm ${isAr ? "pr-12 pl-12 text-right" : "pl-12 pr-12 text-left"}`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute ${isAr ? "left-4" : "right-4"} top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary cursor-pointer`}
            >
              {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs font-semibold mt-1">{errors.password.message}</p>}

          {/* Password Strength Indicator & Requirements */}
          {passwordValue.length > 0 && (
            <div className="mt-2.5 space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-200/50 text-left">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-gray-500">Password Strength:</span>
                <span className={`font-bold ${
                  strengthScore <= 2 ? "text-red-500" :
                  strengthScore <= 4 ? "text-amber-500" : "text-emerald-500"
                }`}>
                  {strengthScore <= 2 ? "Weak" :
                   strengthScore <= 4 ? "Medium" : "Strong"}
                </span>
              </div>
              {/* Strength Bar */}
              <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`h-full flex-1 transition-all duration-300 ${
                      i <= strengthScore
                        ? strengthScore <= 2
                          ? "bg-red-500"
                          : strengthScore <= 4
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                        : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
              {/* Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 pt-1 text-[11px] font-semibold text-gray-500">
                <div className="flex items-center gap-1.5">
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 text-[10px] ${
                    hasMinLength ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-400"
                  }`}>
                    ✓
                  </div>
                  <span>Min. 8 characters</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 text-[10px] ${
                    hasLowercase ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-400"
                  }`}>
                    ✓
                  </div>
                  <span>One lowercase letter (a-z)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 text-[10px] ${
                    hasUppercase ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-400"
                  }`}>
                    ✓
                  </div>
                  <span>One uppercase letter (A-Z)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 text-[10px] ${
                    hasNumber ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-400"
                  }`}>
                    ✓
                  </div>
                  <span>One number (0-9)</span>
                </div>
                <div className="flex items-center gap-1.5 sm:col-span-2">
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 text-[10px] ${
                    hasSymbol ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-400"
                  }`}>
                    ✓
                  </div>
                  <span>One special symbol (e.g. !, @, #, $, %)</span>
                </div>
              </div>
            </div>
          )}

          {errors.password && <p className={`text-red-500 text-[11px] font-semibold ${isAr ? "text-right" : "text-left"}`}>{errors.password.message}</p>}

        </div>
      </div>

      <div className="pt-3 flex justify-between items-center border-t border-sand-high mt-5">
        <button
          type="button"
          onClick={prevStep}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:text-primary hover:bg-gray-50 transition-all cursor-pointer animate-none"
        >
          {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          {labels.back}
        </button>
        <button
          type="submit"
          className="group flex items-center justify-center gap-1.5 px-8 py-2.5 bg-primary text-white rounded-xl font-bold text-sm shadow-md hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
        >
          {labels.next}
          {isAr ? <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> : <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
        </button>
      </div>
    </form>
  );
}
