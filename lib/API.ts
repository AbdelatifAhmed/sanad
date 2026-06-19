import type {
  ApiResponse,
  LoginResponse,
  Booking,
  CompanionProfile,
  JobPost,
  Proposal,
  NotificationItem,
  PaymentRecord,
  CreateBookingPayload,
  SendProposalBody,
  UpdateProposalStatusBody,
  PayBookingBody,
} from "@/types";
import { api } from "./services/api";

// --- AUTH ROUTER (/auth) ---
export const registerUser = async (data: Record<string, unknown>) => {
  const res = await api.post("/auth/register", data);
  return res.data;
};

export const loginUser = async (data: Record<string, unknown>): Promise<LoginResponse> => {
  const res = await api.post<ApiResponse<LoginResponse>>("/auth/login", data);
  return res.data.data as LoginResponse;
};

export const refreshUserToken = async (): Promise<LoginResponse> => {
  const res = await api.post<ApiResponse<LoginResponse>>("/auth/refresh-token");
  return res.data.data as LoginResponse;
};

export const logoutUser = async (): Promise<ApiResponse<null>> => {
  const res = await api.post<ApiResponse<null>>("/auth/logout");
  return res.data;
};

// --- AI ROUTER (/ai) ---
export const familyAIChat = async (data: Record<string, unknown>) => {
  const res = await api.post("/ai/session/family", data);
  return res.data.data;
};

export const companionAIChat = async (data: Record<string, unknown>) => {
  const res = await api.post("/ai/session/companion", data);
  return res.data.data;
};

export const aiSmartSearch = async (data: Record<string, unknown>) => {
  const res = await api.post("/ai/search/companions", data);
  return res.data.data;
};

export const clearAIChatSession = async () => {
  const res = await api.delete("/ai/session");
  return res.data;
};

// --- BOOKINGS ROUTER (/bookings) ---
export const createBooking = async (data: CreateBookingPayload): Promise<Booking> => {
  const res = await api.post<ApiResponse<Booking>>("/bookings", data);
  return res.data.data as Booking;
};

export const getCompanionRequests = async (): Promise<Booking[]> => {
  const res = await api.get<ApiResponse<Booking[]>>("/bookings/companion/requests");
  return res.data.data as Booking[];
};

export const respondToBooking = async (id: string, data: Record<string, unknown>): Promise<Booking> => {
  const res = await api.put<ApiResponse<Booking>>(`/bookings/${id}/respond`, data);
  return res.data.data as Booking;
};

export const updateBookingStatus = async (id: string, data: Record<string, unknown>): Promise<Booking> => {
  const res = await api.put<ApiResponse<Booking>>(`/bookings/${id}/status`, data);
  return res.data.data as Booking;
};

export const bookingCheckIn = async (id: string, data: Record<string, unknown>): Promise<Booking> => {
  const res = await api.post<ApiResponse<Booking>>(`/bookings/${id}/check-in`, data);
  return res.data.data as Booking;
};

export const bookingCheckOut = async (id: string, data: Record<string, unknown>): Promise<Booking> => {
  const res = await api.post<ApiResponse<Booking>>(`/bookings/${id}/check-out`, data);
  return res.data.data as Booking;
};

// --- COMPANION ROUTER (/companion) ---
export const getVerifiedCompanions = async (params?: Record<string, unknown>): Promise<CompanionProfile[]> => {
  const res = await api.get<ApiResponse<CompanionProfile[]>>("/companion", { params });
  return res.data.data as CompanionProfile[];
};

export const getCompanionById = async (id: string): Promise<CompanionProfile> => {
  const res = await api.get<ApiResponse<CompanionProfile>>(`/companion/${id}`);
  return res.data.data as CompanionProfile;
};

export const updateCompanionProfile = async (data: Record<string, unknown>) => {
  const res = await api.put("/companion/profile", data);
  return res.data.data;
};

export const getCompanionSchedule = async (config?: Record<string, unknown>) => {
  const res = await api.get("/companion/me/schedule", config);
  return res.data.data;
};

export const updateCompanionAvailability = async (data: Record<string, unknown>) => {
  const res = await api.patch("/companion/me/availability", data);
  return res.data.data;
};

export const getMyCompanionProfile = async (config?: Record<string, unknown>) => {
  const res = await api.get("/companion/me", config);
  return res.data.data;
};

export const getCompanionBookings = async (): Promise<Booking[]> => {
  const res = await api.get<ApiResponse<Booking[]>>("/companion/me/bookings");
  return res.data.data as Booking[];
};

export const getCompanionDashboardStats = async (config?: any) => {
  const res = await api.get("/companion/me/dashboard-stats", config);
  return res.data.data;
};

// --- FAMILY ROUTER (/family) ---
export const updateFamilyProfile = async (data: Record<string, unknown>) => {
  const res = await api.put("/family/profile", data);
  return res.data.data;
};

export const getFamilyBookings = async (): Promise<Booking[]> => {
  const res = await api.get<ApiResponse<Booking[]>>("/family/bookings");
  return res.data.data as Booking[];
};

export const getFamilyDashboardStats = async (config?: Record<string, unknown>) => {
  const res = await api.get("/family/me/dashboard-stats", config);
  return res.data.data;
};

// --- CHAT ROUTER (/chat) ---
export const sendChatMessage = async (data: Record<string, unknown>) => {
  const res = await api.post("/chat", data);
  return res.data.data;
};

