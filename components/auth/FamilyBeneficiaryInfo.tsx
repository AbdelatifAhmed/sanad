"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, ArrowRight, User, Heart, Plus, Trash2, HeartHandshake } from "lucide-react";
import { useRegisterStore } from "@/store/registerStore";

const beneficiarySchema = z.object({
  name: z.string().min(1, "Beneficiary name is required"),
  age: z.number().min(1, "Please enter a valid age"),
  gender: z.enum(["male", "female"]),
  category: z.enum(["elderly", "special_needs"]),
  conditionDetails: z.string().min(10, "Please provide some condition details (min 10 characters)"),
});

type BeneficiaryData = z.infer<typeof beneficiarySchema>;

export default function FamilyBeneficiaryInfo() {
  const { familyData, updateFamilyData, nextStep, prevStep } = useRegisterStore();
  const [isAdding, setIsAdding] = useState(familyData.beneficiaries.length === 0);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BeneficiaryData>({
    resolver: zodResolver(beneficiarySchema),
    defaultValues: {
      gender: "male",
      category: "elderly",
    },
  });

  const category = watch("category");
  const gender = watch("gender");

  const addBeneficiary = (data: BeneficiaryData) => {
    updateFamilyData({
      beneficiaries: [...familyData.beneficiaries, { ...data, interests: [] }],
    });
    setIsAdding(false);
    reset();
  };

  const removeBeneficiary = (index: number) => {
    const newList = [...familyData.beneficiaries];
    newList.splice(index, 1);
    updateFamilyData({ beneficiaries: newList });
    if (newList.length === 0) setIsAdding(true);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-primary">Beneficiary Information</h2>
        <p className="text-sm text-gray-500 font-medium leading-relaxed text-left">
          Tell us about the person who needs companion care services.
        </p>
      </div>

      <div className="space-y-4">
        {familyData.beneficiaries.map((b, idx) => (
          <div key={idx} className="flex items-center justify-between p-4 bg-white border border-sand-high rounded-2xl custom-shadow animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-primary">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">{b.name}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase">
                  {b.age} years • {b.category === 'elderly' ? 'Elderly' : 'Special Needs'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeBeneficiary(idx)}
              className="text-gray-400 hover:text-red-500 p-2 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        {isAdding ? (
          <form onSubmit={handleSubmit(addBeneficiary)} className="bg-white rounded-3xl border border-sand-high p-6 space-y-6 animate-fade-in shadow-sm">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-gray-700">Name</label>
                <input
                  {...register("name")}
                  className="w-full px-4 py-3 bg-gray-50 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm font-medium"
                  placeholder="Full Name"
                />
                {errors.name && <p className="text-red-500 text-[10px] font-semibold">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-gray-700">Age</label>
                <input
                  {...register("age", { valueAsNumber: true })}
                  type="number"
                  className="w-full px-4 py-3 bg-gray-50 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm font-medium"
                  placeholder="Age"
                />
                {errors.age && <p className="text-red-500 text-[10px] font-semibold">{errors.age.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Gender</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setValue("gender", "male")}
                    className={`py-2.5 rounded-xl border-2 transition-all font-bold text-xs ${
                      gender === "male" ? "border-button bg-button/5 text-button" : "border-gray-100 bg-white text-gray-400"
                    }`}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue("gender", "female")}
                    className={`py-2.5 rounded-xl border-2 transition-all font-bold text-xs ${
                      gender === "female" ? "border-button bg-button/5 text-button" : "border-gray-100 bg-white text-gray-400"
                    }`}
                  >
                    Female
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setValue("category", "elderly")}
                    className={`py-2.5 rounded-xl border-2 transition-all font-bold text-[10px] ${
                      category === "elderly" ? "border-button bg-button/5 text-button" : "border-gray-100 bg-white text-gray-400"
                    }`}
                  >
                    Elderly
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue("category", "special_needs")}
                    className={`py-2.5 rounded-xl border-2 transition-all font-bold text-[10px] ${
                      category === "special_needs" ? "border-button bg-button/5 text-button" : "border-gray-100 bg-white text-gray-400"
                    }`}
                  >
                    Special Needs
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-gray-700">Condition Details</label>
              <textarea
                {...register("conditionDetails")}
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm font-medium resize-none leading-relaxed"
                placeholder="Describe their daily needs, mobility, or medical conditions..."
              />
              {errors.conditionDetails && <p className="text-red-500 text-[10px] font-semibold">{errors.conditionDetails.message}</p>}
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-sm hover:opacity-95 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Beneficiary
              </button>
              {familyData.beneficiaries.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-3 border border-gray-200 text-gray-500 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-bold text-sm hover:border-primary hover:text-primary hover:bg-teal-50/5 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Another Beneficiary
          </button>
        )}
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
          type="button"
          onClick={nextStep}
          disabled={familyData.beneficiaries.length === 0 || isAdding}
          className="group flex items-center justify-center gap-1.5 px-8 py-3.5 bg-primary text-white rounded-xl font-bold text-base shadow-md hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
        >
          Next Step
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
