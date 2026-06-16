"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useRegisterStore } from "@/store/registerStore";

const basicInfoSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب بالكامل"),
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(8, "كلمة المرور يجب أن لا تقل عن 8 أحرف"),
  phone: z.string().regex(/^01[0125][0-9]{8}$/, "رقم الهاتف المصري غير صالح (يجب أن يبدأ بـ 010 أو 011 أو 012 أو 015 ومكون من 11 رقم)"),
});

type BasicInfoData = z.infer<typeof basicInfoSchema>;

export default function BasicInfoStep() {
  const { name, email, password, phone, updateBasicInfo, nextStep } = useRegisterStore();
  const [showPassword, setShowPassword] = React.useState(false);

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        {/* Name */}
        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-gray-700">Full Name</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              {...register("name")}
              type="text"
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-gray-400 text-sm"
              placeholder="e.g. Fatima Al-Zahra"
            />
          </div>
          {errors.name && <p className="text-red-500 text-xs font-semibold">{errors.name.message}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-gray-700">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              {...register("email")}
              type="email"
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-gray-400 text-sm"
              placeholder="name@example.com"
            />
          </div>
          {errors.email && <p className="text-red-500 text-xs font-semibold">{errors.email.message}</p>}
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-gray-700">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              {...register("phone")}
              type="tel"
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-gray-400 text-sm"
              placeholder="01XXXXXXXXX"
            />
          </div>
          {errors.phone && <p className="text-red-500 text-xs font-semibold">{errors.phone.message}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-gray-700">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              className="w-full pl-12 pr-12 py-3.5 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-gray-400 text-sm"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs font-semibold">{errors.password.message}</p>}
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-button text-white py-3.5 px-8 rounded-xl font-bold text-base hover:bg-button-hover transition-all active:scale-[0.99] shadow-md shadow-button/20 flex items-center justify-center gap-2 mt-8 cursor-pointer"
      >
        <span>Next Step</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
}
