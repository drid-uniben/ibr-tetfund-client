"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import * as api from '@/services/api';
import { getProposals, getFacultiesWithProposals, toggleProposalArchiveStatus, getEligibleReviewers, reassignRegularReview, reassignReconciliationReview } from '@/services/api';
import AdminLayout from '@/components/admin/AdminLayout';
import { Loader2, FileText, Filter, ArrowUpDown, Eye, RefreshCw, MoreVertical, Archive, FolderOpen, User, Users, Search, CheckCircle, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";


interface Faculty {
  code: string | null;
  title: string;
  type?: string | null;
}

interface Proposal {
  _id: string;
  projectTitle: string;
  submitterType: 'staff' | 'master_student';
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'revision_requested';
  createdAt: string;
  submitter: {
    name: string;
    email: string;
  };
  isArchived: boolean; // Add isArchived property
}

interface PaginationData {
  count: number;
  totalPages: number;
  currentPage: number;
}

export default function AdminProposalsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    count: 0,
    totalPages: 1,
    currentPage: 1
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // New state to trigger refresh
  const [filters, setFilters] = useState({
    status: '',
    submitterType: '',
    faculty: '', // Add faculty filter
    sort: 'createdAt',
    order: 'desc',
    isArchived: false, // Default to unarchived proposals
  });
  const router = useRouter();

  // State for comment modal
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [currentProposalId, setCurrentProposalId] = useState<string | null>(null);
  const [isArchivingAction, setIsArchivingAction] = useState(false); // true for archive, false for unarchive
  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);
  const [showReassignModal, setShowReassignModal] = useState(false);
const [reassignData, setReassignData] = useState<{
  proposalId: string;
  isReconciliation: boolean;
} | null>(null);
const [reassignMode, setReassignMode] = useState<'auto' | 'manual' | null>(null);
interface EligibleReviewer {
  _id: string;
  name: string;
  email: string;
  facultyTitle: string;
  totalReviewsCount: number;
  completionRate: number;
}

interface ProposalInfo {
  title: string;
  submitterFaculty: string;
}

