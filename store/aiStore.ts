import { create } from 'zustand';

export interface CompanionResult {
  _id: string;
  name?: string;
  gender?: string;
  location?: any;
  specialization?: string;
  hourlyRate?: number;
  skills?: string[];
  rating?: number;
  reviewCount?: number;
  score?: number; // Vector search score
  [key: string]: any;
}

interface AIStoreState {
  // Smart Search Global State
  searchResults: CompanionResult[];
  extractedFilters: Record<string, any> | null;
  nativeFilter: Record<string, any> | null;
  totalCount: number;
  currentPage: number;
  isSearchActive: boolean;
  isSearchLoading: boolean;

  // Global AI Assistant Widget State
  isAssistantOpen: boolean;
  
  // Actions
  setSearchResults: (results: CompanionResult[], total: number, page: number) => void;
  setExtractedFilters: (filters: Record<string, any>, nativeFilter?: Record<string, any>) => void;
  setSearchActive: (isActive: boolean) => void;
  setSearchLoading: (isLoading: boolean) => void;
  toggleAssistant: () => void;
  openAssistant: () => void;
  closeAssistant: () => void;
  clearSearch: () => void;
}

export const useAIStore = create<AIStoreState>((set) => ({
  searchResults: [],
  extractedFilters: null,
  nativeFilter: null,
  totalCount: 0,
  currentPage: 1,
  isSearchActive: false,
  isSearchLoading: false,

  isAssistantOpen: false,

  setSearchResults: (results, total, page) =>
    set({ searchResults: results, totalCount: total, currentPage: page }),
  
  setExtractedFilters: (filters, nativeFilter) =>
    set({ extractedFilters: filters, nativeFilter }),

  setSearchActive: (isActive) => set({ isSearchActive: isActive }),
  setSearchLoading: (isLoading) => set({ isSearchLoading: isLoading }),

  toggleAssistant: () => set((state) => ({ isAssistantOpen: !state.isAssistantOpen })),
  openAssistant: () => set({ isAssistantOpen: true }),
  closeAssistant: () => set({ isAssistantOpen: false }),

  clearSearch: () =>
    set({
      searchResults: [],
      extractedFilters: null,
      nativeFilter: null,
      totalCount: 0,
      currentPage: 1,
      isSearchActive: false,
    }),
}));
