"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useVerifiedCompanions } from "@/lib/hooks";
import CaregiverCard from "@/components/companion/CaregiverCard";
import CaregiverFilters from "@/components/companion/CaregiverFilters";
import Pagination from "@/components/shared/Pagination";
import SmartSearchBar from "@/components/ai/SmartSearchBar";
import { useAIStore } from "@/store/aiStore";

interface FilterState {
  search: string;
  duration: string;
  rate: string;
  rating: string;
  specialization: string;
  gender: string;
  companionType: string;
}

const DEFAULT_FILTERS: FilterState = {
  search: "",
  duration: "",
  rate: "",
  rating: "",
  specialization: "",
  gender: "",
  companionType: "",
};

const PAGE_SIZE = 9;

// Helper to derive a display title from specialization
function deriveTitle(
  t: any,
  specialization?: string,
  companionType?: string
): string {
  const resolve = (key: string) => t(key) ?? "";
  if (specialization === "nursing") return resolve("titleNurse");
  if (specialization === "physiotherapy") return resolve("titlePhysio");
  if (specialization === "companionship_companion") return resolve("titleCompanion");
  if (specialization === "dementia") return resolve("titleDementia");
  if (companionType === "specialized") return resolve("titleSpecialized");
  return resolve("titleProfessional");
}

function SkeletonCard({ viewMode = "grid" }: { viewMode?: "grid" | "list" }) {
  if (viewMode === "list") {
    return (
      <div className="bg-white rounded-3xl border border-sand-high/60 shadow-soft overflow-hidden animate-pulse flex flex-col md:flex-row">
        <div className="w-full md:w-64 h-52 md:h-auto bg-sand-high/80 shrink-0 min-h-52" />
        <div className="flex-1 p-5 md:p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="h-4 bg-sand-high/80 rounded-full w-3/4" />
            <div className="h-3 bg-sand-high/60 rounded-full w-1/2" />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-3xl border border-sand-high/60 shadow-soft overflow-hidden animate-pulse">
      <div className="h-52 bg-sand-high/80" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-sand-high/80 rounded-full w-3/4" />
        <div className="h-3 bg-sand-high/60 rounded-full w-1/2" />
      </div>
    </div>
  );
}

export default function ClientCompanionsView({ initialData }: { initialData: any }) {
  const t = useTranslations("companionsPage");
  const locale = useLocale();
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Use Zustand AI Store
  const { searchResults, isSearchActive, clearSearch } = useAIStore();

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(filters.search);
      setPage(1); 
    }, 400);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [filters.search]);

  const queryParams = useMemo(() => {
    const p: Record<string, unknown> = { page, limit: PAGE_SIZE };
    if (debouncedSearch) p.search = debouncedSearch;
    if (filters.duration) p.duration = filters.duration;
    if (filters.specialization) p.specialization = filters.specialization;
    if (filters.rating) p.rating = filters.rating;
    if (filters.rate) p.rate = filters.rate;
    if (filters.gender) p.gender = filters.gender;
    if (filters.companionType) p.companionType = filters.companionType;
    return p;
  }, [debouncedSearch, filters, page]);

  const { data: fetchedData, isLoading, error } = useVerifiedCompanions(queryParams);
  const activeData = fetchedData?.data || initialData;

  const companions = useMemo(() => {
    const raw = activeData?.companions || [];
    return raw.map((c: any) => ({
      id: String(c._id ?? c.id ?? ""),
      name: c.userId?.name ?? "Caregiver",
      avatar: c.userId?.avatar,
      title: deriveTitle(t, c.specialization, c.companionType),
      rating: c.rating ?? 5.0,
      reviewsCount: c.reviewCount ?? 0,
      location: c.userId?.location?.readableAddress ?? c.userId?.location?.city ?? "Dubai, UAE",
      hourlyRate: c.hourlyRate ?? 0,
      bio: c.bio ?? "",
      specialization: c.specialization ?? "",
    }));
  }, [activeData, t]);

  const total = isSearchActive ? searchResults.length : (activeData?.pagination?.total ?? companions.length);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleFilterChange = useCallback((key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    if (key !== "search") setPage(1);
  }, []);

  const handleClearAll = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
    clearSearch(); // Clear AI Store
  }, [clearSearch]);

  const displayList = isSearchActive ? searchResults : companions;

  return (
    <div className="max-w-6xl w-full mx-auto space-y-8 pb-16 animate-fade-in select-none">
      <header className="space-y-1">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-stitch-display font-bold text-2xl md:text-3xl text-primary tracking-tight">
              {t("title")}
            </h1>
            <p className="text-sm text-stitch-on-surface-variant mt-1 max-w-xl">
              {t("subtitle")}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-1.5 bg-white border border-sand-high/60 rounded-xl p-1 shadow-soft">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                viewMode === "grid" ? "bg-stitch-primary text-white" : "text-stitch-on-surface-variant hover:bg-sand-low"
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">grid_view</span>
              {t("viewModeGrid")}
            </button>
          </div>
        </div>
      </header>

      <div className="flex justify-center mb-4">
        <SmartSearchBar />
      </div>

      <CaregiverFilters
        filters={filters}
        totalCount={total}
        onFilterChange={handleFilterChange}
        onClearAll={handleClearAll}
      />

      <section
        className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-6"}
      >
        {isLoading && !isSearchActive
          ? Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} viewMode={viewMode} />)
          : displayList.map((companion: any) => (
              <CaregiverCard
                key={companion.id || companion._id}
                id={companion.id || companion._id}
                name={companion.name}
                avatar={companion.avatar}
                title={companion.title || companion.specialization}
                rating={companion.rating}
                reviewsCount={companion.reviewCount || companion.reviewsCount}
                location={companion.location}
                hourlyRate={companion.hourlyRate}
                bio={companion.bio}
                specialization={companion.specialization}
                viewMode={viewMode}
              />
            ))}
      </section>

      {!isLoading && displayList.length > 0 && (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p: number) => setPage(p)} />
      )}
    </div>
  );
}
