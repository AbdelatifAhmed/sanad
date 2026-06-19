"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslations } from "next-intl";
import { Send, Check, Timer, ShieldCheck, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { useFamilyElderlyProfiles, useCreateBooking } from "@/lib/hooks";
import RequestCaregiverHeader from "./RequestCaregiverHeader";
import WhoNeedsCare, { FamilyMember } from "./WhoNeedsCare";
import ScheduleInformation from "./ScheduleInformation";
import LocationSelection, { CITIES_BY_REGION } from "./LocationSelection";
import CareDetails from "./CareDetails";

interface CompanionData {
  id: string;
  name: string;
  avatar: string;
  title: string;
  experience: string;
  location: string;
  bio: string;
  rating: number;
  verified: boolean;
}

interface DirectCareRequestFormProps {
  companion: CompanionData;
}

// Zod validation schema matching the database form
const bookingFormSchema = z.object({
  selectedMemberId: z.string().min(1, { message: "validation.memberRequired" }),
  serviceDate: z.string().min(1, { message: "validation.dateRequired" }),
  startTime: z.string().min(1, { message: "validation.startRequired" }),
  endTime: z.string().min(1, { message: "validation.endRequired" }),
  governorate: z.string().min(1, { message: "validation.governorateRequired" }),
  city: z.string().min(1, { message: "validation.cityRequired" }),
  streetAddress: z.string().trim().min(1, { message: "validation.addressRequired" }),
  careType: z.string().min(1, { message: "validation.careTypeRequired" }),
  notes: z.string(),
  isRecurring: z.boolean(),
}).refine((data) => {
  if (!data.startTime || !data.endTime) return true;
  const [startH, startM] = data.startTime.split(":").map(Number);
  const [endH, endM] = data.endTime.split(":").map(Number);
  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;
  return endTotal > startTotal;
}, {
  message: "validation.endTimeAfterStart",
  path: ["endTime"],
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

export default function DirectCareRequestForm({ companion }: DirectCareRequestFormProps) {
  const router = useRouter();
  const t = useTranslations("bookingForm");
  
  // Fetch real family elderly profiles from database
  const { data: profileData, isLoading: isProfilesLoading } = useFamilyElderlyProfiles();
  const beneficiaries = profileData?.beneficiaries ?? [];

  // Map beneficiaries to FamilyMember format
  const familyMembers: FamilyMember[] = beneficiaries.map((b: any) => ({
    id: b._id,
    name: b.name,
    age: b.age,
    gender: b.gender,
    category: b.category,
    avatar: b.gender === "female" ? "/avatar_2.jpg" : "/avatar_1.jpg",
  }));

  // Setup react-hook-form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors: formErrors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      selectedMemberId: "",
      serviceDate: "",
      startTime: "",
      endTime: "",
      governorate: "",
      city: "",
      streetAddress: "",
      careType: "",
      notes: "",
      isRecurring: false,
    },
  });

  // Watch form values for conditional rendering & child component integration
  const selectedMemberId = watch("selectedMemberId");
  const serviceDate = watch("serviceDate");
  const startTime = watch("startTime");
  const endTime = watch("endTime");
  const isRecurring = watch("isRecurring");
  const governorate = watch("governorate");
  const city = watch("city");
  const streetAddress = watch("streetAddress");
  const careType = watch("careType");
  const notes = watch("notes");

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Mongoose booking creator hook
  const { execute: submitBooking, error: bookingError } = useCreateBooking();

  // Set initial selected member once beneficiaries load
  useEffect(() => {
    if (familyMembers.length > 0 && !selectedMemberId) {
      setValue("selectedMemberId", familyMembers[0].id, { shouldValidate: true });
    }
  }, [familyMembers, selectedMemberId, setValue]);

  // Pre-fill location once profile loads
  useEffect(() => {
    if (profileData?.profile?.address) {
      const addr = profileData.profile.address;
      if (addr.fullAddress) setValue("streetAddress", addr.fullAddress);
      
      if (addr.city) {
        // Find if this city exists in our region map
        let foundRegion = "";
        for (const [region, cities] of Object.entries(CITIES_BY_REGION)) {
          if (cities.includes(addr.city)) {
            foundRegion = region;
            break;
          }
        }
        
        if (foundRegion) {
          setValue("governorate", foundRegion);
          setValue("city", addr.city);
        } else {
          // Fallback if not found in predefined list
          setValue("governorate", "Other");
          setValue("city", addr.city);
        }
      }
    }
  }, [profileData, setValue]);

  const calculateHours = (start: string, end: string) => {
    if (!start || !end) return 0;
    const [startH, startM] = start.split(":").map(Number);
    const [endH, endM] = end.split(":").map(Number);
    const diff = (endH * 60 + endM) - (startH * 60 + startM);
    return diff > 0 ? diff / 60 : 0;
  };

  const getErrorMessage = (fieldName: keyof BookingFormValues) => {
    const err = formErrors[fieldName];
    if (!err) return undefined;
    if (err.message && err.message.startsWith("validation.")) {
      return t(err.message as any);
    }
    return err.message;
  };

  // Build errors map for backward compatibility with child components
  const errorsMap: Record<string, string> = {};
  const formKeys: (keyof BookingFormValues)[] = [
    "selectedMemberId", "serviceDate", "startTime", "endTime",
    "governorate", "city", "streetAddress", "careType"
  ];
  formKeys.forEach((k) => {
    const msg = getErrorMessage(k);
    if (msg) errorsMap[k] = msg;
  });

  const onSubmit = async (data: BookingFormValues) => {
    setValidationError(null);
    setIsSubmitting(true);

    try {
      // Build schedule array (1 date for single booking, 4 dates for weekly recurring)
      const schedule = [];
      const baseDate = new Date(data.serviceDate);
      const totalDays = data.isRecurring ? 4 : 1;
      const hoursPerDay = calculateHours(data.startTime, data.endTime);

      for (let i = 0; i < totalDays; i++) {
        const date = new Date(baseDate);
        date.setDate(baseDate.getDate() + (i * 7));
        schedule.push({
          date: date.toISOString().split("T")[0],
          startTime: data.startTime,
          endTime: data.endTime,
          tasksList: []
        });
      }

      const totalHours = hoursPerDay * totalDays;

      const careTypeLabels: Record<string, string> = {
        elderly_care: t("elderlyCare"),
        companionship: t("companionCare"),
        home_nursing: t("homeNursing"),
        physical_therapy: t("physicalTherapy"),
        child_care: t("childCare"),
      };
      const careTypeLabel = careTypeLabels[data.careType] || data.careType;
      const finalNotes = `${t("careTypeRequired")}: ${careTypeLabel}\n\n${t("additionalNotes")}:\n${data.notes || "None"}`;

      const payload = {
        companionId: companion.id,
        beneficiaryId: data.selectedMemberId,
        notes: finalNotes,
        taskList: [],
        totalHours,
        schedule
      };

      await submitBooking(payload);
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error("Booking creation failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto py-12 animate-fade-in">
        {/* Main Success Container */}
        <div className="bg-white rounded-3xl shadow-soft border border-sand-high/60 p-8 md:p-12 text-center flex flex-col items-center">
          
          {/* Big Check Circle */}
          <div className="w-24 h-24 bg-[#e5efed] rounded-full flex items-center justify-center mb-8">
            <Check className="w-10 h-10 text-[#005c53]" style={{ strokeWidth: 3 }} />
          </div>
          
          {/* Title & Desc */}
          <h2 className="text-3xl font-display font-bold text-[#1b1c1c] mb-3">
            {t("successTitle")}
          </h2>
          
          <p className="text-gray-500 text-sm max-w-lg mx-auto mb-8 leading-relaxed">
            {t("successDesc", { name: companion.name })}
          </p>

          {/* Expected Response & Guarantee Block */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 border border-sand-highest/80 rounded-2xl mb-10 text-left bg-white">
            
            {/* Expected Response */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#e6f4f2] text-[#005c53] flex items-center justify-center rounded-xl shrink-0">
                <Timer className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-gray-400 tracking-wider block">
                  {t("expectedResponse")}
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#012d1d]">
                  {t("within24h")}
                </span>
              </div>
            </div>

            {/* Sanad Guarantee */}
            <div className="flex items-center gap-3 sm:border-l sm:border-sand-high sm:pl-6">
              <div className="w-10 h-10 bg-[#e6f4f2] text-[#005c53] flex items-center justify-center rounded-xl shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-gray-400 tracking-wider block">
                  {t("sanadGuarantee")}
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#012d1d]">
                  {t("secureConfidential")}
                </span>
              </div>
            </div>

          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
            <Link
              href="/family/bookings"
              className="w-full sm:w-auto h-12 px-6 bg-[#005c53] hover:bg-[#00473c] text-white font-bold rounded-xl transition-all shadow-soft flex items-center justify-center gap-2 text-sm hover:scale-[1.01] active:scale-[0.99] cursor-pointer animate-fade-in"
            >
              <span>{t("viewStatus")}</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </Link>
            
            <Link
              href={`/family/companions/${companion.id}`}
              className="w-full sm:w-auto h-12 px-8 border border-gray-300 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center text-sm hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              {t("returnProfile")}
            </Link>
          </div>

          {/* Bottom Security Footer */}
          <div className="flex items-center justify-center gap-1.5 mt-8 text-gray-400 text-[11px] font-semibold">
            <Lock className="w-3.5 h-3.5 animate-pulse" />
            <span>{t("encryptedChannel")}</span>
          </div>

        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* 1. Header component */}
      <RequestCaregiverHeader 
        name={companion.name}
        avatar={companion.avatar}
        title={companion.title}
        experience={companion.experience}
        location={companion.location}
        bio={companion.bio}
        rating={companion.rating}
        verified={companion.verified}
      />

      {/* Error banner */}
      {(validationError || bookingError) && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-3xl text-red-700 animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          <div className="text-sm font-semibold">
            {validationError || bookingError?.response?.data?.error || bookingError?.message || t("errorOccurred")}
          </div>
        </div>
      )}

      {/* 2. Patient Profile Selector */}
      <WhoNeedsCare 
        members={familyMembers}
        selectedId={selectedMemberId}
        onSelect={(id) => setValue("selectedMemberId", id, { shouldValidate: true })}
        isLoading={isProfilesLoading}
        error={errorsMap.selectedMemberId}
      />

      {/* 3. Schedule details */}
      <ScheduleInformation 
        serviceDate={serviceDate}
        startTime={startTime}
        endTime={endTime}
        isRecurring={isRecurring}
        onChangeDate={(val) => setValue("serviceDate", val, { shouldValidate: true })}
        onChangeStart={(val) => setValue("startTime", val, { shouldValidate: true })}
        onChangeEnd={(val) => setValue("endTime", val, { shouldValidate: true })}
        onToggleRecurring={() => setValue("isRecurring", !isRecurring)}
        errors={errorsMap}
      />

      {/* 4. Location Details */}
      <LocationSelection 
        governorate={governorate}
        city={city}
        streetAddress={streetAddress}
        onChangeGovernorate={(val) => {
          setValue("governorate", val, { shouldValidate: true });
          setValue("city", "");
        }}
        onChangeCity={(val) => setValue("city", val, { shouldValidate: true })}
        onChangeStreet={(val) => setValue("streetAddress", val, { shouldValidate: true })}
        errors={errorsMap}
      />

      {/* 5. Care type selection */}
      <CareDetails 
        careType={careType}
        notes={notes}
        onChangeCareType={(val) => setValue("careType", val, { shouldValidate: true })}
        onChangeNotes={(val) => setValue("notes", val)}
        error={errorsMap.careType}
      />

      {/* Form Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-sand-high/60">
        <button
          type="button"
          onClick={() => router.push(`/family/companions/${companion.id}`)}
          className="w-full sm:w-36 h-12 border border-[#005c53] text-[#005c53] font-bold rounded-xl hover:bg-[#e6f4f2]/20 transition-all text-sm cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
        >
          {t("cancel")}
        </button>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-48 h-12 bg-[#005c53] hover:bg-[#00473c] text-white font-bold rounded-xl shadow-soft hover:shadow-premium transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
        >
          {isSubmitting ? (
            <span>{t("sending")}</span>
          ) : (
            <>
              <span>{t("sendRequest")}</span>
              <Send className="w-4.5 h-4.5 fill-current rotate-45 text-white translate-x-[2px] translate-y-[-1px]" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

