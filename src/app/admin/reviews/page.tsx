"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Eye,  
  Search, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  RefreshCw,
  Loader2,
  Users,
  FileText
} from 'lucide-react';
import { 
  getAllProposalReviews, 
  getProposalReviewStatistics, 
  getDiscrepancyProposals,
  getFacultiesWithProposals 
} from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface ProposalReview {
  _id: string;
  projectTitle: string;
  submitterType: string;
  status: string;
  reviewStatus: string;
  currentStatus: string;
  totalReviews: number;
  completedReviews: number;
  hasReconciliation: boolean;
  hasDiscrepancy: boolean;
  createdAt: string;
  updatedAt: string;
  submitter: {
    name: string;
    email: string;
    academicTitle?: string;
  };
  faculty: {
    title: string;
    code: string;
  };
  department: {
    title: string;
    code: string;
  };
}

interface ReviewStatistics {
  totalWithReviews: number;
  underReview: number;
  reviewed: number;
  inReconciliation: number;
  withDiscrepancy: number;
  completionRate: number;
}

interface Params {
  page: number;
  limit: number;
  status?: string;
  faculty?: string;
  discrepancy?: string;
}

interface Faculty {
  _id: string;
  title: string;
}

export default function ProposalReviewsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [proposals, setProposals] = useState<ProposalReview[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [statistics, setStatistics] = useState<ReviewStatistics | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [facultyFilter, setFacultyFilter] = useState<string>('all');
  const [discrepancyFilter, setDiscrepancyFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDiscrepancyOnly, setShowDiscrepancyOnly] = useState(false);

  const limit = 10;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

    // Load statistics and faculties
    const [statsResponse, facultiesResponse] = await Promise.all([
      getProposalReviewStatistics(),
      getFacultiesWithProposals()
    ]);
    
    setStatistics(statsResponse.data);
    setFaculties(facultiesResponse);

      // Build params for proposals
      const params: Params = {
        page: currentPage,
        limit,
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (facultyFilter !== 'all') {
        params.faculty = facultyFilter;
      }
      if (discrepancyFilter !== 'all') {
        params.discrepancy = discrepancyFilter;
      }

      // Load proposals
      let response;
      if (showDiscrepancyOnly) {
        response = await getDiscrepancyProposals(params);
      } else {
        response = await getAllProposalReviews(params);
      }

      setProposals(response.data);
      console.log('Loaded proposals:', response.data);
      setTotalPages(response.pagination.pages);
      setTotalCount(response.pagination.total);

    } catch (err) {
      console.error('Failed to load proposal reviews:', err);
      setError('Failed to load proposal reviews');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, discrepancyFilter, showDiscrepancyOnly, statusFilter, facultyFilter]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [
    isAuthenticated,
    currentPage, 
    statusFilter, 
    facultyFilter, 
    discrepancyFilter, 
    showDiscrepancyOnly,
    loadData,
  ]);

  const handleViewDetails = (proposalId: string) => {
    router.push(`/admin/reviews/${proposalId}`);
  };

  const getStatusBadge = (status: string, hasDiscrepancy: boolean) => {
    console.log(`getStatusBadge called with: status=${status}, hasDiscrepancy=${hasDiscrepancy}`);
    const baseClasses = "inline-flex items-center gap-1 text-xs font-medium";
    
    if (hasDiscrepancy) {
      return (
        <Badge className={`${baseClasses} bg-orange-100 text-orange-800 border-orange-200`}>
          <AlertTriangle size={12} />
          Discrepancy
        </Badge>
      );
    }

    switch (status) {
      case 'under_review':
        return (
          <Badge className={`${baseClasses} bg-[#6d035c]/10 text-[#4a0340] border-[#6d035c]/20`}>
            <Clock size={12} />
            Under Review
          </Badge>
        );
      case 'reviewed':
        return (
          <Badge className={`${baseClasses} bg-green-100 text-green-800 border-green-200`}>
            <CheckCircle size={12} />
            Reviewed
          </Badge>
        );
      case 'reconciliation':
        return (
          <Badge className={`${baseClasses} bg-secondary text-secondary-foreground border-[#e9c96b]`}>
            <RefreshCw size={12} />
            Reconciliation
          </Badge>
        );
      default:
        return (
          <Badge className={`${baseClasses} bg-muted text-muted-foreground border-border`}>
            {status}
          </Badge>
        );
    }
  };

  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch = !searchQuery || 
      proposal.projectTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proposal.submitter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proposal.faculty.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
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
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {showDiscrepancyOnly ? 'Discrepancy Proposals' : 'Proposal Reviews'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {showDiscrepancyOnly 
                ? 'Proposals flagged for discrepancy requiring reconciliation'
                : 'Monitor and manage proposal review progress'
              }
            </p>
          </div>
          <Button
            onClick={() => setShowDiscrepancyOnly(!showDiscrepancyOnly)}
            variant={showDiscrepancyOnly ? "default" : "outline"}
            className={showDiscrepancyOnly 
              ? "bg-orange-600 hover:bg-orange-700" 
              : "border-orange-200 text-orange-700 hover:bg-orange-50"
            }
          >
            <AlertTriangle size={16} className="mr-2" />
            {showDiscrepancyOnly ? 'Show All Reviews' : 'Show Discrepancies Only'}
          </Button>
        </div>

        {/* Statistics Cards */}
        {statistics && !showDiscrepancyOnly && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Reviews</p>
                    <p className="text-2xl font-bold text-foreground">{statistics.totalWithReviews}</p>
                  </div>
                  <FileText className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Under Review</p>
                    <p className="text-2xl font-bold text-primary">{statistics.underReview}</p>
                  </div>
                  <Clock className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{statistics.reviewed}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Reconciliation</p>
                    <p className="text-2xl font-bold text-primary">{statistics.inReconciliation}</p>
                  </div>
                  <RefreshCw className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Discrepancies</p>
                    <p className="text-2xl font-bold text-orange-600">{statistics.withDiscrepancy}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  type="text"
                  placeholder="Search proposals, submitters, or faculty..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {!showDiscrepancyOnly && (
              <>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="reconciliation">Reconciliation</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={facultyFilter} onValueChange={setFacultyFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Faculty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Faculties</SelectItem>
    {faculties.map((faculty) => (
      <SelectItem key={faculty._id} value={faculty._id}>
        {faculty.title}
      </SelectItem>
    ))}
                  </SelectContent>
                </Select>

                <Select value={discrepancyFilter} onValueChange={setDiscrepancyFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Discrepancy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="true">Has Discrepancy</SelectItem>
                    <SelectItem value="false">No Discrepancy</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}

            <Button 
              onClick={loadData} 
              variant="outline" 
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading proposals...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p>{error}</p>
          </div>
        )}

        {/* Proposals Table */}
        {!isLoading && !error && (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Proposal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Submitter
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Faculty/Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Review Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Updated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-border">
                  {filteredProposals.map((proposal) => (
                    <tr key={proposal._id} className="hover:bg-muted">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-foreground max-w-xs truncate">
                            {proposal.projectTitle || 'Untitled Proposal'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {proposal.submitterType === 'staff' ? 'Staff' : 'Master Student'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {proposal.submitter.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {proposal.submitter.academicTitle}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {proposal.faculty?.title || 'N/A'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {proposal.department?.title || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Users size={14} className="text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {proposal.completedReviews}/{proposal.totalReviews} completed
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ 
                                  width: `${proposal.totalReviews > 0 ? (proposal.completedReviews / proposal.totalReviews) * 100 : 0}%` 
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(proposal.currentStatus, proposal.hasDiscrepancy)}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(proposal.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          onClick={() => handleViewDetails(proposal._id)}
                          size="sm"
                          variant="outline"
                          className="border-[#e9c96b] text-primary hover:bg-secondary"
                        >
                          <Eye size={14} className="mr-1" />
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredProposals.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium text-foreground">No proposals found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {showDiscrepancyOnly 
                    ? 'No proposals with discrepancies found.'
                    : 'No proposals match your current filters.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalCount)} of {totalCount} results
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