export const getChatHistory = async (bookingId: string) => {
  const res = await api.get(`/chat/${bookingId}`);
  return res.data.data;
};

// --- SKILLS ROUTER (/skills) ---
export const getAllSkills = async () => {
  const res = await api.get("/skills");
  return res.data.data;
};

export const createSkill = async (data: Record<string, unknown>) => {
  const res = await api.post("/skills", data);
  return res.data.data;
};

// --- JOB POSTS ROUTER (/job-posts) ---
export const createJobPost = async (data: Record<string, unknown>) => {
  const res = await api.post("/job-posts", data);
  return res.data.data;
};

export const getJobPostsForCompanions = async (): Promise<JobPost[]> => {
  const res = await api.get<ApiResponse<JobPost[]>>("/job-posts");
  return res.data.data as JobPost[];
};

// --- PROPOSALS ROUTER (/proposals) ---
export const sendProposal = async (data: SendProposalBody): Promise<Proposal> => {
  const res = await api.post<ApiResponse<Proposal>>("/proposals", data);
  return res.data.data as Proposal;
};

export const updateProposalStatus = async (
  proposalId: string,
  data: UpdateProposalStatusBody,
): Promise<Proposal> => {
  const res = await api.patch<ApiResponse<Proposal>>(`/proposals/${proposalId}/status`, data);
  return res.data.data as Proposal;
};

export const getProposalsForJob = async (jobId: string): Promise<Proposal[]> => {
  const res = await api.get<ApiResponse<Proposal[]>>(`/proposals/job/${jobId}`);
  return res.data.data as Proposal[];
};

// --- PAYMENTS ROUTER (/payments) ---
export const payBooking = async (id: string, data: PayBookingBody): Promise<PaymentRecord> => {
  const res = await api.post<ApiResponse<PaymentRecord>>(`/payments/${id}/pay`, data);
  return res.data.data as PaymentRecord;
};

export const getMyPayments = async (): Promise<PaymentRecord[]> => {
  const res = await api.get<ApiResponse<PaymentRecord[]>>("/payments/me");
  return res.data.data as PaymentRecord[];
};

export const getAdminPayments = async () => {
  const res = await api.get("/payments/admin");
  return res.data.data;
};

// --- REVIEWS ROUTER (/reviews) ---
export const createReview = async (data: Record<string, unknown>) => {
  const res = await api.post("/reviews", data);
  return res.data.data;
};

export const getMyReviews = async () => {
  const res = await api.get("/reviews/my");
  return res.data.data;
};

export const getCompanionReviews = async (id: string) => {
  const res = await api.get(`/reviews/companion/${id}`);
  return res.data.data;
};

export const deleteReview = async (id: string) => {
  const res = await api.delete(`/reviews/${id}`);
  return res.data.data;
};

// --- NOTIFICATIONS ROUTER (/notifications) ---
export const getUserNotifications = async (): Promise<NotificationItem[]> => {
  const res = await api.get<ApiResponse<NotificationItem[]>>("/notifications");
  return res.data.data as NotificationItem[];
};

export const markAllNotificationsAsRead = async () => {
  const res = await api.patch("/notifications/read-all");
  return res.data.data;
};

export const markNotificationAsRead = async (id: string) => {
  const res = await api.patch(`/notifications/${id}/read`);
  return res.data.data;
};

export const deleteAllNotifications = async () => {
  const res = await api.delete("/notifications/all");
  return res.data.data;
};

export const deleteNotification = async (id: string) => {
  const res = await api.delete(`/notifications/${id}`);
  return res.data.data;
};

// --- ADMIN BOOKINGS (/admin/bookings) ---
export const adminGetAllBookings = async () => {
  const res = await api.get("/admin/bookings");
  return res.data.data;
};

// --- ADMIN COMPANIONS (/admin/companions) ---
export const adminGetPendingCompanions = async () => {
  const res = await api.get("/admin/companions/pending-companions");
  return res.data.data;
};

export const adminVerifyCompanion = async (id: string, data: Record<string, unknown>) => {
  const res = await api.patch(`/admin/companions/verify-companion/${id}`, data);
  return res.data.data;
};

// --- ADMIN DASHBOARD (/admin) ---
export const adminGetDashboardStats = async () => {
  const res = await api.get("/admin/dashboard/stats");
  return res.data.data;
};

// --- ADMIN REVIEWS (/admin/reviews) ---
export const adminGetAllReviews = async () => {
  const res = await api.get("/admin/reviews");
  return res.data.data;
};

// --- ADMIN USERS (/admin/users) ---
export const adminGetAllUsers = async () => {
  const res = await api.get("/admin/users");
  return res.data.data;
};

export const adminToggleBanUser = async (id: string, data?: Record<string, unknown>) => {
  const res = await api.put(`/admin/users/${id}/toggle-ban`, data);
  return res.data.data;
};

// --- CARE REQUESTS (mapped to /job-posts) ---
export const createCareRequest = async (data: any) => {
  const res = await api.post("/job-posts", data);
  return res.data.data;
};

export const getFamilyCareRequests = async () => {
  const res = await api.get("/family/my-job-posts");
  return res.data.data;
};

// --- FAMILY PROFILE & BENEFICIARIES ---
export const getFamilyElderlyProfiles = async () => {
  const res = await api.get("/family/profile");
  return res.data.data;
};
