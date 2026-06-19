"use client";

import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/services/api";
import { 
  User, 
  MapPin, 
  Plus, 
  Trash2, 
  Edit2, 
  Heart, 
  Activity, 
  ShieldAlert, 
  X, 
  Info,
  Check,
  ChevronRight,
  Smile,
  AlertCircle
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
  
  // State variables
  const [profileExists, setProfileExists] = useState<boolean>(false);
  const [address, setAddress] = useState({
    city: "",
    area: "",
    fullAddress: ""
  });
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Address editing states
  const [savingAddress, setSavingAddress] = useState<boolean>(false);

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

  // Toast notification state
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Auto-clear toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Fetch family profile on mount
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/family/profile");
      
      if (res.data) {
        setProfileExists(true);
        setAddress({
          city: res.data.address?.city || "",
          area: res.data.address?.area || "",
          fullAddress: res.data.address?.fullAddress || ""
        });
        setBeneficiaries(res.data.beneficiaries || []);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setProfileExists(false);
        // Pre-populate address from user location object if it exists
        if (user?.location) {
          setAddress({
            city: user.location.city || "",
            area: "",
            fullAddress: user.location.readableAddress || ""
          });
        }
      } else {
        console.error("Error loading family profile:", err);
        setError("Could not load family profile settings. Please refresh the page.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  // Handle saving address residence
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.city.trim() || !address.area.trim() || !address.fullAddress.trim()) {
      setToast({
        message: "Please fill out all address fields.",
        type: "error"
      });
      return;
    }

    try {
      setSavingAddress(true);
      const res = await api.put("/family/profile", {
        address: {
          city: address.city.trim(),
          area: address.area.trim(),
          fullAddress: address.fullAddress.trim()
        }
      });
      
      setProfileExists(true);
      setToast({
        message: "Residence address updated successfully!",
        type: "success"
      });
    } catch (err: any) {
      console.error("Failed to save address:", err);
      const msg = err.response?.data?.error || "Failed to update address residence.";
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
      setToast({ message: "Dependent name is required.", type: "error" });
      return;
    }
    if (formAge === "" || formAge < 0) {
      setToast({ message: "Please enter a valid age.", type: "error" });
      return;
    }
    if (!formCondition.trim()) {
      setToast({ message: "Please provide condition or care details.", type: "error" });
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
            message: "You must complete the Residence Address details first to initialize your profile.",
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
      setProfileExists(true);
      setBeneficiaries(res.data.beneficiaries || []);
      setModalOpen(false);
      setToast({
        message: editingMember 
          ? "Dependent profile updated successfully!" 
          : "New family dependent registered successfully!",
        type: "success"
      });
    } catch (err: any) {
      console.error("Error saving member:", err);
      const msg = err.response?.data?.error || "Failed to save family member.";
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
      
      setBeneficiaries(res.data.beneficiaries || []);
      setConfirmDeleteId(null);
      setToast({
        message: "Dependent removed from family profile.",
        type: "success"
      });
    } catch (err: any) {
      console.error("Failed to delete dependent:", err);
      const msg = err.response?.data?.error || "Failed to remove dependent.";
      setToast({ message: msg, type: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  const getCategoryColor = (category: string) => {
    if (category === "elderly") {
      return "bg-[#aeedd5]/50 text-[#1d503f] border-[#aeedd5]";
    }
    return "bg-amber-50 text-amber-800 border-amber-200";
  };

  return (
    <div className="relative font-stitch-body select-none pb-12">
      {/* Header Panel */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-stitch-display font-bold text-[#012d1d]">
            Family Profile
          </h2>
          <p className="text-stitch-on-surface-variant/70 mt-1.5 text-sm">
            Manage your family contacts, residence settings, and active dependents requiring care.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-5 py-3 bg-stitch-primary hover:bg-[#166f6f] text-white rounded-2xl font-bold text-sm shadow-soft hover:shadow-premium transition-all active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Family Member
        </button>
      </header>

      {/* Main Grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Skeleton Left */}
          <div className="space-y-6 lg:col-span-1">
            <div className="bg-white p-6 rounded-3xl border border-stitch-outline/10 shadow-soft animate-pulse space-y-4">
              <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto" />
              <div className="h-6 bg-slate-100 rounded w-2/3 mx-auto" />
              <div className="h-4 bg-slate-100 rounded w-1/2 mx-auto" />
            </div>
            <div className="bg-white p-6 rounded-3xl border border-stitch-outline/10 shadow-soft animate-pulse space-y-4">
              <div className="h-6 bg-slate-100 rounded w-1/3" />
              <div className="space-y-2">
                <div className="h-10 bg-slate-100 rounded" />
                <div className="h-10 bg-slate-100 rounded" />
                <div className="h-16 bg-slate-100 rounded" />
              </div>
            </div>
          </div>
          {/* Skeleton Right */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-stitch-outline/10 shadow-soft animate-pulse space-y-6">
              <div className="h-6 bg-slate-100 rounded w-1/4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-48 bg-slate-50/70 rounded-2xl border border-slate-100" />
                <div className="h-48 bg-slate-50/70 rounded-2xl border border-slate-100" />
              </div>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50/80 border border-red-200 text-red-800 p-6 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          <div>
            <h4 className="font-bold font-stitch-display text-sm">Error Loading Profile</h4>
            <p className="text-xs mt-1 text-red-700">{error}</p>
            <button
              onClick={fetchProfile}
              className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Account Details & Address Settings */}
          <div className="space-y-6 lg:col-span-1">
            {/* Account Info Card */}
            <div className="bg-white p-6 rounded-3xl border border-stitch-outline/10 shadow-soft text-center flex flex-col items-center">
              <div className="relative w-20 h-20 bg-teal-50 border-2 border-[#aeedd5] rounded-full flex items-center justify-center text-stitch-primary mb-4 shadow-sm">
                <User className="w-10 h-10" />
                <div className="absolute -bottom-1 -right-1 bg-stitch-primary text-white p-1 rounded-full border border-white">
                  <Check className="w-3 h-3" />
                </div>
              </div>
              <h3 className="font-stitch-display text-lg font-bold text-slate-800 leading-tight">
                {user?.name || "Family Account"}
              </h3>
              <span className="inline-block px-3 py-1 bg-teal-50 text-stitch-primary text-[10px] uppercase tracking-wider font-extrabold rounded-full mt-1.5 border border-[#aeedd5]/40">
                Primary Host
              </span>

              <div className="w-full border-t border-slate-100 my-5" />

              <div className="w-full space-y-3.5 text-left text-xs">
                <div className="flex items-center gap-2.5 text-stitch-on-surface-variant">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="truncate">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Account Role</p>
                    <p className="font-semibold text-slate-700 capitalize">{user?.role || "Family"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-stitch-on-surface-variant">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="truncate">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Email Address</p>
                    <p className="font-semibold text-slate-700 truncate">{user?.email || "No email linked"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-stitch-on-surface-variant">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Phone Number</p>
                    <p className="font-semibold text-slate-700">{user?.phone || "No phone added"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Residence Address Form */}
            <div className="bg-white p-6 rounded-3xl border border-stitch-outline/10 shadow-soft">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-stitch-primary" />
                <h3 className="font-stitch-display text-base font-bold text-slate-800">
                  Residence Address
                </h3>
              </div>

              <form onSubmit={handleSaveAddress} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    placeholder="e.g. Dubai, Abu Dhabi"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-stitch-primary/30 focus:border-stitch-primary transition-all text-slate-800 placeholder-slate-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                    Area / District
                  </label>
                  <input
                    type="text"
                    value={address.area}
                    onChange={(e) => setAddress({ ...address, area: e.target.value })}
                    placeholder="e.g. Dubai Marina, Jumeirah"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-stitch-primary/30 focus:border-stitch-primary transition-all text-slate-800 placeholder-slate-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                    Full Address Details
                  </label>
                  <textarea
                    rows={3}
                    value={address.fullAddress}
                    onChange={(e) => setAddress({ ...address, fullAddress: e.target.value })}
                    placeholder="e.g. Building Name, Villa Number, Street, Landmark"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-stitch-primary/30 focus:border-stitch-primary transition-all text-slate-800 placeholder-slate-400 resize-none leading-relaxed"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingAddress}
                  className="w-full mt-2 py-3 bg-stitch-primary hover:bg-[#166f6f] disabled:bg-stitch-primary/60 text-white rounded-xl text-xs font-bold shadow-soft transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {savingAddress ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving Address...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Save Residence Info
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Dependents list */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-stitch-outline/10 shadow-soft">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-stitch-display text-lg font-bold text-slate-800">
                    Registered Dependents
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Total: {beneficiaries.length} family members
                  </p>
                </div>
              </div>

              {beneficiaries.length === 0 ? (
                /* Empty state */
                <div className="border-2 border-dashed border-stitch-outline/25 p-12 rounded-3xl flex flex-col items-center justify-center text-center bg-slate-50/30">
                  <div className="w-16 h-16 bg-teal-50 border border-[#aeedd5] rounded-full flex items-center justify-center text-stitch-primary mb-4 shadow-sm animate-bounce-slow">
                    <Heart className="w-8 h-8" />
                  </div>
                  <h4 className="font-stitch-display text-base font-bold text-slate-800">
                    No dependents added yet
                  </h4>
                  <p className="text-slate-500 text-xs max-w-sm mt-2 leading-relaxed">
                    {!profileExists
                      ? "To register your first dependent, please complete your residence address on the left first. We need this to match you with local companions."
                      : "Add family members requiring companionship, home care, or nursing assistance. You can save multiple dependent profiles."}
                  </p>
                  <button
                    onClick={handleOpenAddModal}
                    className="mt-6 px-5 py-2.5 bg-stitch-primary hover:bg-[#166f6f] text-white text-xs font-bold rounded-xl shadow-soft hover:shadow-premium transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Register First Dependent
                  </button>
                </div>
              ) : (
                /* Grid of Dependent Cards */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {beneficiaries.map((member) => (
                    <div
                      key={member._id}
                      className="bg-white p-5 rounded-2xl border border-stitch-outline/15 shadow-sm hover:shadow-soft hover:border-stitch-primary/30 transition-all duration-300 flex flex-col justify-between"
                    >
                      <div>
                        {/* Card Header */}
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <div className="flex gap-3">
                            <div className="w-11 h-11 rounded-xl bg-teal-50 border border-[#aeedd5] flex items-center justify-center text-lg shadow-sm">
                              {member.category === "elderly" ? "👴" : "🎗️"}
                            </div>
                            <div>
                              <h4 className="font-stitch-display text-sm font-bold text-slate-800">
                                {member.name}
                              </h4>
                              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                {member.age} years old • <span className="capitalize">{member.gender}</span>
                              </p>
                            </div>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${getCategoryColor(
                              member.category
                            )}`}
                          >
                            {member.category === "elderly" ? "Elder" : "Special Needs"}
                          </span>
                        </div>

                        {/* Medical Details */}
                        <div className="bg-slate-50 border border-slate-100/80 p-3 rounded-xl mb-4 text-xs">
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                            Condition & Care Needs
                          </p>
                          <p className="text-slate-600 font-medium leading-relaxed line-clamp-3">
                            {member.conditionDetails}
                          </p>
                        </div>

                        {/* Hobbies / Interests */}
                        {member.interests && member.interests.length > 0 && (
                          <div className="mb-4">
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                              Interests & Hobbies
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {member.interests.map((interest, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-semibold border border-slate-200/50"
                                >
                                  {interest}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="flex gap-2 pt-3 border-t border-slate-100 mt-4">
                        <button
                          onClick={() => handleOpenEditModal(member)}
                          className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit Profile
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(member._id || null)}
                          className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-xl text-xs font-bold transition-all active:scale-[0.98] flex items-center justify-center cursor-pointer"
                          title="Remove dependent"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Member Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            onClick={() => !savingMember && setModalOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />

          {/* Modal Content */}
          <div className="bg-white rounded-3xl shadow-premium border border-stitch-outline/10 max-w-lg w-full relative z-10 overflow-hidden transform scale-in duration-300 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-stitch-display text-base font-bold text-slate-800">
                  {editingMember ? "Edit Dependent Details" : "Register New Dependent"}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Provide demographic and care requirements for your family member.
                </p>
              </div>
              <button
                disabled={savingMember}
                onClick={() => setModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveMember} className="overflow-y-auto flex-1 p-6 space-y-4 scrollbar-none">
              <div className="grid grid-cols-2 gap-4">
                {/* Name */}
                <div className="col-span-2">
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-stitch-primary/30 focus:border-stitch-primary transition-all text-slate-800 placeholder-slate-400"
                    required
                  />
                </div>

                {/* Age */}
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                    Age
                  </label>
                  <input
                    type="number"
                    value={formAge}
                    onChange={(e) => setFormAge(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="e.g. 78"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-stitch-primary/30 focus:border-stitch-primary transition-all text-slate-800 placeholder-slate-400"
                    required
                    min={0}
                  />
                </div>

                {/* Category Selector */}
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                    Care Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-stitch-primary/30 focus:border-stitch-primary transition-all text-slate-800"
                  >
                    <option value="elderly">Elderly Care</option>
                    <option value="special_needs">Special Needs</option>
                  </select>
                </div>
              </div>

              {/* Gender Selector */}
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                  Gender
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormGender("male")}
                    className={`py-3 rounded-xl border text-xs font-bold transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 ${
                      formGender === "male"
                        ? "bg-[#aeedd5]/50 border-stitch-primary text-[#1d503f]"
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    👴 Male
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormGender("female")}
                    className={`py-3 rounded-xl border text-xs font-bold transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 ${
                      formGender === "female"
                        ? "bg-[#aeedd5]/50 border-stitch-primary text-[#1d503f]"
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    👵 Female
                  </button>
                </div>
              </div>

              {/* Medical/Condition Details */}
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                  Condition & Health Details
                </label>
                <textarea
                  rows={4}
                  value={formCondition}
                  onChange={(e) => setFormCondition(e.target.value)}
                  placeholder="Describe mobility level, medical assistance required, food restrictions, cognitive health (e.g. Alzheimer's level), or medications."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-stitch-primary/30 focus:border-stitch-primary transition-all text-slate-800 placeholder-slate-400 resize-none leading-relaxed"
                  required
                />
              </div>

              {/* Interests & Hobbies */}
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                  Interests & Hobbies (Comma separated)
                </label>
                <input
                  type="text"
                  value={formInterests}
                  onChange={(e) => setFormInterests(e.target.value)}
                  placeholder="e.g. Reading, Chess, Walking, Music, Gardening"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-stitch-primary/30 focus:border-stitch-primary transition-all text-slate-800 placeholder-slate-400"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Type hobbies separated by commas. These help us pair them with like-minded companions.
                </p>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  disabled={savingMember}
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold transition-all active:scale-[0.98] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMember}
                  className="flex-1 py-3 bg-stitch-primary hover:bg-[#166f6f] text-white rounded-xl text-xs font-bold shadow-soft transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {savingMember ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Member Profile"
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
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-premium max-w-sm w-full relative z-10 text-center animate-scale-in">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="font-stitch-display text-base font-bold text-slate-800">
              Remove Family Member?
            </h3>
            <p className="text-slate-500 text-xs mt-2 leading-relaxed">
              Are you sure you want to remove this dependent profile from your family? This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                disabled={deletingId !== null}
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={deletingId !== null}
                onClick={() => confirmDeleteId && handleDeleteMember(confirmDeleteId)}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {deletingId ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Removing...
                  </>
                ) : (
                  "Yes, Remove"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#012d1d] text-white px-5 py-4 rounded-2xl shadow-premium border border-stitch-primary/20 z-50 flex items-center justify-between gap-4 max-w-md animate-slide-up">
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
