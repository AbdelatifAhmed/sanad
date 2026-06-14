"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  Shield,
  Award,
  Users,
  CheckCircle,
  FileText,
  Trash2
} from "lucide-react";

export default function QualificationsPage() {
  const router = useRouter();

  // Form states
  const [specialization, setSpecialization] = useState("");
  const [experience, setExperience] = useState("");
  
  // File upload simulation states
  const [certFile, setCertFile] = useState<{ name: string; size: string } | null>(null);
  const [idFile, setIdFile] = useState<{ name: string; size: string } | null>(null);
  
  const [isCertUploading, setIsCertUploading] = useState(false);
  const [isIdUploading, setIsIdUploading] = useState(false);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Load from localStorage on mount
  useEffect(() => {
    const savedSpecialization = localStorage.getItem("onboarding_specialization");
    const savedExperience = localStorage.getItem("onboarding_experience");
    const savedCertFile = localStorage.getItem("onboarding_cert_file");
    const savedIdFile = localStorage.getItem("onboarding_id_file");

    if (savedSpecialization) setSpecialization(savedSpecialization);
    if (savedExperience) setExperience(savedExperience);
    if (savedCertFile) setCertFile(JSON.parse(savedCertFile));
    if (savedIdFile) setIdFile(JSON.parse(savedIdFile));
  }, []);

  const handleSaveAndExit = () => {
    // Save state
    localStorage.setItem("onboarding_specialization", specialization);
    localStorage.setItem("onboarding_experience", experience);
    if (certFile) localStorage.setItem("onboarding_cert_file", JSON.stringify(certFile));
    if (idFile) localStorage.setItem("onboarding_id_file", JSON.stringify(idFile));
    
    // Redirect to login or home
    router.push("/login");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "cert" | "id") => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate upload
    if (type === "cert") {
      setIsCertUploading(true);
      setTimeout(() => {
        setCertFile({
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(2) + " MB"
        });
        setIsCertUploading(false);
        setErrors(prev => ({ ...prev, cert: "" }));
      }, 1500);
    } else {
      setIsIdUploading(true);
      setTimeout(() => {
        setIdFile({
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(2) + " MB"
        });
        setIsIdUploading(false);
        setErrors(prev => ({ ...prev, id: "" }));
      }, 1500);
    }
  };

  const removeFile = (type: "cert" | "id") => {
    if (type === "cert") {
      setCertFile(null);
      localStorage.removeItem("onboarding_cert_file");
    } else {
      setIdFile(null);
      localStorage.removeItem("onboarding_id_file");
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!specialization) newErrors.specialization = "Please select your specialization.";
    if (!experience.trim() || parseInt(experience) < 0) {
      newErrors.experience = "Please enter valid years of experience.";
    }
    if (!certFile) newErrors.cert = "Please upload at least one certification or education document.";
    if (!idFile) newErrors.id = "Please upload your identity verification document.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Save state
    localStorage.setItem("onboarding_specialization", specialization);
    localStorage.setItem("onboarding_experience", experience);
    localStorage.setItem("onboarding_cert_file", JSON.stringify(certFile));
    localStorage.setItem("onboarding_id_file", JSON.stringify(idFile));

    router.push("/onboarding/availability");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fcf9f6] text-[#1c1c1a] font-body">
      {/* Top Header */}
      <header className="bg-white border-b border-sand-high sticky top-0 z-50 flex justify-between items-center px-6 md:px-16 py-4 w-full">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Sanad Logo" className="h-10 w-auto object-contain mix-blend-multiply" />
          <span className="font-display text-xl font-bold text-[#012d1d]">Sanad</span>
        </div>
        <div>
          <button
            onClick={handleSaveAndExit}
            className="text-gray-500 font-semibold text-sm hover:text-primary transition-colors cursor-pointer"
          >
            Save &amp; Exit
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center py-12 px-6 md:px-16 max-w-4xl w-full mx-auto">
        <div className="w-full">
          {/* Stepper */}
          <div className="mb-12">
            <div className="flex justify-between items-center relative">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-10 -translate-y-1/2" />
              <div className="absolute top-1/2 left-0 w-1/4 h-0.5 bg-primary -z-10 -translate-y-1/2 transition-all duration-500" />
              
              {/* Step 1 */}
              <div className="flex flex-col items-center gap-2 bg-[#fcf9f6] px-2 md:px-4">
                <div className="w-9 h-9 rounded-full bg-[#aeedd5] text-[#316d5b] flex items-center justify-center font-bold">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <span className="text-[10px] md:text-xs font-semibold text-gray-500">Basic Info</span>
              </div>
              
              {/* Step 2 */}
              <div className="flex flex-col items-center gap-2 bg-[#fcf9f6] px-2 md:px-4">
                <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold ring-4 ring-primary-container/10">
                  2
                </div>
                <span className="text-[10px] md:text-xs font-bold text-primary">Qualifications</span>
              </div>
              
              {/* Step 3 */}
              <div className="flex flex-col items-center gap-2 bg-[#fcf9f6] px-2 md:px-4">
                <div className="w-9 h-9 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <span className="text-[10px] md:text-xs font-semibold text-gray-400">Availability</span>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center gap-2 bg-[#fcf9f6] px-2 md:px-4">
                <div className="w-9 h-9 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-xs font-bold">
                  4
                </div>
                <span className="text-[10px] md:text-xs font-semibold text-gray-400">Preferences</span>
              </div>

              {/* Step 5 */}
              <div className="flex flex-col items-center gap-2 bg-[#fcf9f6] px-2 md:px-4">
                <div className="w-9 h-9 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-xs font-bold">
                  5
                </div>
                <span className="text-[10px] md:text-xs font-semibold text-gray-400">Review</span>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-3xl border border-sand-high p-8 md:p-10 custom-shadow space-y-8">
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-primary mb-2">
                Experience &amp; Qualifications
              </h1>
              <p className="text-gray-500 text-sm md:text-base font-medium">
                Help us match you with the right families by sharing your professional background.
              </p>
            </div>

            <form onSubmit={handleNext} className="space-y-8">
              {/* Specialty & Experience Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 block">Caregiver Type</label>
                  <div className="relative">
                    <select
                      value={specialization}
                      onChange={(e) => {
                        setSpecialization(e.target.value);
                        setErrors(prev => ({ ...prev, specialization: "" }));
                      }}
                      className="w-full h-14 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-gray-700 text-sm font-medium"
                    >
                      <option value="">Select your specialization</option>
                      <option value="medical">Medical (RN, LPN, CNA)</option>
                      <option value="companion">Companion Care</option>
                      <option value="general">General Support</option>
                    </select>
                  </div>
                  {errors.specialization && (
                    <p className="text-red-500 text-xs font-semibold">{errors.specialization}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 block">Years of Experience</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 5"
                      value={experience}
                      onChange={(e) => {
                        setExperience(e.target.value);
                        setErrors(prev => ({ ...prev, experience: "" }));
                      }}
                      className="w-full h-14 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-gray-700 text-sm font-medium"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">
                      Years
                    </span>
                  </div>
                  {errors.experience && (
                    <p className="text-red-500 text-xs font-semibold">{errors.experience}</p>
                  )}
                </div>
              </div>

              {/* Education Upload Area */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-700 block">Education &amp; Certifications</label>
                
                {certFile ? (
                  <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-[#1f8a8a]">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800 truncate max-w-[200px] md:max-w-xs">{certFile.name}</p>
                        <p className="text-xs text-gray-400 font-medium">{certFile.size}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile("cert")}
                      className="text-gray-400 hover:text-red-500 p-2 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4 cursor-pointer hover:border-primary hover:bg-teal-50/10 transition-all bg-gray-50/50">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, "cert")}
                      disabled={isCertUploading}
                    />
                    <div className="w-14 h-14 rounded-full bg-[#aeedd5] flex items-center justify-center text-[#316d5b]">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-primary font-bold">
                        {isCertUploading ? "Uploading..." : "Click to upload or drag and drop"}
                      </p>
                      <p className="text-xs text-gray-400 font-medium mt-1">PDF, JPG or PNG (max. 10MB)</p>
                    </div>
                  </label>
                )}
                {errors.cert && (
                  <p className="text-red-500 text-xs font-semibold">{errors.cert}</p>
                )}
              </div>

              {/* ID Verification Upload */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-700 block">Identity Verification</label>
                
                {idFile ? (
                  <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-[#1f8a8a]">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800 truncate max-w-[200px] md:max-w-xs">{idFile.name}</p>
                        <p className="text-xs text-gray-400 font-medium">{idFile.size}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile("id")}
                      className="text-gray-400 hover:text-red-500 p-2 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center p-4 bg-gray-50 border border-gray-200 rounded-xl gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div className="flex-grow text-left">
                      <p className="text-sm font-bold text-gray-800">Upload Government Issued ID</p>
                      <p className="text-xs text-gray-400 font-medium">Passport, Driver's License or National ID</p>
                    </div>
                    <label className="flex-shrink-0 px-4 py-2 font-semibold text-xs text-primary hover:bg-teal-50/50 rounded-lg transition-colors border border-primary/20 cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, "id")}
                        disabled={isIdUploading}
                      />
                      {isIdUploading ? "Uploading..." : "Browse File"}
                    </label>
                  </div>
                )}
                {errors.id && (
                  <p className="text-red-500 text-xs font-semibold">{errors.id}</p>
                )}
              </div>

              {/* Security Warning */}
              <div className="p-4 bg-[#fcf9f6] rounded-xl flex items-start gap-3 border border-sand-high">
                <Shield className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                  Your documents are encrypted and stored securely. We only use them to verify your professional background for family peace of mind.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 flex justify-between items-center border-t border-sand-high">
                <Link
                  href="/register"
                  className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-bold text-gray-500 hover:text-primary hover:bg-gray-50 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Link>
                <button
                  type="submit"
                  className="group flex items-center justify-center gap-1.5 px-8 py-3.5 bg-primary text-white rounded-xl font-bold text-base shadow-md hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
                >
                  Next Step
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </form>
          </div>

          {/* Supporting Imagery/Mood */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-sand-high rounded-2xl p-4 flex items-center gap-3 custom-shadow">
              <img
                className="w-12 h-12 rounded-lg object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAuMfNhLYD-h2-6ctIGM-eydB2_WJ1nlI8C7YxXYpB1DmoX2iI0x9CKinYIgbJM0-AqJ6AdOAEMHE2KUQK0LAkWNHaq2R1SQG7GLaSKl9CppJz1M2fjwqJMajn6Pc2KyzpE3vJQUtbNNiR1hWxrPiAXqOwdhpp6X_kozx-WTMF4d_ycihdXugtcVr_aSJHYRN6thy_r1-SMg13DU0Fy_5gJ50J20n17E08xF-kDXrceJRezI_9TsBisMuYKLpABqlBp85egOjX9cFET"
                alt="Verified Skills representation"
              />
              <div>
                <p className="text-xs font-bold text-gray-800">Verified Skills</p>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Trusted by 2k+ Families</p>
              </div>
            </div>

            <div className="bg-white border border-sand-high rounded-2xl p-4 flex items-center gap-3 custom-shadow">
              <div className="w-12 h-12 rounded-lg bg-[#aeedd5] flex items-center justify-center text-[#316d5b]">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">Quality First</p>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Background Checked</p>
              </div>
            </div>

            <div className="bg-white border border-sand-high rounded-2xl p-4 flex items-center gap-3 custom-shadow">
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">Community</p>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Professional Network</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-sand-high w-full mt-12 py-8 px-6 md:px-16">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="font-display text-lg font-bold text-primary">Sanad</span>
          <p className="text-xs text-gray-400 font-medium">
            &copy; 2026 Sanad. All rights reserved. Providing compassionate support.
          </p>
          <div className="flex gap-4">
            <Link href="#" className="text-xs font-medium text-gray-400 hover:text-primary transition-colors underline">
              Privacy Policy
            </Link>
            <Link href="#" className="text-xs font-medium text-gray-400 hover:text-primary transition-colors underline">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
