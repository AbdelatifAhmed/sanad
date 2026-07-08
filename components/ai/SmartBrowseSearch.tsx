"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useBrowseSearchCompanions } from "@/lib/hooks";

interface SmartBrowseSearchProps {
  onResults?: (payload: any) => void;
  className?: string;
}

export default function SmartBrowseSearch({ onResults, className = "" }: SmartBrowseSearchProps) {
  const t = useTranslations("companionsPage");
  const locale = useLocale();
  const { execute, isLoading, error } = useBrowseSearchCompanions();
  const [query, setQuery] = useState("");
  const [summary, setSummary] = useState("");
  const [results, setResults] = useState<any[]>([]);

  const placeholder = useMemo(() => {
    return locale === "ar"
      ? "ابحث مثل: ممرضة بعد جراحة، رعاية ذهنية، أو مضيف متفرغ لليوم"
      : "Try: post-op nurse, dementia support, or a companion for evenings";
  }, [locale]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    try {
      const response = await execute({ query: query.trim(), limit: 6 }, locale);
      const companions = response?.companions ?? [];
      setResults(companions);
      const summaryText = locale === "ar"
        ? `تم العثور على ${companions.length} مرشحًا مناسبًا.`
        : `Found ${companions.length} matching options.`;
      setSummary(summaryText);
      onResults?.({ companions, extractedFilters: response?.extractedFilters, nativeFilter: response?.nativeFilter, summary: summaryText, query: query.trim() });
    } catch {
      setSummary(locale === "ar" ? "تعذر إكمال البحث الآن." : "The smart search is unavailable right now.");
    }
  };

  return (
    <div className={`rounded-3xl border border-sand-high/60 bg-white p-4 shadow-soft ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-stitch-primary">Smart Browse</p>
          <p className="text-xs text-stitch-on-surface-variant">{t("subtitle")}</p>
        </div>
        <span className="rounded-full bg-stitch-primary/10 px-3 py-1.5 text-xs font-semibold text-stitch-primary">
          AI
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleSearch();
            }
          }}
          placeholder={placeholder}
          className="flex-1 rounded-2xl border border-sand-high/70 bg-sand-low px-3 py-2.5 text-sm outline-none focus:border-stitch-primary"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={isLoading || !query.trim()}
          className="rounded-2xl bg-stitch-primary px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? (locale === "ar" ? "جاري..." : "Searching...") : (locale === "ar" ? "بحث ذكي" : "Smart Search")}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{locale === "ar" ? "تعذر استخدام البحث الذكي." : "Smart search is temporarily unavailable."}</p>}

      {summary ? <p className="mt-3 text-sm text-stitch-on-surface-variant">{summary}</p> : null}

      {results.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {results.slice(0, 4).map((item: any, index: number) => (
            <span key={item?._id || index} className="rounded-full border border-sand-high/70 bg-sand-low px-3 py-1.5 text-xs font-semibold text-stitch-on-surface">
              {item?.userId?.name || item?.name || (locale === "ar" ? "مساعد" : "Caregiver")}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
