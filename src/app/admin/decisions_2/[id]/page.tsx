"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getFullProposalById } from '@/services/api';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  Loader2, 
  ArrowLeft, 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  Building, 
  BookOpen, 
  FileText, 
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Banknote
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Award {
  fundingAmount: number;
  approvedAt: string;
}

interface Submitter {
  _id: string;
  name: string;
  email: string;
  alternativeEmail?: string;
  phoneNumber?: string;
  userType: 'staff' | 'master_student';
  academicTitle?: string;
  department?: string;
  faculty?: string;
}

interface Proposal {
  _id: string;
  projectTitle: string;
  estimatedBudget: number;
  submitterType: 'staff' | 'master_student';
}

interface FullProposal {
  _id: string;
  proposal: Proposal;
  submitter: Submitter;
  docFile: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  submittedAt: string;
  deadline: string;
  reviewedAt?: string;
  reviewComments?: string;
  createdAt: string;
  updatedAt: string;
  award: Award;
  finalSubmission?: string;
}

interface ApiResponse {
  success: boolean;
  data: FullProposal;
}

export default function FullProposalDetailPage() {
  const { id } = useParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [fullProposal, setFullProposal] = useState<FullProposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchFullProposal = async () => {
      if (!isAuthenticated || !id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response: ApiResponse = await getFullProposalById(id as string);
        setFullProposal(response.data);
      } catch (err) {
        console.error('Failed to fetch full proposal:', err);
        setError('Failed to load full proposal details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFullProposal();
  }, [isAuthenticated, id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      submitted: 'Submitted',
      under_review: 'Under Review',
      approved: 'Approved',
      rejected: 'Rejected'
    };
    
    return statusMap[status] || status;
  };

  const isDeadlinePassed = (deadline: string) => {
    return new Date() > new Date(deadline);
  };

  const linkify = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 hover:underline"
          >
            {part}
          </a>
        );
      }
      return part;
    });
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
          {/* Back link */}
          <div className="mb-6">
            <Button
              className="inline-flex items-center text-sm font-medium text-purple-600 hover:bg-gray-300 bg-transparent"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Full Proposals
            </Button>
          </div>

          {/* Title */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">
              {isLoading ? 'Loading full proposal...' : fullProposal?.proposal.projectTitle || 'Full Proposal Details'}
            </h1>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
              {error}
            </div>
          )}
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-purple-800" />
            </div>
          ) : fullProposal ? (
            <div className="space-y-6">
              {/* Status and Funding Overview */}
              <div className="bg-white shadow overflow-hidden rounded-lg">
                <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Full Proposal Status
                      </h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        Submitted on {formatDate(fullProposal.submittedAt)}
                      </p>
                    </div>
                    <div className="mt-3 md:mt-0 flex items-center space-x-3">
                      <span className={`px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full border ${getStatusBadgeClass(fullProposal.status)}`}>
                        {getStatusIcon(fullProposal.status)}
                        <span className="ml-1">{getStatusLabel(fullProposal.status)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Funding Information */}
                <div className="px-4 py-5 sm:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-center">
                        <Banknote className="h-6 w-6 text-green-600 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-green-800">Approved Funding</p>
                          <p className="text-xl font-bold text-green-900">{formatCurrency(fullProposal.award.fundingAmount)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center">
                        <FileText className="h-6 w-6 text-blue-600 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-blue-800">Original Budget</p>
                          <p className="text-xl font-bold text-blue-900">{formatCurrency(fullProposal.proposal.estimatedBudget)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <div className="flex items-center">
                        <Calendar className="h-6 w-6 text-purple-600 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-purple-800">Award Approved</p>
                          <p className="text-sm font-bold text-purple-900">{formatDate(fullProposal.award.approvedAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deadline Warning */}
              {isDeadlinePassed(fullProposal.deadline) && fullProposal.status === 'submitted' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                    <div>
                      <h4 className="text-sm font-medium text-red-800">Deadline Passed</h4>
                      <p className="text-sm text-red-700">
                        The submission deadline ({formatDate(fullProposal.deadline)}) has passed.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Researcher Information */}
              <div className="bg-white shadow overflow-hidden rounded-lg">
                <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Researcher Information</h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <User className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{fullProposal.submitter.name}</p>
                          {fullProposal.submitter.academicTitle && (
                            <p className="text-xs text-gray-500">{fullProposal.submitter.academicTitle}</p>
                          )}
                          <p className="text-xs text-gray-500 capitalize">
                            {fullProposal.submitter.userType.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <Mail className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-900">{fullProposal.submitter.email}</p>
                          {fullProposal.submitter.alternativeEmail && (
                            <p className="text-xs text-gray-500">{fullProposal.submitter.alternativeEmail}</p>
                          )}
                        </div>
                      </div>
                      
                      {fullProposal.submitter.phoneNumber && (
                        <div className="flex items-center">
                          <Phone className="h-5 w-5 text-gray-400 mr-3" />
                          <p className="text-sm text-gray-900">{fullProposal.submitter.phoneNumber}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      {fullProposal.submitter.faculty && (
                        <div className="flex items-center">
                          <Building className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{fullProposal.submitter.faculty}</p>
                          </div>
                        </div>
                      )}

                      {fullProposal.submitter.department && (
                        <div className="flex items-center">
                          <BookOpen className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{fullProposal.submitter.department}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Information */}
              <div className="bg-white shadow overflow-hidden rounded-lg">
                <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Project Information</h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Project Title</label>
                      <p className="mt-1 text-sm text-gray-900">{fullProposal.proposal.projectTitle}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Submitter Type</label>
                        <p className="mt-1 text-sm text-gray-900 capitalize">
                          {fullProposal.proposal.submitterType.replace('_', ' ')}
                        </p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-500">Original Estimated Budget</label>
                        <p className="mt-1 text-sm text-gray-900">{formatCurrency(fullProposal.proposal.estimatedBudget)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document and Timeline */}
              <div className="bg-white shadow overflow-hidden rounded-lg">
                <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Full Proposal Document</h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="space-y-6">
                    {/* Document Section */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FileText className="h-6 w-6 text-gray-500 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Full Proposal Document</p>
                            <p className="text-xs text-gray-500">Complete research proposal with detailed methodology</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                        <a
                          href={fullProposal.docFile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                        >
                          View
                        </a>
                        <Button
                          onClick={() => window.open(fullProposal.docFile, '_blank')}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        </div>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-4">Submission Timeline</h4>
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full"></div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900">Award Approved</p>
                            <p className="text-xs text-gray-500">{formatDate(fullProposal.award.approvedAt)}</p>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full"></div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900">Full Proposal Submitted</p>
                            <p className="text-xs text-gray-500">{formatDate(fullProposal.submittedAt)}</p>
                          </div>
                        </div>

                        {fullProposal.reviewedAt && (
                          <div className="flex items-center">
                            <div className={`flex-shrink-0 w-2 h-2 rounded-full ${
                              fullProposal.status === 'approved' ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                            <div className="ml-4">
                              <p className="text-sm font-medium text-gray-900">
                                Full Proposal {fullProposal.status === 'approved' ? 'Approved' : 'Decision Made'}
                              </p>
                              <p className="text-xs text-gray-500">{formatDate(fullProposal.reviewedAt)}</p>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 w-2 h-2 rounded-full ${
                            isDeadlinePassed(fullProposal.deadline) ? 'bg-red-500' : 'bg-yellow-500'
                          }`}></div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900">Submission Deadline</p>
                            <p className="text-xs text-gray-500">{formatDate(fullProposal.deadline)}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Review Comments */}
                    {fullProposal.reviewComments && (
                      <div>
                        <h4 className="text-sm font-medium text-black mb-2">Review Comments</h4>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">{linkify(fullProposal.reviewComments)}</p>
                        </div>
                      </div>
                    )}

                    {/* Final Submission Document */}
                    {fullProposal.finalSubmission && (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <FileText className="h-6 w-6 text-green-600 mr-3" />
                            <div>
                              <p className="text-sm font-medium text-green-900">Final Submission Document</p>
                              <p className="text-xs text-gray-500">The final submitted proposal document.</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <a
                              href={fullProposal.finalSubmission}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                            >
                              View
                            </a>
                            <Button
                              onClick={() => window.open(fullProposal.finalSubmission, '_blank')}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden rounded-lg p-6 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Full Proposal not found</h3>
              <p className="mt-1 text-gray-500">The full proposal you&apos;re looking for doesn&apos;t exist or has been removed.</p>
              <div className="mt-6">
                <Button
                  onClick={() => router.back()}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Go Back
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
