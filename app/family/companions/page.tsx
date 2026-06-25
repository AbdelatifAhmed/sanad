"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useVerifiedCompanions } from "@/lib/hooks";
import CaregiverCard from "@/components/companion/CaregiverCard";
import CaregiverFilters from "@/components/companion/CaregiverFilters";

interface FilterState {
  search: string;
  duration: string;
  rate: string;
  rating: string;
  specialization: string;
}

const DEFAULT_FILTERS: FilterState = {
  search: "",
  duration: "",
  rate: "",
  rating: "",
  specialization: "",
};

const PAGE_SIZE = 9;

// Helper to derive a display title from specialization
function deriveTitle(specialization?: string, companionType?: string): string {
  if (specialization === "nursing") return "Registered Nurse";
  if (specialization === "physiotherapy") return "Physiotherapist";
  if (specialization === "companionship_companion") return "Compassionate Companion";
  if (specialization === "dementia") return "Dementia Care Specialist";
  if (companionType === "specialized") return "Specialized Caregiver";
  return "Professional Caregiver";
}

// Skeleton loader card
function SkeletonCard({ viewMode = "grid" }: { viewMode?: "grid" | "list" }) {
  if (viewMode === "list") {
    return (
      <div className="bg-white rounded-3xl border border-sand-high/60 shadow-soft overflow-hidden animate-pulse flex flex-col md:flex-row">
        <div className="w-full md:w-64 h-52 md:h-auto bg-sand-high/80 shrink-0 min-h-[208px]" />
        <div className="flex-1 p-5 md:p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="h-4 bg-sand-high/80 rounded-full w-3/4" />
            <div className="h-3 bg-sand-high/60 rounded-full w-1/2" />
            <div className="h-3 bg-sand-high/60 rounded-full w-full mt-4" />
            <div className="h-3 bg-sand-high/60 rounded-full w-5/6" />
          </div>
          <div className="flex gap-3 mt-4 justify-end">
            <div className="h-10 bg-sand-high/40 rounded-xl w-28" />
            <div className="h-10 bg-sand-high/40 rounded-xl w-28" />
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
        <div className="h-3 bg-sand-high/60 rounded-full w-1/3" />
        <div className="h-10 bg-sand-high/40 rounded-xl mt-4" />
      </div>
    </div>
  );
}

// Empty state
function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center space-y-4">
      <div className="w-20 h-20 rounded-full bg-stitch-secondary-container/40 flex items-center justify-center mb-2">
        <span className="material-symbols-outlined text-4xl text-stitch-primary/60">
          person_search
        </span>
      </div>
      <h3 className="font-stitch-display font-bold text-lg text-[#012d1d]">
        No caregivers found
      </h3>
      <p className="text-sm text-stitch-on-surface-variant max-w-xs">
        Try adjusting your filters or broadening your search to find the right match.
      </p>
      <button
        onClick={onClear}
        className="mt-2 px-6 py-2.5 bg-stitch-primary text-white text-sm font-bold rounded-xl hover:opacity-90 transition-all active:scale-95 shadow-soft"
      >
        Clear Filters
      </button>
    </div>
  );
}

