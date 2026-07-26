"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ReviewerLayout from '@/components/reviewers/ReviewerLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getReviewerAssignments, getReviewerStatistics } from '@/services/api';
import {
  Clock,
  AlertTriangle,
  FileText,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  Search,
  TrendingUp,
  Award,
  RefreshCw,
} from 'lucide-react';

interface ReviewAssignment {
  _id: string;
  proposal: {
    _id: string;
    projectTitle: string;
    submitterType: 'staff' | 'master_student';
    status: string;
    createdAt: string;
    estimatedBudget?: number;
    submitter: {
      name: string;
      email: string;
      faculty?: {
        title: string;
      };
      department?: {
        title: string;
      };
    };
  };
  reviewType: 'human' | 'reconciliation';
  status: 'in_progress' | 'completed' | 'overdue';
  dueDate: string;
  completedAt?: string;
  totalScore?: number;
}

interface ReviewerStats {
  totalAssigned: number;
  completed: number;
  pending: number;
  overdue: number;
}

const ReviewerAssignments: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [assignments, setAssignments] = useState<ReviewAssignment[]>([]);
  const [statistics, setStatistics] = useState<ReviewerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'reconciliation'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assignmentsData, statsData] = await Promise.all([
        getReviewerAssignments(),
        getReviewerStatistics(),
      ]);
      
      setAssignments(assignmentsData.data || []);
      setStatistics(statsData.data.statistics || null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load assignments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const getStatusBadge = (status: string, dueDate: string) => {
    const isOverdue = new Date(dueDate) < new Date() && status !== 'completed';
    
    if (isOverdue) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#fef2f2] text-[#b91c1c]">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Overdue
        </span>
      );
    }

    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f2faf3] text-[#1f5b34]">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f3e7d0] text-[#4a0340]">
            <Clock className="w-3 h-3 mr-1" />
            In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f4eef3] text-[#2b1229]">
            {status}
          </span>
        );
    }
  };

  const getPriorityLevel = (dueDate: string, reviewType: string) => {
    const days = Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (reviewType === 'reconciliation') return 'high';
    if (days < 0) return 'overdue';
    if (days <= 2) return 'high';
    if (days <= 7) return 'medium';
    return 'low';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'overdue': return 'bg-[#fef2f2]';
      case 'high': return 'bg-[#fef2f2]';
      case 'medium': return 'bg-[#f3e7d0]';
      case 'reconciliation': return 'bg-[#f3e7d0]';
      default: return 'bg-[#f2faf3]';
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.proposal.projectTitle.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    switch (filter) {
      case 'pending':
        return assignment.status === 'in_progress';
      case 'overdue':
        return new Date(assignment.dueDate) < new Date() && assignment.status !== 'completed';
      case 'reconciliation':
        return assignment.reviewType === 'reconciliation';
      default:
        return true;
    }
  }).sort((a, b) => new Date(b.proposal.createdAt).getTime() - new Date(a.proposal.createdAt).getTime());

  if (authLoading || loading) {
    return (
      <ReviewerLayout>
        <div className="min-h-screen bg-[#faf7fc] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#6d035c] border-t-transparent mx-auto mb-4"></div>
            <p className="text-[#6b5566]">Loading assignments...</p>
          </div>
        </div>
      </ReviewerLayout>
    );
  }

  if (error) {
    return (
      <ReviewerLayout>
        <div className="min-h-screen bg-[#faf7fc] flex items-center justify-center">
          <div className="text-center">
            <XCircle className="w-16 h-16 text-[#b91c1c] mx-auto mb-4" />
            <p className="text-[#b91c1c] mb-4">{error}</p>
            <button
              onClick={fetchData}
              className="bg-[#6d035c] text-white px-4 py-2 rounded-full hover:bg-[#4a0340] transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </ReviewerLayout>
    );
  }

  return (
    <ReviewerLayout>
      <div className="min-h-screen bg-[#faf7fc] p-6">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#2b1229] mb-2">Review Assignments</h1>
              <p className="text-[#6b5566]">Manage your proposal reviews and track progress</p>
            </div>
            <button
              onClick={fetchData}
              className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 bg-white border border-[#e6d9e6] rounded-full shadow-[0_20px_60px_-40px_rgba(109,3,92,0.5)] hover:bg-[#f3e7d0] transition-colors text-[#4a0340]"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="max-w-7xl mx-auto mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl border border-[#e6d9e6] shadow-[0_20px_60px_-40px_rgba(109,3,92,0.5)] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#6b5566]">Total Assigned</p>
                    <p className="text-2xl font-bold text-[#2b1229]">{statistics.totalAssigned}</p>
                  </div>
                  <div className="bg-[#f4eef3] p-3 rounded-lg">
                    <FileText className="w-6 h-6 text-[#6d035c]" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#e6d9e6] shadow-[0_20px_60px_-40px_rgba(109,3,92,0.5)] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#6b5566]">Completed</p>
                    <p className="text-2xl font-bold text-[#1f5b34]">{statistics.completed}</p>
                  </div>
                  <div className="bg-[#f2faf3] p-3 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-[#1f5b34]" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#e6d9e6] shadow-[0_20px_60px_-40px_rgba(109,3,92,0.5)] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#6b5566]">Pending</p>
                    <p className="text-2xl font-bold text-[#b8860b]">{statistics.pending}</p>
                  </div>
                  <div className="bg-[#f3e7d0] p-3 rounded-lg">
                    <Clock className="w-6 h-6 text-[#b8860b]" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#e6d9e6] shadow-[0_20px_60px_-40px_rgba(109,3,92,0.5)] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#6b5566]">Overdue</p>
                    <p className="text-2xl font-bold text-[#b91c1c]">{statistics.overdue}</p>
                  </div>
                  <div className="bg-[#fef2f2] p-3 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-[#b91c1c]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-white rounded-2xl border border-[#e6d9e6] shadow-[0_20px_60px_-40px_rgba(109,3,92,0.5)] p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <Filter className="w-5 h-5 text-[#6b5566]" />
                <div className="flex space-x-2">
                  {['all', 'pending', 'overdue', 'reconciliation'].map((filterOption) => (
                    <button
                      key={filterOption}
                      onClick={() => setFilter(filterOption as "all" | "pending" | "overdue" | "reconciliation")}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        filter === filterOption
                          ? 'bg-[#6d035c] text-white'
                          : 'bg-[#f4eef3] text-[#4a0340] hover:bg-[#f3e7d0]'
                      }`}
                    >
                      {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative">
                <Search className="w-5 h-5 text-[#a48fa0] absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search proposals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-[#e0d3e0] rounded-lg focus:ring-2 focus:ring-[#6d035c]/20 focus:border-[#6d035c] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Assignments List */}
        <div className="max-w-7xl mx-auto">
          {filteredAssignments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#e6d9e6] shadow-[0_20px_60px_-40px_rgba(109,3,92,0.5)] p-12 text-center">
              <FileText className="w-16 h-16 text-[#a48fa0] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#2b1229] mb-2">No assignments found</h3>
              <p className="text-[#6b5566]">
                {searchTerm || filter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'You have no review assignments at the moment'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAssignments.map((assignment) => {
                const priority = getPriorityLevel(assignment.dueDate, assignment.reviewType);
                const daysUntilDue = Math.ceil((new Date(assignment.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div
                    key={assignment._id}
                    className={`rounded-2xl border border-[#e6d9e6] shadow-[0_20px_60px_-40px_rgba(109,3,92,0.5)] hover:shadow-[0_24px_64px_-36px_rgba(109,3,92,0.55)] transition-all duration-200 ${getPriorityColor(priority)}`}
                  >
                    <div className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-semibold text-[#2b1229] mb-1">
                                {assignment.proposal.projectTitle}
                              </h3>
                              <div className="flex items-center space-x-4 text-sm text-[#6b5566]">
                                <div className="flex items-center">
                                  <Calendar className="w-4 h-4 mr-1" />
                                  {new Date(assignment.proposal.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {assignment.reviewType === 'reconciliation' && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f3e7d0] text-[#4a0340]">
                                  <Award className="w-3 h-3 mr-1" />
                                  Reconciliation
                                </span>
                              )}
                              {getStatusBadge(assignment.status, assignment.dueDate)}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center text-sm text-[#6b5566]">
                              <Clock className="w-4 h-4 mr-2 text-[#a48fa0]" />
                              <span>
                                Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                {daysUntilDue >= 0 ? (
                                  <span className="ml-1 text-[#1f5b34]">({daysUntilDue} days left)</span>
                                ) : (
                                  <span className="ml-1 text-[#b91c1c]">({Math.abs(daysUntilDue)} days overdue)</span>
                                )}
                              </span>
                            </div>

                            {assignment.proposal.estimatedBudget && (
                              <div className="flex items-center text-sm text-[#6b5566]">
                                <DollarSign className="w-4 h-4 mr-2 text-[#a48fa0]" />
                                <span>₦{assignment.proposal.estimatedBudget.toLocaleString()}</span>
                              </div>
                            )}

                            <div className="flex items-center text-sm text-[#6b5566]">
                              <span className="capitalize">
                                {assignment.proposal.submitterType.replace('_', ' ')} Proposal
                              </span>
                            </div>
                          </div>

                          {assignment.totalScore && (
                            <div className="mb-4">
                              <div className="flex items-center text-sm text-[#6b5566]">
                                <TrendingUp className="w-4 h-4 mr-2 text-[#a48fa0]" />
                                <span>Score: {assignment.totalScore}/100</span>
                                <div className="ml-3 w-24 bg-[#e6d9e6] rounded-full h-2">
                                  <div
                                    className="bg-[#6d035c] rounded-full h-2"
                                    style={{ width: `${assignment.totalScore}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col sm:flex-row lg:flex-col gap-2">
                          <Link
                            href={`/reviewers/assignments/${assignment._id}`}
                            className="inline-flex items-center justify-center px-4 py-2 bg-[#6d035c] text-white rounded-full hover:bg-[#4a0340] transition-colors text-sm font-medium"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            {assignment.status === 'in_progress' ? 'Continue Review' : assignment.status === 'completed' ? 'View Review' : 'Start Review'}
                          </Link>

                          {assignment.status === 'completed' && assignment.completedAt && (
                            <span className="text-xs text-[#6b5566] text-center lg:text-left">
                              Completed {new Date(assignment.completedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ReviewerLayout>
  );
};

export default ReviewerAssignments;