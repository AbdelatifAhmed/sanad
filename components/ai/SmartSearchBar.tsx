"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { useAIStore } from "@/store/aiStore";
import { api } from "@/lib/services/api";

export default function SmartSearchBar() {
  const t = useTranslations("companionsPage");
  const [query, setQuery] = useState("");
  const { setSearchResults, setSearchActive, setSearchLoading, setAiQuery, isSearchLoading } = useAIStore();

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setSearchActive(true);
    setSearchLoading(true);
    setAiQuery(query);

    try {
      const response = await api.post("/ai/family/browse-search", {
        query,
        page: 1,
        limit: 10,
      }, {
        timeout: 45000,
      });

      const results = response.data?.data?.companions || [];
      const pagination = response.data?.pagination || { total: results.length, currentPage: 1 };
      
      setSearchResults(results, pagination.total, pagination.currentPage);
    } catch (error) {
      console.error("AI Search Error:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto relative group">
      {/* 
        Premium Border Gradient Animation 
        Using a pseudo-element or absolute background for the rotating gradient.
      */}
      <div className="absolute -inset-[2px] rounded-full overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)] animate-[spin_2s_linear_infinite]" />
      </div>

      <div className="relative bg-white dark:bg-zinc-900 rounded-full border border-sand-high/60 shadow-soft p-2 flex items-center z-10 overflow-hidden focus-within:ring-2 focus-within:ring-stitch-primary">
        <span className="material-symbols-outlined text-stitch-primary/50 ml-3 mr-2">
          auto_awesome
        </span>
        
        <form onSubmit={handleSearch} className="flex-1 flex">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder= "Describe what you're looking for..."
            className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-sm py-2 px-1 text-stitch-on-surface placeholder:text-stitch-on-surface-variant/50"
            disabled={isSearchLoading}
          />
          
          <button
            type="submit"
            disabled={isSearchLoading || !query.trim()}
            className="ml-2 px-6 py-2 bg-stitch-primary text-white rounded-full font-semibold text-sm transition-transform active:scale-95 disabled:opacity-50 relative overflow-hidden"
          >
            {isSearchLoading ? (
              <span className="material-symbols-outlined animate-spin text-[20px]">
                progress_activity
              </span>
            ) : (
              <span>Search</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
