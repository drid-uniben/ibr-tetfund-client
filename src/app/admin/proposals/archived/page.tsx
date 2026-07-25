"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getProposals, getFacultiesWithProposals, toggleProposalArchiveStatus } from '@/services/api';
import AdminLayout from '@/components/admin/AdminLayout';
import { Loader2, FileText, Filter, ArrowUpDown, Eye, RefreshCw, MoreVertical, FolderOpen } from 'lucide-react';
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
  currentPage: number
}

export default function AdminArchivedProposalsPage() {
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
    isArchived: true, // Default to archived proposals for this page
  });
  const router = useRouter();

  // State for comment modal
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [currentProposalId, setCurrentProposalId] = useState<string | null>(null);
  const [isArchivingAction, setIsArchivingAction] = useState(false); // true for archive, false for unarchive
  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch faculties with proposals
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    let mounted = true; // Flag to track if component is mounted

    const fetchFaculties = async () => {
      if (!isAuthenticated) return;
      
      try {
        const facultyData = await getFacultiesWithProposals({ signal });
        if (mounted) { // Only update state if component is still mounted
          setFaculties(facultyData);
        }
      } catch (err: unknown) {
        if (mounted) { // Only log error if component is still mounted
          if ((err as Error).name === 'CanceledError') {
            // console.log('Faculties fetch aborted (expected)');
          } else {
            console.error('Failed to fetch faculties:', err);
          }
        }
      }
    };

    fetchFaculties();

    return () => {
      mounted = false; // Set mounted to false on cleanup
      controller.abort();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    let mounted = true; // Flag to track if component is mounted

    const fetchProposals = async () => {
      if (!isAuthenticated) return;
      
      if (mounted) { // Only set loading state if component is still mounted
        setIsLoading(true);
        setError(null);
      }
      
      try {
        const response = await getProposals({
          page: pagination.currentPage,
          limit: 10,
          ...filters,
          isArchived: filters.isArchived, // Ensure this filter is passed
        }, { signal });
        if (mounted) { // Only update state if component is still mounted
          setProposals(response.data);
          setPagination({
            count: response.count,
            totalPages: response.totalPages,
            currentPage: response.currentPage
          });
        }
      } catch (err: unknown) {
        if (mounted) { // Only log error and set error state if component is still mounted
          if ((err as Error).name === 'CanceledError') {
            // console.log('Proposals fetch aborted (expected)');
          } else {
            console.error('Failed to fetch proposals:', err);
            setError('Failed to load proposals. Please try again.');
          }
        }
      } finally {
        if (mounted) { // Ensure isLoading is set to false only if mounted
          setIsLoading(false);
        }
      }
    };

    fetchProposals();

    return () => {
      mounted = false; // Set mounted to false on cleanup
      controller.abort();
    };
  }, [isAuthenticated, pagination.currentPage, filters, refreshTrigger]); // Add refreshTrigger to dependencies

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
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
        return 'bg-[#6d035c]/10 text-primary';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'revision_requested':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-muted text-foreground';
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
      <div className="min-h-screen flex justify-center items-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="py-6">
        <div className="mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-foreground">Archived Proposals</h1>
            <div className="flex space-x-4">
              <Link href="/admin/proposals" passHref>
                <Button
                  variant="outline"
                  className="flex items-center px-3 py-2 border border-border shadow-sm text-sm font-medium rounded-md text-muted-foreground bg-white hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Unarchived Proposals
                </Button>
              </Link>
              <button 
                onClick={refreshData}
                className="flex items-center px-3 py-2 border border-border shadow-sm text-sm font-medium rounded-md text-muted-foreground bg-white hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
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
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex items-center">
                <Filter className="text-muted-foreground mr-2 h-5 w-5" />
                <span className="text-sm font-medium text-muted-foreground">Filters:</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-grow">
                {/* Status Filter */}
                <div>
                  <label htmlFor="status" className="block text-xs font-medium text-muted-foreground mb-1">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="w-full rounded-md border border-border py-2 px-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
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
                  <label htmlFor="submitterType" className="block text-xs font-medium text-muted-foreground mb-1">
                    Submitter Type
                  </label>
                  <select
                    id="submitterType"
                    name="submitterType"
                    value={filters.submitterType}
                    onChange={handleFilterChange}
                    className="w-full rounded-md border border-border py-2 px-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">All Types</option>
                    <option value="staff">Staff</option>
                    <option value="master_student">Master&apos;s Student</option>
                  </select>
                </div>
                
                {/* Faculty Filter - NEW */}
                <div>
                  <label htmlFor="faculty" className="block text-xs font-medium text-muted-foreground mb-1">
                    Faculty
                  </label>
                  <select
                    id="faculty"
                    name="faculty"
                    value={filters.faculty}
                    onChange={handleFilterChange}
                    className="w-full rounded-md border border-border py-2 px-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">All Faculties</option>
                    {faculties.map((faculty) => (
                      <option key={faculty.title} value={faculty.title}>
                        {faculty.title}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Sort Order */}
                <div>
                  <label htmlFor="sort" className="block text-xs font-medium text-muted-foreground mb-1">
                    Sort By
                  </label>
                  <select
                    id="sort"
                    name="sort"
                    value={filters.sort}
                    onChange={handleFilterChange}
                    className="w-full rounded-md border border-border py-2 px-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="createdAt">Submission Date</option>
                    <option value="projectTitle">Project Title</option>
                    <option value="status">Status</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          {/* Proposals Table */}
          <div className="bg-white shadow overflow-hidden rounded-lg">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : proposals.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium text-foreground">No archived proposals found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  No archived proposals match your current filters.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer"
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
                        className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer"
                      >
                        Submitter
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer"
                      >
                        Type
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer"
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
                        className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer"
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
                        className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-border">
                    {proposals.map((proposal) => (
                      <tr key={proposal._id} className="hover:bg-muted">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                          {proposal.projectTitle}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          <div className="flex flex-col">
                            <span className="font-medium">{proposal.submitter.name}</span>
                            <span className="text-xs text-muted-foreground">{proposal.submitter.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {proposal.submitterType === 'staff' ? 'Staff' : "Master's Student"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(proposal.status)}`}>
                            {getStatusLabel(proposal.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
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
                              <DropdownMenuItem onSelect={() => handleArchiveClick(proposal._id, false)} className="text-green-600 focus:text-green-600">
                                <FolderOpen className="h-4 w-4 mr-2" /> Unarchive
                              </DropdownMenuItem>
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
              <nav className="bg-white px-4 py-3 flex items-center justify-between border-t border-border sm:px-6">
                <div className="hidden sm:block">
                  <p className="text-sm text-muted-foreground">
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
                    className="relative inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md text-muted-foreground bg-white hover:bg-muted disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md text-muted-foreground bg-white hover:bg-muted disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
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

      <Toaster />
    </AdminLayout>
  );
}