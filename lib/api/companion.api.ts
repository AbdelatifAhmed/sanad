import { api } from "@/lib/services/api";

// Types based on the backend response
export interface CompanionProfile {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    avatar?: { url: string; public_id: string };
    location?: any;
  };
  companionType: string;
  specialization: string;
  bio: string;
  hourlyRate: number;
  skills: any[];
  hobbies: string[];
  availability: Array<{ day: string; slots: string[] }>;
  rating: number;
  reviewCount: number;
  totalWorkHours: number;
  verificationStatus: string;
  documents?: {
    nationalIdCard?: { url: string; public_id: string };
    criminalRecord?: { url: string; public_id: string };
    syndicateCard?: { url: string; public_id: string };
    Certificates?: Array<{ name: string; url: string; public_id: string }>;
  };
}

export const getMyProfile = async (): Promise<CompanionProfile> => {
  try {
    const res = await api.get("/companion/me");
    return res.data.data.companion;
  } catch (error) {
    console.error("Error fetching companion profile:", error);
    throw error;
  }
};

export const updateProfileInfo = async (data: Partial<CompanionProfile>) => {
  try {
    const res = await api.patch("/companion/profile", data);
    return res.data;
  } catch (error) {
    console.error("Error updating profile info:", error);
    throw error;
  }
};

export const updateAvailability = async (availability: Array<{ day: string; slots: string[] }>) => {
  try {
    const res = await api.patch("/companion/me/availability", { availability });
    return res.data;
  } catch (error) {
    console.error("Error updating availability:", error);
    throw error;
  }
};

export const updateLocation = async (locationData: { coordinates: [number, number]; readableAddress: string; city: string; governorate: string }) => {
  try {
    const res = await api.patch("/companion/me/location", locationData);
    return res.data;
  } catch (error) {
    console.error("Error updating location:", error);
    throw error;
  }
};

export const getCompanionReviews = async (companionId: string, page = 1, limit = 10) => {
  try {
    const res = await api.get(`/reviews/companion/${companionId}`, {
      params: { page, limit }
    });
    return res.data;
  } catch (error) {
    console.error("Error fetching companion reviews:", error);
    throw error;
  }
};

export interface SkillItem {
  _id: string;
  nameAr: string;
  nameEn: string;
  category: string;
}

export const getAllSkills = async (): Promise<SkillItem[]> => {
  try {
    const res = await api.get("/skills");
    return res.data.data.skills;
  } catch (error) {
    console.error("Error fetching all skills:", error);
    throw error;
  }
};
