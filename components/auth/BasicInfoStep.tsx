"use client";

import React, { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react";
import { useRegisterStore } from "@/store/registerStore";
import { useTranslations } from "next-intl";

interface BasicInfoData {
  name: string;
  email: string;
  password: string;
  phone: string;
}

export default function BasicInfoStep() {
  const t = useTranslations("validation");
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-3">
        {/* Name */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-700">Full Name</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5" />
            <input
              {...register("name")}
              type="text"
              className="w-full pl-12 pr-4 py-2.5 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-gray-400 text-sm"
              placeholder="e.g. Fatima Al-Zahra"
            />
          </div>
          {errors.name && <p className="text-red-500 text-[11px] font-semibold">{errors.name.message}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-700">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5" />
            <input
              {...register("email")}
              type="email"
              className="w-full pl-12 pr-4 py-2.5 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-gray-400 text-sm"
              placeholder="name@example.com"
            />
          </div>
          {errors.email && <p className="text-red-500 text-[11px] font-semibold">{errors.email.message}</p>}
        </div>

        {/* Phone */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-700">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5" />
            <input
              {...register("phone")}
              type="tel"
              className="w-full pl-12 pr-4 py-2.5 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-gray-400 text-sm"
              placeholder="01XXXXXXXXX"
            />
          </div>
          {errors.phone && <p className="text-red-500 text-[11px] font-semibold">{errors.phone.message}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-700">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5" />
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              className="w-full pl-12 pr-12 py-2.5 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-gray-400 text-sm"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary"
            >
              {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-[11px] font-semibold">{errors.password.message}</p>}
        </div>
      </div>

      <div className="pt-3 flex justify-between items-center border-t border-sand-high mt-5">
        <button
          type="button"
          onClick={prevStep}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:text-primary hover:bg-gray-50 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          type="submit"
          className="group flex items-center justify-center gap-1.5 px-8 py-2.5 bg-primary text-white rounded-xl font-bold text-sm shadow-md hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
        >
          Next Step
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </form>
  );
}
