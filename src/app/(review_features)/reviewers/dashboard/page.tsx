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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <p className="text-gray-600">No dashboard data available</p>
      </div>
    );
  }

  const { reviewer, statistics } = dashboardData;

  return (
    <ReviewerLayout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                  Welcome back, {reviewer.name}
                </h1>
                <p className="text-gray-600 flex items-center">
                  <Award className="w-4 h-4 mr-2" />
                  {reviewer.academicTitle} • {reviewer.department || 'Department'}
                </p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Assigned</p>
                <p className="text-2xl font-bold text-purple-600">{statistics.totalAssigned}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{statistics.inProgress}</p>
              </div>
              <Edit3 className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{statistics.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-l-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{statistics.overdue}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Quick Stats Footer */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {Math.round((statistics.completed / (statistics.totalAssigned || 1)) * 100)}%
              </p>
              <p className="text-sm text-gray-600">Completion Rate</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {statistics.totalAssigned - statistics.completed - statistics.overdue}
              </p>
              <p className="text-sm text-gray-600">Remaining Reviews</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {statistics.overdue === 0 ? 'On Track' : `${statistics.overdue} Overdue`}
              </p>
              <p className="text-sm text-gray-600">Review Status</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ReviewerLayout>
  );
};

export default ReviewersDashboard;
