import React from "react";
import { serverFetch } from "@/lib/serverAuth";
import WelcomeHeader from "@/components/dashboard/WelcomeHeader";
import QuickActions from "@/components/dashboard/QuickActions";
import OverviewSection from "@/components/dashboard/OverviewSection";
import CurrentCaregivers from "@/components/dashboard/CurrentCaregivers";
import CareSummary from "@/components/dashboard/CareSummary";

async function getStats() {
  return serverFetch("/family/me/dashboard-stats");
}

export default async function FamilyDashboard() {
  try {
    const stats = await getStats();
    const userName = stats?.user?.name ? stats.user.name.split(" ")[0] : "Sarah";
    const userAvatar = stats?.user?.avatar || "/avatar_1.jpg";

    return (
      <div className="max-w-6xl w-full mx-auto space-y-8 pb-12 animate-fade-in select-none">
        
        {/* Welcome Header */}
        <WelcomeHeader userName={userName} userAvatar={userAvatar} />

        {/* CTA Action Buttons Grid */}
        <QuickActions />

        {/* Main Content Grid: Overview & Caregivers on Left, Care Summary on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Side (col-span-2) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview Section */}
            <OverviewSection 
              activeRequestsCount={stats?.activeRequests?.count ?? 0}
              upcomingVisitsCount={stats?.upcomingVisits?.count ?? 0}
              nextVisitLabel={stats?.upcomingVisits?.nextVisitLabel ?? "No upcoming visits"}
            />

            {/* Current Caregivers Section */}
            <CurrentCaregivers caregivers={stats?.currentCaregivers ?? []} />
          </div>

          {/* Right Side - Care Summary Sidebar (col-span-1) */}
          <div className="lg:col-span-1">
            <CareSummary careSummary={stats?.careSummary} />
          </div>
        </div>
      </div>
    );
  } catch (err: any) {
    if (err.digest === "DYNAMIC_SERVER_USAGE" || err.message?.includes("Dynamic server usage")) {
      throw err;
    }
    console.error("Error loading family dashboard:", err);
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-3xl text-center">
        <p className="font-semibold">Failed to load dashboard data. Please make sure you are logged in.</p>
        <a 
          href="/family/dashboard" 
          className="mt-4 inline-block px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          Retry
        </a>
      </div>
    );
  }
}
