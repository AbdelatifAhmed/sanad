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
import { 
  Star, MapPin, Edit2, Check, X, Camera, Plus, Loader2, Upload, Calendar, Clock, FileText, VerifiedIcon, CheckCircle2,
  UploadCloud
} from "lucide-react";
import { useLocale } from "next-intl";

interface EditableProfileProps {
  initialData: CompanionProfile | null;
}

export default function EditableProfile({ initialData }: EditableProfileProps) {
  const locale = useLocale();
  const [profile, setProfile] = useState<CompanionProfile | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [saving, setSaving] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [docUploading, setDocUploading] = useState(false);
  
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

  // New Certificate Upload State
  const [showCertUpload, setShowCertUpload] = useState(false);
  const [certName, setCertName] = useState("");
  const [certFile, setCertFile] = useState<File | null>(null);

  const [avatarLoading, setAvatarLoading] = useState(false);

  useEffect(() => {
    if (!initialData) {
      fetchProfile();
    } else if (initialData.userId?._id) {
      fetchReviews(initialData.userId._id);
    }
  }, [initialData]);

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

  const saveInfo = async () => {
    try {
      setSaving(true);
      const hobbiesArray = hobbiesEdit.split(",").map(h => h.trim()).filter(h => h !== "");
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
          hourlyRate: result.hourlyRate !== undefined ? result.hourlyRate : Number(hourlyRateEdit)
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
              <span className="font-bold text-gray-900">Online</span>
            </div>
            {/* Fake toggle for UI matching */}
            <div className="w-10 h-6 bg-gray-300 rounded-full flex items-center p-1 cursor-not-allowed opacity-50">
              <div className="w-4 h-4 bg-white rounded-full translate-x-4 shadow-sm"></div>
            </div>
          </div>
          <button className="px-6 py-3 bg-stitch-primary text-white font-bold rounded-xl hover:bg-stitch-primary-container transition-colors shadow-sm w-full md:w-auto">
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
          <div className="bg-[#FCF9F6] rounded-3xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Certifications</h2>
            </div>

            <div className="space-y-4">

              {/* National ID Check */}
              <div className={`p-4 rounded-2xl border shadow-sm ${hasNationalId ? 'bg-white border-gray-100' : 'bg-transparent border-dashed border-gray-300'}`}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-sm">National ID</h3>
                    {hasNationalId ? (
                      <div className="flex items-center gap-1 text-xs font-bold text-teal-700 mt-1">
                        <CheckCircle2 className="w-3 h-3" /> VERIFIED
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">Required Document</p>
                    )}
                  </div>
                  {!hasNationalId && (
                    <label className="text-stitch-primary cursor-pointer hover:bg-gray-100 p-2 rounded-full transition-colors">
                      {docUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                      <input type="file" className="hidden" accept=".pdf,image/jpeg,image/png" onChange={(e) => e.target.files?.[0] && handleDocumentUpload('nationalIdCard', e.target.files[0])} disabled={docUploading} />
                    </label>
                  )}
                </div>
              </div>

              {/* Criminal Record Check */}
              <div className={`p-4 rounded-2xl border shadow-sm ${hasCriminalRecord ? 'bg-white border-gray-100' : 'bg-transparent border-dashed border-gray-300'}`}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-sm">Criminal Record</h3>
                    {hasCriminalRecord ? (
                      <div className="flex items-center gap-1 text-xs font-bold text-teal-700 mt-1">
                        <CheckCircle2 className="w-3 h-3" /> VERIFIED
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">Required Document</p>
                    )}
                  </div>
                  {!hasCriminalRecord && (
                    <label className="text-stitch-primary cursor-pointer hover:bg-gray-100 p-2 rounded-full transition-colors">
                      {docUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                      <input type="file" className="hidden" accept=".pdf,image/jpeg,image/png" onChange={(e) => e.target.files?.[0] && handleDocumentUpload('criminalRecord', e.target.files[0])} disabled={docUploading} />
                    </label>
                  )}
                </div>
              </div>

              {/* Named Certificates */}
              {profile.documents?.Certificates?.map((cert: any, i: number) => (
                <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{cert.name}</h3>
                      <div className="flex items-center gap-1 text-xs font-bold text-teal-700 mt-1">
                        <CheckCircle2 className="w-3 h-3" /> VERIFIED
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add New Certificate Form */}
              {showCertUpload ? (
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                  <input 
                    type="text" 
                    placeholder="Certificate Name" 
                    value={certName}
                    onChange={e => setCertName(e.target.value)}
                    className="w-full text-sm p-2 border border-gray-200 rounded-lg outline-none focus:border-stitch-primary"
                  />
                  <input 
                    type="file" 
                    onChange={e => setCertFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-stitch-primary/10 file:text-stitch-primary hover:file:bg-stitch-primary/20"
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => setShowCertUpload(false)} className="text-xs font-bold text-gray-500 px-3 py-1.5 hover:bg-gray-100 rounded-lg">Cancel</button>
                    <button 
                      onClick={() => certFile && certName && handleDocumentUpload('Certificates', certFile, certName)}
                      disabled={!certFile || !certName || docUploading}
                      className="text-xs font-bold text-white bg-stitch-primary px-3 py-1.5 rounded-lg disabled:opacity-50 flex items-center gap-1"
                    >
                      {docUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Upload"}
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setShowCertUpload(true)}
                  className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500 hover:text-stitch-primary hover:border-stitch-primary hover:bg-stitch-primary/5 transition-all font-bold text-sm flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Certificate
                </button>
              )}

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

        </div>
      </div>
    </div>
  );
}
