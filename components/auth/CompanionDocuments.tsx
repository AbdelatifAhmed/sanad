"use client";

import { useRegisterStore } from "@/store/registerStore";
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, Trash2, Upload } from "lucide-react";
import React, { useState } from "react";
import { uploadPublicFile } from "@/lib/api/upload.api";
import { useLocale } from "next-intl";

interface FileUploaderProps {
  label: string;
  onUpload: (fileData: { url: string; public_id: string }) => void;
  onRemove: () => void;
  currentUrl?: string;
  required?: boolean;
  isAr: boolean;
}

const FileUploader = ({ label, onUpload, onRemove, currentUrl, required, isAr }: FileUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = {
    allowedTypes: isAr ? "يسمح فقط بملفات JPEG و PNG و PDF." : "Only JPEG, PNG, and PDF are allowed.",
    exceedsSize: isAr ? "حجم الملف يتجاوز الحد الأقصى 5 ميجابايت." : "File size exceeds 5MB limit.",
    failedUpload: isAr ? "فشل الرفع. يرجى المحاولة مرة أخرى." : "Failed to upload. Please try again.",
    uploaded: isAr ? "تم رفع المستند بنجاح" : "Document Uploaded",
    readyVerify: isAr ? "جاهز للتحقق والمراجعة" : "Ready for verification",
    uploading: isAr ? "جاري الرفع..." : "Uploading...",
    clickToUpload: isAr ? "اضغط لرفع المستند" : "Click to upload document",
    formatHelp: isAr ? "PDF أو JPG أو PNG (الحد الأقصى 5 ميجابايت)" : "PDF, JPG or PNG (max. 5MB)",
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      setError(t.allowedTypes);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(t.exceedsSize);
      return;
    }

    setUploading(true);
    setError(null);
    
    try {
      const result = await uploadPublicFile(file);
      onUpload(result);
    } catch (err) {
      setError(t.failedUpload);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className={`text-sm font-bold text-gray-700 block ${isAr ? "text-right" : "text-left"}`}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {currentUrl ? (
        <div className={`flex items-center justify-between p-4 bg-teal-50/30 border border-teal-100 rounded-xl animate-fade-in ${isAr ? "flex-row-reverse" : "flex-row"}`}>
          <div className={`flex items-center gap-3 ${isAr ? "flex-row-reverse text-right" : "flex-row text-left"}`}>
            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-primary">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">{t.uploaded}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase">{t.readyVerify}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="text-gray-400 hover:text-red-500 p-2 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          <label className={`border-2 border-dashed ${error ? 'border-red-300 bg-red-50/50' : 'border-gray-200 bg-gray-50/50 hover:border-primary hover:bg-teal-50/5'} rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 cursor-pointer transition-all group`}>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
                <Upload className="w-5 h-5" />
              </div>
            )}
            <div>
              <p className={`text-xs font-bold ${error ? 'text-red-500' : 'text-primary'}`}>
                {uploading ? t.uploading : error || t.clickToUpload}
              </p>
              <p className="text-[10px] text-gray-400 font-medium mt-1">{t.formatHelp}</p>
            </div>
          </label>
        </>
      )}
    </div>
  );
};

export default function CompanionDocuments() {
  const { companionData, updateCompanionData, nextStep, prevStep } = useRegisterStore();
  const locale = useLocale();
  const isAr = locale === "ar";

  const handleUpload = (field: keyof typeof companionData.documents, fileData: { url: string; public_id: string }) => {
    updateCompanionData({
      documents: {
        ...companionData.documents,
        [field]: fileData,
      },
    });
  };

  const handleRemove = (field: keyof typeof companionData.documents) => {
    const updatedDocuments = { ...companionData.documents };
    delete updatedDocuments[field];
    updateCompanionData({ documents: updatedDocuments });
  };

  const isComplete = companionData.documents.nationalIdCard && companionData.documents.criminalRecord;

  const labels = {
    title: isAr ? "وثائق التحقق والمراجعة" : "Verification Documents",
    desc: isAr 
      ? "يرجى رفع صور واضحة من وثائقك الرسمية لبدء عملية توثيق الحساب." 
      : "Please upload clear photos of your official documents for our verification process.",
    nationalId: isAr ? "بطاقة الرقم القومي" : "National ID Card",
    criminalRecord: isAr ? "صحيفة الحالة الجنائية (الفيش الجنائي)" : "Criminal Record (الفيش الجنائي)",
    syndicateCard: isAr ? "كارنيه النقابة (اختياري)" : "Syndicate Card (Optional)",
    back: isAr ? "رجوع" : "Back",
    next: isAr ? "الخطوة التالية" : "Next Step",
  };

  return (
    <div className="space-y-8" dir={isAr ? "rtl" : "ltr"}>
      <div className="space-y-2">
        <h2 className={`text-xl font-bold text-primary ${isAr ? "text-right" : "text-left"}`}>{labels.title}</h2>
        <p className={`text-sm text-gray-500 font-medium leading-relaxed ${isAr ? "text-right" : "text-left"}`}>
          {labels.desc}
        </p>
      </div>

      <div className="space-y-6">
        <FileUploader
          label={labels.nationalId}
          required
          isAr={isAr}
          currentUrl={companionData.documents.nationalIdCard?.url}
          onUpload={(fileData) => handleUpload("nationalIdCard", fileData)}
          onRemove={() => handleRemove("nationalIdCard")}
        />

        <FileUploader
          label={labels.criminalRecord}
          required
          isAr={isAr}
          currentUrl={companionData.documents.criminalRecord?.url}
          onUpload={(fileData) => handleUpload("criminalRecord", fileData)}
          onRemove={() => handleRemove("criminalRecord")}
        />

        <FileUploader
          label={labels.syndicateCard}
          isAr={isAr}
          currentUrl={companionData.documents.syndicateCard?.url}
          onUpload={(fileData) => handleUpload("syndicateCard", fileData)}
          onRemove={() => handleRemove("syndicateCard")}
        />
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
          type="button"
          onClick={nextStep}
          disabled={!isComplete}
          className="group flex items-center justify-center gap-1.5 px-8 py-3.5 bg-primary text-white rounded-xl font-bold text-base shadow-md hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
        >
          {labels.next}
          {isAr ? <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> : <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
        </button>
      </div>
    </div>
  );
}
