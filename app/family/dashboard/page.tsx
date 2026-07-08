import CurrentCaregivers from "@/components/dashboard/family/CurrentCaregivers";
import OverviewSection from "@/components/dashboard/family/OverviewSection";
import QuickActions from "@/components/dashboard/family/QuickActions";
import WelcomeHeader from "@/components/dashboard/family/WelcomeHeader";
import { serverFetch } from "@/lib/serverAuth";
import { getTranslations } from "next-intl/server";

async function getStats() {
  return serverFetch("/family/me/dashboard-stats");
}

export default async function FamilyDashboard() {
  const t = await getTranslations("familyDashboard");

  let stats = null;
  let loadError = false;

  try {
    stats = await getStats();
  } catch (err: unknown) {
    const error = err as { digest?: string; message?: string };
    if (error.digest === "DYNAMIC_SERVER_USAGE" || error.message?.includes("Dynamic server usage")) {
      throw err;
    }
    console.error("Error loading family dashboard:", err);
    loadError = true;
  }

  if (loadError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-3xl text-center">
        <p className="font-semibold">{t("loadError")}</p>
        <a 
          href="/family/dashboard" 
          className="mt-4 inline-block px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          {t("retry")}
        </a>
      </div>
    );
  }

  const userName = stats?.user?.name ? stats.user.name.split(" ")[0] : "Sarah";
  const userAvatar = stats?.user?.avatar || null;

  return (
    <div className="max-w-6xl w-full mx-auto space-y-8 pb-12 animate-fade-in select-none">
      
      {/* Welcome Header */}
      <WelcomeHeader userName={userName} userAvatar={userAvatar} />

      {/* CTA Action Buttons Grid */}
      <QuickActions />

      {/* Overview Section */}
      <OverviewSection 
        activeRequestsCount={stats?.activeRequests?.count ?? 0}
        upcomingVisitsCount={stats?.upcomingVisits?.count ?? 0}
        nextVisitLabel={stats?.upcomingVisits?.nextVisitLabel ?? "No upcoming visits"}
      />

      {/* Current Caregivers Section */}
      <CurrentCaregivers caregivers={stats?.currentCaregivers ?? []} />
    </div>
  );
}
