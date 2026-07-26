"use client";

import { useEffect, useState } from 'react';
import ResearcherLayout from '@/components/researchers/ResearcherLayout';
import { getResearcherDashboard } from '@/services/api';
import { FileText, ClipboardList, CheckCircle, AlertCircle, Clock, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface RecentProposal {
  _id: string;
  title: string;
  projectTitle: string;
  status: string;
  updatedAt: string;
}

interface DashboardData {
  profile: {
    name: string;
    email: string;
  };
  stats: {
    totalProposals: number;
    statusCounts: {
      submitted: number;
      under_review: number;
      approved: number;
      rejected: number;
      revision_requested: number;
    };
  };
  recentProposal: RecentProposal;
}

export default function ResearcherDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await getResearcherDashboard();
        setDashboardData(response.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'submitted': return 'bg-[#f3e7d0] text-[#4a0340]';
      case 'under_review': return 'bg-amber-100 text-amber-800';
      case 'approved': return 'bg-[#f2faf3] text-[#1f5b34]';
      case 'rejected': return 'bg-[#fef2f2] text-[#b91c1c]';
      case 'revision_requested': return 'bg-orange-100 text-orange-800';
      default: return 'bg-[#ecdfec] text-[#6b5566]';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <ResearcherLayout>
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin h-10 w-10 text-[#6d035c]" />
          </div>
        ) : error ? (
          <div className="bg-[#fef2f2] border border-red-200 rounded-md p-4 my-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-[#b91c1c] mr-2" />
              <p className="text-[#b91c1c]">{error}</p>
            </div>
          </div>
        ) : dashboardData && (
          <>
            {/* Welcome Section */}
            <div className="bg-white rounded-2xl border border-[#e6d9e6] shadow-[0_20px_60px_-40px_rgba(109,3,92,0.5)] p-6 mb-6">
              <h1 className="font-serif text-2xl font-semibold tracking-tight text-[#2b1229] mb-2">Welcome, {dashboardData.profile.name}</h1>
              <p className="text-[#6b5566]">Manage your research proposals and track their status.</p>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-2xl border border-[#e6d9e6] shadow-[0_20px_60px_-40px_rgba(109,3,92,0.5)] p-4 flex flex-col items-center">
                <div className="bg-[#f3e7d0] p-3 rounded-full mb-3">
                  <FileText className="h-6 w-6 text-[#4a0340]" />
                </div>
                <p className="text-lg font-bold text-[#2b1229]">{dashboardData.stats.totalProposals}</p>
                <p className="text-sm text-[#6b5566]">Total Proposals</p>
              </div>

              <div className="bg-white rounded-2xl border border-[#e6d9e6] shadow-[0_20px_60px_-40px_rgba(109,3,92,0.5)] p-4 flex flex-col items-center">
                <div className="bg-[#f3e7d0] p-3 rounded-full mb-3">
                  <ClipboardList className="h-6 w-6 text-[#6d035c]" />
                </div>
                <p className="text-lg font-bold text-[#2b1229]">{dashboardData.stats.statusCounts.submitted}</p>
                <p className="text-sm text-[#6b5566]">Submitted</p>
              </div>

              <div className="bg-white rounded-2xl border border-[#e6d9e6] shadow-[0_20px_60px_-40px_rgba(109,3,92,0.5)] p-4 flex flex-col items-center">
                <div className="bg-amber-100 p-3 rounded-full mb-3">
                  <Clock className="h-6 w-6 text-amber-800" />
                </div>
                <p className="text-lg font-bold text-[#2b1229]">{dashboardData.stats.statusCounts.under_review}</p>
                <p className="text-sm text-[#6b5566]">Under Review</p>
              </div>

              <div className="bg-white rounded-2xl border border-[#e6d9e6] shadow-[0_20px_60px_-40px_rgba(109,3,92,0.5)] p-4 flex flex-col items-center">
                <div className="bg-[#f2faf3] p-3 rounded-full mb-3">
                  <CheckCircle className="h-6 w-6 text-[#1f5b34]" />
                </div>
                <p className="text-lg font-bold text-[#2b1229]">{dashboardData.stats.statusCounts.approved}</p>
                <p className="text-sm text-[#6b5566]">Approved</p>
              </div>

              <div className="bg-white rounded-2xl border border-[#e6d9e6] shadow-[0_20px_60px_-40px_rgba(109,3,92,0.5)] p-4 flex flex-col items-center">
                <div className="bg-[#fef2f2] p-3 rounded-full mb-3">
                  <XCircle className="h-6 w-6 text-[#b91c1c]" />
                </div>
                <p className="text-lg font-bold text-[#2b1229]">{dashboardData.stats.statusCounts.rejected}</p>
                <p className="text-sm text-[#6b5566]">Rejected</p>
              </div>
            </div>

            {/* Recent Activity Section */}
            <div className="bg-white rounded-2xl border border-[#e6d9e6] shadow-[0_20px_60px_-40px_rgba(109,3,92,0.5)] p-6 mb-6">
              <h2 className="font-serif text-xl font-semibold text-[#2b1229] mb-4">Recent Activity</h2>

              {dashboardData.recentProposal ? (
                <div className="border-l border-[#e0c9df] pl-4 py-2">
                  <h3 className="font-medium text-lg text-[#2b1229]">{dashboardData.recentProposal.projectTitle || 'Untitled Proposal'}</h3>
                  <div className="flex items-center mt-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(dashboardData.recentProposal.status)}`}>
                      {dashboardData.recentProposal.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-[#6b5566] text-sm ml-3">
                      Last updated: {formatDate(dashboardData.recentProposal.updatedAt)}
                    </span>
                  </div>
                  <div className="mt-2">
                    <Link
                      href={`/researchers/proposals/${dashboardData.recentProposal._id}`}
                      className="text-sm text-[#6d035c] hover:text-[#4a0340]"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="text-[#6b5566]">No recent proposals found. Submit your first proposal!</p>
              )}
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/" target='_blank'
                className="bg-white rounded-2xl border border-[#e6d9e6] shadow-[0_20px_60px_-40px_rgba(109,3,92,0.5)] p-6 hover:bg-[#f3e8f2] transition-colors"
              >
                <h3 className="font-semibold text-[#2b1229] mb-2">Submit New Proposal</h3>
                <p className="text-[#6b5566] text-sm">Start a new research proposal submission</p>
              </Link>

              <Link
                href="/researchers/proposals"
                className="bg-white rounded-2xl border border-[#e6d9e6] shadow-[0_20px_60px_-40px_rgba(109,3,92,0.5)] p-6 hover:bg-[#f3e8f2] transition-colors"
              >
                <h3 className="font-semibold text-[#2b1229] mb-2">View All Proposals</h3>
                <p className="text-[#6b5566] text-sm">Check status and details of all your submitted proposals</p>
              </Link>
            </div>
          </>
        )}
      </div>
    </ResearcherLayout>
  );
}
