"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getAllReviewers, getReviewerById, checkOverdueReviews  } from '@/services/api';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  Users, 
  Search, 
  Filter, 
  ChevronRight, 
  User, 
  Mail, 
  Phone, 
  Building, 
  GraduationCap,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Loader2,
  Calendar,
  Award,
  BarChart3,
  Bell,
  Send,
} from 'lucide-react';

interface ReviewerStatistics {
  assigned: number;
  completed: number;
  completionRate: number;
}

interface Proposal {
  _id: string;
  projectTitle: string;
  submitterType: string;
  submitter: {
    name: string;
    email: string;
  };
  status: string;
  createdAt: string;
}

interface AssignedReviewItem {
  _id: string;
  comments: string;
  createdAt: string;
  dueDate: string;
  proposal: Proposal; // This links to the existing Proposal interface
  reviewType: string;
  reviewer: string;
  scores: {
    relevanceToNationalPriorities: number;
    originalityAndInnovation: number;
    clarityOfResearchProblem: number;
    methodology: number;
    literatureReview: number;
    // Add other score properties if they exist in your data
  };
  status: string;
  totalScore: number;
  updatedAt: string;
  __v: number;
}

interface Reviewer {
  _id: string;
  name: string;
  email: string;
  alternativeEmail?: string;
  phoneNumber: string;
  academicTitle?: string;
  faculty: string;
  department: string;
  isActive: boolean;
  invitationStatus: 'pending' | 'accepted' | 'added' | 'expired';
  assignedProposals: AssignedReviewItem[]; // Updated to use new interface
  completedReviews: Proposal[]; // Keep as Proposal[] if it's just a simplified version
  createdAt: string;
  lastLogin?: string;
  statistics: ReviewerStatistics;
}

interface CompletedReview {
  _id: string;
  proposal: {
    projectTitle: string;
    submitterType: string;
  };
  totalScore: number;
  completedAt: string;
}

interface ReviewerDetails {
  _id: string;
  name: string;
  email: string;
  alternativeEmail?: string;
  phoneNumber: string;
  academicTitle?: string;
  faculty: string;
  department: string;
  isActive: boolean;
  invitationStatus: 'pending' | 'accepted' | 'added' | 'expired';
  assignedProposals: AssignedReviewItem[]; // Updated to use new interface
  completedReviews: CompletedReview[];
  createdAt: string;
  lastLogin?: string;
  statistics: ReviewerStatistics;
}

export default function AdminReviewersPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [selectedReviewer, setSelectedReviewer] = useState<ReviewerDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDetails, setShowDetails] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    count: 0
  });
  const [isCheckingOverdue, setIsCheckingOverdue] = useState(false);
  const [overdueCheckResult, setOverdueCheckResult] = useState<{
    approachingDeadline: number;
    overdue: number;
  } | null>(null);
  const [showOverdueAlert, setShowOverdueAlert] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const loadReviewers = useCallback(async () => {
  try {
    setIsLoading(true);
    const params = {
      page: 1,
      limit: 20,
      ...(statusFilter !== 'all' && { status: statusFilter }),
      ...(searchTerm && { search: searchTerm })
    };
    
    const response = await getAllReviewers(params);
    setReviewers(response.data || []);
    setPagination({
      currentPage: response.currentPage || 1,
      totalPages: response.totalPages || 1,
      count: response.count || 0
    });
    setError(null);
  } catch (err) {
    console.error('Failed to load reviewers:', err);
    setError('Failed to load reviewers');
  } finally {
    setIsLoading(false);
  }
}, [statusFilter, searchTerm]);

  useEffect(() => {
    if (isAuthenticated) {
      loadReviewers();
    }
  }, [isAuthenticated, statusFilter, searchTerm, loadReviewers]);

  // Effect to log selectedReviewer when it changes and manage loading state
  useEffect(() => {
    if (selectedReviewer) {
      console.log('selectedReviewer state updated:', selectedReviewer);
      setIsLoadingDetails(false); // Set loading to false once selectedReviewer is updated
    }
  }, [selectedReviewer]);


  const loadReviewerDetails = async (id: string) => {
  try {
    setIsLoadingDetails(true);
    
    // Get statistics from existing list data
    const existingReviewer = reviewers.find(r => r._id === id);
    const response = await getReviewerById(id);

    // Merge statistics from list with detailed data
    const mergedData: ReviewerDetails = {
      ...response.data,
      assignedProposals: response.data.assignedProposals || [], // Ensure it's an array
      completedReviews: response.data.completedReviews || [],   // Ensure it's an array
      statistics: existingReviewer?.statistics || {
        assigned: (response.data.assignedProposals || []).length,
        completed: (response.data.completedReviews || []).length,
        completionRate: (response.data.assignedProposals || []).length > 0 
          ? Math.round(((response.data.completedReviews || []).length / (response.data.assignedProposals || []).length) * 100)
          : 0
      }
    };

    setSelectedReviewer(mergedData);
    console.log('Reviewer details loaded:', mergedData);
    setShowDetails(true);
  } catch (err) {
    console.error('Failed to load reviewer details:', err);
    setError('Failed to load reviewer details');
    setIsLoadingDetails(false); // Set loading to false on error
  }
};

