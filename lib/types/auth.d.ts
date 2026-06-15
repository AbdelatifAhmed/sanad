interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'family' | 'companion';
  avatar: string | null;
  location: {
    geo: { type: 'Point'; coordinates: [number, number] };
    readableAddress: string;
    city: string;
    governorate: string;
  } | null;
  companionId?: string | null;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  familyId?: string | null;
}

interface AuthState {
  user: UserData | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: UserData, accessToken: string) => void;
  clearAuth: () => void;
  updateAvatar: (avatarUrl: string) => void;
}