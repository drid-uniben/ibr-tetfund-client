"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getResearcherDashboard } from '@/services/api';
import ResearcherLayout from '@/components/researchers/ResearcherLayout';
import { AlertCircle, Search, FileText, ChevronRight, Loader2 } from 'lucide-react';

interface Proposal {
  _id: string;
  projectTitle: string;
  submitterType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function ResearcherProposals() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [filteredProposals, setFilteredProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const response = await getResearcherDashboard();
        setProposals(response.data.proposals);
      } catch (err) {
        console.error('Error fetching proposals:', err);
        setError('Failed to load proposals. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProposals();
  }, []);

  useEffect(() => {
    const filterAndSearchProposals = () => {
      let filtered = proposals;

      if (statusFilter !== 'all') {
        filtered = filtered.filter(proposal => proposal.status === statusFilter);
      }

      if (searchTerm) {
        filtered = filtered.filter(proposal =>
          proposal.projectTitle?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setFilteredProposals(filtered);
    };

    filterAndSearchProposals();
  }, [proposals, searchTerm, statusFilter]);

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

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <ResearcherLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-[#2b1229] mb-4 md:mb-0">My Proposals</h1>
          <Link
            href={proposals[0]?.submitterType === 'staff' ? "/tet-fund" : "/masters-funding"} target='_blank'
            className="bg-[#6d035c] hover:bg-[#4a0340] text-white px-6 py-2.5 rounded-full text-sm font-semibold flex items-center transition-colors"
          >
            <FileText className="h-4 w-4 mr-2" />
            Submit New Proposal
          </Link>
        </div>

        {error && (
          <div className="bg-[#fef2f2] border border-red-200 rounded-md p-4 my-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-[#b91c1c] mr-2" />
              <p className="text-[#b91c1c]">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-[#e6d9e6] shadow-[0_20px_60px_-40px_rgba(109,3,92,0.5)] p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-[#a48fa0]" />
              </div>
              <input
                type="text"
                className="pl-10 pr-4 py-2.5 border border-[#e0d3e0] rounded-lg w-full text-sm text-[#2b1229] placeholder:text-[#a48fa0] focus:outline-none focus:border-[#6d035c] focus:ring-2 focus:ring-[#6d035c]/20"
                placeholder="Search proposals by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="w-full md:w-64">
              <select
                className="w-full border border-[#e0d3e0] rounded-lg px-4 py-2.5 text-sm text-[#2b1229] focus:outline-none focus:border-[#6d035c] focus:ring-2 focus:ring-[#6d035c]/20"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="revision_requested">Revision Requested</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="animate-spin h-10 w-10 text-[#6d035c]" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-[#faf7fc]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#6b5566] uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#6b5566] uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#6b5566] uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#6b5566] uppercase tracking-wider">Submitted</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#6b5566] uppercase tracking-wider">Last Updated</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-[#6b5566] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#ecdfec]">
                  {filteredProposals.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-[#6b5566]">
                        {proposals.length === 0
                          ? "You haven't submitted any proposals yet."
                          : "No proposals match your current filters."}
                      </td>
                    </tr>
                  ) : (
                    filteredProposals.map((proposal) => (
                      <tr key={proposal._id} className="hover:bg-[#faf7fc]">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#2b1229]">
                          {proposal.projectTitle || 'Untitled Proposal'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6b5566]">
                          {proposal.submitterType === 'staff' ? 'Staff Research' : 'Master\'s Research'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(proposal.status)}`}>
                            {formatStatus(proposal.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6b5566]">
                          {formatDate(proposal.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6b5566]">
                          {formatDate(proposal.updatedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/researchers/proposals/${proposal._id}`}
                            className="text-[#6d035c] hover:text-[#4a0340] flex items-center justify-end"
                          >
                            View Details
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ResearcherLayout>
  );
}
