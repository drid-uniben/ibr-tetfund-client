// Updated api.ts with reviewer and researcher endpoints
import axios from "axios";

// Configure base API settings
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v2";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    let token = null;
    const currentPath = window.location.pathname;

    if (currentPath.startsWith("/admin")) {
      token = localStorage.getItem("adminAccessToken");
    } else if (currentPath.startsWith("/reviewers")) {
      token = localStorage.getItem("reviewerAccessToken");
    } else if (currentPath.startsWith("/researchers")) {
      token = localStorage.getItem("researcherAccessToken");
    } else {
      // Fallback for other paths or if no specific role path is matched
      token = localStorage.getItem("accessToken");
    }

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
// Fixed response interceptor in api.ts
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if this is a login endpoint - don't attempt refresh for login failures
    const isLoginEndpoint =
      originalRequest.url?.includes("/auth/") &&
      (originalRequest.url.includes("-login") ||
        originalRequest.url.includes("/login"));

    // Only attempt token refresh for 401s that are NOT from login endpoints
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isLoginEndpoint
    ) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshResponse = await api.post("/auth/refresh-token");

        if (refreshResponse.data.accessToken) {
          // Save the new token based on the current path/role context
          const currentPath = window.location.pathname;
          if (currentPath.startsWith("/admin")) {
            localStorage.setItem(
              "adminAccessToken",
              refreshResponse.data.accessToken
            );
          } else if (currentPath.startsWith("/reviewers")) {
            localStorage.setItem(
              "reviewerAccessToken",
              refreshResponse.data.accessToken
            );
          } else if (currentPath.startsWith("/researchers")) {
            localStorage.setItem(
              "researcherAccessToken",
              refreshResponse.data.accessToken
            );
          } else {
            localStorage.setItem(
              "accessToken",
              refreshResponse.data.accessToken
            );
          }

          // Update the original request with the new token
          originalRequest.headers["Authorization"] =
            `Bearer ${refreshResponse.data.accessToken}`;

          // Retry the original request
          return api(originalRequest);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (refreshError: any) {
        // If refresh fails, redirect to login
        console.error("Token refresh failed:", refreshError);
        // Clear all potential tokens on refresh failure
        localStorage.removeItem("adminAccessToken");
        localStorage.removeItem("reviewerAccessToken");
        localStorage.removeItem("researcherAccessToken");
        localStorage.removeItem("accessToken"); // Fallback
        localStorage.removeItem("userData"); // Assuming userData is generic

        // Only redirect if we're in the browser
        if (typeof window !== "undefined") {
          // Redirect based on the stored user role
          const currentPath = window.location.pathname;
          let redirectPath = "/admin/login"; // Default

          if (currentPath.startsWith("/reviewers")) {
            redirectPath = "/reviewers/login";
          } else if (currentPath.startsWith("/researchers")) {
            redirectPath = "/researchers/login";
          }

          window.location.href = redirectPath;
        }
      }
    }

    if (axios.isCancel(error)) {
      // console.log('Request cancelled (expected)');
      return Promise.reject(error); // Re-throw the error so calling code can handle it if needed
    }

    return Promise.reject(error);
  }
);

// Faculty related endpoints
export const getFaculties = async () => {
  try {
    const response = await api.get("/faculties");
    return response.data;
  } catch (error) {
    console.error("Error fetching faculties:", error);
    throw error;
  }
};

export const getDepartments = async () => {
  try {
    const response = await api.get("/departments");
    return response.data;
  } catch (error) {
    console.error("Error fetching faculties:", error);
    throw error;
  }
};

