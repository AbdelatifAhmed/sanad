"use client";

import React, { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react";
import { useRegisterStore } from "@/store/registerStore";
import { useTranslations, useLocale } from "next-intl";

interface BasicInfoData {
  name: string;
  email: string;
  password: string;
  phone: string;
}

export default function BasicInfoStep() {
  const t = useTranslations("validation");
  const locale = useLocale();
  const isAr = locale === "ar";
  const { name, email, password, phone, updateBasicInfo, nextStep, prevStep } = useRegisterStore();
  const [showPassword, setShowPassword] = React.useState(false);

  const basicInfoSchema = useMemo(() => z.object({
    name: z.string().min(1, t("nameRequired")),
    email: z.string().email(t("emailInvalid")),
    password: z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, t("passwordMin")),
    phone: z.string().regex(/^01[0125][0-9]{8}$/, t("phoneInvalid")),
  }), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BasicInfoData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: { name, email, password, phone },
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
