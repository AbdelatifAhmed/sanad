import { api } from "@/lib/services/api";

export interface JobPostDetail {
  _id: string;
  title: string;
  description: string;
  serviceType: string;
  budgetPerHour: number;
  location: {
    city: string;
    governorate: string;
    readableAddress?: string;
  };
  schedule: {
    workingDays: string[];
    startTime: string;
    endTime: string;
    durationInWeeks: number;
  };
  familyId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    avatar?: { url: string; public_id: string };
  };
}

export interface ProposalDetail {
  _id: string;
  jobPostId: JobPostDetail;
  companionId: string;
  proposedRate: number;
  coverLetter: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  updatedAt: string;
}

export interface MyProposalsResponse {
  status: string;
  data: {
    proposals: ProposalDetail[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
    stats: {
      total: number;
      pending: number;
      accepted: number;
      rejected: number;
    };
  };
}

export const getMyProposals = async (params: { page?: number; limit?: number; status?: string }): Promise<MyProposalsResponse> => {
  try {
    const res = await api.get("/proposals/my-proposals", { params });
    return res.data;
  } catch (error) {
    console.error("Error fetching companion proposals:", error);
    throw error;
  }
};