export const getDepartmentsByFaculty = async (facultyCode: string) => {
  try {
    const response = await api.get(
      `/departments/by-faculty-code/${facultyCode}`
    );
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching departments for faculty ${facultyCode}:`,
      error
    );
    throw error;
  }
};

// Full nested faculty -> departments structure (Option A: names are the
// canonical identity, no ObjectIds). One request powers the whole form.
export interface AcademicDepartment {
  code: string;
  title: string;
}
export interface AcademicUnit {
  code: string;
  title: string;
  type: "faculty" | "school" | "college" | "centre" | "institute" | "other";
  departments: AcademicDepartment[];
}

export const getFacultyData = async (): Promise<AcademicUnit[]> => {
  try {
    const response = await api.get("/faculties/data");
    return response.data.data as AcademicUnit[];
  } catch (error) {
    console.error("Error fetching faculty data:", error);
    throw error;
  }
};

// Submission endpoints
export const submitStaffProposal = async (formData: FormData) => {
  try {
    const response = await api.post("/submit/staff-proposal", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error submitting staff proposal:", error);
    throw error;
  }
};

export const submitMasterProposal = async (formData: FormData) => {
  try {
    const response = await api.post("/submit/master-proposal", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error submitting master proposal:", error);
    throw error;
  }
};

// Authentication endpoints
export const loginAdmin = async (credentials: {
  email: string;
  password: string;
}) => {
  try {
    const response = await api.post("/auth/admin-login", credentials);

    if (response.data.accessToken) {
      localStorage.setItem("adminAccessToken", response.data.accessToken);
      // No need to set api.defaults.headers.common["Authorization"] here
      // as the interceptor will handle it based on the path.
    }

    return response.data;
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
};

// Reviewer authentication
export const loginReviewer = async (credentials: {
  email: string;
  password: string;
}) => {
  try {
    const response = await api.post("/auth/reviewer-login", credentials);

    if (response.data.accessToken) {
      localStorage.setItem("reviewerAccessToken", response.data.accessToken);
    }

    return response.data;
  } catch (error) {
    console.error("Reviewer login failed:", error);
    throw error;
  }
};

// Researcher authentication
export const loginResearcher = async (credentials: {
  email: string;
  password: string;
}) => {
  try {
    const response = await api.post("/auth/researcher-login", credentials);

    if (response.data.accessToken) {
      localStorage.setItem("researcherAccessToken", response.data.accessToken);
    }

    return response.data;
  } catch (error) {
    console.error("Researcher login failed:", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await api.post("/auth/logout");
  } catch (error) {
    console.error("Logout API call failed:", error);
  } finally {
    // Clear all potential tokens on logout
    localStorage.removeItem("adminAccessToken");
    localStorage.removeItem("reviewerAccessToken");
    localStorage.removeItem("researcherAccessToken");
    localStorage.removeItem("accessToken"); // Fallback
    localStorage.removeItem("userData");
  }
};

export const verifyToken = async () => {
  try {
    const response = await api.get("/auth/verify-token");
    return response.data;
  } catch (error) {
    console.error("Token verification failed:", error);
    throw error;
  }
};

// Admin endpoints
export const getProposals = async (
  params = {},
  options?: { signal?: AbortSignal }
) => {
  try {
    const response = await api.get("/admin/proposals", {
      params,
      signal: options?.signal,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching proposals:", error);
    throw error;
  }
};

export const getProposalById = async (id: string) => {
  try {
    const response = await api.get(`/admin/proposals/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching proposal with ID ${id}:`, error);
    throw error;
  }
};

export const getFacultiesWithProposals = async (options?: {
  signal?: AbortSignal;
}) => {
  try {
    const response = await api.get("/admin/faculties-with-proposals", {
      signal: options?.signal,
    });
    return response.data.data;
  } catch (error) {
    console.error("Error fetching faculties with proposals:", error);
    throw error;
  }
};

export const getProposalStatistics = async () => {
  try {
    const response = await api.get("/admin/statistics");
    return response.data;
  } catch (error) {
    console.error("Error fetching proposal statistics:", error);
    throw error;
  }
};

// Researcher management endpoints for admin use
export const getResearchersWithProposals = async () => {
  try {
    const response = await api.get("/admin/researcher/researchers");
    return response.data;
  } catch (error) {
    console.error("Error fetching researchers with proposals:", error);
    throw error;
  }
};

export const getResearcherDetails = async (researcherId: string) => {
  try {
    const response = await api.get(
      `/admin/researcher/researchers/${researcherId}`
    );
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching researcher details with ID ${researcherId}:`,
      error
    );
    throw error;
  }
};

export const sendResearcherCredentials = async (researcherId: string) => {
  try {
    const response = await api.post(
      `/admin/researcher/researchers/${researcherId}/send-credentials`
    );
    return response.data;
  } catch (error) {
    console.error(
      `Error sending credentials to researcher ${researcherId}:`,
      error
    );
    throw error;
  }
};

