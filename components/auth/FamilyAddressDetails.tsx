"use client";

import React, { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, ArrowRight, MapPin, Home, Building } from "lucide-react";
import { useRegisterStore } from "@/store/registerStore";
import { useLocale } from "next-intl";

export default function FamilyAddressDetails() {
  const { familyData, location, updateFamilyData, nextStep, prevStep } = useRegisterStore();
  const locale = useLocale();
  const isAr = locale === "ar";

  const addressSchema = useMemo(() => z.object({
    city: z.string().min(1, isAr ? "المدينة مطلوبة" : "City is required"),
    area: z.string().min(1, isAr ? "المنطقة مطلوبة" : "Area is required"),
    fullAddress: z.string().min(5, isAr ? "العنوان الكامل مطلوب" : "Full address is required"),
  }), [isAr]);

  type AddressData = z.infer<typeof addressSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      city: familyData.address.city || location?.city || "",
      area: familyData.address.area || "",
      fullAddress: familyData.address.fullAddress || location?.readableAddress || "",
    },
  });

  const onSubmit = (data: AddressData) => {
    updateFamilyData({ address: data });
    nextStep();
  };

  const labels = {
    title: isAr ? "تفاصيل العنوان" : "Address Details",
    desc: isAr 
      ? "يرجى تقديم تفاصيل السكن الذي سيتم تقديم الرعاية للمستفيد فيه." 
      : "Please provide the residence details where the companion care will be provided.",
    cityLabel: isAr ? "المدينة" : "City",
    cityPlaceholder: isAr ? "مثال: القاهرة" : "e.g. Cairo",
    areaLabel: isAr ? "المنطقة / الحي" : "Area / District",
    areaPlaceholder: isAr ? "مثال: المعادي" : "e.g. Maadi",
    fullAddressLabel: isAr ? "العنوان الكامل" : "Full Address",
    fullAddressPlaceholder: isAr 
      ? "رقم المبنى، اسم الشارع، رقم الشقة، إلخ." 
      : "Building number, Street name, Apartment, etc.",
    back: isAr ? "رجوع" : "Back",
    next: isAr ? "الخطوة التالية" : "Next Step",
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
      <div className="space-y-2">
        <h2 className={`text-xl font-bold text-primary ${isAr ? "text-right" : "text-left"}`}>{labels.title}</h2>
        <p className={`text-sm text-gray-500 font-medium leading-relaxed ${isAr ? "text-right" : "text-left"}`}>
          {labels.desc}
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className={`space-y-1.5 ${isAr ? "text-right" : "text-left"}`}>
            <label className="text-sm font-bold text-gray-700">{labels.cityLabel}</label>
            <div className="relative">
              <Building className={`absolute ${isAr ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4`} />
              <input
                {...register("city")}
                className={`w-full py-3 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm font-medium ${isAr ? "pr-10 pl-4 text-right" : "pl-10 pr-4 text-left"}`}
                placeholder={labels.cityPlaceholder}
              />
            </div>
            {errors.city && <p className={`text-red-500 text-[10px] font-semibold ${isAr ? "text-right" : "text-left"}`}>{errors.city.message}</p>}
          </div>

          <div className={`space-y-1.5 ${isAr ? "text-right" : "text-left"}`}>
            <label className="text-sm font-bold text-gray-700">{labels.areaLabel}</label>
            <div className="relative">
              <MapPin className={`absolute ${isAr ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4`} />
              <input
                {...register("area")}
                className={`w-full py-3 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm font-medium ${isAr ? "pr-10 pl-4 text-right" : "pl-10 pr-4 text-left"}`}
                placeholder={labels.areaPlaceholder}
              />
            </div>
            {errors.area && <p className={`text-red-500 text-[10px] font-semibold ${isAr ? "text-right" : "text-left"}`}>{errors.area.message}</p>}
          </div>
        </div>

        <div className={`space-y-1.5 ${isAr ? "text-right" : "text-left"}`}>
          <label className="text-sm font-bold text-gray-700">{labels.fullAddressLabel}</label>
          <div className="relative">
            <Home className={`absolute ${isAr ? "right-4" : "left-4"} top-4 text-gray-400 w-4 h-4`} />
            <textarea
              {...register("fullAddress")}
              rows={3}
              className={`w-full py-3 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm font-medium resize-none leading-relaxed ${isAr ? "pr-10 pl-4 text-right" : "pl-10 pr-4 text-left"}`}
              placeholder={labels.fullAddressPlaceholder}
            />
          </div>
          {errors.fullAddress && <p className={`text-red-500 text-[10px] font-semibold ${isAr ? "text-right" : "text-left"}`}>{errors.fullAddress.message}</p>}
        </div>
      </div>

      <div className="pt-6 flex justify-between items-center border-t border-sand-high">
        <button
          type="button"
          onClick={prevStep}
          className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-bold text-gray-500 hover:text-primary hover:bg-gray-50 transition-all cursor-pointer"
        >
          {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          {labels.back}
        </button>
        <button
          type="submit"
          className="group flex items-center justify-center gap-1.5 px-8 py-3.5 bg-primary text-white rounded-xl font-bold text-base shadow-md hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
        >
          {labels.next}
          {isAr ? <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> : <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
        </button>
      </div>
    </form>
  );
}
