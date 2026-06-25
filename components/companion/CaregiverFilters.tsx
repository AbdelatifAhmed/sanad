"use client";

interface FilterState {
  search: string;
  duration: string;
  rate: string;
  rating: string;
  specialization: string;
}

interface CaregiverFiltersProps {
  filters: FilterState;
  totalCount: number;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onClearAll: () => void;
}

const SPECIALIZATION_CHIPS = [
  { label: "All", value: "", icon: "grid_view" },
  { label: "Medical Care", value: "nursing", icon: "medical_services" },
  { label: "Companion", value: "companionship_companion", icon: "volunteer_activism" },
  { label: "Dementia", value: "dementia", icon: "psychology" },
  { label: "Physiotherapy", value: "physiotherapy", icon: "self_improvement" },
];

export default function CaregiverFilters({
  filters,
  totalCount,
  onFilterChange,
  onClearAll,
}: CaregiverFiltersProps) {
  const hasActiveFilters =
    filters.search ||
    filters.duration ||
    filters.rate ||
    filters.rating ||
    filters.specialization;

  return (
    <div className="space-y-4">
      {/* Search + Location Bar */}
      <div className="bg-white rounded-2xl border border-sand-high/60 shadow-soft p-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Keyword search */}
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-stitch-on-surface-variant text-[20px]">
              search
            </span>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onFilterChange("search", e.target.value)}
              placeholder="Search by name or specialty..."
              className="w-full pl-10 pr-4 py-3 bg-sand-low border border-sand-high/60 rounded-xl text-sm focus:ring-2 focus:ring-stitch-primary/30 focus:border-stitch-primary outline-none transition-all placeholder:text-stitch-on-surface-variant/50 text-[#012d1d] font-medium"
            />
          </div>

          {/* Clear / count */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-stitch-on-surface-variant font-medium hidden md:block">
              <span className="font-bold text-stitch-primary">{totalCount}</span> caregivers found
            </span>
            {hasActiveFilters && (
              <button
                onClick={onClearAll}
                className="text-xs font-bold text-stitch-primary hover:underline transition-all"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Detailed Filters Row */}
        <div className="mt-4 pt-4 border-t border-sand-high/60 flex flex-wrap gap-4 items-center">
          {/* Duration */}
          <div className="flex flex-col gap-1 min-w-[140px]">
            <label className="text-[10px] font-bold uppercase tracking-wider text-stitch-on-surface-variant/60">
              Duration
            </label>
            <select
              value={filters.duration}
              onChange={(e) => onFilterChange("duration", e.target.value)}
              className="bg-transparent border-none font-bold text-stitch-primary text-sm focus:ring-0 p-0 cursor-pointer outline-none"
            >
              <option value="">Any Duration</option>
              <option value="100">100+ Hours</option>
              <option value="500">500+ Hours</option>
              <option value="1000">1000+ Hours</option>
              <option value="2000">2000+ Hours</option>
            </select>
          </div>

          <div className="w-px h-8 bg-sand-high/80 hidden md:block" />

          {/* Hourly Rate */}
          <div className="flex flex-col gap-1 min-w-[140px]">
            <label className="text-[10px] font-bold uppercase tracking-wider text-stitch-on-surface-variant/60">
              Hourly Rate (USD)
            </label>
            <select
              value={filters.rate}
              onChange={(e) => onFilterChange("rate", e.target.value)}
              className="bg-transparent border-none font-bold text-stitch-primary text-sm focus:ring-0 p-0 cursor-pointer outline-none"
            >
              <option value="">All Rates</option>
              <option value="0-100">Under 100</option>
              <option value="100-150">100 – 150</option>
              <option value="150+">150+</option>
            </select>
          </div>

          <div className="w-px h-8 bg-sand-high/80 hidden md:block" />

          {/* Rating */}
          <div className="flex flex-col gap-1 min-w-[140px]">
            <label className="text-[10px] font-bold uppercase tracking-wider text-stitch-on-surface-variant/60">
              Rating
            </label>
            <select
              value={filters.rating}
              onChange={(e) => onFilterChange("rating", e.target.value)}
              className="bg-transparent border-none font-bold text-stitch-primary text-sm focus:ring-0 p-0 cursor-pointer outline-none"
            >
              <option value="">Any Rating</option>
              <option value="4.5">4.5+ Stars</option>
              <option value="4.0">4.0+ Stars</option>
              <option value="3.0">3.0+ Stars</option>
            </select>
          </div>

          {/* Mobile count */}
          <div className="ml-auto md:hidden">
            <span className="text-xs text-stitch-on-surface-variant font-medium">
              <span className="font-bold text-stitch-primary">{totalCount}</span> found
            </span>
          </div>
        </div>
      </div>

      {/* Specialization Chips */}
      <div className="flex flex-wrap gap-2">
        {SPECIALIZATION_CHIPS.map((chip) => {
          const isActive = filters.specialization === chip.value;
          return (
            <button
              key={chip.value}
              onClick={() => onFilterChange("specialization", chip.value)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 ${
                isActive
                  ? "bg-stitch-secondary-container text-stitch-on-secondary-container border-stitch-primary/30 shadow-sm"
                  : "bg-white text-stitch-on-surface-variant border-sand-high/60 hover:bg-sand-low hover:border-stitch-primary/20"
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">{chip.icon}</span>
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
