"use client";

import { useRegisterStore } from "@/store/registerStore";
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, Trash2, Upload } from "lucide-react";
import React, { useState } from "react";

interface FileUploaderProps {
  label: string;
  onUpload: (url: string) => void;
  onRemove: () => void;
  currentUrl?: string;
  required?: boolean;
}

const FileUploader = ({ label, onUpload, onRemove, currentUrl, required }: FileUploaderProps) => {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    
    // Simulation of Cloudinary Upload
    // In a real app, you would use:
    // const formData = new FormData();
    // formData.append("file", file);
    // formData.append("upload_preset", "your_preset");
    // const res = await axios.post("https://api.cloudinary.com/v1_1/your_cloud/image/upload", formData);
    // onUpload(res.data.secure_url);

    setTimeout(() => {
      onUpload(`https://placeholder.com/${file.name}`);
      setUploading(false);
    }, 1500);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-gray-700 block">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {currentUrl ? (
        <div className="flex items-center justify-between p-4 bg-teal-50/30 border border-teal-100 rounded-xl animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-primary">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">Document Uploaded</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Ready for verification</p>
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
        <label className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 cursor-pointer hover:border-primary hover:bg-teal-50/5 transition-all bg-gray-50/50 group">
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
            <p className="text-xs text-primary font-bold">
              {uploading ? "Uploading..." : "Click to upload document"}
            </p>
            <p className="text-[10px] text-gray-400 font-medium mt-1">PDF, JPG or PNG (max. 10MB)</p>
          </div>
        </label>
      )}
    </div>
  );
};

export default function CompanionDocuments() {
  const { companionData, updateCompanionData, nextStep, prevStep } = useRegisterStore();

  const handleUpload = (field: keyof typeof companionData.documents, url: string) => {
    updateCompanionData({
      documents: {
        ...companionData.documents,
        [field]: url,
      },
    });
  };

  const handleRemove = (field: keyof typeof companionData.documents) => {
    updateCompanionData({
      documents: {
        ...companionData.documents,
        [field]: "",
      },
    });
  };

  const isComplete = companionData.documents.nationalIdUrl && companionData.documents.criminalRecordUrl;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-primary">Verification Documents</h2>
        <p className="text-sm text-gray-500 font-medium leading-relaxed">
          Please upload clear photos of your official documents for our verification process.
        </p>
      </div>

      <div className="space-y-6">
        <FileUploader
          label="National ID Card"
          required
          currentUrl={companionData.documents.nationalIdUrl}
          onUpload={(url) => handleUpload("nationalIdUrl", url)}
          onRemove={() => handleRemove("nationalIdUrl")}
        />

        <FileUploader
          label="Criminal Record (الفيش الجنائي)"
          required
          currentUrl={companionData.documents.criminalRecordUrl}
          onUpload={(url) => handleUpload("criminalRecordUrl", url)}
          onRemove={() => handleRemove("criminalRecordUrl")}
        />

        <FileUploader
          label="Syndicate Card (Optional)"
          currentUrl={companionData.documents.syndicateCardUrl}
          onUpload={(url) => handleUpload("syndicateCardUrl", url)}
          onRemove={() => handleRemove("syndicateCardUrl")}
        />
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
          disabled={!isComplete}
          className="group flex items-center justify-center gap-1.5 px-8 py-3.5 bg-primary text-white rounded-xl font-bold text-base shadow-md hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
        >
          Next Step
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
