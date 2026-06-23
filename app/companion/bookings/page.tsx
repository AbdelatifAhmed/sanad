import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { serverFetch } from "@/lib/serverAuth";
import BookingsFilters from "@/components/companion/BookingsFilters";
import BookingCard from "@/components/companion/BookingCard";
import Pagination from "@/components/shared/Pagination";

export default async function CompanionBookings({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("companionBookings");
  const locale = await getLocale();

  const params = await searchParams;
  const location = (params.location as string) || "all";
  const nearMe = params.nearMe === "true";
  const careType = (params.careType as string) || "all";
  const date = (params.date as string) || "all";
  const startDate = (params.startDate as string) || "";
  const endDate = (params.endDate as string) || "";
  const page = parseInt(params.page as string) || 1;
  const maxDistanceInKm = (params.maxDistanceInKm as string) || "20";

  // Build backend search query parameters
  const queryParams = new URLSearchParams();
  if (location !== "all") queryParams.set("location", location);
  if (nearMe) queryParams.set("nearMe", "true");
  if (careType !== "all") queryParams.set("serviceType", careType);
  if (startDate) queryParams.set("startDate", startDate);
  if (endDate) queryParams.set("endDate", endDate);
  else if (date !== "all") queryParams.set("date", date);
  queryParams.set("maxDistanceInKm", maxDistanceInKm);
  queryParams.set("page", page.toString());
  queryParams.set("limit", "10"); // Fetch 10 items per page

  let jobs: any[] = [];
  let totalJobs = 0;
  let totalPages = 1;
  let currentPage = page;

  let serviceTypes: string[] = [];
  try {
    const data = await serverFetch("/job-posts/service-types");
    if (data && data.serviceTypes) {
      serviceTypes = data.serviceTypes;
    }
  } catch (error) {
    console.error("Failed to load service types from backend:", error);
    serviceTypes = [
      "elderly_care",
      "child_care",
      "home_nursing",
      "physical_therapy",
      "companionship",
    ];
  }

  try {
    const apiData = await serverFetch(`/job-posts?${queryParams.toString()}`);
    if (apiData) {
      jobs = apiData.jobs || [];
      if (apiData.pagination) {
        totalJobs = apiData.pagination.totalJobs || 0;
        totalPages = apiData.pagination.totalPages || 1;
        currentPage = apiData.pagination.currentPage || page;
      }
    }
  } catch (error) {
    console.error("Error fetching jobs from backend API:", error);
  }

  return (
    <div className="space-y-8 animate-fade-in font-stitch-body select-none max-w-5xl mx-auto py-6 px-4">
      {/* Title */}
      <h1 className="text-2xl font-stitch-display font-extrabold text-stitch-on-surface tracking-tight">
        {t("title")}
      </h1>

      {/* Filters Bar Component */}
      <BookingsFilters 
        filters={{ location, nearMe, careType, date, maxDistanceInKm, startDate, endDate }} 
        serviceTypes={serviceTypes}
      />

      {/* Jobs List */}
      <div className="space-y-6 animate-fade-in">
        {jobs.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stitch-outline/10 shadow-soft py-16 px-4 text-center max-w-lg mx-auto flex flex-col items-center gap-4 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-stitch-on-surface-variant/30">
              <span className="material-symbols-outlined text-3xl">search_off</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-stitch-on-surface">
                {locale === "ar" ? "لا توجد نتائج" : "No Results"}
              </h3>
              <p className="text-sm text-stitch-on-surface-variant/65">
                {t("noJobsFound")}
              </p>
            </div>
            <Link
              href="/companion/bookings"
              className="mt-2 bg-[#005f56] hover:bg-[#004e46] text-white font-extrabold py-2.5 px-6 rounded-xl text-xs transition-colors cursor-pointer"
            >
              {t("resetFilters")}
            </Link>
          </div>
        ) : (
          jobs.map((job) => (
            <BookingCard key={job._id || job.id} job={job} />
          ))
        )}
      </div>

      {/* Pagination Server Component */}
      {jobs.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          searchParams={params}
          baseUrl="/companion/bookings"
        />
      )}
    </div>
  );
}
