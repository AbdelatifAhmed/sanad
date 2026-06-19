import CompanionAbout from "@/components/companion/CompanionAbout";
import CompanionBookingCard from "@/components/companion/CompanionBookingCard";
import CompanionCertifications from "@/components/companion/CompanionCertifications";
import CompanionHeader from "@/components/companion/CompanionHeader";
import CompanionSkills from "@/components/companion/CompanionSkills";
import CompanionHobbies from "@/components/companion/CompanionHobbies";
import CompanionAvailability from "@/components/companion/CompanionAvailability";
import { serverFetch } from "@/lib/serverAuth";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getCompanionData(id: string) {
  const data = await serverFetch(`/companion/${id}`);
  return data.companion;
}

export default async function CompanionProfilePage({ params }: PageProps) {
  let id = "";
  try {
    const resolvedParams = await params;
    id = resolvedParams.id;
    const companion = await getCompanionData(id);

    if (!companion) {
      throw new Error("Companion not found");
    }

    // Dynamic mapping from database schema , to page/components format
    const name = companion.userId?.name || "Caregiver";
    const avatar = companion.userId?.avatar || "/avatar_3.jpg";
    const verified = companion.verificationStatus === "verified";
    
    // Map title dynamically based on specialization
    let title = "Professional Caregiver";
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

    const rating = companion.rating ?? 5.0;
    const reviewsCount = companion.reviewCount ?? 0;
    
    // Map Location
    const location = companion.userId?.location?.readableAddress || 
                     companion.userId?.location?.city || 
                     "Dubai Healthcare City";

    // Dynamic Experience mapping (fallback if totalWorkHours is 0)
    const yearsExp = companion.totalWorkHours > 0 
      ? Math.max(1, Math.round(companion.totalWorkHours / 200)) 
      : 5;
    const experience = `${yearsExp}+ Years Exp.`;

    // Process biography paragraphs (split by newline)
    const bioParagraphs = companion.bio
      ? companion.bio.split("\n").filter((p: string) => p.trim() !== "")
      : ["No biography provided."];

    // Extract clinical skills names
    const skillsList = companion.skills && companion.skills.length > 0
      ? companion.skills.map((s: { nameEn?: string; nameAr?: string }) => s.nameEn || s.nameAr)
      : ["General Caregiving"];

    // Extract hobbies
    const hobbiesList = companion.hobbies && companion.hobbies.length > 0
      ? companion.hobbies
      : [];

    return (
      <div className="max-w-6xl w-full mx-auto space-y-8 pb-16 animate-fade-in select-none">
        
        {/* Row 1: Header & Booking Card (Equal size / Symmetrical height) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          <CompanionHeader 
            name={name}
            avatar={avatar}
            verified={verified}
            title={title}
            rating={rating}
            reviewsCount={reviewsCount}
            location={location}
            experience={experience}
          />
          <CompanionBookingCard 
            id={id}
            hourlyRate={companion.hourlyRate}
            name={name}
          />
        </div>

        {/* Row 2: About Me Section */}
        <div className="w-full">
          <CompanionAbout bio={bioParagraphs} />
        </div>

        {/* Row 3: Skills, Certifications (Verified Credentials) & Hobbies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CompanionSkills skills={skillsList} />
          <CompanionCertifications documents={companion.documents} />
          <CompanionHobbies hobbies={hobbiesList} />
        </div>

        {/* Row 4: Availability Schedule */}
        <div className="w-full">
          <CompanionAvailability availability={companion.availability} />
        </div>

      </div>
    );
  } catch (err: any) {
    if (err.digest === "DYNAMIC_SERVER_USAGE" || err.message?.includes("Dynamic server usage")) {
      throw err;
    }
    console.error("Error loading companion profile page:", err);
    return (
      <div className="max-w-xl mx-auto my-12 bg-red-50 border border-red-200 text-red-700 p-8 rounded-3xl text-center space-y-4 shadow-soft">
        <h3 className="text-lg font-bold">Error Loading Caregiver Profile</h3>
        <p className="text-sm text-red-600">
          We couldn&apos;t retrieve this caregiver&apos;s profile. Please verify the ID or make sure you are logged in.
        </p>
        <a 
          href={`/family/companions/${id}`}
          className="inline-block bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          Try Again
        </a>
      </div>
    );
  }
}