const [eligibleReviewers, setEligibleReviewers] = useState<EligibleReviewer[]>([]);
const [selectedReviewer, setSelectedReviewer] = useState<string | null>(null);
const [searchTerm, setSearchTerm] = useState('');
const [proposalInfo, setProposalInfo] = useState<ProposalInfo | null>(null);
const [reassignLoading, setReassignLoading] = useState(false);
const [reassignSuccess, setReassignSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!showReassignModal) {
      // Ensure body styles are reset when modal is closed
      document.body.style.pointerEvents = ''; // Reset to default
      document.body.style.overflow = ''; // Reset to default
    }
  }, [showReassignModal]);


  // Fetch faculties with proposals
  useEffect(() => {
    const fetchFaculties = async () => {
      if (!isAuthenticated) return;
      
      try {
        const facultyData = await getFacultiesWithProposals();
        setFaculties(facultyData);
      } catch (err: unknown) {
        if ((err as Error).name === 'CanceledError') {
          // console.log('Faculties fetch aborted (expected)');
        } else {
          console.error('Failed to fetch faculties:', err);
        }
      }
    };

    fetchFaculties();
  }, [isAuthenticated]);

  useEffect(() => {
  const fetchProposals = async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await getProposals({
        page: pagination.currentPage,
        limit: 10,
        ...filters,
        isArchived: filters.isArchived,
      });
      setProposals(response.data);
      console.log('Proposals fetched:', response.data);
      setPagination({
        count: response.count,
        totalPages: response.totalPages,
        currentPage: response.currentPage
      });
    } catch (err: unknown) {
      if ((err as Error).name === 'CanceledError') {
        // console.log('Proposals fetch aborted (expected)');
      } else {
        console.error('Failed to fetch proposals:', err);
        setError('Failed to load proposals. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  fetchProposals();
}, [isAuthenticated, pagination.currentPage, filters, refreshTrigger]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
  const { name, value, type } = e.target;
  const checked = (e.target as HTMLInputElement).checked;
  
  setFilters(prev => ({ 
    ...prev, 
    [name]: type === 'checkbox' ? checked : value 
  }));
  setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page on filter change
};

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  const toggleSortOrder = (field: string) => {
    setFilters(prev => ({
      ...prev,
      sort: field,
      order: prev.sort === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1); // Increment to force useEffect re-run
  };

  const handleAssignReviewer = async (proposalId: string) => {
    toast.info("Assigning reviewer...");
    try {
      const response = await api.assignReviewers(proposalId);
      if(response.success) {
        toast.success("Assigned reviewer successfully.");
        refreshData(); // Refresh the list after assignment
      }
      else {
        toast.error("Assignment failed")
      }
    } catch (error) {
      console.error("Failed to assign reviewer:", error);
      toast.error("Error while assigning reviewer.");
    }
  };

  // Helper function to determine if reassign is available
  const canReassignReview = (proposal: Proposal): { 
  canReassign: boolean; 
  isReconciliation: boolean 
} => {
  // For regular review reassignment
  if (proposal.status === 'under_review') {
    // You would need to check if reviewer hasn't completed their review
    return { canReassign: true, isReconciliation: false };
  }
  
  // For reconciliation review reassignment
  if (proposal.status === 'revision_requested') {
    // Check if reconciliation review is pending
    return { canReassign: true, isReconciliation: true };
  }

  return { canReassign: false, isReconciliation: false };
};

// Function to handle reassign click
const handleReassignClick = (proposalId: string, isReconciliation: boolean) => {
  setReassignData({ proposalId, isReconciliation });
  setReassignMode(null);
  setSelectedReviewer(null);
  setSearchTerm('');
  setReassignSuccess(false);
  setShowReassignModal(true);
};

// Function to load eligible reviewers
const loadEligibleReviewers = async () => {
  if (!reassignData) return;
  
  try {
    setReassignLoading(true);
    const response = await getEligibleReviewers(reassignData.proposalId);
    setEligibleReviewers(response.data.eligibleReviewers);
    setProposalInfo(response.data.proposalInfo);
  } catch (err) {
    console.error('Failed to load eligible reviewers:', err);
    toast.error('Failed to load eligible reviewers');
  } finally {
    setReassignLoading(false);
  }
};

// Function to handle the reassignment
const handleReassignSubmit = async () => {
  if (!reassignData) return;

  try {
    setReassignLoading(true);
    const reassignFn = reassignData.isReconciliation ? reassignReconciliationReview : reassignRegularReview;
    const response = await reassignFn(
      reassignData.proposalId, 
      reassignMode === 'manual' ? (selectedReviewer ?? undefined) : undefined
    );

    if (response.success) {
      setReassignSuccess(true);
      toast.success('Review reassigned successfully');
      
      setShowReassignModal(false);
      refreshData();
    } else {
      toast.error('Failed to reassign review');
    }
  } catch (err) {
    console.error('Failed to reassign review:', err);
    toast.error('Failed to reassign review');
  } finally {
    setReassignLoading(false);
  }
};

  const handleArchiveClick = (proposalId: string, archive: boolean) => {
    setCurrentProposalId(proposalId);
    setIsArchivingAction(archive);
    setComment(''); // Clear previous comment
    setCommentError(null); // Clear previous error
    // Use setTimeout to allow DropdownMenu to close before Dialog opens
    setTimeout(() => {
      setShowCommentModal(true);
    }, 50); // A small delay
  };

  const handleSubmitComment = async () => {
    if (isArchivingAction && !comment.trim()) {
      setCommentError("Comment is mandatory for archiving.");
      return;
    }

    if (!currentProposalId) {
      toast.error("No proposal selected.");
      return;
    }

    setCommentError(null);
    setShowCommentModal(false); // Close dialog immediately

    if (!currentProposalId) {
      toast.error("No proposal selected.");
      return;
    }

    toast.info(isArchivingAction ? "Archiving proposal..." : "Unarchiving proposal...");

    try {
      const response = await toggleProposalArchiveStatus(currentProposalId, isArchivingAction, comment);
      if (response.success) {
        toast.success(isArchivingAction ? "Proposal archived successfully." : "Proposal unarchived successfully.");
        refreshData(); // Refresh the list after archiving/unarchiving
      } else {
        toast.error(isArchivingAction ? "Archiving failed." : "Unarchiving failed.");
      }
    } catch (error) {
      console.error("Failed to toggle archive status:", error);
      toast.error("Error while toggling archive status.");
    } finally {
      setCurrentProposalId(null);
      setComment('');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'revision_requested':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      submitted: 'Submitted',
      under_review: 'Under Review',
      approved: 'Approved',
      rejected: 'Rejected',
      revision_requested: 'Needs Revision'
    };
    
    return statusMap[status] || status;
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-purple-800" />
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="py-6">
        <div className="mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Unarchived Proposals</h1>
            <div className="flex space-x-4">
              <Link href="/admin/proposals/archived" passHref>
                <Button
                  variant="outline"
                  className="flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Archived Proposals
                </Button>
              </Link>
              <button 
                onClick={refreshData}
                className="flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
              {error}
            </div>
          )}
          
          {/* Filters */}
          <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
  <div className="flex flex-col md:flex-row items-start gap-4">
    <div className="flex items-center">
      <Filter className="text-gray-400 mr-2 h-5 w-5" />
      <span className="text-sm font-medium text-gray-500">Filters:</span>
    </div>
    
    <div className="flex flex-col gap-4 flex-grow">
      {/* Remove the entire checkbox filter row */}
      
      {/* Updated Select Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Status Filter */}
        <div>
          <label htmlFor="status" className="block text-xs font-medium text-gray-500 mb-1">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="revision_requested">Needs Revision</option>
          </select>
        </div>
        
        {/* Submitter Type Filter */}
        <div>
          <label htmlFor="submitterType" className="block text-xs font-medium text-gray-500 mb-1">
            Submitter Type
          </label>
          <select
            id="submitterType"
            name="submitterType"
            value={filters.submitterType}
            onChange={handleFilterChange}
            className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="">All Types</option>
            <option value="staff">Staff</option>
            <option value="master_student">Master&apos;s Student</option>
          </select>
        </div>
        
        {/* Faculty Filter */}
        <div>
          <label htmlFor="faculty" className="block text-xs font-medium text-gray-500 mb-1">
            Faculty
          </label>
          <select
            id="faculty"
            name="faculty"
            value={filters.faculty}
            onChange={handleFilterChange}
            className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="">All Faculties</option>
            {faculties.map((faculty) => (
              <option key={faculty.title} value={faculty.title}>
                {faculty.title}
              </option>
            ))}
          </select>
        </div>
        
        {/* Updated Sort Order - Add duplicates option */}
        <div>
          <label htmlFor="sort" className="block text-xs font-medium text-gray-500 mb-1">
            Sort By
          </label>
          <select
            id="sort"
            name="sort"
            value={filters.sort}
            onChange={handleFilterChange}
            className="w-full rounded-md border border-gray-300 py-2 px-3 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="createdAt">Submission Date</option>
            <option value="projectTitle">Project Title</option>
            <option value="status">Status</option>
            <option value="duplicates">Duplicate Submissions</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</div>
          
          {/* Proposals Table */}
          <div className="bg-white shadow overflow-hidden rounded-lg">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-purple-800" />
              </div>
            ) : proposals.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No proposals found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No proposals match your current filters.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => toggleSortOrder('projectTitle')}
                      >
                        <div className="flex items-center">
                          Project Title
                          {filters.sort === 'projectTitle' && (
                            <ArrowUpDown className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      >
                        Submitter
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      >
                        Type
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => toggleSortOrder('status')}
                      >
                        <div className="flex items-center">
                          Status
                          {filters.sort === 'status' && (
                            <ArrowUpDown className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => toggleSortOrder('createdAt')}
                      >
                        <div className="flex items-center">
                          Submitted
                          {filters.sort === 'createdAt' && (
                            <ArrowUpDown className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {proposals.map((proposal) => (
                      <tr key={proposal._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {proposal.projectTitle}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex flex-col">
                            <span className="font-medium">{proposal.submitter.name}</span>
                            <span className="text-xs text-gray-400">{proposal.submitter.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {proposal.submitterType === 'staff' ? 'Staff' : "Master's Student"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(proposal.status)}`}>
                            {getStatusLabel(proposal.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(proposal.createdAt)}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" className="h-8 w-8 p-0">
        <span className="sr-only">Open menu</span>
        <MoreVertical className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem onSelect={() => router.push(`/admin/proposals/${proposal._id}`)}>
        <Eye className="h-4 w-4 mr-2" /> View
      </DropdownMenuItem>
      
      {proposal.status === "submitted" && (
        <DropdownMenuItem onSelect={() => handleAssignReviewer(proposal._id)}>
          <UserPlus className="h-4 w-4 mr-2" /> Assign Reviewer
        </DropdownMenuItem>
      )}
      
      {(() => {
        const { canReassign, isReconciliation } = canReassignReview(proposal);
        return canReassign && (
          <DropdownMenuItem onSelect={() => handleReassignClick(proposal._id, isReconciliation)}>
            <RefreshCw className="h-4 w-4 mr-2" /> 
            {isReconciliation ? 'Reassign Reconciliation' : 'Reassign Review'}
          </DropdownMenuItem>
        );
      })()}
                              {proposal.isArchived ? (
                                <DropdownMenuItem onSelect={() => handleArchiveClick(proposal._id, false)}>
                                  <FolderOpen className="h-4 w-4 mr-2" /> Unarchive
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onSelect={() => handleArchiveClick(proposal._id, true)} className="text-red-500 focus:text-red-500">
                                  <Archive className="h-4 w-4 mr-2" /> Archive
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Pagination */}
            {!isLoading && proposals.length > 0 && (
              <nav className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="hidden sm:block">
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{((pagination.currentPage - 1) * 10) + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.currentPage * 10, pagination.count)}
                    </span>{' '}
                    of <span className="font-medium">{pagination.count}</span> proposals
                  </p>
                </div>
                <div className="flex-1 flex justify-between sm:justify-end">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </nav>
            )}
          </div>
        </div>
      </div>

      {/* Comment Modal */}
      <Dialog open={showCommentModal} onOpenChange={setShowCommentModal} key={showCommentModal ? "open" : "closed"}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isArchivingAction ? "Archive Proposal" : "Unarchive Proposal"}</DialogTitle>
            <DialogDescription>
              {isArchivingAction ? 
                "Please provide a mandatory comment explaining why you are archiving this proposal." : 
                "Optionally, provide a comment explaining why you are unarchiving this proposal."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="comment" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Comment
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                rows={4}
                placeholder={isArchivingAction ? "e.g., Proposal archived due to..." : "e.g., Proposal unarchived for further review."}
              />
              {commentError && <p className="text-red-500 text-xs mt-1">{commentError}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowCommentModal(false)}>
                Cancel
            </Button>
            <Button type="submit" onClick={handleSubmitComment}>
              {isArchivingAction ? "Archive" : "Unarchive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

{showReassignModal && (
  <Dialog open={showReassignModal} onOpenChange={(open) => {
    setShowReassignModal(open);
    if (!open) { // If modal is closing
      setReassignSuccess(false); // Reset success state
      setReassignMode(null); // Reset mode
      setSelectedReviewer(null); // Reset selected reviewer
      setSearchTerm(''); // Reset search term
    }
  }}>
    <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-purple-600" />
          {reassignData?.isReconciliation ? 'Reassign Reconciliation Review' : 'Reassign Review'}
        </DialogTitle>
        <DialogDescription>
          Choose how you want to reassign this {reassignData?.isReconciliation ? 'reconciliation ' : ''}review.
        </DialogDescription>
      </DialogHeader>

      <div className="py-4">
        {reassignSuccess ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900">Review reassigned successfully!</p>
          </div>
        ) : !reassignMode ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div 
                onClick={() => setReassignMode('auto')}
                className="group p-6 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all cursor-pointer"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-purple-100 group-hover:bg-purple-200 flex items-center justify-center mb-4 transition-colors">
                    <RefreshCw className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Automatic Assignment</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    System will automatically select the best available reviewer based on workload, expertise, and availability.
                  </p>
                </div>
              </div>

              <div 
                onClick={() => {
                  setReassignMode('manual');
                  loadEligibleReviewers();
                }}
                className="group p-6 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all cursor-pointer"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 rounded-full bg-purple-100 group-hover:bg-purple-200 flex items-center justify-center mb-4 transition-colors">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Manual Selection</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Browse and select from a list of eligible reviewers to manually assign the review.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : reassignMode === 'manual' ? (
          <div className="space-y-6">
            {proposalInfo && (
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Proposal Information
                </h4>
                <div className="space-y-1">
                  <p className="text-sm text-purple-800"><span className="font-medium">Title:</span> {proposalInfo.title}</p>
                  <p className="text-sm text-purple-800"><span className="font-medium">Faculty:</span> {proposalInfo.submitterFaculty}</p>
                </div>
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search reviewers by name, email, or title..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {reassignLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  <span className="ml-2 text-gray-600">Loading eligible reviewers...</span>
                </div>
              ) : eligibleReviewers.filter(reviewer =>
                reviewer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                reviewer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                reviewer.facultyTitle.toLowerCase().includes(searchTerm.toLowerCase())
              ).length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No eligible reviewers found</p>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  {eligibleReviewers
                    .filter(reviewer =>
                      reviewer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      reviewer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      reviewer.facultyTitle.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((reviewer) => (
                      <div
                        key={reviewer._id}
                        className={`p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors ${
                          selectedReviewer === reviewer._id ? 'bg-purple-50 border-l-4 border-l-purple-500' : ''
                        }`}
                        onClick={() => setSelectedReviewer(reviewer._id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                selectedReviewer === reviewer._id ? 'bg-purple-100' : 'bg-gray-100'
                              }`}>
                                <User className={`h-5 w-5 ${
                                  selectedReviewer === reviewer._id ? 'text-purple-600' : 'text-gray-600'
                                }`} />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{reviewer.name}</p>
                              <p className="text-sm text-gray-500">{reviewer.facultyTitle}</p>
                              <p className="text-xs text-gray-400">{reviewer.email}</p>
                            </div>
                          </div>
                          <div className="text-right text-sm space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">{reviewer.totalReviewsCount}</span>
                              <span className="text-xs text-gray-500">reviews</span>
                            </div>
                            <div className={`text-xs font-medium ${
                              reviewer.completionRate >= 80 ? 'text-green-600' : 
                              reviewer.completionRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {reviewer.completionRate}% completion
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ready for Automatic Assignment</h3>
            <p className="text-gray-600 mb-6">
              The system will automatically select the most suitable reviewer for this {reassignData?.isReconciliation ? 'reconciliation ' : ''}review.
            </p>
          </div>
        )}
      </div>

      <DialogFooter className="border-t pt-4">
        <Button
          variant="outline"
          onClick={() => setShowReassignModal(false)}
          disabled={reassignLoading}
        >
          Cancel
        </Button>
        {reassignMode && !reassignSuccess && (
          <Button
            onClick={handleReassignSubmit}
            disabled={reassignLoading || (reassignMode === 'manual' && !selectedReviewer)}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {reassignLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {reassignMode === 'auto' ? 'Auto Reassign' : 'Reassign to Selected'}
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  </Dialog>
)}

      <Toaster />
    </AdminLayout>
  );
}
