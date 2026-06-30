import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import type { BookingScheduleEntry, UserData } from "@/types";
import { getServerAuthToken } from "@/lib/serverAuth";
import {
  getCompanionDashboardStats,
  getCompanionSchedule,
  getMyCompanionProfile,
} from "@/lib/API";
import { StatsSection, ProfileCompletion, type DashboardStats } from "@/components/dashboard/companion/StatsOverview";
import { RecentActivity } from "@/components/dashboard/companion/RecentActivity";
import { ScheduleOverview } from "@/components/dashboard/companion/ScheduleOverview";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CompanionDashboard({ searchParams }: PageProps) {
  const searchParamsVal = await searchParams;
  const viewMode = (searchParamsVal.view as "list" | "timeline") || "list";

  let stats: DashboardStats | null = null;
  let schedule: any[] = [];
  let profile: { userId?: UserData; [key: string]: unknown } | null = null;
  let errorStatus: number | null = null;
  let errorMessage = "";

  const t = await getTranslations("companionDashboard");
  const locale = await getLocale();

  try {
    const accessToken = await getServerAuthToken();
    const config = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Accept-Language": locale,
      },
    };

    const [statsData, scheduleData, profileData] = await Promise.all([
      getCompanionDashboardStats(config),
      getCompanionSchedule(config),
      getMyCompanionProfile(config),
    ]);

    stats = statsData;
    schedule = scheduleData?.schedule || [];
    profile = profileData?.companion;
  } catch (err: unknown) {
    const error = err as { response?: { status?: number; data?: { message?: string } }; status?: number; message?: string };
    console.error("Error loading dashboard data:", err);
    errorStatus = error.response?.status || error.status || 500;
    errorMessage = error.response?.data?.message || error.message || "Failed to load dashboard data. Please try again later.";
  }

  // Handle Missing Profile (404 Companion Profile Not Found)
  if (errorStatus === 404) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6 animate-fade-in font-stitch-body">
        <div className="bg-white p-8 rounded-3xl border border-stitch-outline/10 shadow-soft max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-stitch-primary/10 rounded-full flex items-center justify-center text-stitch-primary mx-auto">
            <span className="material-symbols-outlined text-3xl">account_circle</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-stitch-display font-bold text-stitch-on-surface">
              {t("completeProfile")}
            </h2>
            <p className="text-stitch-on-surface-variant/75 text-sm leading-relaxed">
               {errorMessage || t("completeProfileDesc")}
            </p>
          </div>
          <Link
            href="/companion/profile"
            className="block w-full py-3 px-4 bg-stitch-primary text-white font-bold rounded-xl hover:bg-stitch-primary/95 transition-colors text-center text-sm shadow-sm"
          >
             {t("completeNow")}
          </Link>
        </div>
      </div>
    );
  }

  // Handle general API errors
  if (errorStatus) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6 animate-fade-in font-stitch-body">
        <div className="bg-white p-8 rounded-3xl border border-red-100 shadow-soft max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl">error</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-stitch-on-surface">
               {t("errorTitle")}
            </h2>
            <p className="text-stitch-on-surface-variant/75 text-sm leading-relaxed">
              {errorMessage}
            </p>
          </div>
          <Link
            href="/companion/dashboard"
            className="block w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-stitch-on-surface font-semibold rounded-xl transition-colors text-sm text-center"
          >
             {t("retry")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in font-stitch-body select-none">
      
      {/* Header section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-stitch-display font-bold text-stitch-on-surface tracking-tight">
             {t("welcomeBack", { name: profile?.userId?.name || "Dr. Amina" })}
          </h1>
          <p className="text-stitch-on-surface-variant/70 text-sm mt-1">
             {t("subtitle")}
          </p>
        </div>
        
        {/* Action Icons */}
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 bg-white border border-stitch-outline/20 rounded-full flex items-center justify-center text-stitch-on-surface hover:bg-stitch-secondary-container/10 transition-colors shadow-sm cursor-pointer">
            <span className="material-symbols-outlined text-xl">search</span>
          </button>
          <button className="w-10 h-10 bg-white border border-stitch-outline/20 rounded-full flex items-center justify-center text-stitch-on-surface hover:bg-stitch-secondary-container/10 transition-colors relative shadow-sm cursor-pointer">
            <span className="material-symbols-outlined text-xl">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </button>
        </div>
      </div>

      {/* Stats Cards Section */}
      <StatsSection stats={stats} />

      {/* Middle Cards Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Completion Card */}
        <ProfileCompletion stats={stats} />
        {/* Recent Activity Card */}
        <RecentActivity />
      </div>

      {/* Schedule Overview Section */}
      <ScheduleOverview schedule={schedule} viewMode={viewMode} />
    </div>
  );
}
