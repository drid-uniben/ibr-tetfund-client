"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getProposalById } from '@/services/api';
import AdminLayout from '@/components/admin/AdminLayout';
import { Loader2, ArrowLeft, Calendar, User, Phone, Mail, Building, BookOpen, Banknote, FileText, Clock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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

interface CoInvestigator {
  name: string;
  department?: string;
  faculty?: string;
}

interface Proposal {
  _id: string;
  submitterType: 'staff' | 'master_student';
  projectTitle?: string;
  submitter: Submitter;
  problemStatement?: string;
  objectives?: string;
  methodology?: string;
  expectedOutcomes?: string;
  workPlan?: string;
  estimatedBudget?: number;
  coInvestigators?: CoInvestigator[];
  cvFile?: string;
  docFile?: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'revision_requested';
  createdAt: string;
  updatedAt: string;
}

export default function ProposalDetailPage() {
  const { id } = useParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchProposal = async () => {
      if (!isAuthenticated || !id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await getProposalById(id as string);
        setProposal(response.data);
      } catch (err) {
        console.error('Failed to fetch proposal:', err);
        setError('Failed to load proposal details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProposal();
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
          {/* Back link */}
          <div className="mb-6">
            <Button
              className="inline-flex items-center text-sm font-medium text-primary hover:bg-muted bg-transparent"
              onClick={(e) => {
                console.log(e);
                router.back()
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Proposals
              </Button>
          </div>

          {/* Title */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h1 className="text-2xl font-semibold text-foreground">
              {isLoading ? 'Loading proposal...' : proposal?.projectTitle || 'Proposal Details'}
            </h1>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
              {error}
            </div>
          )}
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : proposal ? (
            <div className="bg-white shadow overflow-hidden rounded-lg">
              {/* Header Section */}
              <div className="px-4 py-5 sm:px-6 bg-muted border-b border-border">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-foreground">
                      {proposal.submitterType === 'staff' 
                        ? 'Staff Research Proposal' 
                        : 'Master Student Proposal'}
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                      Submitted on {formatDate(proposal.createdAt)}
                    </p>
                  </div>
                  <div className="mt-3 md:mt-0 flex items-center">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(proposal.status)}`}>
                      {getStatusLabel(proposal.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content Section */}
              <div className="px-4 py-5 sm:p-6">
                {/* Submitter Information */}
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-foreground mb-4">Submitter Information</h4>
                  <div className="bg-muted rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start">
                        <User className="h-5 w-5 text-muted-foreground mr-2 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">{proposal.submitter.name}</p>
                          {proposal.submitter.academicTitle && (
                            <p className="text-xs text-muted-foreground">{proposal.submitter.academicTitle}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <Mail className="h-5 w-5 text-muted-foreground mr-2 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">{proposal.submitter.email}</p>
                          {proposal.submitter.alternativeEmail && (
                            <p className="text-xs text-muted-foreground">{proposal.submitter.alternativeEmail}</p>
                          )}
                        </div>
                      </div>
                      
                      {proposal.submitter.phoneNumber && (
                        <div className="flex items-center">
                          <Phone className="h-5 w-5 text-muted-foreground mr-2" />
                          <p className="text-sm">{proposal.submitter.phoneNumber}</p>
                        </div>
                      )}
                      
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 text-muted-foreground mr-2" />
                        <p className="text-sm">{
                          proposal.submitter.userType === 'staff' ? 'Staff Member' : 'Master\'s Student'
                        }</p>
                      </div>
                      
                      {proposal.submitter.faculty && (
                        <div className="flex items-center">
                          <Building className="h-5 w-5 text-muted-foreground mr-2" />
                          <p className="text-sm">{proposal.submitter.faculty}</p>
                        </div>
                      )}

                      {proposal.submitter.department && (
                        <div className="flex items-center">
                          <BookOpen className="h-5 w-5 text-muted-foreground mr-2" />
                          <p className="text-sm">{proposal.submitter.department}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Staff Proposal Content */}
                {proposal.submitterType === 'staff' && (
                  <>
                    {/* Project Details */}
                    <div className="mb-8">
                      <h4 className="text-lg font-medium text-foreground mb-4">Project Details</h4>
                      
                      <div className="mb-6">
                        <h5 className="text-sm font-medium text-muted-foreground mb-2">Project Title</h5>
                        <p className="text-sm bg-muted p-3 rounded-md">{proposal.projectTitle}</p>
                      </div>
                      
                      <div className="mb-6">
                        <h5 className="text-sm font-medium text-muted-foreground mb-2">Problem Statement</h5>
                        <div className="text-sm bg-muted p-3 rounded-md whitespace-pre-line">
                          {proposal.problemStatement}
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <h5 className="text-sm font-medium text-muted-foreground mb-2">Research Objectives</h5>
                        <div className="text-sm bg-muted p-3 rounded-md whitespace-pre-line">
                          {proposal.objectives}
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <h5 className="text-sm font-medium text-muted-foreground mb-2">Methodology</h5>
                        <div className="text-sm bg-muted p-3 rounded-md whitespace-pre-line">
                          {proposal.methodology}
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <h5 className="text-sm font-medium text-muted-foreground mb-2">Expected Outcomes</h5>
                        <div className="text-sm bg-muted p-3 rounded-md whitespace-pre-line">
                          {proposal.expectedOutcomes}
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <h5 className="text-sm font-medium text-muted-foreground mb-2">Work Plan</h5>
                        <div className="text-sm bg-muted p-3 rounded-md whitespace-pre-line">
                          {proposal.workPlan}
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <h5 className="text-sm font-medium text-muted-foreground mb-2">Estimated Budget</h5>
                        <div className="flex items-center text-sm bg-muted p-3 rounded-md">
                          <Banknote className="h-4 w-4 text-muted-foreground mr-1" />
                          {proposal.estimatedBudget?.toLocaleString()} NGN
                        </div>
                      </div>
                    </div>
                    
                    {/* Co-Investigators */}
                    {proposal.coInvestigators && proposal.coInvestigators.length > 0 && (
                      <div className="mb-8">
                        <h4 className="text-lg font-medium text-foreground mb-4">Co-Investigators</h4>
                        <div className="bg-muted rounded-md overflow-hidden">
                          <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                  Name
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                  Department
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                  Faculty
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-border">
                              {proposal.coInvestigators.map((investigator, index) => (
                                <tr key={index}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                    {investigator.name}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                    {investigator.department || '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                    {investigator.faculty || '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    
                    {/* Attached Files */}
                    {proposal.cvFile && (
                      <div className="mb-8">
                        <h4 className="text-lg font-medium text-foreground mb-4">Attached Documents</h4>
                        <div className="bg-muted p-4 rounded-md">
                          <div className="flex items-center">
                            <FileText className="h-5 w-5 text-muted-foreground mr-2" />
                            <a 
                              href={proposal.cvFile}
                              target="_blank"
                              rel="noopener noreferrer" 
                              className="text-sm font-medium text-primary hover:text-primary"
                            >
                              View CV Document
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                {/* Master Student Proposal Content */}
                {proposal.submitterType === 'master_student' && (
                  <>
                    {/* Attached Files */}
                    {proposal.docFile && (
                      <div className="mb-8">
                        <h4 className="text-lg font-medium text-foreground mb-4">Attached Documents</h4>
                        <div className="bg-muted p-4 rounded-md flex flex-col gap-3">
                          <p className="text-sm text-muted-foreground">Master&apos;s student proposals are submitted as a comprehensive document.</p>
                          <div className="flex items-center">
                            <FileText className="h-5 w-5 text-muted-foreground mr-2" />
                            <a 
                              href={proposal.docFile}
                              target="_blank"
                              rel="noopener noreferrer" 
                              className="text-sm font-medium text-primary hover:text-primary"
                            >
                              View Proposal Document
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                {/* Timeline Information */}
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-foreground mb-4">Submission Timeline</h4>
                  <div className="bg-muted p-4 rounded-md">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-muted-foreground mr-2" />
                        <div>
                          <p className="text-xs text-muted-foreground">Submitted on</p>
                          <p className="text-sm font-medium">{formatDate(proposal.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 text-muted-foreground mr-2" />
                        <div>
                          <p className="text-xs text-muted-foreground">Last Updated</p>
                          <p className="text-sm font-medium">{formatDate(proposal.updatedAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden rounded-lg p-6 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground">Proposal not found</h3>
              <p className="mt-1 text-muted-foreground">The proposal you&apos;re looking for doesn&apos;t exist or has been removed.</p>
              <div className="mt-6">
                <Link
                  href="/admin/proposals"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
                >
                  Return to Proposals
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}