// Pagination bar
function PaginationBar({
  page,
  totalPages,
  onPrev,
  onNext,
  onGoTo,
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  // Build page number list with ellipsis
  const getPages = (): (number | "...")[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 pt-6">
      <button
        onClick={onPrev}
        disabled={page === 1}
        className="flex items-center gap-1 px-4 py-2 rounded-xl border border-sand-high/60 text-xs font-bold text-stitch-primary disabled:opacity-40 disabled:cursor-not-allowed hover:bg-sand-low transition-all"
      >
        <span className="material-symbols-outlined text-[16px]">chevron_left</span>
        Prev
      </button>

      {getPages().map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="px-2 text-stitch-on-surface-variant text-xs">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onGoTo(p as number)}
            className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
              p === page
                ? "bg-stitch-primary text-white shadow-soft"
                : "border border-sand-high/60 text-stitch-on-surface-variant hover:bg-sand-low"
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={onNext}
        disabled={page === totalPages}
        className="flex items-center gap-1 px-4 py-2 rounded-xl border border-sand-high/60 text-xs font-bold text-stitch-primary disabled:opacity-40 disabled:cursor-not-allowed hover:bg-sand-low transition-all"
      >
        Next
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
      </button>
    </div>
  );
}

export default function FamilyCompanionsPage() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Debounce the search term so we don't hit the backend on every keystroke
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(filters.search);
      setPage(1); // reset page when search settles
    }, 400);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [filters.search]);

  // Build query params for the backend — all filtering is server-side
  const queryParams = useMemo(() => {
    const p: Record<string, unknown> = { page, limit: PAGE_SIZE };
    if (debouncedSearch) p.search = debouncedSearch;
    if (filters.duration) p.duration = filters.duration;
    if (filters.specialization) p.specialization = filters.specialization;
    if (filters.rating) p.rating = filters.rating;
    if (filters.rate) p.rate = filters.rate;
    return p;
  }, [debouncedSearch, filters.duration, filters.specialization, filters.rating, filters.rate, page]);

  const { data, isLoading, error } = useVerifiedCompanions(queryParams);

  // Parse backend response
  const companions = useMemo(() => {
    const raw: Record<string, unknown>[] =
      (data as any)?.data?.companions ??
      (data as any)?.companions ??
      [];
    return raw.map((c: any) => ({
      id: c._id ?? c.id,
      name: c.userId?.name ?? "Caregiver",
      avatar: c.userId?.avatar ?? "/avatar_1.jpg",
      title: deriveTitle(c.specialization, c.companionType),
      rating: c.rating ?? 5.0,
      reviewsCount: c.reviewCount ?? 0,
      location:
        c.userId?.location?.readableAddress ??
        c.userId?.location?.city ??
        "Dubai, UAE",
      hourlyRate: c.hourlyRate ?? 0,
      bio: c.bio ?? "",
      specialization: c.specialization ?? "",
    }));
  }, [data]);

  const pagination = (data as any)?.pagination;
  const total: number = pagination?.total ?? companions.length;
  const totalPages: number = pagination?.pages ?? Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleFilterChange = useCallback((key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    // For non-search filters, reset page immediately
    if (key !== "search") setPage(1);
  }, []);

  const handleClearAll = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }, []);

  return (
    <div className="max-w-6xl w-full mx-auto space-y-8 pb-16 animate-fade-in select-none">

      {/* Page Header */}
      <header className="space-y-1">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-stitch-display font-bold text-2xl md:text-3xl text-[#012d1d] tracking-tight">
              Browse Caregivers
            </h1>
            <p className="text-sm text-stitch-on-surface-variant mt-1 max-w-xl">
              Connect with verified, compassionate caregivers who understand the
              value of independence and dignity.
            </p>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-1.5 bg-white border border-sand-high/60 rounded-xl p-1 shadow-soft self-start sm:self-auto">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                viewMode === "grid"
                  ? "bg-stitch-primary text-white"
                  : "text-stitch-on-surface-variant hover:bg-sand-low"
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">grid_view</span>
              Grid
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                viewMode === "list"
                  ? "bg-stitch-primary text-white"
                  : "text-stitch-on-surface-variant hover:bg-sand-low"
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">view_list</span>
              List
            </button>
          </div>
        </div>
      </header>

      {/* Filters */}
      <CaregiverFilters
        filters={filters}
        totalCount={total}
        onFilterChange={handleFilterChange}
        onClearAll={handleClearAll}
      />

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl text-center text-sm font-medium shadow-soft">
          <span className="material-symbols-outlined text-2xl mb-2 block">error</span>
          Failed to load caregivers. Please make sure you are logged in and try again.
        </div>
      )}

      {/* Caregiver Grid/List */}
      <section
        aria-label="Caregiver listings"
        className={
          viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "flex flex-col gap-6"
        }
      >
        {isLoading
          ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <SkeletonCard key={i} viewMode={viewMode} />
            ))
          : companions.length === 0
          ? <EmptyState onClear={handleClearAll} />
          : companions.map((companion) => (
              <CaregiverCard
                key={companion.id}
                id={companion.id}
                name={companion.name}
                avatar={companion.avatar}
                title={companion.title}
                rating={companion.rating}
                reviewsCount={companion.reviewsCount}
                location={companion.location}
                hourlyRate={companion.hourlyRate}
                bio={companion.bio}
                specialization={companion.specialization}
                viewMode={viewMode}
              />
            ))}
      </section>

      {/* Pagination */}
      {!isLoading && companions.length > 0 && (
        <PaginationBar
          page={page}
          totalPages={totalPages}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          onGoTo={(p) => setPage(p)}
        />
      )}

      {/* Results summary */}
      {!isLoading && companions.length > 0 && (
        <p className="text-center text-xs text-stitch-on-surface-variant font-medium">
          Showing page {page} of {totalPages} — {total} caregiver{total !== 1 ? "s" : ""} total
        </p>
      )}
    </div>
  );
}
