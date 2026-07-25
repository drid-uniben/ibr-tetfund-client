"use client";

import React, { useState, useEffect, useCallback } from 'react';
import ReviewerLayout from '@/components/reviewers/ReviewerLayout';
import {
  Edit3,  
  CheckCircle, 
  AlertTriangle,
  Award,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getReviewerDashboard } from '@/services/api';
import { useRouter } from 'next/navigation';

// Types based on your API response structure
interface ReviewerInfo {
  name: string;
  email: string;
  department: string;
  faculty: string;
  academicTitle: string;
}

interface Statistics {
  pendingReviews: number;
  completed: number;
  inProgress: number;
  overdue: number;
  totalAssigned: number;
}

interface Proposal {
  _id: string;
  projectTitle: string;
  submitterType: string;
  status: string;
  reviewStatus: string;
  createdAt: string;
  submitter: {
    name: string;
    email: string;
  };
  faculty?: {
    name: string;
    code: string;
  };
  department?: {
    name: string;
    code: string;
  };
}

interface Review {
  _id: string;
  status: string;
  dueDate: string;
  completedAt?: string;
  proposal: {
    projectTitle: string;
    submitterType: string;
  };
}

interface DashboardData {
  reviewer: ReviewerInfo;
  statistics: Statistics;
  assignedProposals: Proposal[];
  completedReviews: Review[];
  inProgressReviews: Review[];
  overdueReviews: Review[];
}

interface ErrorType {
  response: {
    data: {
      message: string;
    };
  };
}

const ReviewersDashboard: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
      if (!authLoading && !isAuthenticated) {
        router.push('/reviewers/login');
      }
    }, [authLoading, isAuthenticated, router]);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
  try {
    setError(null);
    const response = await getReviewerDashboard();
    if (response.success) {
      setDashboardData(response.data);
    } else {
      setError('Failed to load dashboard data');
    }
  } catch (err: unknown) {
    setError((error as unknown as ErrorType)?.response?.data?.message || 'Failed to load dashboard data');
    console.error('Dashboard fetch error:', err);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
}, [setError, setDashboardData, setLoading, setRefreshing, error]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated, authLoading, fetchDashboardData]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#faf7fc] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#6d035c] border-t-transparent mx-auto mb-4"></div>
          <p className="text-[#6b5566]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#faf7fc] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="h-12 w-12 text-[#b91c1c] mx-auto mb-4" />
          <h2 className="font-serif text-xl font-semibold text-[#2b1229] mb-2">Error Loading Dashboard</h2>
          <p className="text-[#6b5566] mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#6d035c] text-white px-4 py-2 rounded-full hover:bg-[#4a0340] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-[#faf7fc] flex items-center justify-center">
        <p className="text-[#6b5566]">No dashboard data available</p>
      </div>
    );
  }

  const { reviewer, statistics } = dashboardData;

  return (
    <ReviewerLayout>
      <div className="min-h-screen bg-[#faf7fc]">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight text-[#2b1229] mb-2">
                  Welcome back, {reviewer.name}
                </h1>
                <p className="text-[#6b5566] flex items-center">
                  <Award className="w-4 h-4 mr-2" />
                  {reviewer.academicTitle} • {reviewer.department || 'Department'}
                </p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center px-4 py-2 bg-white border border-[#e6d9e6] rounded-full shadow-[0_20px_60px_-40px_rgba(109,3,92,0.5)] hover:bg-[#f3e7d0] transition-all duration-200 disabled:opacity-50 text-[#4a0340]"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">

          <div className="bg-white rounded-2xl border border-[#e6d9e6] shadow-[0_20px_60px_-40px_rgba(109,3,92,0.5)] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#6b5566]">Total Assigned</p>
                <p className="text-2xl font-bold text-[#6d035c]">{statistics.totalAssigned}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-[#6d035c]" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#e6d9e6] shadow-[0_20px_60px_-40px_rgba(109,3,92,0.5)] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#6b5566]">In Progress</p>
                <p className="text-2xl font-bold text-[#b8860b]">{statistics.inProgress}</p>
              </div>
              <Edit3 className="w-8 h-8 text-[#b8860b]" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#e6d9e6] shadow-[0_20px_60px_-40px_rgba(109,3,92,0.5)] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#6b5566]">Completed</p>
                <p className="text-2xl font-bold text-[#1f5b34]">{statistics.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-[#1f5b34]" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#e6d9e6] shadow-[0_20px_60px_-40px_rgba(109,3,92,0.5)] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#6b5566]">Overdue</p>
                <p className="text-2xl font-bold text-[#b91c1c]">{statistics.overdue}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-[#b91c1c]" />
            </div>
          </div>
        </div>

        {/* Quick Stats Footer */}
        <div className="mt-8 bg-white rounded-2xl border border-[#e6d9e6] shadow-[0_20px_60px_-40px_rgba(109,3,92,0.5)] p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-[#6d035c]">
                {Math.round((statistics.completed / (statistics.totalAssigned || 1)) * 100)}%
              </p>
              <p className="text-sm text-[#6b5566]">Completion Rate</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#b8860b]">
                {statistics.totalAssigned - statistics.completed - statistics.overdue}
              </p>
              <p className="text-sm text-[#6b5566]">Remaining Reviews</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1f5b34]">
                {statistics.overdue === 0 ? 'On Track' : `${statistics.overdue} Overdue`}
              </p>
              <p className="text-sm text-[#6b5566]">Review Status</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ReviewerLayout>
  );
};

export default ReviewersDashboard;
