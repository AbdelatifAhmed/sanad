import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { serverFetch } from "@/lib/serverAuth";
import BookingDetailHeader from "@/components/companion/BookingDetailHeader";
import BookingOverview from "@/components/companion/BookingOverview";
import ProposalForm from "@/components/companion/ProposalForm";
import BookingSidebar from "@/components/companion/BookingSidebar";

interface JobDetail {
  id: number;
  categoryKey: string;
  categoryType: string;
  titleKey: string;
  recipientName: string;
  recipientAge: number;
  locationName: string;
  locationAddress: string;
  approxDistance: string;
  postedTimeAgoKey: string;
  postedTimeAgoParams?: Record<string, any>;
  overview: string;
  overviewAr: string;
  requiredSkills: string[];
  requiredSkillsAr: string[];
  preferences: {
    preferredGender: string;
    preferredGenderAr: string;
    minExperience: string;
    minExperienceAr: string;
    backgroundCheck: string;
    backgroundCheckAr: string;
  };
  scheduleDays: string;
  scheduleDaysAr: string;
  scheduleTimes: string;
  scheduleHoursPerShift: number;
  hourlyRateRange: string;
  weeklyBudget: string;
  budgetHours: number;
  budgetShifts: number;
  budgetHoursPerShift: number;
  location?: any;
}