const handleCheckOverdueReviews = async () => {
  try {
    setIsCheckingOverdue(true);
    const response = await checkOverdueReviews();
    setOverdueCheckResult(response.data);
    setShowOverdueAlert(true);
    
    // Auto-hide the alert after 5 seconds
    setTimeout(() => {
      setShowOverdueAlert(false);
    }, 5000);
  } catch (err) {
    console.error('Failed to check overdue reviews:', err);
    setError('Failed to check overdue reviews');
  } finally {
    setIsCheckingOverdue(false);
  }
};

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'added':
        return 'bg-[#6d035c]/10 text-primary';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'added':
        return <User className="h-4 w-4" />;
      case 'expired':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getCompletionRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    if (rate >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const filteredReviewers = reviewers.filter(reviewer => {
    // Safely access nested properties, providing empty strings if undefined
    const facultyTitle = reviewer.faculty || '';
    const departmentTitle = reviewer.department || '';

    const matchesSearch = (reviewer.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (reviewer.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         facultyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         departmentTitle.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || reviewer.invitationStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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

{/*Reviewer Management Header*/}
          <div className="flex justify-between items-center mb-6">
  <div>
    <h1 className="text-2xl font-semibold text-foreground">Reviewer Management</h1>
    <p className="text-muted-foreground mt-1">Manage and monitor reviewer activities</p>
  </div>
  <div className="flex items-center space-x-4">
    {/* Add this button before the existing Total Reviewers display */}
    <button
      onClick={handleCheckOverdueReviews}
      disabled={isCheckingOverdue}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
    >
      {isCheckingOverdue ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Bell className="h-4 w-4 mr-2" />
      )}
      {isCheckingOverdue ? 'Checking...' : 'Check Overdue Reviews'}
    </button>
    
    <div className="bg-white px-3 py-2 rounded-lg shadow-sm border">
      <div className="flex items-center space-x-2">
        <Users className="h-5 w-5 text-primary" />
        <span className="text-sm font-medium text-muted-foreground">
          {pagination.count} Total Reviewers
        </span>
      </div>
    </div>
  </div>
</div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
              {error}
            </div>
          )}

           {/* Overdue Reviews Alert */}
           {showOverdueAlert && overdueCheckResult && (
  <div className="mb-6 p-4 bg-[#6d035c]/10 border border-[#6d035c]/20 rounded-md">
    <div className="flex items-start">
      <div className="flex-shrink-0">
        <Send className="h-5 w-5 text-muted-foreground mt-0.5" />
      </div>
      <div className="ml-3 flex-1">
        <h3 className="text-sm font-medium text-primary">
          Review Deadline Check Completed
        </h3>
        <div className="mt-2 text-sm text-primary">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <span>
                <span className="font-semibold">{overdueCheckResult.approachingDeadline}</span> 
                {' '}reviews approaching deadline (reminders sent)
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span>
                <span className="font-semibold">{overdueCheckResult.overdue}</span> 
                {' '}overdue reviews (notifications sent)
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="ml-auto pl-3">
        <div className="-mx-1.5 -my-1.5">
          <button
            type="button"
            onClick={() => setShowOverdueAlert(false)}
            className="inline-flex bg-[#6d035c]/10 rounded-md p-1.5 text-primary hover:bg-[#6d035c]/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#f3e7d0] focus:ring-ring"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
)}

          {/* Search and Filter Bar */}
          <div className="bg-white shadow rounded-lg p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="flex-1 max-w-lg">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search reviewers by name, email, faculty, or department..."
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Filter className="h-5 w-5 text-muted-foreground" />
                  <select
                    className="border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="accepted">Accepted</option>
                    <option value="pending">Pending</option>
                    <option value="added">Added</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Reviewers List */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="divide-y divide-border">
                {filteredReviewers.length === 0 ? (
                  <div className="p-8 text-center">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-medium text-foreground">No reviewers found</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {searchTerm || statusFilter !== 'all' 
                        ? 'Try adjusting your search or filter criteria.' 
                        : 'There are no reviewers in the system yet.'}
                    </p>
                  </div>
                ) : (
                  filteredReviewers.map((reviewer) => (
                    <div
                      key={reviewer._id}
                      className="p-6 hover:bg-muted cursor-pointer transition-colors duration-150"
                      onClick={() => loadReviewerDetails(reviewer._id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                              <User className="h-6 w-6 text-primary" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-lg font-medium text-foreground truncate">
                                {reviewer.name}
                              </h3>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(reviewer.invitationStatus)}`}>
                                {getStatusIcon(reviewer.invitationStatus)}
                                <span className="ml-1 capitalize">{reviewer.invitationStatus}</span>
                              </span>
                              {reviewer.academicTitle && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#6d035c]/10 text-primary">
                                  <GraduationCap className="h-3 w-3 mr-1" />
                                  {reviewer.academicTitle}
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex items-center space-x-4 text-sm text-muted-foreground">
                              <div className="flex items-center">
                                <Mail className="h-4 w-4 mr-1" />
                                {reviewer.email}
                              </div>
                              <div className="flex items-center">
                                <Building className="h-4 w-4 mr-1" />
                                {reviewer.faculty} - {reviewer.department}
                              </div>
                            </div>
                            <div className="mt-2 flex items-center space-x-6 text-sm">
                              <div className="flex items-center text-primary">
                                <FileText className="h-4 w-4 mr-1" />
                                <span className="font-medium">{reviewer.statistics.assigned}</span>
                                <span className="ml-1">Assigned</span>
                              </div>
                              <div className="flex items-center text-green-600">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                <span className="font-medium">{reviewer.statistics.completed}</span>
                                <span className="ml-1">Completed</span>
                              </div>
                              <div className={`flex items-center ${getCompletionRateColor(reviewer.statistics.completionRate)}`}>
                                <BarChart3 className="h-4 w-4 mr-1" />
                                <span className="font-medium">{reviewer.statistics.completionRate}%</span>
                                <span className="ml-1">Rate</span>
                              </div>
                              <div className="flex items-center text-muted-foreground">
                                <Calendar className="h-4 w-4 mr-1" />
                                <span>Joined {new Date(reviewer.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviewer Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-muted-foreground bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b">
              <h2 className="text-2xl font-bold text-foreground">Reviewer Details</h2>
              <button
                className="p-2 hover:bg-muted rounded-full"
                onClick={() => setShowDetails(false)}
              >
                <X className="h-6 w-6 text-muted-foreground" />
              </button>
            </div>

            {isLoadingDetails ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : selectedReviewer ? (
              <div className="mt-6">
                {/* Reviewer Info */}
                <div className="bg-muted rounded-lg p-6 mb-6">
                  <div className="flex items-start space-x-6">
                    <div className="flex-shrink-0">
                      <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center">
                        <User className="h-10 w-10 text-primary" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-foreground">
                          {selectedReviewer.name}
                        </h3>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedReviewer.invitationStatus)}`}>
                          {getStatusIcon(selectedReviewer.invitationStatus)}
                          <span className="ml-1 capitalize">{selectedReviewer.invitationStatus}</span>
                        </span>
                      </div>
                      {selectedReviewer.academicTitle && (
                        <div className="mb-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#6d035c]/10 text-primary">
                            <GraduationCap className="h-4 w-4 mr-1" />
                            {selectedReviewer.academicTitle}
                          </span>
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="flex items-center text-muted-foreground mb-2">
                            <Mail className="h-4 w-4 mr-2" />
                            <span className="font-medium">Primary Email:</span>
                            <span className="ml-2">{selectedReviewer.email}</span>
                          </div>
                          {selectedReviewer.alternativeEmail && (
                            <div className="flex items-center text-muted-foreground mb-2">
                              <Mail className="h-4 w-4 mr-2" />
                              <span className="font-medium">Alternative Email:</span>
                              <span className="ml-2">{selectedReviewer.alternativeEmail}</span>
                            </div>
                          )}
                          <div className="flex items-center text-muted-foreground">
                            <Phone className="h-4 w-4 mr-2" />
                            <span className="font-medium">Phone:</span>
                            <span className="ml-2">{selectedReviewer.phoneNumber}</span>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center text-muted-foreground mb-2">
                            <Building className="h-4 w-4 mr-2" />
                            <span className="font-medium">Faculty:</span>
                            <span className="ml-2">{selectedReviewer.faculty}</span>
                          </div>
                          <div className="flex items-center text-muted-foreground mb-2">
                            <Building className="h-4 w-4 mr-2" />
                            <span className="font-medium">Department:</span>
                            <span className="ml-2">{selectedReviewer.department}</span>
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span className="font-medium">Joined:</span>
                            <span className="ml-2">{new Date(selectedReviewer.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-white border rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-[#6d035c]/10 rounded-md p-3">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-muted-foreground">Assigned Reviews</p>
                        <p className="text-2xl font-semibold text-foreground">
                          {selectedReviewer.statistics.assigned}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white border rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                        <CheckCircle className="h-6 w-6 text-green-800" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-muted-foreground">Completed Reviews</p>
                        <p className="text-2xl font-semibold text-foreground">
                          {selectedReviewer.statistics.completed}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white border rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-secondary rounded-md p-3">
                        <Award className="h-6 w-6 text-primary" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                        <p className={`text-2xl font-semibold ${getCompletionRateColor(selectedReviewer.statistics.completionRate)}`}>
                          {selectedReviewer.statistics.completionRate}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assigned Proposals */}
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-foreground mb-4">Assigned Proposals</h4>
                  {selectedReviewer.assignedProposals.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No proposals assigned yet.</p>
                  ) : (
                    <div className="bg-white border rounded-lg overflow-hidden">
                      <div className="divide-y divide-border">
                        {selectedReviewer.assignedProposals.map((prop) => (
                          <div key={prop._id} className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-medium text-foreground">{prop.proposal.projectTitle}</h5>
                                <p className="text-sm text-muted-foreground mt-1">
                                  By {prop.proposal.submitter.name} ({prop.proposal.submitter.email})
                                </p>
                                <div className="mt-2 flex items-center space-x-4 text-sm text-muted-foreground">
                                  <span className="capitalize">{prop.proposal.submitterType.replace('_', ' ')}</span>
                                  <span>•</span>
                                  <span>{new Date(prop.proposal.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                prop.proposal.status === 'approved' ? 'bg-green-100 text-green-800' :
                                prop.proposal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                prop.proposal.status === 'under_review' ? 'bg-[#6d035c]/10 text-primary' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {prop.status.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Completed Reviews */}
                <div>
                  <h4 className="text-lg font-medium text-foreground mb-4">Completed Reviews</h4>
                  {selectedReviewer.completedReviews.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No reviews completed yet.</p>
                  ) : (
                    <div className="bg-white border rounded-lg overflow-hidden">
                      <div className="divide-y divide-border">
                        {selectedReviewer.completedReviews.map((review) => (
                          <div key={review._id} className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-medium text-foreground">{review.proposal.projectTitle}</h5>
                                <div className="mt-2 flex items-center space-x-4 text-sm text-muted-foreground">
                                  <span className="capitalize">{review.proposal.submitterType.replace('_', ' ')}</span>
                                  <span>•</span>
                                  <span>Completed {new Date(review.completedAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-semibold text-primary">
                                  {review.totalScore}/100
                                </div>
                                <div className="text-sm text-muted-foreground">Total Score</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
