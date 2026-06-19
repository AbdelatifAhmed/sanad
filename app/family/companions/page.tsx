"use client";

import { useState, useMemo, useEffect } from "react";
import { useVerifiedCompanions } from "@/lib/hooks";
import CaregiverCard from "@/components/companion/CaregiverCard";
import CaregiverFilters from "@/components/companion/CaregiverFilters";

interface FilterState {
  search: string;
  experience: string;
  rate: string;
  rating: string;
  specialization: string;
}

const DEFAULT_FILTERS: FilterState = {
  search: "",
  experience: "",
  rate: "",
  rating: "",
  specialization: "",
};

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
function SkeletonCard() {
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

const PAGE_SIZE = 9;

export default function FamilyCompanionsPage() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useVerifiedCompanions();

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  // Map raw API data to a safe shape
  const allCompanions = useMemo(() => {
    const raw: any[] = data?.companions ?? data ?? [];
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
      verified: c.verificationStatus === "verified",
      specialization: c.specialization ?? "",
      totalWorkHours: c.totalWorkHours ?? 0,
    }));
  }, [data]);

  // Client-side filtering
  const filtered = useMemo(() => {
    return allCompanions.filter((c) => {
      // Search
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const match =
          c.name.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.bio.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Specialization chip
      if (filters.specialization && c.specialization !== filters.specialization) {
        return false;
      }

      // Experience (work hours / 200 ≈ years)
      if (filters.experience) {
        const minYears = parseInt(filters.experience);
        const years = c.totalWorkHours > 0 ? Math.round(c.totalWorkHours / 200) : 0;
        if (years < minYears) return false;
      }

      // Rate
      if (filters.rate) {
        const rate = c.hourlyRate;
        if (filters.rate === "0-100" && rate >= 100) return false;
        if (filters.rate === "100-150" && (rate < 100 || rate > 150)) return false;
        if (filters.rate === "150+" && rate < 150) return false;
      }

      // Rating
      if (filters.rating) {
        const minRating = parseFloat(filters.rating);
        if (c.rating < minRating) return false;
      }

      return true;
    });
  }, [allCompanions, filters]);

  const paginated = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = paginated.length < filtered.length;

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearAll = () => {
    setFilters(DEFAULT_FILTERS);
  };

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

          {/* View mode toggle (cosmetic, list is default) */}
          <div className="flex items-center gap-1.5 bg-white border border-sand-high/60 rounded-xl p-1 shadow-soft self-start sm:self-auto">
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stitch-primary text-white text-xs font-bold transition-all">
              <span className="material-symbols-outlined text-[15px]">grid_view</span>
              Grid
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-stitch-on-surface-variant text-xs font-bold hover:bg-sand-low transition-all">
              <span className="material-symbols-outlined text-[15px]">view_list</span>
              List
            </button>
          </div>
        </div>
      </header>

      {/* Filters */}
      <CaregiverFilters
        filters={filters}
        totalCount={filtered.length}
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

      {/* Caregiver Grid */}
      <section
        aria-label="Caregiver listings"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {isLoading
          ? Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)
          : paginated.length === 0
          ? <EmptyState onClear={handleClearAll} />
          : paginated.map((companion) => (
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
                verified={companion.verified}
                specialization={companion.specialization}
              />
            ))}
      </section>

      {/* Load More */}
      {!isLoading && hasMore && (
        <div className="flex flex-col items-center gap-4 pt-4">
          <button
            onClick={() => setPage((p) => p + 1)}
            className="px-10 py-3.5 border-2 border-stitch-primary text-stitch-primary font-bold text-sm rounded-2xl hover:bg-stitch-primary hover:text-white transition-all active:scale-95 shadow-soft"
          >
            Load More Caregivers
          </button>
          {/* Pagination dots */}
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.ceil(filtered.length / PAGE_SIZE) }).map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i < page
                    ? "bg-stitch-primary"
                    : "bg-sand-highest"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* End of results indicator */}
      {!isLoading && !hasMore && paginated.length > 0 && (
        <p className="text-center text-xs text-stitch-on-surface-variant font-medium pt-2">
          Showing all {filtered.length} caregivers
        </p>
      )}
    </div>
  );
}
