"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, ArrowRight, MapPin, Home, Building } from "lucide-react";
import { useRegisterStore } from "@/store/registerStore";

const addressSchema = z.object({
  city: z.string().min(1, "City is required"),
  area: z.string().min(1, "Area is required"),
  fullAddress: z.string().min(5, "Full address is required"),
});

type AddressData = z.infer<typeof addressSchema>;

export default function FamilyAddressDetails() {
  const { familyData, location, updateFamilyData, nextStep, prevStep } = useRegisterStore();

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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-primary">Address Details</h2>
        <p className="text-sm text-gray-500 font-medium leading-relaxed text-left">
          Please provide the residence details where the companion care will be provided.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5 text-left">
            <label className="text-sm font-bold text-gray-700">City</label>
            <div className="relative">
              <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                {...register("city")}
                className="w-full pl-10 pr-4 py-3 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm font-medium"
                placeholder="e.g. Cairo"
              />
            </div>
            {errors.city && <p className="text-red-500 text-[10px] font-semibold">{errors.city.message}</p>}
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-sm font-bold text-gray-700">Area / District</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                {...register("area")}
                className="w-full pl-10 pr-4 py-3 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm font-medium"
                placeholder="e.g. Maadi"
              />
            </div>
            {errors.area && <p className="text-red-500 text-[10px] font-semibold">{errors.area.message}</p>}
          </div>
        </div>

        <div className="space-y-1.5 text-left">
          <label className="text-sm font-bold text-gray-700">Full Address</label>
          <div className="relative">
            <Home className="absolute left-4 top-4 text-gray-400 w-4 h-4" />
            <textarea
              {...register("fullAddress")}
              rows={3}
              className="w-full pl-10 pr-4 py-3 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm font-medium resize-none leading-relaxed"
              placeholder="Building number, Street name, Apartment, etc."
            />
          </div>
          {errors.fullAddress && <p className="text-red-500 text-[10px] font-semibold">{errors.fullAddress.message}</p>}
        </div>
      </div>

      <div className="pt-6 flex justify-between items-center border-t border-sand-high">
        <button
          type="button"
          onClick={prevStep}
          className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-bold text-gray-500 hover:text-primary hover:bg-gray-50 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          type="submit"
          className="group flex items-center justify-center gap-1.5 px-8 py-3.5 bg-primary text-white rounded-xl font-bold text-base shadow-md hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
        >
          Next Step
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </form>
  );
}
