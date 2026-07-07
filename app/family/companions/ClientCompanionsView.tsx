"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useVerifiedCompanions } from "@/lib/hooks";
import CaregiverCard from "@/components/companion/CaregiverCard";
import CaregiverFilters from "@/components/companion/CaregiverFilters";
import Pagination from "@/components/shared/Pagination";
import SmartSearchBar from "@/components/ai/SmartSearchBar";
import { useAIStore } from "@/store/aiStore";
import { api } from "@/lib/services/api";

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

const PAGE_SIZE = 20;

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

  const [searchMode, setSearchMode] = useState<"normal" | "ai">("normal");

  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Use Zustand AI Store
  const { searchResults, isSearchActive, clearSearch, aiQuery, setSearchResults, totalCount } = useAIStore();

  // Reset page to 1 when a new AI Search query is submitted
  useEffect(() => {
    setPage(1);
  }, [aiQuery]);

  // Handle AI Search backend pagination when page changes
  useEffect(() => {
    if (!isSearchActive || !aiQuery || searchMode !== "ai") return;

    const fetchAiPage = async () => {
      try {
        const response = await api.post("/ai/family/browse-search", {
          query: aiQuery,
          page: page,
          limit: PAGE_SIZE,
        }, {
          timeout: 45000
        });
        const results = response.data?.data?.companions || [];
        const pagination = response.data?.pagination || { total: results.length, currentPage: page };
        setSearchResults(results, pagination.total, pagination.currentPage);
      } catch (err) {
        console.error("Failed to paginate AI results:", err);
      }
    };

    fetchAiPage();
  }, [page, aiQuery, isSearchActive, setSearchResults, searchMode]);

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
    if (debouncedSearch && searchMode === "normal") p.search = debouncedSearch;
    if (filters.duration && searchMode === "normal") p.duration = filters.duration;
    if (filters.specialization && searchMode === "normal") p.specialization = filters.specialization;
    if (filters.rating && searchMode === "normal") p.rating = filters.rating;
    if (filters.rate && searchMode === "normal") p.rate = filters.rate;
    if (filters.gender && searchMode === "normal") p.gender = filters.gender;
    if (filters.companionType && searchMode === "normal") p.companionType = filters.companionType;
    return p;
  }, [debouncedSearch, filters, page, searchMode]);

  const { data: fetchedData, isLoading, error } = useVerifiedCompanions(queryParams);
  const activeData = fetchedData?.data || initialData;

  const isAiSearchActive = searchMode === "ai" && isSearchActive;

  const displayList = useMemo(() => {
    const raw = isAiSearchActive ? searchResults : (activeData?.companions || []);
    return raw.map((c: any) => ({
      id: String(c._id ?? c.id ?? ""),
      name: c.userId?.name ?? c.name ?? "Caregiver",
      avatar: c.userId?.avatar ?? c.avatar ?? "/avatar_1.jpg",
      title: c.title || deriveTitle(t, c.specialization, c.companionType),
      rating: c.rating ?? 5.0,
      reviewsCount: c.reviewCount ?? c.reviewsCount ?? 0,
      location: typeof c.location === "string"
        ? c.location
        : (c.userId?.location?.readableAddress ?? c.userId?.location?.city ?? "Cairo, Egypt"),
      hourlyRate: c.hourlyRate ?? 0,
      bio: c.bio ?? "",
      specialization: c.specialization ?? "",
    }));
  }, [activeData, searchResults, isAiSearchActive, t]);

  const total = isAiSearchActive ? totalCount : (activeData?.pagination?.total ?? displayList.length);
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

      {/* Modern Switch Toggle segment with sliding backdrop */}
      <div className="flex justify-center my-2">
        <div className="bg-sand-low/40 dark:bg-zinc-800/40 p-1.5 rounded-2xl border border-sand-high/40 relative flex items-center shadow-inner overflow-hidden w-[310px] h-[52px]">
          {/* Sliding Backdrop */}
          <div
            className={`absolute top-1 bottom-1 rounded-xl shadow-sm border border-sand-high/20 transition-all duration-300 ease-out ${
              searchMode === "normal"
                ? "left-1.5 w-[146px] bg-white dark:bg-zinc-700"
                : "left-[156px] w-[146px] bg-stitch-primary"
            }`}
          />
          <button
            onClick={() => {
              clearSearch();
              setSearchMode("normal");
              setPage(1);
            }}
            className={`flex items-center justify-center gap-2 w-[146px] py-2.5 rounded-xl text-xs font-bold transition-all duration-300 relative z-10 cursor-pointer select-none ${
              searchMode === "normal"
                ? "text-stitch-primary"
                : "text-stitch-on-surface-variant/80 hover:text-stitch-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">search</span>
            {locale === "ar" ? "البحث العادي" : "Normal Search"}
          </button>
          <button
            onClick={() => {
              setSearchMode("ai");
              setPage(1);
            }}
            className={`flex items-center justify-center gap-2 w-[146px] py-2.5 rounded-xl text-xs font-bold transition-all duration-300 relative z-10 cursor-pointer select-none ${
              searchMode === "ai"
                ? "text-white"
                : "text-stitch-on-surface-variant/80 hover:text-stitch-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
            {locale === "ar" ? "البحث بالذكاء الاصطناعي" : "AI Search"}
          </button>
        </div>
      </div>

      {/* Conditionally render Search Inputs with fade effects */}
      <div className="transition-all duration-300">
        {searchMode === "ai" ? (
          <div className="flex justify-center mb-4 animate-fade-in">
            <SmartSearchBar />
          </div>
        ) : (
          <div className="relative max-w-xl w-full mx-auto animate-fade-in mb-4">
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              placeholder={locale === "ar" ? "ابحث بالاسم، المهارات أو الكلمات الدلالية..." : "Search by name, skills or keywords..."}
              className="w-full bg-white dark:bg-zinc-800 text-stitch-on-surface rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-stitch-primary/50 border border-sand-high/60 shadow-soft outline-none"
              dir={locale === "ar" ? "rtl" : "ltr"}
            />
            <span className={`material-symbols-outlined absolute top-1/2 -translate-y-1/2 text-stitch-on-surface-variant/50 ${locale === "ar" ? "left-4" : "right-4"}`}>
              search
            </span>
          </div>
        )}
      </div>

      {/* Animated collapse/expand wrapper for CaregiverFilters */}
      <div
        className={`transition-all duration-500 ease-in-out transform origin-top overflow-hidden ${
          searchMode === "normal"
            ? "max-h-[500px] opacity-100 scale-y-100 translate-y-0"
            : "max-h-0 opacity-0 scale-y-95 -translate-y-2 pointer-events-none"
        }`}
      >
        <CaregiverFilters
          filters={filters}
          totalCount={total}
          onFilterChange={handleFilterChange}
          onClearAll={handleClearAll}
        />
      </div>

      {!isLoading && displayList.length === 0 ? (
        <div className="bg-white dark:bg-zinc-800 rounded-3xl border border-sand-high/60 p-8 text-center max-w-lg mx-auto shadow-soft space-y-4 animate-fade-in mt-12">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl">search_off</span>
          </div>
          <div className="space-y-1.5">
            <h3 className="font-bold text-lg text-stitch-on-surface">
              {locale === "ar" ? "لا توجد نتائج بحث" : "No Results Found"}
            </h3>
            <p className="text-xs text-stitch-on-surface-variant/80 leading-relaxed">
              {searchMode === "ai" && aiQuery ? (
                locale === "ar" 
                  ? `لم نجد أي مرافقي رعاية يطابقون شروط البحث بالذكاء الاصطناعي حالياً. قد يكون ذلك بسبب عدم توفر مرافقين في نطاق البحث أو معايير السعر المطلوبة.`
                  : `No caregivers matched your AI search criteria. This might be due to unavailability in the requested city or budget range.`
              ) : (
                locale === "ar"
                  ? "لم نجد أي نتائج تطابق الفلاتر المحددة حالياً. يرجى محاولة توسيع نطاق السعر، تغيير المدينة، أو اختيار أيام عمل أخرى."
                  : "No caregivers matched your active filters. Try widening your budget, changing the city, or selecting different days."
              )}
            </p>
          </div>
          <button
            onClick={handleClearAll}
            className="px-4 py-2 bg-stitch-primary text-white rounded-xl text-xs font-bold hover:opacity-95 transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-md"
          >
            <span className="material-symbols-outlined text-sm">restart_alt</span>
            {locale === "ar" ? "إعادة تعيين البحث" : "Reset Search"}
          </button>
        </div>
      ) : (
        <section
          key={`${searchMode}-${displayList.length}-${page}`}
          className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up" : "flex flex-col gap-6 animate-fade-in-up"}
        >
          {isLoading && !isAiSearchActive
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
      )}

      {!isLoading && displayList.length > 0 && (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p: number) => setPage(p)} />
      )}
    </div>
  );
}
