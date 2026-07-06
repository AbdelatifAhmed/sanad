import { useState, useCallback } from "react";
import { api } from "@/lib/services/api";

interface SearchResult {
  companions: any[];
  extractedFilters: any;
}

interface SmartSearchState {
  isLoading: boolean;
  error: string | null;
  results: SearchResult | null;
  pagination: {
    total: number;
    pages: number;
    currentPage: number;
  } | null;
}

export function useSmartSearch() {
  const [state, setState] = useState<SmartSearchState>({
    isLoading: false,
    error: null,
    results: null,
    pagination: null,
  });

  const executeSearch = useCallback(async (query: string, page = 1, limit = 9) => {
    if (!query.trim()) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      // Direct call to the stateless smart search hub
      const res = await api.post(
        "/ai/family/browse-search",
        { query, page, limit },
        { timeout: 60000 }
      );

      if (res.data?.status === "success") {
        setState({
          isLoading: false,
          error: null,
          results: res.data.data,
          pagination: res.data.pagination || null,
        });
        
        // Dispatch event for components that need to listen globally (e.g. page.tsx)
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("sanad:ai-search-result", {
              detail: {
                query,
                companions: res.data.data.companions,
                filters: res.data.data.extractedFilters,
                pagination: res.data.pagination,
                summary: "Smart search applied successfully.",
              },
            })
          );
        }
      } else {
        throw new Error(res.data?.message || "Search failed");
      }
    } catch (err: any) {
      setState({
        isLoading: false,
        error: err.response?.data?.message || err.message || "An error occurred",
        results: null,
        pagination: null,
      });
    }
  }, []);

  const clearSearch = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      results: null,
      pagination: null,
    });
  }, []);

  return { ...state, executeSearch, clearSearch };
}
