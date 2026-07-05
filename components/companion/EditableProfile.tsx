"use client";

import React, { useState, useEffect } from "react";
import { 
  CompanionProfile, 
  getMyProfile, 
  updateProfileInfo, 
  updateAvailability, 
  getCompanionReviews,
  SkillItem
} from "@/lib/api/companion.api";
import { uploadUserAvatar } from "@/lib/api/upload.api";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/services/api";
import { 
  Star, MapPin, Edit2, Check, X, Camera, Plus, Loader2, Upload, Calendar, Clock, FileText, VerifiedIcon, CheckCircle2,
  UploadCloud, Lock, Trash2, ShieldAlert, AlertCircle, Info, ChevronRight
} from "lucide-react";
import { useLocale } from "next-intl";

interface EditableProfileProps {
  initialData: CompanionProfile | null;
}

export default function EditableProfile({ initialData }: EditableProfileProps) {
  const locale = useLocale();
  const router = useRouter();
  const [profile, setProfile] = useState<CompanionProfile | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [saving, setSaving] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [docUploading, setDocUploading] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Change Password state
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState<boolean>(false);

  // Delete Account state
  const [confirmDeleteAccountOpen, setConfirmDeleteAccountOpen] = useState<boolean>(false);
  const [deletingAccount, setDeletingAccount] = useState<boolean>(false);
  
  // Edit states
  const [editMode, setEditMode] = useState<{
    info: boolean;
    skills: boolean;
    schedule: boolean;
  }>({ info: false, skills: false, schedule: false });

  // Temporary edit values
  const [bioEdit, setBioEdit] = useState("");
  const [hobbiesEdit, setHobbiesEdit] = useState<string>("");
  const [skillsEdit, setSkillsEdit] = useState<string[]>([]);
  const [newSkillText, setNewSkillText] = useState("");
  const [scheduleEdit, setScheduleEdit] = useState<Array<{ day: string; slots: string[] }>>([]);
  const [dbSkills, setDbSkills] = useState<SkillItem[]>([]);
  const [hourlyRateEdit, setHourlyRateEdit] = useState<number>(0);
  const [phoneEdit, setPhoneEdit] = useState("");

  // New Certificate Upload State
  const [showCertUpload, setShowCertUpload] = useState(false);
  const [certName, setCertName] = useState("");
  const [certFile, setCertFile] = useState<File | null>(null);

  const [avatarLoading, setAvatarLoading] = useState(false);
  const [dragActive, setDragActive] = useState<{ [key: string]: boolean }>({});

  // Online / Offline Status State
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("caregiver_online_status");
      return saved !== null ? saved === "true" : true;
    }
    return true;
  });

  const toggleOnlineStatus = () => {
    const nextStatus = !isOnline;
    setIsOnline(nextStatus);
    if (typeof window !== "undefined") {
      localStorage.setItem("caregiver_online_status", String(nextStatus));
    }
    setToast({
      message: `You are now ${nextStatus ? "Online" : "Offline"}`,
      type: "info",
    });
  };

  useEffect(() => {
    if (!initialData) {
      fetchProfile();
    } else if (initialData.userId?._id) {
      fetchReviews(initialData.userId._id);
    }
  }, [initialData]);

  // Auto-clear toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setToast({
        message: locale === "ar" ? "يرجى ملء جميع الحقول." : "Please fill in all fields.",
        type: "error"
      });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setToast({
        message: locale === "ar" ? "كلمتا المرور الجديدتان غير متطابقتين." : "New passwords do not match.",
        type: "error"
      });
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setToast({
        message: locale === "ar" 
          ? "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل، وتحتوي على حرف كبير، وحرف صغير، ورقم، ورمز خاص واحد على الأقل." 
          : "Password must be at least 8 characters long, containing at least one uppercase letter, one lowercase letter, one number, and one symbol.",
        type: "error"
      });
      return;
    }

    try {
      setChangingPassword(true);
      const res = await api.put("/auth/change-password", {
        currentPassword,
        newPassword
      });
      if (res.data) {
        setToast({ 
          message: locale === "ar" ? "تم تغيير كلمة المرور بنجاح." : (res.data.message || "Password changed successfully."), 
          type: "success" 
        });
        setChangePasswordModalOpen(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      }
    } catch (err: any) {
      console.error("Failed to change password:", err);
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to change password.";
      setToast({ message: msg, type: "error" });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeletingAccount(true);
      const res = await api.delete("/auth/delete-account");
      if (res.data) {
        setToast({ 
          message: locale === "ar" ? "تم حذف الحساب بنجاح." : (res.data.message || "Account deleted successfully."), 
          type: "success" 
        });
        // Clear auth store
        useAuthStore.getState().clearAuth();
        // Redirect to login page after a short delay
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      }
    } catch (err: any) {
      console.error("Failed to delete account:", err);
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to delete account.";
      setToast({ message: msg, type: "error" });
      setDeletingAccount(false);
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await getMyProfile();
      setProfile(data);
      if (data.userId?._id) {
        fetchReviews(data.userId._id);
      }
    } catch (error) {
      console.error("Failed to load profile", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (userId: string) => {
    try {
      setReviewsLoading(true);
      const data = await getCompanionReviews(userId);
      if (data && data.reviews) {
        setReviews(data.reviews);
      }
    } catch (error) {
      console.error("Failed to load reviews", error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setAvatarLoading(true);
      const result = await uploadUserAvatar(file);
      if (profile) {
        setProfile({
          ...profile,
          userId: {
            ...profile.userId,
            avatar: result.avatar
          }
        });
      }
    } catch (error) {
      console.error("Avatar upload failed", error);
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleDocumentUpload = async (docType: 'nationalIdCard' | 'criminalRecord' | 'Certificates', file: File, name?: string) => {
    try {
      setDocUploading(true);
      const formData = new FormData();
      formData.append(docType, file);
      if (docType === 'Certificates' && name) {
        formData.append('certificateName', name);
      }

      const { api } = await import("@/lib/services/api");
      const response = await api.post("/upload/companion/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      if (profile && response.data.documents) {
        setProfile({
          ...profile,
          documents: response.data.documents
        });
      }
      
      // Reset cert upload modal
      setShowCertUpload(false);
      setCertName("");
      setCertFile(null);
    } catch (error) {
      console.error("Document upload failed", error);
    } finally {
      setDocUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent, docType: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(prev => ({ ...prev, [docType]: true }));
    } else if (e.type === "dragleave") {
      setDragActive(prev => ({ ...prev, [docType]: false }));
    }
  };

  const handleDrop = async (e: React.DragEvent, docType: 'nationalIdCard' | 'criminalRecord' | 'Certificates', certNameText?: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [docType]: false }));
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
      if (!validTypes.includes(file.type)) {
        alert(locale === "ar" ? "نوع الملف غير صالح. يرجى تحميل ملف PDF أو صورة JPEG/PNG" : "Invalid file type. Please upload a PDF or JPEG/PNG image.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(locale === "ar" ? "حجم الملف كبير جداً. يجب أن يكون أقل من 5 ميجابايت." : "File is too large. Must be under 5MB.");
        return;
      }
      handleDocumentUpload(docType, file, certNameText);
    }
  };

  const saveInfo = async () => {
    try {
      setSaving(true);
      const hobbiesArray = hobbiesEdit.split(",").map(h => h.trim()).filter(h => h !== "");
      
      // Update User collection details (phone number)
      await api.put("/auth/profile", {
        phone: phoneEdit.trim()
      });

      const result = await updateProfileInfo({ 
        bio: bioEdit, 
        hobbies: hobbiesArray,
        hourlyRate: Number(hourlyRateEdit)
      });
      if (profile) {
        setProfile({ 
          ...profile, 
          bio: result.bio || bioEdit, 
          hobbies: result.hobbies || hobbiesArray,
          hourlyRate: result.hourlyRate !== undefined ? result.hourlyRate : Number(hourlyRateEdit),
          userId: {
            ...profile.userId,
            phone: phoneEdit.trim()
          }
        });
      }
      setEditMode({ ...editMode, info: false });
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const saveSkills = async () => {
    try {
      setSaving(true);
      const result = await updateProfileInfo({ skills: skillsEdit });
      // Fetch profile again to get populated skills
      await fetchProfile();
      setEditMode({ ...editMode, skills: false });
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const saveSchedule = async () => {
    try {
      setSaving(true);
      const result = await updateAvailability(scheduleEdit);
      if (profile) {
        setProfile({ ...profile, availability: result.data?.availability || scheduleEdit });
      }
      setEditMode({ ...editMode, schedule: false });
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const loadDbSkills = async () => {
    try {
      const { getAllSkills } = await import("@/lib/api/companion.api");
      const list = await getAllSkills();
      setDbSkills(list || []);
    } catch (err) {
      console.error("Failed to load skills from DB", err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-stitch-primary" />
      </div>
    );
  }

  if (!profile) {
    return <div className="text-center py-10">Failed to load profile.</div>;
  }

  // Calculate Profile Strength
  let strength = 0;
  if (profile.bio) strength += 20;
  if (profile.hobbies && profile.hobbies.length > 0) strength += 10;
  if (profile.skills && profile.skills.length > 0) strength += 20;
  if (profile.availability && profile.availability.length > 0) strength += 20;
  if (profile.documents?.nationalIdCard && profile.documents.nationalIdCard.public_id) strength += 15;
  if (profile.documents?.criminalRecord && profile.documents.criminalRecord.public_id) strength += 15;

  const hasNationalId = profile.documents?.nationalIdCard && profile.documents.nationalIdCard.url && !profile.documents.nationalIdCard.url.includes("placeholder");
  const hasCriminalRecord = profile.documents?.criminalRecord && profile.documents.criminalRecord.url && !profile.documents.criminalRecord.url.includes("placeholder");

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* HEADER SECTION */}
      <div className="bg-[#FCF9F6] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 relative shadow-sm border border-gray-100">
        
        {/* Avatar */}
        <div className="relative group shrink-0">
          <div className="w-32 h-32 rounded-[2rem] overflow-hidden border-4 border-white shadow-md bg-white flex items-center justify-center relative">
            {avatarLoading ? (
              <Loader2 className="w-8 h-8 animate-spin text-stitch-primary" />
            ) : profile.userId?.avatar?.url ? (
              <img src={profile.userId.avatar.url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl text-gray-300 font-bold">{profile.userId?.name?.charAt(0) || "U"}</span>
            )}
          </div>
          <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-stitch-primary text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-stitch-primary-container transition-colors z-10">
            <Edit2 className="w-4 h-4" />
            <input type="file" className="hidden" accept="image/jpeg, image/png" onChange={handleAvatarChange} disabled={avatarLoading} />
          </label>
        </div>

        {/* Info */}
        <div className="flex-1 text-center md:text-left md:mt-2">
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-gray-900">{profile.userId?.name}</h1>
            {profile.verificationStatus === 'verified' && (
              <span className="inline-flex items-center gap-1 bg-teal-50 text-stitch-primary text-xs font-bold px-3 py-1 rounded-full border border-teal-100">
                Verified
              </span>
            )}
          </div>
          
          <p className="text-gray-600 text-lg mb-4">
            {profile.companionType === 'specialized' ? 'Compassionate Specialist' : 'General Care Provider'} 
            {profile.specialization && profile.specialization !== 'none' && ` in ${profile.specialization.replace("_", " ")}`}
          </p>
          
          <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-gray-600 font-medium">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 text-teal-600 fill-teal-600" />
              <span className="text-gray-900 font-bold">{profile.rating || 5.0}</span>
              <span className="text-gray-500 font-normal">({profile.reviewCount || 0} reviews)</span>
            </div>
            <div className="w-px h-4 bg-gray-300"></div>
            <div className="flex items-center gap-1">
              <MapPin className="w-5 h-5 text-gray-400" />
              <span>{profile.userId?.location?.city ? `${profile.userId.location.city}, Egypt` : "Location not set"}</span>
            </div>
            <div className="w-px h-4 bg-gray-300"></div>
            <div className="flex items-center gap-1">
              <span className="text-gray-900 font-bold">${profile.hourlyRate || 0}</span>
              <span className="text-gray-500 font-normal">/ hour</span>
            </div>
          </div>
        </div>

        {/* Top Right Actions */}
        <div className="flex flex-col items-center md:items-end gap-4 shrink-0">
          <div className="flex items-center gap-3 bg-gray-100 px-4 py-2 rounded-full">
            <span className="text-sm font-bold text-gray-700">Status:</span>
            <div className="flex flex-col text-xs">
              <span className={`font-bold transition-colors ${isOnline ? "text-teal-600" : "text-gray-500"}`}>
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>
            {/* Interactive Toggle */}
            <button 
              onClick={toggleOnlineStatus}
              className={`w-10 h-6 rounded-full flex items-center p-1 transition-all duration-300 ${isOnline ? "bg-teal-500 justify-end" : "bg-gray-300 justify-start"}`}
              title="Toggle Online Status"
            >
              <div className="w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300"></div>
            </button>
          </div>
          <button 
            onClick={() => {
              if (profile?._id) {
                router.push(`/family/companions/${profile._id}`);
              } else {
                setToast({ message: "Unable to resolve profile ID", type: "error" });
              }
            }}
            disabled={!profile?._id}
            className="px-6 py-3 bg-stitch-primary text-white font-bold rounded-xl hover:bg-stitch-primary-container transition-colors shadow-sm w-full md:w-auto disabled:opacity-50"
          >
            View Public Profile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Personal Information */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
              {!editMode.info ? (
                <button onClick={() => { 
                  setBioEdit(profile.bio || ""); 
                  setHobbiesEdit(profile.hobbies?.join(", ") || "");
                  setHourlyRateEdit(profile.hourlyRate || 0);
                  setPhoneEdit(profile.userId?.phone || "");
                  setEditMode({ ...editMode, info: true }); 
                }} className="text-stitch-primary font-bold text-sm hover:underline">
                  Edit Info
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setEditMode({ ...editMode, info: false })} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                  <button onClick={saveInfo} disabled={saving} className="p-2 text-white bg-stitch-primary hover:bg-stitch-primary-container rounded-lg">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2 col-span-2 md:col-span-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
                <div className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-700 cursor-not-allowed">
                  {profile.userId?.name}
                </div>
              </div>
              <div className="space-y-2 col-span-2 md:col-span-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Email Address</label>
                <div className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-700 cursor-not-allowed">
                  {profile.userId?.email}
                </div>
              </div>
              <div className="space-y-2 col-span-2 md:col-span-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Phone Number</label>
                {editMode.info ? (
                  <input 
                    type="tel"
                    className="w-full p-4 border border-stitch-outline rounded-xl focus:ring-2 focus:ring-stitch-primary focus:border-transparent outline-none text-gray-700"
                    value={phoneEdit}
                    onChange={(e) => setPhoneEdit(e.target.value)}
                    placeholder="e.g. 01012345678"
                  />
                ) : (
                  <div className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl text-gray-700 leading-relaxed font-bold">
                    {profile.userId?.phone || "Not set"}
                  </div>
                )}
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Hourly Rate ($/hr)</label>
                {editMode.info ? (
                  <input 
                    type="number"
                    min="0"
                    className="w-full p-4 border border-stitch-outline rounded-xl focus:ring-2 focus:ring-stitch-primary focus:border-transparent outline-none text-gray-700"
                    value={hourlyRateEdit}
                    onChange={(e) => setHourlyRateEdit(Number(e.target.value))}
                    placeholder="e.g. 150"
                  />
                ) : (
                  <div className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl text-gray-700 leading-relaxed font-bold">
                    ${profile.hourlyRate || 0}/hr
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Bio & Philosophy</label>
                {editMode.info ? (
                  <textarea 
                    className="w-full p-4 border border-stitch-outline rounded-xl focus:ring-2 focus:ring-stitch-primary focus:border-transparent outline-none min-h-[140px] text-gray-700"
                    value={bioEdit}
                    onChange={(e) => setBioEdit(e.target.value)}
                    placeholder="Tell families about yourself..."
                  />
                ) : (
                  <div className="w-full p-6 bg-gray-50 border border-gray-100 rounded-2xl text-gray-700 leading-relaxed min-h-[120px]">
                    {profile.bio || "No bio provided yet. Add a bio to attract more families!"}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Hobbies</label>
                {editMode.info ? (
                  <input 
                    type="text"
                    className="w-full p-4 border border-stitch-outline rounded-xl focus:ring-2 focus:ring-stitch-primary focus:border-transparent outline-none text-gray-700"
                    value={hobbiesEdit}
                    onChange={(e) => setHobbiesEdit(e.target.value)}
                    placeholder="Reading, Chess, Walking... (comma separated)"
                  />
                ) : (
                  <div className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl text-gray-700 leading-relaxed">
                    {profile.hobbies && profile.hobbies.length > 0 ? profile.hobbies.join(", ") : "No hobbies listed."}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Specialties & Skills */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Specialties & Skills</h2>
              {!editMode.skills ? (
                <button onClick={() => { 
                  // Map existing skills to their names for editing
                  const currentNames = profile.skills?.map(s => typeof s === 'string' ? s : (locale === 'ar' ? s.nameAr : s.nameEn)) || [];
                  setSkillsEdit(currentNames);
                  setEditMode({ ...editMode, skills: true }); 
                  loadDbSkills();
                }} className="text-stitch-primary font-bold text-sm hover:underline">
                  Manage Tags
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setEditMode({ ...editMode, skills: false })} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                  <button onClick={saveSkills} disabled={saving} className="p-2 text-white bg-stitch-primary hover:bg-stitch-primary-container rounded-lg">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              {!editMode.skills ? (
                profile.skills && profile.skills.length > 0 ? profile.skills.map((skill: any, index) => {
                  const skillName = typeof skill === 'string' 
                    ? skill 
                    : (locale === 'ar' ? skill.nameAr : skill.nameEn) || "Skill";
                  
                  return (
                    <div key={index} className="bg-stitch-secondary-container/50 text-stitch-on-secondary-container px-4 py-2 rounded-full text-sm font-bold border border-stitch-secondary-container">
                      {skillName}
                    </div>
                  );
                }) : (
                  <span className="text-gray-400 text-sm italic">No skills listed yet.</span>
                )
              ) : (
                <div className="w-full space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {skillsEdit.map((skill, index) => (
                      <div key={index} className="flex items-center gap-2 bg-stitch-secondary-container/50 text-stitch-on-secondary-container px-4 py-2 rounded-full text-sm font-bold border border-stitch-secondary-container">
                        {skill}
                        <button onClick={() => setSkillsEdit(skillsEdit.filter((_, i) => i !== index))} className="hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      className="flex-1 p-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-stitch-primary"
                      placeholder="Type a skill..."
                      value={newSkillText}
                      onChange={(e) => setNewSkillText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newSkillText.trim()) {
                          e.preventDefault();
                          if (!skillsEdit.includes(newSkillText.trim())) {
                            setSkillsEdit([...skillsEdit, newSkillText.trim()]);
                          }
                          setNewSkillText("");
                        }
                      }}
                    />
                    <button 
                      onClick={() => {
                        if (newSkillText.trim() && !skillsEdit.includes(newSkillText.trim())) {
                          setSkillsEdit([...skillsEdit, newSkillText.trim()]);
                          setNewSkillText("");
                        }
                      }}
                      className="px-4 py-2 bg-stitch-primary text-white rounded-xl font-bold hover:bg-stitch-primary-container"
                    >
                      Add Custom
                    </button>
                  </div>

                  {/* Suggestions list from Database */}
                  {dbSkills.filter(s => {
                    const name = locale === 'ar' ? s.nameAr : s.nameEn;
                    const matchesQuery = name.toLowerCase().includes(newSkillText.toLowerCase());
                    const notSelected = !skillsEdit.includes(name);
                    return matchesQuery && notSelected;
                  }).length > 0 && (
                    <div className="space-y-2 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-xs font-bold text-gray-500 uppercase">Suggested Skills</p>
                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                        {dbSkills.filter(s => {
                          const name = locale === 'ar' ? s.nameAr : s.nameEn;
                          const matchesQuery = name.toLowerCase().includes(newSkillText.toLowerCase());
                          const notSelected = !skillsEdit.includes(name);
                          return matchesQuery && notSelected;
                        }).map(s => {
                          const name = locale === 'ar' ? s.nameAr : s.nameEn;
                          return (
                            <button
                              type="button"
                              key={s._id}
                              onClick={() => {
                                setSkillsEdit([...skillsEdit, name]);
                                setNewSkillText("");
                              }}
                              className="px-3 py-1.5 bg-white hover:bg-stitch-primary/10 hover:text-stitch-primary text-gray-600 rounded-full text-xs font-bold border border-gray-200 transition-colors shadow-sm"
                            >
                              + {name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Schedule (Modern UI Redesign) */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Weekly Schedule</h2>
              {!editMode.schedule ? (
                <button onClick={() => { setScheduleEdit(profile.availability || []); setEditMode({ ...editMode, schedule: true }); }} className="text-stitch-primary font-bold text-sm hover:underline">
                  Edit Schedule
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setEditMode({ ...editMode, schedule: false })} className="px-3 py-1.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg">
                    Cancel
                  </button>
                  <button onClick={saveSchedule} disabled={saving} className="px-3 py-1.5 text-sm font-bold text-white bg-stitch-primary hover:bg-stitch-primary-container rounded-lg flex items-center gap-1">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                  </button>
                </div>
              )}
            </div>

            {editMode.schedule ? (
              <div className="space-y-3">
                {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(day => {
                  const currentDay = scheduleEdit.find(s => s.day === day);
                  const isWorking = !!currentDay && currentDay.slots.length > 0;

                  return (
                    <div key={day} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-2xl transition-colors ${isWorking ? 'border-stitch-outline bg-gray-50/50' : 'border-gray-100 bg-white'}`}>
                      <div className="flex items-center justify-between w-full sm:w-auto mb-3 sm:mb-0">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={isWorking}
                            className="w-5 h-5 text-stitch-primary rounded border-gray-300 focus:ring-stitch-primary"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setScheduleEdit([...scheduleEdit, { day, slots: ["09:00-17:00"] }]);
                              } else {
                                setScheduleEdit(scheduleEdit.filter(s => s.day !== day));
                              }
                            }}
                          />
                          <span className={`font-bold ${isWorking ? 'text-gray-900' : 'text-gray-500'}`}>{day}</span>
                        </label>
                      </div>
                      
                      <div className="flex-1 sm:px-6">
                        {isWorking && (
                          <input 
                            type="text" 
                            className="w-full text-sm p-2.5 border border-gray-200 rounded-xl focus:border-stitch-primary outline-none"
                            placeholder="e.g. 09:00-17:00"
                            value={currentDay.slots.join(", ")}
                            onChange={(e) => {
                              const slots = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                              const newSchedule = scheduleEdit.filter(s => s.day !== day);
                              setScheduleEdit([...newSchedule, { day, slots }]);
                            }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.availability && profile.availability.length > 0 ? (
                  profile.availability.map((a, i) => (
                    <div key={i} className="flex flex-col p-5 bg-gray-50 border border-gray-100 rounded-2xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-5 h-5 text-stitch-primary" />
                        <p className="font-bold text-gray-900">{a.day}</p>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">{a.slots.join(", ")}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic col-span-2">No schedule set. Please add your availability.</p>
                )}
              </div>
            )}
          </div>

          {/* Reviews from Families */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Reviews from Families</h2>
              <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                <span>Sort by:</span>
                <span className="text-stitch-primary cursor-pointer">Recent</span>
              </div>
            </div>

            {reviewsLoading ? (
              <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-stitch-primary" /></div>
            ) : reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map((review, i) => (
                  <div key={i} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                          {review.familyId?.name?.substring(0, 2).toUpperCase() || "FA"}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{review.familyId?.name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex">
                        {[1,2,3,4,5].map(star => (
                          <Star key={star} className={`w-4 h-4 ${star <= review.rating ? 'text-teal-600 fill-teal-600' : 'text-gray-300'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                  </div>
                ))}
                
                <button className="w-full py-3 mt-4 border border-gray-200 rounded-xl text-stitch-primary font-bold hover:bg-gray-50 transition-colors">
                  View All {profile.reviewCount || reviews.length} Reviews
                </button>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-6">No reviews yet.</p>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Certifications (Documents) */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 font-stitch-body">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {locale === "ar" ? "المستندات والشهادات والتوثيق" : "Verification & Certificates"}
              </h2>
            </div>

            <div className="space-y-6">

              {/* National ID Card (بطاقة الرقم القومي) */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 block">
                  {locale === "ar" ? "بطاقة الرقم القومي (مطلوبة)" : "National ID Card (Required)"}
                </label>
                <div 
                  onDragEnter={(e) => handleDrag(e, "nationalIdCard")}
                  onDragLeave={(e) => handleDrag(e, "nationalIdCard")}
                  onDragOver={(e) => handleDrag(e, "nationalIdCard")}
                  onDrop={(e) => handleDrop(e, "nationalIdCard")}
                  className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center relative ${
                    dragActive["nationalIdCard"]
                      ? "border-stitch-primary bg-stitch-primary/5"
                      : hasNationalId
                      ? "border-teal-500 bg-teal-50/20"
                      : "border-dashed border-gray-300 hover:border-stitch-primary hover:bg-gray-50/50"
                  }`}
                >
                  {hasNationalId ? (
                    <div className="space-y-3">
                      <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto text-teal-600">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-950">
                          {locale === "ar" ? "تم رفع بطاقة الرقم القومي" : "National ID Card Uploaded"}
                        </p>
                        <a 
                          href={profile.documents?.nationalIdCard?.url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-xs text-stitch-primary font-bold hover:underline inline-flex items-center gap-1 mt-1 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          {locale === "ar" ? "معاينة المستند" : "Preview Document"}
                        </a>
                      </div>
                    </div>
                  ) : (
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer py-4">
                      <UploadCloud className="w-10 h-10 text-gray-400 mb-2" />
                      <p className="text-sm font-semibold text-gray-700">
                        {locale === "ar" ? "اسحب وأفلت صورة البطاقة هنا أو تصفح" : "Drag & drop ID photo here or browse"}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PDF, JPG, PNG (Max 5MB)
                      </p>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept=".pdf,image/jpeg,image/png" 
                        onChange={(e) => e.target.files?.[0] && handleDocumentUpload('nationalIdCard', e.target.files[0])}
                        disabled={docUploading}
                      />
                    </label>
                  )}
                  {docUploading && (
                    <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-stitch-primary" />
                    </div>
                  )}
                </div>
              </div>

              {/* Criminal Record Certificate (الفيش الجنائي) */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 block">
                  {locale === "ar" ? "صحيفة الحالة الجنائية - الفيش والتشبيه (مطلوب)" : "Criminal Record Certificate (Required)"}
                </label>
                <div 
                  onDragEnter={(e) => handleDrag(e, "criminalRecord")}
                  onDragLeave={(e) => handleDrag(e, "criminalRecord")}
                  onDragOver={(e) => handleDrag(e, "criminalRecord")}
                  onDrop={(e) => handleDrop(e, "criminalRecord")}
                  className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center relative ${
                    dragActive["criminalRecord"]
                      ? "border-stitch-primary bg-stitch-primary/5"
                      : hasCriminalRecord
                      ? "border-teal-500 bg-teal-50/20"
                      : "border-dashed border-gray-300 hover:border-stitch-primary hover:bg-gray-50/50"
                  }`}
                >
                  {hasCriminalRecord ? (
                    <div className="space-y-3">
                      <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto text-teal-600">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-950">
                          {locale === "ar" ? "تم رفع الفيش الجنائي" : "Criminal Record Uploaded"}
                        </p>
                        <a 
                          href={profile.documents?.criminalRecord?.url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-xs text-stitch-primary font-bold hover:underline inline-flex items-center gap-1 mt-1 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          {locale === "ar" ? "معاينة المستند" : "Preview Document"}
                        </a>
                      </div>
                    </div>
                  ) : (
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer py-4">
                      <UploadCloud className="w-10 h-10 text-gray-400 mb-2" />
                      <p className="text-sm font-semibold text-gray-700">
                        {locale === "ar" ? "اسحب وأفلت الفيش الجنائي هنا أو تصفح" : "Drag & drop criminal record here or browse"}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PDF, JPG, PNG (Max 5MB)
                      </p>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept=".pdf,image/jpeg,image/png" 
                        onChange={(e) => e.target.files?.[0] && handleDocumentUpload('criminalRecord', e.target.files[0])}
                        disabled={docUploading}
                      />
                    </label>
                  )}
                  {docUploading && (
                    <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-stitch-primary" />
                    </div>
                  )}
                </div>
              </div>

              {/* Certificates & Professional Licenses */}
              <div className="space-y-4 pt-2">
                <label className="text-sm font-bold text-gray-700 block">
                  {locale === "ar" ? "الشهادات المهنية والتراخيص الطبية" : "Professional Certificates & Medical Licenses"}
                </label>
                
                {profile.documents?.Certificates?.map((cert: any, i: number) => (
                  <div key={i} className="bg-gray-50 p-4 rounded-2xl border border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">{cert.name}</h4>
                        <a 
                          href={cert.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-xs text-stitch-primary hover:underline font-semibold flex items-center gap-1 mt-0.5"
                        >
                          {locale === "ar" ? "عرض المستند" : "View Document"}
                        </a>
                      </div>
                    </div>
                    <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full uppercase">
                      {locale === "ar" ? "موثق" : "Verified"}
                    </span>
                  </div>
                ))}

                {showCertUpload ? (
                  <div className="bg-gray-50/50 p-4 rounded-2xl border border-dashed border-gray-300 space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600 block">
                        {locale === "ar" ? "اسم الشهادة" : "Certificate Name"}
                      </label>
                      <input 
                        type="text" 
                        placeholder={locale === "ar" ? "مثال: شهادة ممارسة مهنة التمريض" : "e.g. Nursing Practice License"} 
                        value={certName}
                        onChange={e => setCertName(e.target.value)}
                        className="w-full text-sm p-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-stitch-primary focus:ring-1 focus:ring-stitch-primary"
                      />
                    </div>

                    <div 
                      onDragEnter={(e) => handleDrag(e, "Certificates")}
                      onDragLeave={(e) => handleDrag(e, "Certificates")}
                      onDragOver={(e) => handleDrag(e, "Certificates")}
                      onDrop={(e) => handleDrop(e, "Certificates", certName)}
                      className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center bg-white ${
                        dragActive["Certificates"]
                          ? "border-stitch-primary bg-stitch-primary/5"
                          : certFile
                          ? "border-teal-500 bg-teal-50/20"
                          : "border-dashed border-gray-300 hover:border-stitch-primary hover:bg-gray-50/50"
                      }`}
                    >
                      {certFile ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-teal-600" />
                          <span className="text-sm font-semibold text-gray-800 truncate max-w-[200px]">{certFile.name}</span>
                        </div>
                      ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                          <UploadCloud className="w-8 h-8 text-gray-400 mb-1" />
                          <p className="text-xs font-semibold text-gray-700">
                            {locale === "ar" ? "اسحب وأفلت شهادة هنا أو تصفح" : "Drag & drop certificate here or browse"}
                          </p>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept=".pdf,image/jpeg,image/png" 
                            onChange={(e) => setCertFile(e.target.files?.[0] || null)}
                          />
                        </label>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button 
                        onClick={() => { setShowCertUpload(false); setCertFile(null); setCertName(""); }} 
                        className="text-xs font-bold text-gray-500 px-4 py-2 hover:bg-gray-150 rounded-xl"
                      >
                        {locale === "ar" ? "إلغاء" : "Cancel"}
                      </button>
                      <button 
                        onClick={() => certFile && certName && handleDocumentUpload('Certificates', certFile, certName)}
                        disabled={!certFile || !certName || docUploading}
                        className="text-xs font-bold text-white bg-stitch-primary px-4 py-2 rounded-xl disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {docUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (locale === "ar" ? "رفع الآن" : "Upload")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowCertUpload(true)}
                    className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500 hover:text-stitch-primary hover:border-stitch-primary hover:bg-stitch-primary/5 transition-all font-bold text-sm flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {locale === "ar" ? "إضافة شهادة مهنية جديدة" : "Add New Professional Certificate"}
                  </button>
                )}

              </div>

            </div>
          </div>

          {/* Profile Strength */}
          <div className="bg-stitch-primary rounded-3xl p-8 shadow-sm text-white">
            <h2 className="text-xl font-bold mb-2">Profile Strength</h2>
            <p className="text-sm text-teal-100 mb-6 leading-relaxed">
              Complete your profile to increase visibility to families.
            </p>
            
            <div className="mb-2 h-2 w-full bg-teal-800 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: `${Math.min(strength, 100)}%` }}></div>
            </div>
            
            <div className="flex items-center justify-between font-bold text-sm">
              <span>{Math.min(strength, 100)}% Complete</span>
              {strength < 100 && (
                <button className="underline hover:text-teal-200">Complete Now</button>
              )}
            </div>
          </div>

          {/* Account Security Settings */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-6 font-stitch-body">
            <h2 className="text-xl font-bold text-gray-900">
              {locale === "ar" ? "إعدادات الأمان" : "Security Settings"}
            </h2>
            <div className="space-y-4">
              {/* Change Password Button */}
              <button 
                onClick={() => setChangePasswordModalOpen(true)}
                className="w-full flex items-center justify-between p-4 bg-slate-50 border border-gray-200 rounded-2xl hover:bg-slate-100 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">
                      {locale === "ar" ? "تغيير كلمة المرور" : "Change Password"}
                    </h4>
                    <p className="text-[10px] text-gray-500">
                      {locale === "ar" ? "تحديث بيانات الاعتماد الخاصة بك" : "Update your credentials"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Delete Account Button */}
              <button 
                onClick={() => setConfirmDeleteAccountOpen(true)}
                className="w-full flex items-center justify-between p-4 bg-red-50/50 border border-red-100 rounded-2xl hover:bg-red-50 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-red-600">
                      {locale === "ar" ? "حذف الحساب" : "Delete Account"}
                    </h4>
                    <p className="text-[10px] text-red-400">
                      {locale === "ar" ? "حذف حسابك بشكل دائم" : "Permanently remove your account"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-red-300 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Change Password Modal */}
      {changePasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => !changingPassword && setChangePasswordModalOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />

          <div className="bg-white rounded-[24px] shadow-premium border border-[#eae7e7] max-w-md w-full relative z-10 overflow-hidden transform transition-all flex flex-col font-stitch-body">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-[#eae7e7] flex justify-between items-center bg-[#fcf9f8]">
              <div>
                <h3 className="font-stitch-display text-base font-bold text-[#1b1c1c]">
                  {locale === "ar" ? "تغيير كلمة المرور" : "Change Password"}
                </h3>
                <p className="text-[11px] text-[#3e4949] mt-0.5 font-medium">
                  {locale === "ar" ? "أدخل كلمة المرور الحالية وقم بتعيين كلمة مرور جديدة." : "Provide your current password and set a new one."}
                </p>
              </div>
              <button
                disabled={changingPassword}
                onClick={() => setChangePasswordModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-[#6e7979] hover:text-[#2b2b2b] transition-colors disabled:opacity-50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#3e4949] mb-2">
                  {locale === "ar" ? "كلمة المرور الحالية" : "Current Password"}
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 px-4 bg-white border border-[#eae7e7] rounded-xl text-sm focus:outline-none focus:border-[#1f8a8a] focus:ring-2 focus:ring-[#1f8a8a]/10 transition-all text-[#2b2b2b]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3e4949] mb-2">
                  {locale === "ar" ? "كلمة المرور الجديدة" : "New Password"}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 px-4 bg-white border border-[#eae7e7] rounded-xl text-sm focus:outline-none focus:border-[#1f8a8a] focus:ring-2 focus:ring-[#1f8a8a]/10 transition-all text-[#2b2b2b]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3e4949] mb-2">
                  {locale === "ar" ? "تأكيد كلمة المرور الجديدة" : "Confirm New Password"}
                </label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 px-4 bg-white border border-[#eae7e7] rounded-xl text-sm focus:outline-none focus:border-[#1f8a8a] focus:ring-2 focus:ring-[#1f8a8a]/10 transition-all text-[#2b2b2b]"
                  required
                />
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 pt-4 border-t border-[#eae7e7] mt-6">
                <button
                  type="button"
                  disabled={changingPassword}
                  onClick={() => setChangePasswordModalOpen(false)}
                  className="flex-1 h-12 bg-white hover:bg-slate-50 text-[#3e4949] border border-[#eae7e7] rounded-xl text-xs font-bold transition-all active:scale-[0.98] cursor-pointer"
                >
                  {locale === "ar" ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="flex-1 h-12 bg-[#1f8a8a] hover:bg-[#166f6f] text-white rounded-xl text-xs font-bold shadow-soft transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {changingPassword ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {locale === "ar" ? "جاري التحديث..." : "Updating..."}
                    </>
                  ) : (
                    locale === "ar" ? "تحديث كلمة المرور" : "Update Password"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Dialog */}
      {confirmDeleteAccountOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => !deletingAccount && setConfirmDeleteAccountOpen(false)}
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
          />
          <div className="bg-white p-6 rounded-[24px] border border-[#eae7e7] shadow-premium max-w-sm w-full relative z-10 text-center animate-scale-in font-stitch-body">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="font-stitch-display text-base font-bold text-[#1b1c1c]">
              {locale === "ar" ? "حذف الحساب نهائياً؟" : "Delete Account Permanently?"}
            </h3>
            <p className="text-[#3e4949] text-xs mt-2 leading-relaxed font-medium">
              {locale === "ar" 
                ? "هل أنت متأكد من رغبتك في حذف حسابك؟ سيؤدي هذا إلى حذف ملفك الشخصي وبياناتك وكل الحجوزات بشكل دائم. لا يمكن التراجع عن هذا الإجراء."
                : "Are you sure you want to delete your account? This will permanently remove your profile, data, and all bookings. This action cannot be undone."}
            </p>
            <div className="flex gap-3 mt-6">
              <button
                disabled={deletingAccount}
                onClick={() => setConfirmDeleteAccountOpen(false)}
                className="flex-1 h-12 bg-white hover:bg-slate-50 border border-[#eae7e7] rounded-xl text-xs font-bold text-[#3e4949] transition-all cursor-pointer"
              >
                {locale === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button
                disabled={deletingAccount}
                onClick={handleDeleteAccount}
                className="flex-1 h-12 bg-red-600 hover:bg-red-700 disabled:bg-red-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {deletingAccount ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {locale === "ar" ? "جاري الحذف..." : "Deleting..."}
                  </>
                ) : (
                  locale === "ar" ? "نعم، احذف الحساب" : "Yes, Delete Account"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#1b1c1c] text-white px-5 py-4 rounded-[16px] shadow-premium border border-[#1f8a8a]/20 z-50 flex items-center justify-between gap-4 max-w-md animate-slide-up">
          <div className="flex items-center gap-2">
            <span className="shrink-0">
              {toast.type === "success" ? (
                <Check className="w-4 h-4 text-[#aeedd5]" />
              ) : toast.type === "error" ? (
                <AlertCircle className="w-4 h-4 text-red-400" />
              ) : (
                <Info className="w-4 h-4 text-sky-400" />
              )}
            </span>
            <p className="text-xs font-semibold">{toast.message}</p>
          </div>
        </div>
      )}

    </div>
  );
}
