import { create } from 'zustand';

// تفاصيل المستفيدين للعائلة
interface Beneficiary {
  name: string;
  age: number;
  gender: 'male' | 'female';
  category: 'elderly' | 'special_needs';
  conditionDetails: string;
  interests: string[];
}

interface RegisterState {
  // Step 1: البيانات الأساسية للـ User
  step: number;
  role: 'family' | 'companion' | null;
  name: string;
  email: string;
  password: string;
  phone: string;

  // Step 2: الموقع الجغرافي المشترك
  location: {
    geo: { type: 'Point'; coordinates: [number, number] }; // [long, lat]
    readableAddress: string;
    city: string;
    governorate: string;
  } | null;

  // Step 3 (Family Specific)
  familyData: {
    address: { city: string; area: string; fullAddress: string };
    beneficiaries: Beneficiary[];
  };

  // Step 3 (Companion Specific)
  companionData: {
    companionType: 'general' | 'specialized';
    specialization: 'none' | 'nursing' | 'physiotherapy' | 'companionship_companion';
    bio: string;
    hourlyRate: number;
    skills: string[]; // ObjectIds من جلب الـ Skills
    hobbies: string[];
    availability: Array<{ day: string; slots: string[] }>;
    documents: {
      nationalIdUrl: string;
      criminalRecordUrl: string;
      syndicateCardUrl?: string;
    };
  };

  // Actions الـ موديول لتحديث الخطوات والداتا
  setRole: (role: 'family' | 'companion') => void;
  nextStep: () => void;
  prevStep: () => void;
  updateBasicInfo: (info: Partial<Pick<RegisterState, 'name' | 'email' | 'password' | 'phone'>>) => void;
  updateLocation: (location: RegisterState['location']) => void;
  updateFamilyData: (data: Partial<RegisterState['familyData']>) => void;
  updateCompanionData: (data: Partial<RegisterState['companionData']>) => void;
  resetRegisterForm: () => void;
}

export const useRegisterStore = create<RegisterState>((set) => ({
  step: 1,
  role: null,
  name: '',
  email: '',
  password: '',
  phone: '',
  location: null,

  familyData: {
    address: { city: '', area: '', fullAddress: '' },
    beneficiaries: [],
  },

  companionData: {
    companionType: 'general',
    specialization: 'none',
    bio: '',
    hourlyRate: 0,
    skills: [],
    hobbies: [],
    availability: [],
    documents: { nationalIdUrl: '', criminalRecordUrl: '' },
  },

  setRole: (role) => set({ role }),
  nextStep: () => set((state) => ({ step: state.step + 1 })),
  prevStep: () => set((state) => ({ step: state.step - 1 })),
  
  updateBasicInfo: (info) => set(info),
  updateLocation: (location) => set({ location }),
  
  updateFamilyData: (data) => 
    set((state) => ({ familyData: { ...state.familyData, ...data } })),
    
  updateCompanionData: (data) => 
    set((state) => ({ companionData: { ...state.companionData, ...data } })),

  resetRegisterForm: () => set({
    step: 1, role: null, name: '', email: '', password: '', phone: '', location: null,
    familyData: { address: { city: '', area: '', fullAddress: '' }, beneficiaries: [] },
    companionData: {
      companionType: 'general', specialization: 'none', bio: '', hourlyRate: 0,
      skills: [], hobbies: [], availability: [], documents: { nationalIdUrl: '', criminalRecordUrl: '' }
    }
  })
}));