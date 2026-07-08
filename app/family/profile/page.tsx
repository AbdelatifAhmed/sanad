"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/services/api";
import { uploadUserAvatar } from "@/lib/api/upload.api";
import { getAvatarUrl } from "@/lib/avatar";
import { useFamilyCareRequests } from "@/lib/hooks";
import { useTranslations } from "next-intl";
import { 
  User, 
  MapPin, 
  Plus, 
  Trash2, 
  Edit2, 
  Heart, 
  ShieldAlert, 
  X, 
  Info,
  Check,
  ChevronRight,
  AlertCircle,
  History,
  Users,
  Settings,
  Mail,
  Phone,
  Camera,
  Calendar,
  Lock
} from "lucide-react";

interface Beneficiary {
  _id?: string;
  name: string;
  age: number;
  gender: "male" | "female";
  category: "elderly" | "special_needs";
  conditionDetails: string;
  interests: string[];
}

export default function FamilyProfile() {
  const { user } = useAuthStore();
  const router = useRouter();

  const t = useTranslations("profile");
  
  // Real-time care requests data fetching
  const { data: requestsData, isLoading: requestsLoading } = useFamilyCareRequests();
  const jobs = Array.isArray(requestsData?.jobPosts)
    ? requestsData.jobPosts
    : Array.isArray(requestsData)
      ? requestsData
      : [];

  // State variables
  const [profileExists, setProfileExists] = useState<boolean>(false);
  const [profileName, setProfileName] = useState<string>("");
  const [profileEmail, setProfileEmail] = useState<string>("");
  const [profilePhone, setProfilePhone] = useState<string>("");
  const [address, setAddress] = useState({
    city: "",
    area: "",
    fullAddress: ""
  });
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [bookingsData, setBookingsData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [joinedAt, setJoinedAt] = useState<string>("");

  // Address/Profile editing states
  const [savingAddress, setSavingAddress] = useState<boolean>(false);

  // Edit Profile Modal state
  const [editProfileModalOpen, setEditProfileModalOpen] = useState<boolean>(false);
  const [tempProfileName, setTempProfileName] = useState<string>("");
  const [tempProfileEmail, setTempProfileEmail] = useState<string>("");
  const [tempProfilePhone, setTempProfilePhone] = useState<string>("");
  const [tempAddress, setTempAddress] = useState({
    city: "",
    area: "",
    fullAddress: ""
  });

  // Modal state
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingMember, setEditingMember] = useState<Beneficiary | null>(null);
  const [savingMember, setSavingMember] = useState<boolean>(false);

  // Form inputs for modal
  const [formName, setFormName] = useState("");
  const [formAge, setFormAge] = useState<number | "">("");
  const [formGender, setFormGender] = useState<"male" | "female">("male");
  const [formCategory, setFormCategory] = useState<"elderly" | "special_needs">("elderly");
  const [formCondition, setFormCondition] = useState("");
  const [formInterests, setFormInterests] = useState("");

  // Deletion confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);

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

  // Quick Settings state (persisted in localStorage)
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true
  });

  const displayLocation = address.city
    ? address.city
    : user?.location?.city
    ? `${user.location.city}${user.location.governorate ? `, ${user.location.governorate}` : ""}`
    : "";

  const joinDate = joinedAt
    ? new Date(joinedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";

  // Load user data on store load
  useEffect(() => {
    if (user) {
      setProfileName(user.name || "");
      setProfileEmail(user.email || "");
      setProfilePhone(user.phone || "");
    }
  }, [user]);

  // Load notifications settings
  useEffect(() => {
    const saved = localStorage.getItem("sanad_family_notifications");
    if (saved) {
      try {
        setNotifications(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleToggleNotification = (key: "email" | "sms" | "push") => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    localStorage.setItem("sanad_family_notifications", JSON.stringify(updated));
    setToast({
      message: t("toast.notificationsUpdated"),
      type: "success"
    });
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: t("validation.photoSize"), type: "error" });
      return;
    }

    try {
      setUploadingPhoto(true);
      const result = await uploadUserAvatar(file);
      if (result && result.avatar) {
        if (user) {
          useAuthStore.setState({
            user: {
              ...user,
              avatar: result.avatar,
            }
          });
        }
        setToast({ message: t("toast.photoUpdated"), type: "success" });
      }
    } catch (err: any) {
      console.error("Failed to update photo:", err);
      const msg = err.response?.data?.message || t("toast.photoFailed");
      setToast({ message: msg, type: "error" });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Auto-clear toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Fetch family profile and bookings on mount
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch profile & beneficiaries
      const res = await api.get("/family/profile");
      if (res.data && res.data.status === "success" && res.data.data) {
        const profile = res.data.data.profile;
        if (profile) {
          setProfileExists(true);
          setAddress({
            city: profile.address?.city || "",
            area: profile.address?.area || "",
            fullAddress: profile.address?.fullAddress || ""
          });
          setJoinedAt(profile.familyId?.createdAt || "");
        } else {
          setProfileExists(false);
          // Pre-populate address from user location object if it exists
          if (user?.location) {
            setAddress({
              city: user.location.city || "",
              area: "",
              fullAddress: user.location.readableAddress || ""
            });
          }
        }
        setBeneficiaries(res.data.data.beneficiaries || []);
      }

      // Fetch bookings to count completed services
      try {
        const bookingsRes = await api.get("/family/bookings");
        if (bookingsRes.data && bookingsRes.data.status === "success" && bookingsRes.data.data) {
          setBookingsData(bookingsRes.data.data);
        }
      } catch (err) {
        console.error("Error loading family bookings for stats:", err);
      }

    } catch (err: any) {
      if (err.response?.status === 404) {
        setProfileExists(false);
        if (user?.location) {
          setAddress({
            city: user.location.city || "",
            area: "",
            fullAddress: user.location.readableAddress || ""
          });
        }
      } else {
        console.error("Error loading family profile:", err);
        setError(t("errorLoadMessage"));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const handleOpenEditProfileModal = () => {
    setTempProfileName(profileName);
    setTempProfileEmail(profileEmail);
    setTempProfilePhone(profilePhone);
    setTempAddress({
      city: address.city,
      area: address.area,
      fullAddress: address.fullAddress
    });
    setEditProfileModalOpen(true);
  };

  // Handle saving address & personal details
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempAddress.city.trim() || !tempAddress.area.trim() || !tempAddress.fullAddress.trim()) {
      setToast({
        message: t("validation.addressRequired"),
        type: "error"
      });
      return;
    }

    try {
      setSavingAddress(true);

      // Update User collection details (name, email, phone)
      await api.put("/auth/profile", {
        name: tempProfileName.trim(),
        email: tempProfileEmail.trim(),
        phone: tempProfilePhone.trim()
      });

      const res = await api.put("/family/profile", {
        address: {
          city: tempAddress.city.trim(),
          area: tempAddress.area.trim(),
          fullAddress: tempAddress.fullAddress.trim()
        }
      });

      // Backend PUT returns: { message: '...', profile: savedProfile }
      if (res.data && res.data.profile) {
        setProfileExists(true);
        setAddress({
          city: res.data.profile.address?.city || "",
          area: res.data.profile.address?.area || "",
          fullAddress: res.data.profile.address?.fullAddress || ""
        });
        setBeneficiaries(res.data.profile.beneficiaries || []);

        // Update main user details locally
        setProfileName(tempProfileName.trim());
        setProfileEmail(tempProfileEmail.trim());
        setProfilePhone(tempProfilePhone.trim());

        // Also update local store parameters if they were edited
        if (user) {
          useAuthStore.setState({
            user: {
              ...user,
              name: tempProfileName.trim(),
              email: tempProfileEmail.trim(),
              phone: tempProfilePhone.trim()
            }
          });
        }

        setEditProfileModalOpen(false);
        setToast({
          message: t("toast.profileUpdated"),
          type: "success"
        });
      }
    } catch (err: any) {
      console.error("Failed to save profile:", err);
      const msg = err.response?.data?.error || t("toast.profileFailed");
      setToast({ message: msg, type: "error" });
    } finally {
      setSavingAddress(false);
    }
  };

  // Open modal for adding a new member
  const handleOpenAddModal = () => {
    setEditingMember(null);
    setFormName("");
    setFormAge("");
    setFormGender("male");
    setFormCategory("elderly");
    setFormCondition("");
    setFormInterests("");
    setModalOpen(true);
  };

  // Open modal for editing a member
  const handleOpenEditModal = (member: Beneficiary) => {
    setEditingMember(member);
    setFormName(member.name);
    setFormAge(member.age);
    setFormGender(member.gender);
    setFormCategory(member.category);
    setFormCondition(member.conditionDetails);
    setFormInterests(member.interests.join(", "));
    setModalOpen(true);
  };

  // Handle saving family member (add or update)
  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setToast({ message: t("validation.nameRequired"), type: "error" });
      return;
    }
    if (formAge === "" || formAge < 0) {
      setToast({ message: t("validation.ageRequired"), type: "error" });
      return;
    }
    if (!formCondition.trim()) {
      setToast({ message: t("validation.conditionRequired"), type: "error" });
      return;
    }

    try {
      setSavingMember(true);
      const splitInterests = formInterests
        .split(",")
        .map((i) => i.trim())
        .filter((i) => i.length > 0);

      const memberPayload: any = {
        name: formName.trim(),
        age: Number(formAge),
        gender: formGender,
        category: formCategory,
        conditionDetails: formCondition.trim(),
        interests: splitInterests
      };

      if (editingMember?._id) {
        memberPayload._id = editingMember._id;
      }

      // If family profile doesn't exist yet, we must send address details alongside
      let body: any = {
        beneficiaries: [memberPayload]
      };

      if (!profileExists) {
        if (!address.city.trim() || !address.area.trim() || !address.fullAddress.trim()) {
          setToast({
            message: t("validation.residenceRequired"),
            type: "error"
          });
          setSavingMember(false);
          return;
        }
        body.address = {
          city: address.city.trim(),
          area: address.area.trim(),
          fullAddress: address.fullAddress.trim()
        };
      }

      const res = await api.put("/family/profile", body);

      // Backend PUT returns: { message: '...', profile: savedProfile }
      if (res.data && res.data.profile) {
        setProfileExists(true);
        setBeneficiaries(res.data.profile.beneficiaries || []);
        setModalOpen(false);
        setToast({
          message: editingMember 
            ? t("toast.memberUpdated")
            : t("toast.memberAdded"),
          type: "success"
        });
      }
    } catch (err: any) {
      console.error("Error saving member:", err);
      const msg = err.response?.data?.error || t("toast.memberFailed");
      setToast({ message: msg, type: "error" });
    } finally {
      setSavingMember(false);
    }
  };

  // Handle removing a member (requires backend update)
  const handleDeleteMember = async (id: string) => {
    try {
      setDeletingId(id);
      const res = await api.put("/family/profile", {
        beneficiaries: [{ _id: id, isDeleted: true }]
      });

      // Backend PUT returns: { message: '...', profile: savedProfile }
      if (res.data && res.data.profile) {
        setBeneficiaries(res.data.profile.beneficiaries || []);
        setConfirmDeleteId(null);
        setToast({
          message: t("toast.memberRemoved"),
          type: "success"
        });
      }
    } catch (err: any) {
      console.error("Failed to delete dependent:", err);
      const msg = err.response?.data?.error || t("toast.memberDeleteFailed");
      setToast({ message: msg, type: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  // Handle completing an active booking
  const handleCompleteBooking = async (bookingId: string) => {
    try {
      setCompletingId(bookingId);
      const res = await api.put(`/bookings/${bookingId}/status`, { status: "completed" });
      if (res.data) {
        setToast({
          message: t("toast.serviceCompleted"),
          type: "success"
        });
        // Refresh profile stats and bookings data
        await fetchProfile();
      }
    } catch (err: any) {
      console.error("Failed to complete booking:", err);
      const msg = err.response?.data?.error || t("toast.serviceFailed");
      setToast({ message: msg, type: "error" });
    } finally {
      setCompletingId(null);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setToast({ message: "Please fill in all fields.", type: "error" });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setToast({ message: "New passwords do not match.", type: "error" });
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setToast({
        message: "Password must be at least 8 characters long, containing at least one uppercase letter, one lowercase letter, one number, and one symbol.",
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
        setToast({ message: res.data.message || "Password changed successfully.", type: "success" });
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
        setToast({ message: res.data.message || "Account deleted successfully.", type: "success" });
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

  return (
    <div className="max-w-6xl w-full mx-auto space-y-6 pb-12 select-none text-[#2b2b2b] font-stitch-body">
      {/* Breadcrumbs and Page Header */}
      <header>
        <div className="flex items-center gap-2 text-xs text-[#3e4949] mb-1 font-semibold uppercase tracking-wider">
          <span>{t("familyPortal")}</span>
          <ChevronRight className="w-3 h-3 text-[#6e7979]" />
          <span className="text-[#1f8a8a]">{t("managingCare", { name: profileName || t("familyMembers.dependent") })}</span>
        </div>
        <h1 className="text-3xl font-stitch-display font-extrabold text-[#1b1c1c] tracking-tight">
          {t("pageTitle")}
        </h1>
      </header>

      {loading ? (
        /* Loading skeleton matching layout */
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-2xl border border-[#eae7e7] shadow-soft animate-pulse h-32" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white p-8 rounded-2xl border border-[#eae7e7] shadow-soft animate-pulse h-[400px]" />
            <div className="lg:col-span-4 bg-white p-8 rounded-2xl border border-[#eae7e7] shadow-soft animate-pulse h-[400px]" />
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-2xl flex items-start gap-3 shadow-soft max-w-2xl">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          <div>
            <h4 className="font-bold font-stitch-display text-sm">{t("errorLoadingProfile")}</h4>
            <p className="text-xs mt-1 text-red-700">{error}</p>
            <button
              onClick={fetchProfile}
              className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition-colors"
            >
              {t("tryAgain")}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">

          {/* 1. Hero Profile Card */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-[#eae7e7] shadow-soft flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoChange}
                accept="image/*"
                className="hidden"
              />

              {/* Avatar with Camera Icon Overlay */}
              <div className="relative group cursor-pointer" onClick={handlePhotoClick}>
                <div className="w-24 h-24 bg-[#1f8a8a]/10 border-2 border-[#1f8a8a]/20 rounded-full flex items-center justify-center text-[#1f8a8a] text-3xl font-extrabold shadow-sm overflow-hidden">
                  {uploadingPhoto ? (
                    <div className="w-6 h-6 border-2 border-[#1f8a8a] border-t-transparent rounded-full animate-spin" />
                  ) : getAvatarUrl(user?.avatar) ? (
                    <img src={getAvatarUrl(user?.avatar)!} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    (profileName || "FA").slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="absolute bottom-0 right-0 bg-[#1f8a8a] hover:bg-[#166f6f] text-white p-2 rounded-full border-2 border-white shadow-md transition-all">
                  <Camera className="w-4 h-4" />
                </div>
              </div>

              {/* Bio info */}
              <div>
                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  <h2 className="font-stitch-display text-2xl font-bold text-[#1b1c1c] leading-tight">
                    {profileName || ""}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-xs text-[#3e4949] font-semibold">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#1f8a8a]" />
                    {address.city ? `${address.city}, Egypt` : "Cairo, Egypt"}
                  </span>
                  {displayLocation && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#1f8a8a]" />
                      {displayLocation}
                    </span>
                  )}
                  {joinDate && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#1f8a8a]" />
                      {t("joined")} {joinDate}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Photo Actions */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-center md:justify-end">
              <button
                onClick={handlePhotoClick}
                disabled={uploadingPhoto}
                className="h-[56px] px-6 bg-white hover:bg-slate-50 border-2 border-[#2b2b2b] text-[#2b2b2b] font-bold rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {uploadingPhoto ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#2b2b2b] border-t-transparent rounded-full animate-spin" />
                    {t("uploading")}
                  </>
                ) : (
                  t("changePhoto")
                )}
              </button>
              <button
                onClick={handleOpenEditProfileModal}
                className="h-[56px] px-6 bg-[#1f8a8a] hover:bg-[#166f6f] text-white font-bold rounded-xl text-sm shadow-soft transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                {t("editProfile")}
              </button>
            </div>
          </div>

          {/* 2. Stats Grid (4-columns) - Live data from Database */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Requests */}
            <div className="bg-[#f4f6f8] rounded-2xl p-5 border border-[#eae7e7] flex items-center gap-4">
              <div className="w-12 h-12 bg-[#1f8a8a] rounded-xl flex items-center justify-center shrink-0 shadow-sm text-white">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <span className="block text-2xl font-stitch-display font-extrabold text-[#1b1c1c]">
                  {requestsLoading ? "..." : jobs.length}
                </span>
                <span className="text-xs font-semibold text-[#3e4949] uppercase tracking-wider block">
                  {t("stats.totalRequests")}
                </span>
              </div>
            </div>

            {/* Card 2: Active Requests */}
            <div className="bg-[#f4f6f8] rounded-2xl p-5 border border-[#eae7e7] flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm text-white">
                <Check className="w-6 h-6" />
              </div>
              <div>
                <span className="block text-2xl font-stitch-display font-extrabold text-[#1b1c1c]">
                  {requestsLoading ? "..." : jobs.filter((j: any) => j.status === "open").length}
                </span>
                <span className="text-xs font-semibold text-[#3e4949] uppercase tracking-wider block">
                  {t("stats.activeRequests")}
                </span>
              </div>
            </div>

            {/* Card 3: Completed Services */}
            <div className="bg-[#f4f6f8] rounded-2xl p-5 border border-[#eae7e7] flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shrink-0 shadow-sm text-white">
                <History className="w-6 h-6" />
              </div>
              <div>
                <span className="block text-2xl font-stitch-display font-extrabold text-[#1b1c1c]">
                  {loading ? "..." : (bookingsData?.past?.filter((b: any) => b.status === "completed").length || 0)}
                </span>
                <span className="text-xs font-semibold text-[#3e4949] uppercase tracking-wider block">
                  {t("stats.completedServices")}
                </span>
              </div>
            </div>

            {/* Card 4: Family Members */}
            <div className="bg-[#f4f6f8] rounded-2xl p-5 border border-[#eae7e7] flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shrink-0 shadow-sm text-white">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="block text-2xl font-stitch-display font-extrabold text-[#1b1c1c]">
                  {loading ? "..." : beneficiaries.length}
                </span>
                <span className="text-xs font-semibold text-[#3e4949] uppercase tracking-wider block">
                  {t("stats.familyMembers")}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Mid Section (Two-Column Layout 64% / 34%) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* Left Side: Personal Info & Family Members Grid (span 8/12) */}
            <div className="lg:col-span-8 space-y-6">

              {/* Personal Information */}
              <div className="bg-white rounded-2xl p-6 md:p-8 border border-[#eae7e7] shadow-soft">
                <div className="flex justify-between items-center mb-6 pb-2 border-b border-[#eae7e7]/60">
                  <div className="flex items-center gap-2.5">
                    <User className="w-5 h-5 text-[#1f8a8a]" />
                    <h3 className="font-stitch-display text-lg font-bold text-[#1b1c1c]">
                      {t("personalInfo.title")}
                    </h3>
                  </div>
                  <button
                    onClick={handleOpenEditProfileModal}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#1f8a8a] hover:text-[#166f6f] transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    {t("personalInfo.edit")}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-[#eae7e7]/60 flex items-start gap-3">
                    <User className="w-5 h-5 text-[#1f8a8a] mt-0.5" />
                    <div>
                      <span className="block text-xs font-semibold text-[#3e4949] uppercase tracking-wider">{t("personalInfo.fullName")}</span>
                      <span className="block text-sm font-bold text-[#1b1c1c] mt-1">{profileName || t("personalInfo.notProvided")}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50/50 p-4 rounded-xl border border-[#eae7e7]/60 flex items-start gap-3">
                    <Mail className="w-5 h-5 text-[#1f8a8a] mt-0.5" />
                    <div>
                      <span className="block text-xs font-semibold text-[#3e4949] uppercase tracking-wider">{t("personalInfo.emailAddress")}</span>
                      <span className="block text-sm font-bold text-[#1b1c1c] mt-1 break-all">{profileEmail || t("personalInfo.notProvided")}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50/50 p-4 rounded-xl border border-[#eae7e7]/60 flex items-start gap-3">
                    <Phone className="w-5 h-5 text-[#1f8a8a] mt-0.5" />
                    <div>
                      <span className="block text-xs font-semibold text-[#3e4949] uppercase tracking-wider">{t("personalInfo.phoneNumber")}</span>
                      <span className="block text-sm font-bold text-[#1b1c1c] mt-1">{profilePhone || t("personalInfo.notProvided")}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50/50 p-4 rounded-xl border border-[#eae7e7]/60 flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#1f8a8a] mt-0.5" />
                    <div>
                      <span className="block text-xs font-semibold text-[#3e4949] uppercase tracking-wider">{t("personalInfo.city")}</span>
                      <span className="block text-sm font-bold text-[#1b1c1c] mt-1">{address.city || t("personalInfo.notProvided")}</span>
                    </div>
                  </div>

                  <div className="md:col-span-2 bg-slate-50/50 p-4 rounded-xl border border-[#eae7e7]/60 flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#1f8a8a] mt-0.5" />
                    <div>
                      <span className="block text-xs font-semibold text-[#3e4949] uppercase tracking-wider">{t("personalInfo.areaDistrict")}</span>
                      <span className="block text-sm font-bold text-[#1b1c1c] mt-1">{address.area || t("personalInfo.notProvided")}</span>
                    </div>
                  </div>

                  <div className="md:col-span-2 bg-slate-50/50 p-4 rounded-xl border border-[#eae7e7]/60 flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#1f8a8a] mt-0.5" />
                    <div>
                      <span className="block text-xs font-semibold text-[#3e4949] uppercase tracking-wider">{t("personalInfo.residentialAddress")}</span>
                      <span className="block text-sm font-medium text-[#2b2b2b] mt-1 leading-relaxed">{address.fullAddress || t("personalInfo.notProvided")}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Family Members Receiving Care Card Box - MODIFIED TO BE LARGER */}
              <div className="bg-white rounded-2xl p-6 md:p-8 border border-[#eae7e7] shadow-soft space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-[#eae7e7]/60">
                  <div className="flex items-center gap-3">
                    <Users className="w-6 h-6 text-[#1f8a8a]" />
                    <div>
                      <h3 className="font-stitch-display text-xl font-bold text-[#1b1c1c]">
                        {t("familyMembers.title")}
                      </h3>
                      <p className="text-xs text-[#3e4949] font-semibold mt-0.5">
                        {t("familyMembers.subtitle", { count: beneficiaries.length })}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleOpenAddModal}
                    className="h-[56px] px-6 bg-white hover:bg-slate-50 border-2 border-[#1f8a8a] text-[#1f8a8a] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 text-sm active:scale-[0.98] cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    {t("familyMembers.addMember")}
                  </button>
                </div>

                {beneficiaries.length === 0 ? (
                  <div className="border-2 border-dashed border-[#bdc9c8]/50 p-16 rounded-[16px] flex flex-col items-center justify-center text-center bg-[#fcf9f8]/40">
                    <div className="w-16 h-16 bg-[#1f8a8a]/5 border border-[#1f8a8a]/20 rounded-full flex items-center justify-center text-[#1f8a8a] mb-4 shadow-sm">
                      <Heart className="w-8 h-8" />
                    </div>
                    <h4 className="font-stitch-display text-lg font-bold text-[#1b1c1c]">
                      {t("familyMembers.noMembersTitle")}
                    </h4>
                    <p className="text-[#3e4949] text-sm max-w-sm mt-2 leading-relaxed font-semibold">
                      {t("familyMembers.noMembersDesc")}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {beneficiaries.map((member) => {
                      const isMother = member.name.toLowerCase().includes("margaret") || member.category === "special_needs";

                      return (
                        <div
                          key={member._id}
                          className="bg-[#fcf9f8] p-6 rounded-2xl border border-[#eae7e7] hover:border-[#1f8a8a]/30 transition-all duration-200 flex flex-col justify-between hover:shadow-soft"
                        >
                          <div>
                            <div className="flex justify-between items-start gap-4 mb-4">
                              <div>
                                <h4 className="font-stitch-display text-base md:text-lg font-bold text-[#1b1c1c]">
                                  {member.name}
                                </h4>
                                <p className="text-xs md:text-sm text-[#3e4949] capitalize font-semibold mt-1">
                                  {member.name.toLowerCase().includes("margaret") ? t("familyMembers.mother") : member.name.toLowerCase().includes("arthur") ? t("familyMembers.father") : t("familyMembers.dependent")} • {member.age} {t("familyMembers.years")}
                                </p>
                              </div>

                              <span
                                className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border ${isMother
                                    ? "bg-[#aeedd5] text-[#316d5b] border-[#aeedd5]"
                                    : "bg-slate-100 text-[#3e4949] border-[#eae7e7]"
                                  }`}
                              >
                                {isMother ? t("familyMembers.activeCare") : t("familyMembers.noActiveCare")}
                              </span>
                            </div>

                            {/* Conditions details */}
                            <div className="bg-white border border-[#eae7e7]/60 p-4 rounded-xl mb-4 text-xs md:text-sm">
                              <p className="text-[10px] text-[#3e4949] font-bold uppercase tracking-wider mb-2">
                                {t("familyMembers.conditionsDetails")}
                              </p>
                              <p className="text-[#2b2b2b] font-medium leading-relaxed line-clamp-4">
                                {member.conditionDetails}
                              </p>
                            </div>

                            {/* Hobbies / Interests */}
                            {member.interests && member.interests.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-2">
                                {member.interests.slice(0, 4).map((interest, idx) => (
                                  <span
                                    key={idx}
                                    className="px-3 py-1 bg-white text-[#3e4949] rounded-md text-xs font-semibold border border-[#eae7e7]"
                                  >
                                    {interest}
                                  </span>
                                ))}
                                {member.interests.length > 4 && (
                                  <span className="text-xs text-[#3e4949] font-semibold flex items-center">
                                    +{member.interests.length - 4} {t("familyMembers.more")}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-3 pt-4 border-t border-[#eae7e7]/60 mt-4">
                            <button
                              onClick={() => handleOpenEditModal(member)}
                              className="flex-1 h-11 bg-white hover:bg-slate-50 text-[#3e4949] border border-[#eae7e7] rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-[#1f8a8a]" />
                              {t("familyMembers.editMember")}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(member._id || null)}
                              className="h-11 px-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Service & Booking History */}
              <div className="bg-white rounded-2xl p-6 md:p-8 border border-[#eae7e7] shadow-soft space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-[#eae7e7]/60">
                  <History className="w-6 h-6 text-[#1f8a8a]" />
                  <div>
                    <h3 className="font-stitch-display text-xl font-bold text-[#1b1c1c]">
                      {t("serviceHistory.title")}
                    </h3>
                    <p className="text-xs text-[#3e4949] font-semibold mt-0.5">
                      {t("serviceHistory.subtitle")}
                    </p>
                  </div>
                </div>

                {/* Ongoing/Active Bookings */}
                {bookingsData?.upcoming?.filter((b: any) => b.status === "active").length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {t("serviceHistory.activeServices")}
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      {bookingsData.upcoming
                        .filter((b: any) => b.status === "active")
                        .map((booking: any) => (
                          <div
                            key={booking._id}
                            className="bg-emerald-50/30 p-5 rounded-2xl border border-emerald-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-soft transition-all duration-200"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-emerald-600/10 border border-emerald-200 text-emerald-700 rounded-xl flex items-center justify-center font-bold text-lg overflow-hidden shrink-0">
                                {getAvatarUrl(booking.companionId?.avatar) ? (
                                  <img src={getAvatarUrl(booking.companionId.avatar) || ""} alt={booking.companionId?.name} className="w-full h-full object-cover" />
                                ) : (
                                  (booking.companionId?.name || "C").charAt(0).toUpperCase()
                                )}
                              </div>
                              <div>
                                <h5 className="text-sm font-bold text-[#1b1c1c]">
                                  {t("serviceHistory.companion")} {booking.companionId?.name || t("serviceHistory.assignedCompanion")}
                                </h5>
                                <p className="text-xs text-[#3e4949] font-semibold mt-1">
                                  {t("serviceHistory.period")} {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-[#3e4949] font-semibold mt-0.5">
                                  {t("serviceHistory.hoursRate", { hours: booking.totalHours, rate: booking.hourlyRateAtBooking || booking.hourlyRate })}
                                </p>
                              </div>
                            </div>
                            <button
                              disabled={completingId === booking._id}
                              onClick={() => handleCompleteBooking(booking._id)}
                              className="w-full md:w-auto h-11 px-5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/60 text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
                            >
                              {completingId === booking._id ? (
                                <>
                                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  {t("serviceHistory.completing")}
                                </>
                              ) : (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  {t("serviceHistory.completeService")}
                                </>
                              )}
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Past / Completed Services */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#3e4949]">
                    {t("serviceHistory.completedHistory")}
                  </h4>

                  {(!bookingsData?.past || bookingsData.past.length === 0) ? (
                    <div className="border-2 border-dashed border-[#bdc9c8]/30 p-10 rounded-[16px] flex flex-col items-center justify-center text-center bg-[#fcf9f8]/20">
                      <p className="text-[#3e4949] text-xs font-semibold">
                        {t("serviceHistory.noHistory")}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
                      {bookingsData.past.map((booking: any) => {
                        const isCompleted = booking.status === "completed";
                        return (
                          <div
                            key={booking._id}
                            className="bg-[#fcf9f8] p-4 rounded-xl border border-[#eae7e7] flex items-center justify-between gap-4 hover:border-[#bdc9c8] transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-200 text-[#3e4949] rounded-lg flex items-center justify-center font-bold text-sm overflow-hidden shrink-0">
                                {getAvatarUrl(booking.companionId?.avatar) ? (
                                  <img src={getAvatarUrl(booking.companionId.avatar) || ""} alt={booking.companionId?.name} className="w-full h-full object-cover" />
                                ) : (
                                  (booking.companionId?.name || "C").charAt(0).toUpperCase()
                                )}
                              </div>
                              <div>
                                <h5 className="text-xs font-bold text-[#1b1c1c]">
                                  {booking.companionId?.name || t("serviceHistory.assignedCompanion")}
                                </h5>
                                <p className="text-[10px] text-[#3e4949] font-medium mt-0.5">
                                  {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${isCompleted
                                    ? "bg-[#aeedd5] text-[#316d5b] border-[#aeedd5]"
                                    : "bg-red-50 text-red-700 border-red-100"
                                  }`}
                              >
                                {booking.status || "completed"}
                              </span>
                              <p className="text-xs font-bold text-[#1b1c1c] mt-1.5">
                                £{booking.totalPrice || (booking.hourlyRateAtBooking * booking.totalHours) || 0}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side: Quick Settings (span 4/12) */}
            <div className="lg:col-span-4 space-y-6">

              {/* Quick Settings Card */}
              <div className="bg-white rounded-2xl p-6 md:p-8 border border-[#eae7e7] shadow-soft space-y-6">
                <div>
                  <h3 className="font-stitch-display text-xs font-bold text-[#3e4949] tracking-wider uppercase">
                    {t("quickSettings.title")}
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* Change Password row */}
                  <button
                    onClick={() => setChangePasswordModalOpen(true)}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 border border-[#eae7e7] rounded-xl hover:bg-slate-100 transition-all text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <Lock className="w-5 h-5 text-[#1f8a8a]" />
                      <div>
                        <h4 className="text-sm font-bold text-[#2b2b2b]">{t("quickSettings.changePassword")}</h4>
                        <p className="text-[10px] text-[#3e4949]">{t("quickSettings.changePasswordDesc")}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#6e7979] group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <div className="border-t border-[#eae7e7]/60 my-4" />

                  {/* Notification Preferences */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-[#3e4949] tracking-wide uppercase">
                      {t("quickSettings.notificationPreferences")}
                    </h4>

                    <div className="flex items-center justify-between py-1">
                      <div>
                        <h5 className="text-sm font-bold text-[#2b2b2b]">{t("quickSettings.newApplications")}</h5>
                        <p className="text-[11px] text-[#3e4949]">{t("quickSettings.newApplicationsDesc")}</p>
                      </div>
                      <button
                        onClick={() => handleToggleNotification("email")}
                        className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${notifications.email ? 'bg-[#1f8a8a]' : 'bg-[#bdc9c8]'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${notifications.email ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <div>
                        <h5 className="text-sm font-bold text-[#2b2b2b]">{t("quickSettings.messages")}</h5>
                        <p className="text-[11px] text-[#3e4949]">{t("quickSettings.messagesDesc")}</p>
                      </div>
                      <button
                        onClick={() => handleToggleNotification("sms")}
                        className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${notifications.sms ? 'bg-[#1f8a8a]' : 'bg-[#bdc9c8]'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${notifications.sms ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-[#eae7e7]/60 my-4" />

                  {/* Delete Account */}
                  <button
                    onClick={() => setConfirmDeleteAccountOpen(true)}
                    className="w-full h-[56px] border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t("quickSettings.deleteAccount")}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Add / Edit Member Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => !savingMember && setModalOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />

          <div className="bg-white rounded-[24px] shadow-premium border border-[#eae7e7] max-w-lg w-full relative z-10 overflow-hidden transform transition-all max-h-[90vh] flex flex-col font-stitch-body">

            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-[#eae7e7] flex justify-between items-center bg-[#fcf9f8]">
              <div>
                <h3 className="font-stitch-display text-base font-bold text-[#1b1c1c]">
                  {editingMember ? t("modal.editMemberTitle") : t("modal.addMemberTitle")}
                </h3>
                <p className="text-[11px] text-[#3e4949] mt-0.5 font-medium">
                  {t("modal.modalSubtitle")}
                </p>
              </div>
              <button
                disabled={savingMember}
                onClick={() => setModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-[#6e7979] hover:text-[#2b2b2b] transition-colors disabled:opacity-50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveMember} className="overflow-y-auto flex-1 p-6 space-y-4 scrollbar-none">
              <div className="grid grid-cols-2 gap-4">

                {/* Name */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-[#3e4949] mb-2">
                    {t("modal.fullName")}
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder={t("modal.fullNamePlaceholder")}
                    className="w-full h-12 px-4 bg-white border border-[#eae7e7] rounded-xl text-sm focus:outline-none focus:border-[#1f8a8a] focus:ring-2 focus:ring-[#1f8a8a]/10 transition-all text-[#2b2b2b] placeholder-[#3e4949]/30"
                    required
                  />
                </div>

                {/* Age */}
                <div>
                  <label className="block text-xs font-semibold text-[#3e4949] mb-2">
                    {t("modal.age")}
                  </label>
                  <input
                    type="number"
                    value={formAge}
                    onChange={(e) => setFormAge(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder={t("modal.agePlaceholder")}
                    className="w-full h-12 px-4 bg-white border border-[#eae7e7] rounded-xl text-sm focus:outline-none focus:border-[#1f8a8a] focus:ring-2 focus:ring-[#1f8a8a]/10 transition-all text-[#2b2b2b] placeholder-[#3e4949]/30"
                    required
                    min={0}
                  />
                </div>

                {/* Category Selector */}
                <div>
                  <label className="block text-xs font-semibold text-[#3e4949] mb-2">
                    {t("modal.careCategory")}
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full h-12 px-3 bg-white border border-[#eae7e7] rounded-xl text-sm focus:outline-none focus:border-[#1f8a8a] focus:ring-2 focus:ring-[#1f8a8a]/10 transition-all text-[#2b2b2b]"
                  >
                    <option value="elderly">{t("modal.elderlyCare")}</option>
                    <option value="special_needs">{t("modal.specialNeeds")}</option>
                  </select>
                </div>
              </div>

              {/* Gender Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#3e4949] mb-2">
                  {t("modal.gender")}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormGender("male")}
                    className={`h-12 rounded-xl border text-xs font-bold transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 ${formGender === "male"
                        ? "bg-[#aeedd5] border-[#1f8a8a] text-[#316d5b]"
                        : "bg-white border-[#eae7e7] text-[#3e4949] hover:bg-slate-50"
                      }`}
                  >
                    {t("modal.male")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormGender("female")}
                    className={`h-12 rounded-xl border text-xs font-bold transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 ${formGender === "female"
                        ? "bg-[#aeedd5] border-[#1f8a8a] text-[#316d5b]"
                        : "bg-white border-[#eae7e7] text-[#3e4949] hover:bg-slate-50"
                      }`}
                  >
                    {t("modal.female")}
                  </button>
                </div>
              </div>

              {/* Medical/Condition Details */}
              <div>
                <label className="block text-xs font-semibold text-[#3e4949] mb-2">
                  {t("modal.conditionTitle")}
                </label>
                <textarea
                  rows={4}
                  value={formCondition}
                  onChange={(e) => setFormCondition(e.target.value)}
                  placeholder={t("modal.conditionPlaceholder")}
                  className="w-full p-4 bg-white border border-[#eae7e7] rounded-xl text-sm focus:outline-none focus:border-[#1f8a8a] focus:ring-2 focus:ring-[#1f8a8a]/10 transition-all text-[#2b2b2b] placeholder-[#3e4949]/30 resize-none leading-relaxed"
                  required
                />
              </div>

              {/* Interests & Hobbies */}
              <div>
                <label className="block text-xs font-semibold text-[#3e4949] mb-2">
                  {t("modal.interestsTitle")}
                </label>
                <input
                  type="text"
                  value={formInterests}
                  onChange={(e) => setFormInterests(e.target.value)}
                  placeholder={t("modal.interestsPlaceholder")}
                  className="w-full h-12 px-4 bg-white border border-[#eae7e7] rounded-xl text-sm focus:outline-none focus:border-[#1f8a8a] focus:ring-2 focus:ring-[#1f8a8a]/10 transition-all text-[#2b2b2b] placeholder-[#3e4949]/30"
                />
                <p className="text-[10px] text-[#3e4949] mt-1.5 font-medium">
                  {t("modal.interestsHint")}
                </p>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 pt-4 border-t border-[#eae7e7] mt-6">
                <button
                  type="button"
                  disabled={savingMember}
                  onClick={() => setModalOpen(false)}
                  className="flex-1 h-14 bg-white hover:bg-slate-50 text-[#3e4949] border border-[#eae7e7] rounded-xl text-sm font-bold transition-all active:scale-[0.98] cursor-pointer"
                >
                  {t("modal.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={savingMember}
                  className="flex-1 h-14 bg-[#1f8a8a] hover:bg-[#166f6f] text-white rounded-xl text-sm font-bold shadow-soft transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {savingMember ? (
                    <>
                      <div className="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t("modal.saving")}
                    </>
                  ) : (
                    t("modal.saveMember")
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {editProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => !savingAddress && setEditProfileModalOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />

          <div className="bg-white rounded-[24px] shadow-premium border border-[#eae7e7] max-w-lg w-full relative z-10 overflow-hidden transform transition-all max-h-[90vh] flex flex-col font-stitch-body">

            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-[#eae7e7] flex justify-between items-center bg-[#fcf9f8]">
              <div>
                <h3 className="font-stitch-display text-base font-bold text-[#1b1c1c]">
                  {t("editModal.title")}
                </h3>
                <p className="text-[11px] text-[#3e4949] mt-0.5 font-medium">
                  {t("editModal.subtitle")}
                </p>
              </div>
              <button
                disabled={savingAddress}
                onClick={() => setEditProfileModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-[#6e7979] hover:text-[#2b2b2b] transition-colors disabled:opacity-50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveProfile} className="overflow-y-auto flex-1 p-6 space-y-4 scrollbar-none">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Full Name */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-[#3e4949] mb-2">
                    {t("editModal.fullName")}
                  </label>
                  <input
                    type="text"
                    value={tempProfileName}
                    onChange={(e) => setTempProfileName(e.target.value)}
                    placeholder={t("editModal.fullNamePlaceholder")}
                    className="w-full h-12 px-4 bg-white border border-[#eae7e7] rounded-xl text-sm focus:outline-none focus:border-[#1f8a8a] focus:ring-2 focus:ring-[#1f8a8a]/10 transition-all text-[#2b2b2b] placeholder-[#3e4949]/30"
                    required
                  />
                </div>

                {/* Email Address */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-[#3e4949] mb-2">
                    {t("editModal.emailAddress")}
                  </label>
                  <input
                    type="email"
                    value={tempProfileEmail}
                    onChange={(e) => setTempProfileEmail(e.target.value)}
                    placeholder={t("editModal.emailPlaceholder")}
                    className="w-full h-12 px-4 bg-white border border-[#eae7e7] rounded-xl text-sm focus:outline-none focus:border-[#1f8a8a] focus:ring-2 focus:ring-[#1f8a8a]/10 transition-all text-[#2b2b2b] placeholder-[#3e4949]/30"
                    required
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-semibold text-[#3e4949] mb-2">
                    {t("editModal.phoneNumber")}
                  </label>
                  <input
                    type="text"
                    value={tempProfilePhone}
                    onChange={(e) => setTempProfilePhone(e.target.value)}
                    placeholder={t("editModal.phonePlaceholder")}
                    className="w-full h-12 px-4 bg-white border border-[#eae7e7] rounded-xl text-sm focus:outline-none focus:border-[#1f8a8a] focus:ring-2 focus:ring-[#1f8a8a]/10 transition-all text-[#2b2b2b] placeholder-[#3e4949]/30"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-semibold text-[#3e4949] mb-2">
                    {t("editModal.city")}
                  </label>
                  <input
                    type="text"
                    value={tempAddress.city}
                    onChange={(e) => setTempAddress({ ...tempAddress, city: e.target.value })}
                    placeholder={t("editModal.cityPlaceholder")}
                    className="w-full h-12 px-4 bg-white border border-[#eae7e7] rounded-xl text-sm focus:outline-none focus:border-[#1f8a8a] focus:ring-2 focus:ring-[#1f8a8a]/10 transition-all text-[#2b2b2b] placeholder-[#3e4949]/30"
                    required
                  />
                </div>

                {/* Area / District */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-[#3e4949] mb-2">
                    {t("editModal.areaDistrict")}
                  </label>
                  <input
                    type="text"
                    value={tempAddress.area}
                    onChange={(e) => setTempAddress({ ...tempAddress, area: e.target.value })}
                    placeholder={t("editModal.areaPlaceholder")}
                    className="w-full h-12 px-4 bg-white border border-[#eae7e7] rounded-xl text-sm focus:outline-none focus:border-[#1f8a8a] focus:ring-2 focus:ring-[#1f8a8a]/10 transition-all text-[#2b2b2b] placeholder-[#3e4949]/30"
                    required
                  />
                </div>

                {/* Residential Address */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-[#3e4949] mb-2">
                    {t("editModal.residentialAddress")}
                  </label>
                  <textarea
                    rows={3}
                    value={tempAddress.fullAddress}
                    onChange={(e) => setTempAddress({ ...tempAddress, fullAddress: e.target.value })}
                    placeholder={t("editModal.addressPlaceholder")}
                    className="w-full p-4 bg-white border border-[#eae7e7] rounded-xl text-sm focus:outline-none focus:border-[#1f8a8a] focus:ring-2 focus:ring-[#1f8a8a]/10 transition-all text-[#2b2b2b] placeholder-[#3e4949]/30 resize-none leading-relaxed"
                    required
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 pt-4 border-t border-[#eae7e7] mt-6">
                <button
                  type="button"
                  disabled={savingAddress}
                  onClick={() => setEditProfileModalOpen(false)}
                  className="flex-1 h-14 bg-white hover:bg-slate-50 text-[#3e4949] border border-[#eae7e7] rounded-xl text-sm font-bold transition-all active:scale-[0.98] cursor-pointer"
                >
                  {t("editModal.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={savingAddress}
                  className="flex-1 h-14 bg-[#1f8a8a] hover:bg-[#166f6f] text-white rounded-xl text-sm font-bold shadow-soft transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {savingAddress ? (
                    <>
                      <div className="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t("editModal.saving")}
                    </>
                  ) : (
                    t("editModal.saveDetails")
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => !deletingId && setConfirmDeleteId(null)}
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
          />
          <div className="bg-white p-6 rounded-[24px] border border-[#eae7e7] shadow-premium max-w-sm w-full relative z-10 text-center animate-scale-in font-stitch-body">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="font-stitch-display text-base font-bold text-[#1b1c1c]">
              {t("deleteModal.title")}
            </h3>
            <p className="text-[#3e4949] text-xs mt-2 leading-relaxed font-medium">
              {t("deleteModal.message")}
            </p>
            <div className="flex gap-3 mt-6">
              <button
                disabled={deletingId !== null}
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 h-12 bg-white hover:bg-slate-50 border border-[#eae7e7] rounded-xl text-xs font-bold text-[#3e4949] transition-all cursor-pointer"
              >
                {t("deleteModal.cancel")}
              </button>
              <button
                disabled={deletingId !== null}
                onClick={() => confirmDeleteId && handleDeleteMember(confirmDeleteId)}
                className="flex-1 h-12 bg-red-600 hover:bg-red-700 disabled:bg-red-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {deletingId ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t("deleteModal.removing")}
                  </>
                ) : (
                  t("deleteModal.confirm")
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  Change Password
                </h3>
                <p className="text-[11px] text-[#3e4949] mt-0.5 font-medium">
                  Provide your current password and set a new one.
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
                  Current Password
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
                  New Password
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
                  Confirm New Password
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
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="flex-1 h-12 bg-[#1f8a8a] hover:bg-[#166f6f] text-white rounded-xl text-xs font-bold shadow-soft transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {changingPassword ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Password"
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
              Delete Account Permanently?
            </h3>
            <p className="text-[#3e4949] text-xs mt-2 leading-relaxed font-medium">
              Are you sure you want to delete your account? This will permanently remove your profile, family data, and all bookings. This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                disabled={deletingAccount}
                onClick={() => setConfirmDeleteAccountOpen(false)}
                className="flex-1 h-12 bg-white hover:bg-slate-50 border border-[#eae7e7] rounded-xl text-xs font-bold text-[#3e4949] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={deletingAccount}
                onClick={handleDeleteAccount}
                className="flex-1 h-12 bg-red-600 hover:bg-red-700 disabled:bg-red-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {deletingAccount ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Yes, Delete Account"
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