export const resendResearcherCredentials = async (researcherId: string) => {
  try {
    const response = await api.post(
      `/admin/researcher/researchers/${researcherId}/resend-credentials`
    );
    return response.data;
  } catch (error) {
    console.error(
      `Error resending credentials to researcher ${researcherId}:`,
      error
    );
    throw error;
  }
};

// Assignment review endpoints for admin use
export const assignReviewers = async (proposalId: string) => {
  try {
    const response = await api.post(`/admin/assign/${proposalId}`);
    return response.data;
  } catch (error) {
    console.error("Error assigning reviewers:", error);
    throw error;
  }
};

export const reassignRegularReview = async (
  proposalId: string,
  newReviewerId?: string
) => {
  try {
    const response = await api.put(`/admin/reassign/regular/${proposalId}`, {
      newReviewerId,
    });
    return response.data;
  } catch (error) {
    console.error("Error reassigning regular review:", error);
    throw error;
  }
};

export const reassignReconciliationReview = async (
  proposalId: string,
  newReviewerId?: string
) => {
  try {
    const response = await api.put(
      `/admin/reassign/reconciliation/${proposalId}`,
      { newReviewerId }
    );
    return response.data;
  } catch (error) {
    console.error("Error reassigning reconciliation review:", error);
    throw error;
  }
};