const JOBS_DETAILS: Record<number, JobDetail> = {
  1: {
    id: 1,
    categoryKey: "elderlyCare",
    categoryType: "elderly_care",
    titleKey: "job1Title",
    recipientName: "Sarah J.",
    recipientAge: 82,
    locationName: "Oakwood District, WA",
    locationAddress: "1248 Oakwood Ave, Seattle, WA 98103",
    location: {
      geo: {
        type: "Point",
        coordinates: [-122.3321, 47.6062] // Seattle
      },
      readableAddress: "1248 Oakwood Ave, Seattle, WA 98103",
      city: "Seattle",
      governorate: "WA"
    },
    approxDistance: "4.2",
    postedTimeAgoKey: "hoursAgoTwo",
    overview: "Sarah is a vibrant 82-year-old who requires gentle morning assistance to start her day. She is early-stage Alzheimer's and appreciates a caregiver who is patient, engaging, and capable of light meal preparation. The primary focus is on companionship and ensuring she takes her morning medications safely. We are looking for someone who can bring a positive energy to her household and build a meaningful connection.",
    overviewAr: "سارة هي سيدة مفعمة بالحيوية تبلغ من العمر 82 عاماً وتحتاج إلى مساعدة صباحية لطيفة لبدء يومها. هي في المراحل المبكرة من مرض ألزهايمر وتقدر مقدم الرعاية الذي يتسم بالصبر والتفاعل والقدرة على تحضير وجبات الطعام الخفيفة. التركيز الأساسي هو على المرافقة والتأكد من تناولها لأدوية الصباح بأمان. نحن نبحث عن شخص يمكنه إدخال طاقة إيجابية إلى منزلها وبناء علاقة ذات مغزى.",
    requiredSkills: ["Alzheimer's Care", "Medication Reminders", "Meal Prep", "Mobility Support"],
    requiredSkillsAr: ["رعاية ألزهايمر", "التذكير بالأدوية", "تحضير الطعام", "دعم الحركة"],
    preferences: {
      preferredGender: "Female",
      preferredGenderAr: "أنثى",
      minExperience: "3+ Years",
      minExperienceAr: "3+ سنوات",
      backgroundCheck: "Required",
      backgroundCheckAr: "مطلوب"
    },
    scheduleDays: "Mon, Wed, Fri",
    scheduleDaysAr: "الإثنين، الأربعاء، الجمعة",
    scheduleTimes: "08:00 AM - 12:00 PM",
    scheduleHoursPerShift: 4,
    hourlyRateRange: "$25 - $32",
    weeklyBudget: "$300 - $384",
    budgetHours: 12,
    budgetShifts: 3,
    budgetHoursPerShift: 4
  },
  2: {
    id: 2,
    categoryKey: "postOpSupport",
    categoryType: "post_op",
    titleKey: "job2Title",
    recipientName: "Arthur D.",
    recipientAge: 55,
    locationName: "Jeddah Corniche, KSA",
    locationAddress: "582 King Abdulaziz Rd, Jeddah 23613",
    location: {
      geo: {
        type: "Point",
        coordinates: [39.15, 21.60] // Jeddah
      },
      readableAddress: "582 King Abdulaziz Rd, Jeddah 23613",
      city: "Jeddah",
      governorate: "Makkah Region"
    },
    approxDistance: "6.8",
    postedTimeAgoKey: "hoursAgo",
    postedTimeAgoParams: { count: 5 },
    overview: "Professional support needed for a 55-year-old recovering from knee arthroplasty. Includes PT exercise supervision, vital signs monitoring, wound care, and assistance with mobility devices. The ideal companion should have nursing experience and be comfortable assisting with daily transfers.",
    overviewAr: "مطلوب دعم احترافي لمريض يبلغ من العمر 55 عامًا يتعافى من جراحة استبدال مفصل الركبة. يشمل الإشراف على التمارين العلاجية، ومراقبة المؤشرات الحيوية، ورعاية الجروح، والمساعدة في استخدام أجهزة الحركة. يجب أن يكون لدى المرافق المثالي خبرة في التمريض وأن يكون مرتاحاً في المساعدة في النقل اليومي.",
    requiredSkills: ["Knee Rehab Support", "Wound Care", "Vital Signs", "Transfer Training"],
    requiredSkillsAr: ["دعم تأهيل الركبة", "رعاية الجروح", "المؤشرات الحيوية", "التدريب على الانتقال"],
    preferences: {
      preferredGender: "Any Gender",
      preferredGenderAr: "أي جنس",
      minExperience: "5+ Years",
      minExperienceAr: "5+ سنوات",
      backgroundCheck: "Required",
      backgroundCheckAr: "مطلوب"
    },
    scheduleDays: "Sun, Tue, Thu",
    scheduleDaysAr: "الأحد، الثلاثاء، الخميس",
    scheduleTimes: "10:00 AM - 04:00 PM",
    scheduleHoursPerShift: 6,
    hourlyRateRange: "$30 - $35",
    weeklyBudget: "$540 - $630",
    budgetHours: 18,
    budgetShifts: 3,
    budgetHoursPerShift: 6
  },
  3: {
    id: 3,
    categoryKey: "companionCare",
    categoryType: "companion",
    titleKey: "job3Title",
    recipientName: "Ahmed K.",
    recipientAge: 79,
    locationName: "Riyadh Olaya, KSA",
    locationAddress: "82 Olaya Towers, Riyadh 12212",
    location: {
      geo: {
        type: "Point",
        coordinates: [46.67, 24.71] // Riyadh
      },
      readableAddress: "82 Olaya Towers, Riyadh 12212",
      city: "Riyadh",
      governorate: "Riyadh Region"
    },
    approxDistance: "2.1",
    postedTimeAgoKey: "hoursAgo",
    postedTimeAgoParams: { count: 12 },
    overview: "Looking for a friendly companion to spend a few hours weekly reading, talking, and walking in the park with Mr. Ahmed. He is a retired educator who enjoys history and literature. The ideal candidate should be patient, a good listener, and speak fluent Arabic.",
    overviewAr: "نبحث عن مرافق ودود لقضاء بضع ساعات أسبوعياً في القراءة، الحديث، والمشي في الحديقة مع السيد أحمد. هو معلم متقاعد يستمتع بالتاريخ والأدب. يجب أن يكون المرشح المثالي صبوراً، ومستمعاً جيداً، ويتحدث العربية بطلاقة.",
    requiredSkills: ["Active Listening", "Arabic Fluency", "Short Walks", "Companion Reading"],
    requiredSkillsAr: ["الاستماع الفعال", "طلاقة العربية", "المشي القصير", "القراءة المرافقة"],
    preferences: {
      preferredGender: "Male Preferred",
      preferredGenderAr: "يفضل ذكر",
      minExperience: "1+ Years",
      minExperienceAr: "1+ سنوات",
      backgroundCheck: "Required",
      backgroundCheckAr: "مطلوب"
    },
    scheduleDays: "Mon, Thu",
    scheduleDaysAr: "الإثنين، الخميس",
    scheduleTimes: "04:00 PM - 07:00 PM",
    scheduleHoursPerShift: 3,
    hourlyRateRange: "$20 - $25",
    weeklyBudget: "$120 - $150",
    budgetHours: 6,
    budgetShifts: 2,
    budgetHoursPerShift: 3
  }
};

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getTranslations("companionBookingDetails");
  const { id } = await params;

  let job: any = null;
  try {
    const data = await serverFetch(`/job-posts/${id}`);
    if (data && data.job) {
      job = data.job;
    }
  } catch (error) {
    console.error(`Failed to fetch job post ID ${id} from API:`, error);
  }

  // Fallback to static mock details only if the API call fails or ID is a test integer
  if (!job) {
    const mockId = parseInt(id) || 1;
    job = JOBS_DETAILS[mockId] || JOBS_DETAILS[1];
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 animate-fade-in font-stitch-body select-none">
      {/* Back button */}
      <Link
        href="/companion/bookings"
        className="flex items-center gap-1.5 text-[#005f56] hover:text-[#004e46] text-sm font-bold mb-6 w-fit cursor-pointer transition-colors"
      >
        <span className="material-symbols-outlined text-lg rtl:rotate-180">arrow_back</span>
        {t("backToBookings")}
      </Link>

      {/* Main Container */}
      <div className="space-y-8">
        
        {/* Header Block Component */}
        <BookingDetailHeader job={job} />

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column (Span 2) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Overview, Skills & Preferences Server Component */}
            <BookingOverview job={job} />

            {/* Interactive Proposal Form Client Component */}
            <ProposalForm 
              jobId={job._id || job.id} 
              jobStatus={job.status || "open"} 
              hasApplied={job.hasApplied || false}
              appliedProposalStatus={job.appliedProposalStatus || null}
            />

          </div>

          {/* Right Column (Sidebar) Server Component */}
          <div className="lg:col-span-1">
            <BookingSidebar job={job} />
          </div>

        </div>

      </div>
    </div>
  );
}
