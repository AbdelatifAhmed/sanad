import { useState, useEffect, useCallback } from "react";
import {
  registerUser,
  loginUser,
  refreshUserToken,
  logoutUser,
  familyAIChat,
  companionAIChat,
  aiSmartSearch,
  clearAIChatSession,
  createBooking,
  getCompanionRequests,
  respondToBooking,
  updateBookingStatus,
  bookingCheckIn,
  bookingCheckOut,
  getVerifiedCompanions,
  getCompanionById,
  updateCompanionProfile,
  getCompanionSchedule,
  updateCompanionAvailability,
  getMyCompanionProfile,
  getCompanionBookings,
  getCompanionDashboardStats,
  updateFamilyProfile,
  getFamilyBookings,
  sendChatMessage,
  getChatHistory,
  getAllSkills,
  createSkill,
  createJobPost,
  getJobPostsForCompanions,
  sendProposal,
  updateProposalStatus,
  getProposalsForJob,
  payBooking,
  getMyPayments,
  getAdminPayments,
  createReview,
  getMyReviews,
  getCompanionReviews,
  deleteReview,
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  deleteAllNotifications,
  deleteNotification,
  adminGetAllBookings,
  adminGetPendingCompanions,
  adminVerifyCompanion,
  adminGetDashboardStats,
  adminGetAllReviews,
  adminGetAllUsers,
  adminToggleBanUser,
} from "./API";

// ==========================================
//               QUERY HOOKS (GET)
// ==========================================

export const useCompanionRequests = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getCompanionRequests();
      setData(res);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
};

export const useVerifiedCompanions = (params?: any) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getVerifiedCompanions(params);
      setData(res);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
};

export const useCompanionById = (id: string) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const res = await getCompanionById(id);
      setData(res);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
};

export const useCompanionSchedule = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getCompanionSchedule();
      setData(res);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
};

export const useMyCompanionProfile = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getMyCompanionProfile();
      setData(res);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
};

export const useCompanionBookings = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getCompanionBookings();
      setData(res);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
};

export const useCompanionDashboardStats = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getCompanionDashboardStats();
      setData(res);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
};

export const useFamilyBookings = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getFamilyBookings();
      setData(res);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
};

export const useChatHistory = (bookingId: string) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetch = useCallback(async () => {
    if (!bookingId) return;
    try {
      setIsLoading(true);
      const res = await getChatHistory(bookingId);
      setData(res);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
};

export const useAllSkills = () => {
  const [skills, setSkills] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getAllSkills();
      setSkills(data?.skills || []);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { skills, isLoading, error, refetch: fetch };
};

export const useJobPostsForCompanions = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getJobPostsForCompanions();
      setData(res);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
};

export const useProposalsForJob = (jobId: string) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetch = useCallback(async () => {
    if (!jobId) return;
    try {
      setIsLoading(true);
      const res = await getProposalsForJob(jobId);
      setData(res);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
};

export const useMyPayments = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getMyPayments();
      setData(res);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
};

export const useAdminPayments = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getAdminPayments();
      setData(res);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
};

export const useMyReviews = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getMyReviews();
      setData(res);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
};

export const useCompanionReviews = (id: string) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const res = await getCompanionReviews(id);
      setData(res);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
};

export const useUserNotifications = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getUserNotifications();
      setData(res);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
};

export const useAdminAllBookings = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await adminGetAllBookings();
      setData(res);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
};

export const useAdminPendingCompanions = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await adminGetPendingCompanions();
      setData(res);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
};

export const useAdminDashboardStats = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await adminGetDashboardStats();
      setData(res);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
};

export const useAdminAllReviews = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await adminGetAllReviews();
      setData(res);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
};

export const useAdminAllUsers = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await adminGetAllUsers();
      setData(res);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
};

// ==========================================
//             MUTATION HOOKS (POST/PUT/PATCH/DELETE)
// ==========================================

export const useRegisterUser = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const execute = async (data: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await registerUser(data);
      return res;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
};

export const useLoginUser = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const execute = async (data: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await loginUser(data);
      return res;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
};

export const useRefreshUserToken = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const execute = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await refreshUserToken();
      return res;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
};

export const useLogoutUser = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const execute = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await logoutUser();
      return res;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
};

export const useFamilyAIChat = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const execute = async (data: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await familyAIChat(data);
      return res;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
};

export const useCompanionAIChat = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const execute = async (data: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await companionAIChat(data);
      return res;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
};

export const useAISmartSearch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const execute = async (data: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await aiSmartSearch(data);
      return res;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
};

export const useClearAIChatSession = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const execute = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await clearAIChatSession();
      return res;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
};

export const useCreateBooking = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const execute = async (data: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await createBooking(data);
      return res;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
};

export const useRespondToBooking = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const execute = async (id: string, data: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await respondToBooking(id, data);
      return res;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
};

export const useUpdateBookingStatus = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const execute = async (id: string, data: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await updateBookingStatus(id, data);
      return res;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
};

export const useBookingCheckIn = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const execute = async (id: string, data: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await bookingCheckIn(id, data);
      return res;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
};

export const useBookingCheckOut = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const execute = async (id: string, data: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await bookingCheckOut(id, data);
      return res;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
};

export const useUpdateCompanionProfile = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const execute = async (data: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await updateCompanionProfile(data);
      return res;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
};

export const useUpdateCompanionAvailability = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const execute = async (data: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await updateCompanionAvailability(data);
      return res;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
};

export const useUpdateFamilyProfile = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const execute = async (data: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await updateFamilyProfile(data);
      return res;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
};

export const useSendChatMessage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const execute = async (data: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await sendChatMessage(data);
      return res;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
};

export const useCreateSkill = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const execute = async (data: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await createSkill(data);
      return res;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
};

export const useCreateJobPost = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const execute = async (data: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await createJobPost(data);
      return res;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
};

export const useSendProposal = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const execute = async (data: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await sendProposal(data);
      return res;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
};

export const useUpdateProposalStatus = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const execute = async (proposalId: string, data: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await updateProposalStatus(proposalId, data);
      return res;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
};

export const usePayBooking = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const execute = async (id: string, data: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await payBooking(id, data);
      return res;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
};

export const useCreateReview = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const execute = async (data: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await createReview(data);
      return res;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
};

export const useDeleteReview = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const execute = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await deleteReview(id);
      return res;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
};

export const useMarkAllNotificationsAsRead = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const execute = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await markAllNotificationsAsRead();
      return res;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
};

export const useMarkNotificationAsRead = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const execute = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await markNotificationAsRead(id);
      return res;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
};

export const useDeleteAllNotifications = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const execute = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await deleteAllNotifications();
      return res;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
};

export const useDeleteNotification = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const execute = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await deleteNotification(id);
      return res;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
};

export const useAdminVerifyCompanion = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const execute = async (id: string, data: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await adminVerifyCompanion(id, data);
      return res;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
};

export const useAdminToggleBanUser = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const execute = async (id: string, data?: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await adminToggleBanUser(id, data);
      return res;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
};