export const getEligibleReviewers = async (proposalId: string) => {
  try {
    const response = await api.get(
      `/admin/reassign/eligible-reviewers/${proposalId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching eligible reviewers:", error);
    throw error;
  }
};

export const checkOverdueReviews = async () => {
  try {
    const response = await api.get("/admin/check-overdue");
    return response.data;
  } catch (error) {
    console.error("Error checking overdue reviews:", error);
    throw error;
  }
};

// Reviewer management endpoints for admin
export const inviteReviewer = async (email: string) => {
  try {
    const response = await api.post("/reviewer/invite", { email });
    return response.data;
  } catch (error) {
    console.error("Error inviting reviewer:", error);
    throw error;
  }
};

export const completeReviewerProfile = async (
  token: string,
  profileData: {
    name: string;
    faculty: string;
    department?: string;
    phoneNumber: string;
    academicTitle?: string;
    alternativeEmail?: string;
  }
) => {
  try {
    const response = await api.post(
      `/reviewer/complete-profile/${token}`,
      profileData
    );
    return response.data;
  } catch (error) {
    console.error("Error completing reviewer profile:", error);
    throw error;
  }
};

export const addReviewerProfile = async (reviewerData: {
  email: string;
  name: string;
  faculty: string;
  department?: string;
  phoneNumber: string;
  academicTitle?: string;
  alternativeEmail?: string;
}) => {
  try {
    const response = await api.post("/reviewer/add", reviewerData);
    return response.data;
  } catch (error) {
    console.error("Error adding reviewer profile:", error);
    throw error;
  }
};

export const getAllReviewers = async (params = {}) => {
  try {
    const response = await api.get("/reviewer", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching all reviewers:", error);
    throw error;
  }
};

export const getReviewerById = async (id: string) => {
  try {
    const response = await api.get(`/reviewer/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching reviewer with ID ${id}:`, error);
    throw error;
  }
};

export const deleteReviewer = async (id: string) => {
  try {
    const response = await api.delete(`/reviewer/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting reviewer with ID ${id}:`, error);
    throw error;
  }
};

export const getReviewerInvitations = async () => {
  try {
    const response = await api.get("/reviewer/invitations");
    return response.data;
  } catch (error) {
    console.error("Error fetching reviewer invitations:", error);
    throw error;
  }
};

export const resendReviewerInvitation = async (id: string) => {
  try {
    const response = await api.post(`/reviewer/${id}/resend-invitation`);
    return response.data;
  } catch (error) {
    console.error(
      `Error resending invitation to reviewer with ID ${id}:`,
      error
    );
    throw error;
  }
};

// Reviewer endpoints
export const getReviewerDashboard = async () => {
  try {
    const response = await api.get("/reviewer/dashboard");
    return response.data;
  } catch (error) {
    console.error("Error fetching reviewer dashboard:", error);
    throw error;
  }
};

export const getReviewerAssignments = async () => {
  try {
    const response = await api.get("/reviewsys/assignments");
    return response.data;
  } catch (error) {
    console.error("Error fetching reviewer assignments:", error);
    throw error;
  }
};

export const getReviewerStatistics = async () => {
  try {
    const response = await api.get("/reviewsys/statistics");
    return response.data;
  } catch (error) {
    console.error("Error fetching reviewer statistics:", error);
    throw error;
  }
};

export const getReviewById = async (reviewId: string) => {
  try {
    const response = await api.get(`/reviewsys/${reviewId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching review with ID ${reviewId}:`, error);
    throw error;
  }
};

export const submitReview = async (
  reviewId: string,
  reviewData: {
    scores: {
      relevanceToNationalPriorities: number; // 0-10
      originalityAndInnovation: number; // 0-15
      clarityOfResearchProblem: number; // 0-10
      methodology: number; // 0-15
      literatureReview: number; // 0-10
      teamComposition: number; // 0-10
      feasibilityAndTimeline: number; // 0-10
      budgetJustification: number; // 0-10
      expectedOutcomes: number; // 0-5
      sustainabilityAndScalability: number; // 0-5
    };
    comments: string;
  }
) => {
  try {
    const response = await api.post(
      `/reviewsys/${reviewId}/submit`,
      reviewData
    );
    return response.data;
  } catch (error) {
    console.error("Error submitting review:", error);
    throw error;
  }
};

export const saveReviewProgress = async (
  reviewId: string,
  progressData: {
    scores?: {
      relevanceToNationalPriorities?: number; // 0-10
      originalityAndInnovation?: number; // 0-15
      clarityOfResearchProblem?: number; // 0-10
      methodology?: number; // 0-15
      literatureReview?: number; // 0-10
      teamComposition?: number; // 0-10
      feasibilityAndTimeline?: number; // 0-10
      budgetJustification?: number; // 0-10
      expectedOutcomes?: number; // 0-5
      sustainabilityAndScalability?: number; // 0-5
    };
    comments?: string;
  }
) => {
  try {
    const response = await api.patch(
      `/reviewsys/${reviewId}/save-progress`,
      progressData
    );
    return response.data;
  } catch (error) {
    console.error("Error saving review progress:", error);
    throw error;
  }
};

export const getProposalReviews = async (proposalId: string) => {
  try {
    const response = await api.get(`/admin/reviews/proposal/${proposalId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching reviews for proposal ${proposalId}:`, error);
    throw error;
  }
};

// Researcher endpoints
export const getResearcherDashboard = async () => {
  try {
    const response = await api.get("/researcher/dashboard");
    return response.data;
  } catch (error) {
    console.error("Error fetching researcher dashboard:", error);
    throw error;
  }
};

export const getResearcherProposalDetails = async (proposalId: string) => {
  try {
    const response = await api.get(`/researcher/proposals/${proposalId}`);
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching researcher proposal details with ID ${proposalId}:`,
      error
    );
    throw error;
  }
};

// Final Decision Endpoints
export const finalizeProposalDecision = async (
  proposalId: string,
  decision: "accepted" | "rejected",
  finalScore?: number,
  fundingAmount?: number,
  feedbackComments?: string
) => {
  try {
    const response = await api.post(
      `/admin/proposals/${proposalId}/finalize-decision`,
      {
        decision,
        finalScore,
        fundingAmount,
        feedbackComments,
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      `Error finalizing decision for proposal ${proposalId}:`,
      error
    );
    throw error;
  }
};

// Define the ProposalDecision type for frontend use
export interface ProposalDecision {
  _id: string;
  projectTitle: string;
  award: {
    fundingAmount?: number;
    status: "pending" | "approved" | "declined";
  };
  estimatedBudget?: number;
  fundingAmount?: number;
  feedbackComments?: string;
  finalScore?: number;
  aiScore?: number;
  humanScore?: number;
  reconciliationScore?: number;
  createdAt: string;
  notificationCount?: number;
  submitter?: {
    name: string;
    email: string;
  };
  faculty?: {
    _id: string;
    title: string;
  };
  department?: {
    _id: string;
    title: string;
  };
}

export interface DecisionUpdateData {
  status: "pending" | "approved" | "rejected";
  feedbackComments: string;
  fundingAmount?: number;
  finalScore: number;
}

// Admin endpoints for Proposal Decision Management
export const getProposalsForDecision = async (params?: {
  page?: number;
  limit?: number;
  faculty?: string;
  threshold?: number;
  sort?: string;
  order?: "asc" | "desc";
}): Promise<{
  success: boolean;
  data: ProposalDecision[];
  count: number;
  total: number;
  totalPages: number;
  currentPage: number;
  statistics?: {
    totalProposals: number;
    pendingDecisions: number;
    approved: number;
    rejected: number;
    averageScore: number;
    proposalsAboveThreshold: number;
    totalBudgetAboveThreshold: number;
    approvedBudget: number;
  };
}> => {
  const queryParams = new URLSearchParams();

  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.faculty) queryParams.append("faculty", params.faculty);
  if (params?.threshold)
    queryParams.append("threshold", params.threshold.toString());
  if (params?.sort) queryParams.append("sort", params.sort);
  if (params?.order) queryParams.append("order", params.order);

  try {
    const response = await api.get("/admin/decisions/proposals-for-decision", {
      params: queryParams,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching proposals for decision:", error);
    throw error;
  }
};

export const updateProposalStatus = async (
  proposalId: string,
  data: DecisionUpdateData
): Promise<{
  success: boolean;
  message: string;
  data: ProposalDecision;
}> => {
  try {
    const response = await api.patch(
      `/admin/decisions/${proposalId}/status`,
      data
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating status for proposal ${proposalId}:`, error);
    throw error;
  }
};

export const notifyApplicants = async (
  proposalId: string
): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    const response = await api.post(
      `/admin/decisions/${proposalId}/notify-applicants`
    );
    return response.data;
  } catch (error) {
    console.error(
      `Error notifying applicants for proposal ${proposalId}:`,
      error
    );
    throw error;
  }
};

export const toggleProposalArchiveStatus = async (
  proposalId: string,
  isArchived: boolean,
  comment?: string
) => {
  try {
    const response = await api.put(`/admin/proposals/${proposalId}/archive`, {
      isArchived,
      comment,
    });
    return response.data;
  } catch (error) {
    console.error(
      `Error toggling archive status for proposal ${proposalId}:`,
      error
    );
    throw error;
  }
};

export const exportDecisionsReport = async (): Promise<void> => {
  try {
    const response = await api.get("/admin/decisions/export-decisions", {
      responseType: "blob", // Important for handling file downloads
    });
    // Create a blob from the response data
    const blob = new Blob([response.data], { type: "text/csv" });
    // Create a link element
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = "decisions_report.csv"; // Set the filename
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error exporting decisions report:", error);
    throw error;
  }
};

// get proposal reviews information
export const getAllProposalReviews = async (params = {}) => {
  try {
    const response = await api.get("/admin/proposal-reviews", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching proposal reviews:", error);
    throw error;
  }
};

export const getProposalReviewStatistics = async () => {
  try {
    const response = await api.get("/admin/proposal-reviews/statistics");
    return response.data;
  } catch (error) {
    console.error("Error fetching review statistics:", error);
    throw error;
  }
};

export const getDiscrepancyProposals = async (params = {}) => {
  try {
    const response = await api.get("/admin/proposal-reviews/discrepancy", {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching discrepancy proposals:", error);
    throw error;
  }
};

export const getProposalReviewDetailsById = async (proposalId: string) => {
  try {
    const response = await api.get(`/admin/proposal-reviews/${proposalId}`);
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching proposal review details for ID ${proposalId}:`,
      error
    );
    throw error;
  }
};

export const getFullProposalStatus = async (proposalId: string) => {
  try {
    const response = await api.get(`/can-submit/${proposalId}`);
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching proposal status for ID ${proposalId}:`,
      error
    );
    throw error;
  }
};

export const getFinalSubmissionStatus = async (proposalId: string) => {
  try {
    const response = await api.get(`/can-submit-final/${proposalId}`);
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching final submission status for ID ${proposalId}:`,
      error
    );
    throw error;
  }
};

export const submitFullProposal = async (formData: FormData) => {
  try {
    const response = await api.post("/submit-full-proposal", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Full proposal submission failed:", error);
    throw error;
  }
};

export const submitFinalSubmission = async (formData: FormData) => {
  try {
    const response = await api.post("/submit-final-submission", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Final submission submission failed:", error);
    throw error;
  }
};

// Define the FullProposalDecision type for frontend use
export interface FullProposalDecision {
  _id: string;
  status: "submitted" | "approved" | "rejected";
  score?: number;
  reviewComments?: string;
  reviewedAt?: string;
  submittedAt: string;
  deadline: string;
  lastNotifiedAt?: string;
  notificationCount?: number;
  award?: {
    fundingAmount?: number;
    status?: string;
  };
  faculty?: {
    _id: string;
    title: string;
  };
  submitter?: {
    name: string;
    email: string;
  };
  originalProposal?: {
    projectTitle: string;
  };
}

export const getFullProposalsForDecision = async (params?: {
  page?: number;
  limit?: number;
  faculty?: string;
  sort?: string;
  order?: "asc" | "desc";
}) => {
  try {
    const response = await api.get(
      "/admin/decisions_2/full-proposals-for-decision",
      {
        params,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching full proposals for decision:", error);
    throw error;
  }
};

export const getFullProposalById = async (fullProposalId: string) => {
  try {
    const response = await api.get(
      `/admin/decisions_2/full-proposal/${fullProposalId}`
    );
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching full proposal with ID ${fullProposalId}:`,
      error
    );
    throw error;
  }
};

export const assignFullProposalScore = async (
  fullProposalId: string,
  score: number
) => {
  try {
    const response = await api.post(
      `/admin/decisions_2/full-proposal/${fullProposalId}/assign-score`,
      { score }
    );
    return response.data;
  } catch (error) {
    console.error(
      `Error assigning score to full proposal ${fullProposalId}:`,
      error
    );
    throw error;
  }
};

export const editFullProposalScore = async (
  fullProposalId: string,
  score: number
) => {
  try {
    const response = await api.patch(
      `/admin/decisions_2/full-proposal/${fullProposalId}/edit-score`,
      { score }
    );
    return response.data;
  } catch (error) {
    console.error(
      `Error editing score for full proposal ${fullProposalId}:`,
      error
    );
    throw error;
  }
};

export const editFullProposalFundingAmount = async (
  fullProposalId: string,
  fundingAmount: number
) => {
  try {
    const response = await api.patch(
      `/admin/decisions_2/full-proposal/${fullProposalId}/funding-amount`,
      { fundingAmount }
    );
    return response.data;
  } catch (error) {
    console.error(
      `Error editing funding amount for full proposal ${fullProposalId}:`,
      error
    );
    throw error;
  }
};

export const updateFullProposalStatus = async (
  fullProposalId: string,
  data: {
    status: "submitted" | "approved" | "rejected";
    reviewComments: string;
  }
) => {
  try {
    const response = await api.patch(
      `/admin/decisions_2/full-proposal/${fullProposalId}/status`,
      data
    );
    return response.data;
  } catch (error) {
    console.error(
      `Error updating status for full proposal ${fullProposalId}:`,
      error
    );
    throw error;
  }
};

export const notifyFullProposalApplicants = async (fullProposalId: string) => {
  try {
    const response = await api.post(
      `/admin/decisions_2/full-proposal/${fullProposalId}/notify-applicants`
    );
    return response.data;
  } catch (error) {
    console.error(
      `Error notifying applicants for full proposal ${fullProposalId}:`,
      error
    );
    throw error;
  }
};

// Analytics API calls
export const getFacultiesWithSubmissions = async () => {
  try {
    const response = await api.get(
      "/admin/analytics/faculties-with-submissions"
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching faculties with submissions:", error);
    throw error;
  }
};

export const getFacultiesWithApprovedAwards = async () => {
  try {
    const response = await api.get(
      "/admin/analytics/faculties-with-approved-awards"
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching faculties with approved awards:", error);
    throw error;
  }
};

export const getFacultiesWithApprovedFullProposals = async () => {
  try {
    const response = await api.get(
      "/admin/analytics/faculties-with-approved-full-proposals"
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching faculties with approved full proposals:",
      error
    );
    throw error;
  }
};

export default api;
