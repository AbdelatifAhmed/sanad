import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { serverFetch } from "@/lib/serverAuth";
import BookingDetailHeader from "@/components/companion/BookingDetailHeader";
import BookingOverview from "@/components/companion/BookingOverview";
import ProposalForm from "@/components/companion/ProposalForm";
import BookingSidebar from "@/components/companion/BookingSidebar";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getTranslations("companionBookingDetails");
  const locale = await getLocale();
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

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4 font-stitch-body">
        <span className="material-symbols-outlined text-red-500 text-5xl">error</span>
        <h2 className="text-xl font-bold text-stitch-on-surface">
          {locale === "ar" ? "طلب العمل غير موجود" : "Job Post Not Found"}
        </h2>
        <p className="text-stitch-on-surface-variant/80 text-sm max-w-sm leading-relaxed">
          {locale === "ar" 
            ? "عذراً، لم نتمكن من العثور على طلب العمل المحدد. قد يكون قد تم حذفه أو إغلاقه." 
            : "Sorry, we couldn't find the requested job post. It might have been deleted or closed."}
        </p>
        <Link
          href="/companion/bookings"
          className="px-5 py-2.5 bg-[#005f56] text-white font-bold rounded-xl hover:bg-[#004e46] transition-colors text-sm shadow-sm"
        >
          {t("backToBookings")}
        </Link>
      </div>
    );
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
