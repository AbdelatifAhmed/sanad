import { api } from "./services/api";

// --- AUTH ROUTER (/auth) ---
export const registerUser = async (data: any) => {
  const res = await api.post("/auth/register", data);
  return res.data;
};

export const loginUser = async (data: any) => {
  const res = await api.post("/auth/login", data);
  return res.data;
};

export const refreshUserToken = async () => {
  const res = await api.post("/auth/refresh-token");
  return res.data;
};

export const logoutUser = async () => {
  const res = await api.post("/auth/logout");
  return res.data;
};

// --- AI ROUTER (/ai) ---
export const familyAIChat = async (data: any) => {
  const res = await api.post("/ai/session/family", data);
  return res.data.data;
};

export const companionAIChat = async (data: any) => {
  const res = await api.post("/ai/session/companion", data);
  return res.data.data;
};

export const aiSmartSearch = async (data: any) => {
  const res = await api.post("/ai/search/companions", data);
  return res.data.data;
};

export const clearAIChatSession = async () => {
  const res = await api.delete("/ai/session");
  return res.data;
};

// --- BOOKINGS ROUTER (/bookings) ---
export const createBooking = async (data: any) => {
  const res = await api.post("/bookings", data);
  return res.data.data;
};

export const getCompanionRequests = async () => {
  const res = await api.get("/bookings/companion/requests");
  return res.data.data;
};

export const respondToBooking = async (id: string, data: any) => {
  const res = await api.put(`/bookings/${id}/respond`, data);
  return res.data.data;
};

export const updateBookingStatus = async (id: string, data: any) => {
  const res = await api.put(`/bookings/${id}/status`, data);
  return res.data.data;
};

export const bookingCheckIn = async (id: string, data: any) => {
  const res = await api.post(`/bookings/${id}/check-in`, data);
  return res.data.data;
};

export const bookingCheckOut = async (id: string, data: any) => {
  const res = await api.post(`/bookings/${id}/check-out`, data);
  return res.data.data;
};

// --- COMPANION ROUTER (/companion) ---
export const getVerifiedCompanions = async (params?: any) => {
  const res = await api.get("/companion", { params });
  return res.data.data;
};

export const getCompanionById = async (id: string) => {
  const res = await api.get(`/companion/${id}`);
  return res.data.data;
};

export const updateCompanionProfile = async (data: any) => {
  const res = await api.put("/companion/profile", data);
  return res.data.data;
};

export const getCompanionSchedule = async (config?: any) => {
  const res = await api.get("/companion/me/schedule", config);
  return res.data.data;
};

export const updateCompanionAvailability = async (data: any) => {
  const res = await api.patch("/companion/me/availability", data);
  return res.data.data;
};

export const getMyCompanionProfile = async (config?: any) => {
  const res = await api.get("/companion/me", config);
  return res.data.data;
};

export const getCompanionBookings = async () => {
  const res = await api.get("/companion/me/bookings");
  return res.data.data;
};

export const getCompanionDashboardStats = async (config?: any) => {
  const res = await api.get("/companion/me/dashboard-stats", config);
  return res.data.data;
};

// --- FAMILY ROUTER (/family) ---
export const updateFamilyProfile = async (data: any) => {
  const res = await api.put("/family/profile", data);
  return res.data.data;
};

export const getFamilyBookings = async () => {
  const res = await api.get("/family/bookings");
  return res.data.data;
};

// --- CHAT ROUTER (/chat) ---
export const sendChatMessage = async (data: any) => {
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

export const createSkill = async (data: any) => {
  const res = await api.post("/skills", data);
  return res.data.data;
};

// --- JOB POSTS ROUTER (/job-posts) ---
export const createJobPost = async (data: any) => {
  const res = await api.post("/job-posts", data);
  return res.data.data;
};

export const getJobPostsForCompanions = async () => {
  const res = await api.get("/job-posts");
  return res.data.data;
};

// --- PROPOSALS ROUTER (/proposals) ---
export const sendProposal = async (data: any) => {
  const res = await api.post("/proposals", data);
  return res.data.data;
};

export const updateProposalStatus = async (proposalId: string, data: any) => {
  const res = await api.patch(`/proposals/${proposalId}/status`, data);
  return res.data.data;
};

export const getProposalsForJob = async (jobId: string) => {
  const res = await api.get(`/proposals/job/${jobId}`);
  return res.data.data;
};

// --- PAYMENTS ROUTER (/payments) ---
export const payBooking = async (id: string, data: any) => {
  const res = await api.post(`/payments/${id}/pay`, data);
  return res.data.data;
};

export const getMyPayments = async () => {
  const res = await api.get("/payments/me");
  return res.data.data;
};

export const getAdminPayments = async () => {
  const res = await api.get("/payments/admin");
  return res.data.data;
};

// --- REVIEWS ROUTER (/reviews) ---
export const createReview = async (data: any) => {
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
export const getUserNotifications = async () => {
  const res = await api.get("/notifications");
  return res.data.data;
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

export const adminVerifyCompanion = async (id: string, data: any) => {
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

export const adminToggleBanUser = async (id: string, data?: any) => {
  const res = await api.put(`/admin/users/${id}/toggle-ban`, data);
  return res.data.data;
};
