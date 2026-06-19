import React from "react";
import { serverFetch } from "@/lib/serverAuth";
import DirectCareRequestForm from "@/components/care-request/DirectCareRequestForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getCompanionData(id: string) {
  try {
    const data = await serverFetch(`/companion/${id}`);
    return data?.companion || null;
  } catch (error) {
    console.warn(`Could not fetch companion ID ${id} from API, using fallback data.`, error);
    return null;
  }
}

export default async function DirectCareRequestPage({ params }: PageProps) {
  const { id } = await params;
  const companion = await getCompanionData(id);

  // Map using the same logic as the companion profile page for consistency
  let title = "Professional Caregiver";
  if (companion) {
    if (companion.specialization === "nursing") {
      title = "Registered Nurse & Specialized Caregiver";
    } else if (companion.specialization === "physiotherapy") {
      title = "Physiotherapist & Specialized Caregiver";
    } else if (companion.specialization === "companionship_companion") {
      title = "Senior Companion & Caregiver";
    } else if (companion.companionType === "specialized") {
      title = "Specialized Senior Caregiver";
    } else {
      title = "General Caregiver & Companion";
    }
  }

  const yearsExp = companion && companion.totalWorkHours > 0
    ? Math.max(1, Math.round(companion.totalWorkHours / 200))
    : 5;

  const mappedCompanion = {
    id: companion?.userId?._id || id,
    name: companion?.userId?.name || "Amina Al-Farsi",
    avatar: companion?.userId?.avatar || "/avatar_3.jpg",
    rating: companion?.rating ?? 4.9,
    verified: companion ? companion.verificationStatus === "verified" : true,
    title: title,
    experience: `${yearsExp}+ Years Exp.`,
    location: companion?.userId?.location?.readableAddress ||
              companion?.userId?.location?.city ||
              "Dubai Healthcare City",
    bio: companion?.bio || "Providing dignified, professional care with an empathetic touch to ensure your family's comfort.",
  };

  return (
    <div className="w-full h-full pb-10">
      <DirectCareRequestForm companion={mappedCompanion} />
    </div>
  );
}
