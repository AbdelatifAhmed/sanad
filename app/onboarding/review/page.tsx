"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  FileText,
  User,
  Shield,
  Clock,
  Briefcase,
  Smile,
  Heart,
  MapPin
} from "lucide-react";

export default function ReviewPage() {
  const router = useRouter();

  // Onboarding states loaded from localStorage
  const [role, setRole] = useState<"companion" | "family" | "">("");
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);

  // Companion specific
  const [specialization, setSpecialization] = useState("");
  const [experience, setExperience] = useState("");
  const [certFile, setCertFile] = useState<{ name: string; size: string } | null>(null);
  const [idFile, setIdFile] = useState<{ name: string; size: string } | null>(null);
  const [bio, setBio] = useState("");

  // Family specific
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [beneficiaryAge, setBeneficiaryAge] = useState("");
  const [beneficiaryGender, setBeneficiaryGender] = useState("");
  const [beneficiaryCategory, setBeneficiaryCategory] = useState("");
  const [beneficiaryCondition, setBeneficiaryCondition] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [fullAddress, setFullAddress] = useState("");

  // Shared
  const [availability, setAvailability] = useState<{ day: string; slots: string[] }[]>([]);
  const [emergencyCare, setEmergencyCare] = useState(true);
  const [hourlyRate, setHourlyRate] = useState("30");
  const [languages, setLanguages] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([]);

  const [declaration, setDeclaration] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Load from local storage
  useEffect(() => {
    // Determine role & register info
    const savedRegisterInfo = localStorage.getItem("onboarding_register_info");
    let detectedRole: "companion" | "family" | "" = "";
    if (savedRegisterInfo) {
      try {
        const info = JSON.parse(savedRegisterInfo);
        if (info.role) {
          detectedRole = info.role;
          setRole(info.role);
        }
        setUser({ name: info.name, email: info.email });
      } catch (e) {
        console.error("Error parsing saved register info", e);
      }
    } else {
      setRole("companion");
      detectedRole = "companion";
    }

    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(prev => ({ ...prev, ...parsed }));
      } catch (e) {}
    }

    // Shared
    const savedAvail = localStorage.getItem("onboarding_availability");
    if (savedAvail) {
      try {
        setAvailability(JSON.parse(savedAvail));
      } catch (e) {}
    }
    const savedEmergency = localStorage.getItem("onboarding_emergency");
    if (savedEmergency) setEmergencyCare(savedEmergency === "true");

    setHourlyRate(localStorage.getItem("onboarding_rate") || "30");
    const savedLangs = localStorage.getItem("onboarding_languages");
    if (savedLangs) {
      try {
        setLanguages(JSON.parse(savedLangs));
      } catch (e) {}
    }
    const savedServices = localStorage.getItem("onboarding_services");
    if (savedServices) {
      try {
        setServices(JSON.parse(savedServices));
      } catch (e) {}
    }

    if (detectedRole === "family") {
      setBeneficiaryName(localStorage.getItem("onboarding_beneficiary_name") || "");
      setBeneficiaryAge(localStorage.getItem("onboarding_beneficiary_age") || "");
      setBeneficiaryGender(localStorage.getItem("onboarding_beneficiary_gender") || "male");
      setBeneficiaryCategory(localStorage.getItem("onboarding_beneficiary_category") || "elderly");
      setBeneficiaryCondition(localStorage.getItem("onboarding_beneficiary_condition") || "");
      setCity(localStorage.getItem("onboarding_address_city") || "");
      setArea(localStorage.getItem("onboarding_address_area") || "");
      setFullAddress(localStorage.getItem("onboarding_address_full") || "");
    } else {
      setSpecialization(localStorage.getItem("onboarding_specialization") || "Companion Care");
      setExperience(localStorage.getItem("onboarding_experience") || "5");
      const savedCert = localStorage.getItem("onboarding_cert_file");
      if (savedCert) setCertFile(JSON.parse(savedCert));
      const savedId = localStorage.getItem("onboarding_id_file");
      if (savedId) setIdFile(JSON.parse(savedId));
      setBio(localStorage.getItem("onboarding_bio") || "");
    }
  }, []);

  const handleSaveAndExit = () => {
    router.push("/login");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!declaration) {
      setErrorMsg("Please certify the declaration checkbox to submit your profile.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      let token = localStorage.getItem("token");
      let currentUser = user;

      // If there is no token, register first with all data
      if (!token) {
        const savedRegisterInfo = localStorage.getItem("onboarding_register_info");
        if (!savedRegisterInfo) {
          throw new Error("Registration details not found. Please go back to the registration page.");
        }

        const registerData = JSON.parse(savedRegisterInfo);

        const registerPayload: any = {
          name: registerData.name,
          email: registerData.email,
          phone: registerData.phone,
          password: registerData.password,
          role: role,
        };

        if (role === "companion") {
          registerPayload.specialization = specialization || "none";
          registerPayload.experience = Number(experience) || 0;
          registerPayload.bio = bio || "Professional companion caregiver ready to assist families.";
          registerPayload.hourlyRate = Number(hourlyRate) || 30;
          registerPayload.skills = services.length > 0 ? services : ["Companion Care", "Elderly Care"];
          registerPayload.hobbies = languages.length > 0 ? languages.map(l => l.toUpperCase()) : ["English", "Arabic"];
          registerPayload.availability = availability;
          registerPayload.emergencyCare = emergencyCare;
          registerPayload.documents = {
            nationalIdUrl: certFile?.name || "N/A",
            criminalRecordUrl: idFile?.name || "N/A",
          };
        } else if (role === "family") {
          registerPayload.address = {
            city: city || "Cairo",
            area: area || "Maadi",
            fullAddress: fullAddress || "N/A"
          };
          registerPayload.beneficiaries = [
            {
              name: beneficiaryName || "Beneficiary",
              age: Number(beneficiaryAge) || 75,
              gender: beneficiaryGender || "male",
              category: beneficiaryCategory || "elderly",
              conditionDetails: beneficiaryCondition || "N/A",
              interests: []
            }
          ];
        }

        const registerRes = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(registerPayload),
        });

        const registerJson = await registerRes.json();

        if (!registerRes.ok) {
          throw new Error(registerJson.message || "Failed to register account.");
        }

        token = registerJson.token;
        currentUser = registerJson.user;

        if (token) {
          localStorage.setItem("token", token);
        }
        if (currentUser) {
          localStorage.setItem("user", JSON.stringify(currentUser));
          setUser(currentUser);
        }
      } else {
        // Fallback update if already authenticated
        if (role === "family") {
          // Submit family profile details
          const response = await fetch("/api/family/profile", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              address: {
                city: city || "Cairo",
                area: area || "Maadi",
                fullAddress: fullAddress || "N/A"
              },
              beneficiaries: [
                {
                  name: beneficiaryName || "Beneficiary",
                  age: Number(beneficiaryAge) || 75,
                  gender: beneficiaryGender || "male",
                  category: beneficiaryCategory || "elderly",
                  conditionDetails: beneficiaryCondition || "N/A",
                  interests: []
                }
              ]
            })
          });

          if (!response.ok) {
            const profileJson = await response.json();
            throw new Error(profileJson.error || profileJson.message || "Failed to update family profile.");
          }
        } else {
          // Submit companion profile details
          const response = await fetch("/api/companion/profile", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              bio: bio || "Professional companion caregiver ready to assist families.",
              hourlyRate: Number(hourlyRate) || 30,
              skills: services.length > 0 ? services : ["Companion Care", "Elderly Care"],
              hobbies: languages.length > 0 ? languages.map(l => l.toUpperCase()) : ["English", "Arabic"],
              availability: availability
            })
          });

          if (!response.ok) {
            const profileJson = await response.json();
            throw new Error(profileJson.error || profileJson.message || "Failed to update companion profile.");
          }
        }
      }

      // Clear local storage draft states for all onboarding keys
      const keysToRemove = [
        "onboarding_register_info",
        "onboarding_specialization",
        "onboarding_experience",
        "onboarding_cert_file",
        "onboarding_id_file",
        "onboarding_availability",
        "onboarding_emergency",
        "onboarding_rate",
        "onboarding_languages",
        "onboarding_services",
        "onboarding_bio",
        "onboarding_beneficiary_name",
        "onboarding_beneficiary_age",
        "onboarding_beneficiary_gender",
        "onboarding_beneficiary_category",
        "onboarding_beneficiary_condition",
        "onboarding_address_city",
        "onboarding_address_area",
        "onboarding_address_full"
      ];
      keysToRemove.forEach(k => localStorage.removeItem(k));

      setShowModal(true);
    } catch (err: any) {
      console.error("Submission failed:", err);
      setErrorMsg(err.message || "An error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!role) {
    return <div className="min-h-screen bg-[#fcf9f6] flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fcf9f6] text-[#1c1c1a] font-body relative">
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
      <main className="flex-grow max-w-4xl w-full mx-auto px-6 md:px-16 py-10">
        <div className="w-full">
          {/* Stepper */}
          <div className="mb-12">
            <div className="flex justify-between items-center relative">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-10 -translate-y-1/2" />
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-primary -z-10 -translate-y-1/2 transition-all duration-500" />
              
              {role === "family" ? (
                <>
                  {/* Step 1 */}
                  <div className="flex flex-col items-center gap-2 bg-[#fcf9f6] px-2 md:px-4">
                    <div className="w-9 h-9 rounded-full bg-[#aeedd5] text-[#316d5b] flex items-center justify-center font-bold">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] md:text-xs font-semibold text-gray-500">Basic Info</span>
                  </div>
                  
                  {/* Step 2 */}
                  <div className="flex flex-col items-center gap-2 bg-[#fcf9f6] px-2 md:px-4">
                    <div className="w-9 h-9 rounded-full bg-[#aeedd5] text-[#316d5b] flex items-center justify-center font-bold">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] md:text-xs font-semibold text-gray-500">Beneficiary</span>
                  </div>
                  
                  {/* Step 3 */}
                  <div className="flex flex-col items-center gap-2 bg-[#fcf9f6] px-2 md:px-4">
                    <div className="w-9 h-9 rounded-full bg-[#aeedd5] text-[#316d5b] flex items-center justify-center font-bold">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] md:text-xs font-semibold text-gray-500">Address Details</span>
                  </div>

                  {/* Step 4 */}
                  <div className="flex flex-col items-center gap-2 bg-[#fcf9f6] px-2 md:px-4">
                    <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold ring-4 ring-primary-container/10">
                      4
                    </div>
                    <span className="text-[10px] md:text-xs font-bold text-primary">Review</span>
                  </div>
                </>
              ) : (
                <>
                  {/* Step 1 */}
                  <div className="flex flex-col items-center gap-2 bg-[#fcf9f6] px-2 md:px-4">
                    <div className="w-9 h-9 rounded-full bg-[#aeedd5] text-[#316d5b] flex items-center justify-center font-bold">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] md:text-xs font-semibold text-gray-500">Basic Info</span>
                  </div>
                  
                  {/* Step 2 */}
                  <div className="flex flex-col items-center gap-2 bg-[#fcf9f6] px-2 md:px-4">
                    <div className="w-9 h-9 rounded-full bg-[#aeedd5] text-[#316d5b] flex items-center justify-center font-bold">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] md:text-xs font-semibold text-gray-500">Qualifications</span>
                  </div>
                  
                  {/* Step 3 */}
                  <div className="flex flex-col items-center gap-2 bg-[#fcf9f6] px-2 md:px-4">
                    <div className="w-9 h-9 rounded-full bg-[#aeedd5] text-[#316d5b] flex items-center justify-center font-bold">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] md:text-xs font-semibold text-gray-500">Availability</span>
                  </div>

                  {/* Step 4 */}
                  <div className="flex flex-col items-center gap-2 bg-[#fcf9f6] px-2 md:px-4">
                    <div className="w-9 h-9 rounded-full bg-[#aeedd5] text-[#316d5b] flex items-center justify-center font-bold">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] md:text-xs font-semibold text-gray-500">Preferences</span>
                  </div>

                  {/* Step 5 */}
                  <div className="flex flex-col items-center gap-2 bg-[#fcf9f6] px-2 md:px-4">
                    <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold ring-4 ring-primary-container/10">
                      5
                    </div>
                    <span className="text-[10px] md:text-xs font-bold text-primary">Review</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-3xl border border-sand-high p-8 md:p-10 custom-shadow space-y-8 text-left">
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-primary mb-2">
                Review &amp; Submit
              </h1>
              <p className="text-gray-500 text-sm md:text-base font-medium">
                Make sure all details and settings are correct before submitting your profile.
              </p>
            </div>

            {errorMsg && (
              <p className="text-red-500 text-xs font-semibold bg-red-50 p-3 rounded-lg border border-red-200">
                {errorMsg}
              </p>
            )}

            <div className="space-y-6">
              {/* Profile Card Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. Dynamic Step 2 Details: Qualifications vs Beneficiary */}
                <div className={`${role === "family" ? "md:col-span-2" : ""} bg-[#fcf9f6] p-6 rounded-2xl border border-sand-high space-y-4`}>
                  <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {role === "family" ? "Beneficiary Profile" : "Personal & Qualifications"}
                  </h3>
                  <hr className="border-sand-high" />
                  <div className="space-y-2.5 text-xs text-gray-600 font-medium">
                    <p><span className="text-gray-400">Account Name:</span> {user?.name || "N/A"}</p>
                    <p><span className="text-gray-400">Account Email:</span> {user?.email || "N/A"}</p>
                    
                    {role === "family" ? (
                      <>
                        <p><span className="text-gray-400">Beneficiary Name:</span> {beneficiaryName || "N/A"}</p>
                        <p><span className="text-gray-400">Age:</span> {beneficiaryAge} Years</p>
                        <p><span className="text-gray-400">Gender:</span> <span className="capitalize">{beneficiaryGender}</span></p>
                        <p><span className="text-gray-400">Category:</span> <span className="capitalize">{beneficiaryCategory?.replace("_", " ")}</span></p>
                        <p><span className="text-gray-400">Condition Details:</span> {beneficiaryCondition || "None"}</p>
                      </>
                    ) : (
                      <>
                        <p><span className="text-gray-400">Caregiver Type:</span> <span className="capitalize">{specialization}</span></p>
                        <p><span className="text-gray-400">Experience:</span> {experience} Years</p>
                        
                        {/* Files review */}
                        <div className="space-y-2 pt-2">
                          {certFile && (
                            <div className="flex items-center gap-2 text-[10px] text-gray-500 bg-white border border-gray-150 p-2 rounded-lg">
                              <FileText className="w-3.5 h-3.5 text-[#1f8a8a] shrink-0" />
                              <span className="truncate">{certFile.name}</span>
                            </div>
                          )}
                          {idFile && (
                            <div className="flex items-center gap-2 text-[10px] text-gray-500 bg-white border border-gray-150 p-2 rounded-lg">
                              <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span className="truncate">{idFile.name}</span>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 2. Availability / Weekly Availability (Companion only) */}
                {role !== "family" && (
                  <div className="bg-[#fcf9f6] p-6 rounded-2xl border border-sand-high space-y-4">
                    <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Weekly Availability
                    </h3>
                    <hr className="border-sand-high" />
                    <div className="max-h-48 overflow-y-auto space-y-1.5 text-xs font-semibold text-gray-600">
                      {availability.length > 0 ? (
                        availability.map(item => (
                          <div key={item.day} className="flex justify-between py-0.5 border-b border-gray-100/50">
                            <span className="text-gray-500 font-medium">{item.day.substring(0, 3)}</span>
                            <span className="text-primary capitalize">{item.slots.join(", ") || "None"}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400 text-xs font-medium">No days/slots selected.</p>
                      )}
                      <div className="pt-2 flex justify-between text-[10px] text-gray-400">
                        <span>Emergency Care:</span>
                        <span className="font-bold text-teal-600">{emergencyCare ? "Allowed" : "Not Allowed"}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Rates & Preferences (Companion) or Residence Address (Family) */}
                <div className="bg-[#fcf9f6] p-6 rounded-2xl border border-sand-high md:col-span-2 space-y-4">
                  {role === "family" ? (
                    <>
                      <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Residence Address
                      </h3>
                      <hr className="border-sand-high" />
                      <div className="bg-white p-4 rounded-xl border border-gray-200 text-xs font-medium text-gray-500 leading-relaxed space-y-2">
                        <p><span className="font-bold text-gray-700">City:</span> {city || "N/A"}</p>
                        <p><span className="font-bold text-gray-700">Area / District:</span> {area || "N/A"}</p>
                        <p><span className="font-bold text-gray-700">Street / Building Address:</span> {fullAddress || "N/A"}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        Preferences & Services
                      </h3>
                      <hr className="border-sand-high" />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium text-gray-600">
                        <div>
                          <p className="text-gray-400">Hourly Rate:</p>
                          <p className="text-sm font-bold text-gray-800 mt-1">${hourlyRate} / hour</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Languages Spoken:</p>
                          <p className="text-sm font-bold text-gray-800 mt-1 capitalize">{languages.join(", ") || "Arabic, English"}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Services:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {services.map(s => (
                              <span key={s} className="bg-white border border-gray-200 text-gray-500 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      {bio && (
                        <div className="bg-white p-3.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-500 leading-relaxed">
                          <p className="font-bold text-gray-700 mb-1">Bio Summary:</p>
                          "{bio}"
                        </div>
                      )}
                    </>
                  )}
                </div>

              </div>

              {/* Declaration Checkbox */}
              <div className="p-4 bg-teal-50/10 rounded-2xl border border-primary/10 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="declaration-cb"
                  checked={declaration}
                  onChange={(e) => {
                    setDeclaration(e.target.checked);
                    setErrorMsg("");
                  }}
                  className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300 mt-0.5 cursor-pointer"
                />
                <label htmlFor="declaration-cb" className="text-xs text-gray-500 font-medium leading-relaxed cursor-pointer select-none">
                  {role === "family"
                    ? "I certify that all beneficiary information, care preferences, and residence details provided in this form are accurate and valid. I agree to Sanad's service guidelines."
                    : "I certify that all documents, professional years of experience, and credentials provided in this form are accurate and valid. I agree to Sanad's onboarding background check guidelines."}
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 flex justify-between items-center border-t border-sand-high">
                <button
                  type="button"
                  onClick={() => router.push("/onboarding/preferences")}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-bold text-gray-500 hover:text-primary hover:bg-gray-50 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="group flex items-center justify-center gap-1.5 px-8 py-3.5 bg-primary text-white rounded-xl font-bold text-base shadow-md hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Submit Profile"}
                </button>
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

      {/* Success Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 text-center shadow-2xl space-y-6 transform scale-100 transition-all duration-300">
            <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto text-[#1f8a8a]">
              <Smile className="w-10 h-10" />
            </div>
            <div>
              <h2 className="font-display text-xl md:text-2xl font-bold text-primary">You're All Set!</h2>
              <p className="text-gray-500 text-xs md:text-sm font-medium mt-2 leading-relaxed">
                {role === "family"
                  ? "Your family profile has been successfully submitted. You can now start searching and matching with companion caregivers."
                  : "Your profile has been submitted for review. We'll notify you as soon as you're verified and ready to take your first booking."}
              </p>
            </div>
            <button
              onClick={() => router.push(role === "family" ? "/family" : "/companion")}
              className="w-full bg-primary text-white py-3.5 rounded-xl font-bold text-base hover:opacity-95 transition-all cursor-pointer shadow-md shadow-primary/15"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
