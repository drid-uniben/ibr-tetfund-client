"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getFullProposalStatus, getResearcherProposalDetails, getFinalSubmissionStatus } from '@/services/api';
import ResearcherLayout from '@/components/researchers/ResearcherLayout';
import { AlertCircle, ArrowLeft, FileText, Clock, Loader2 } from 'lucide-react';
import Link from 'next/link';


interface AwardData {
  status: 'approved' | 'declined';
  feedbackComments: string;
  fundingAmount?: number;
}

interface FullProposalStatus {
  canSubmit: boolean;
  isApproved: boolean;
  hasSubmitted: boolean;
  isWithinDeadline: boolean;
  deadline: string;
  daysRemaining: number;
}

interface FinalSubmissionStatus {
  canSubmit: boolean;
  hasSubmitted: boolean;
  isWithinDeadline: boolean;
  deadline: string;
  daysRemaining: number;
  isApproved: boolean;
}

interface FullProposalData {
  status: 'approved' | 'rejected';
  reviewComments?: string;
  reviewedAt?: string;
  submittedAt: string;
}

interface Proposal {
  _id: string;
  projectTitle: string;
  submitterType: string;
  problemStatement: string;
  objectives: string;
  methodology: string;
  expectedOutcomes?: string;
  workPlan?: string;
  estimatedBudget?: number;
  coInvestigators?: Array<{
    name: string;
    department?: string;
    faculty?: string;
  }>;
  cvFile?: string;
  docFile?: string;
  status: string;
  award?: AwardData;
  fullProposal?: FullProposalData;
  createdAt: string;
  updatedAt: string;
}

const linkify = (text: string | undefined) => {
  if (!text) return text;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#6d035c] hover:underline"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

const useFullProposalStatus = (proposalId: string) => {
  const [status, setStatus] = useState<FullProposalStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await getFullProposalStatus(proposalId);
        if (response.success) {
          setStatus(response.data);
        }
      } catch (error) {
        console.error('Error fetching full proposal status:', error);
      } finally {
        setLoading(false);
      }
    };

    if (proposalId) {
      fetchStatus();
    }
  }, [proposalId]);

  return { status, loading };
};

const useFinalSubmissionStatus = (proposalId: string) => {
  const [status, setStatus] = useState<FinalSubmissionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await getFinalSubmissionStatus(proposalId);
        if (response.success) {
          setStatus(response.data);
        }
      } catch (error) {
        console.error('Error fetching final submission status:', error);
      } finally {
        setLoading(false);
      }
    };

    if (proposalId) {
      fetchStatus();
    }
  }, [proposalId]);

  return { status, loading };
};

const AwardPoster = ({ award }: { award: AwardData; projectTitle: string }) => {
  const isApproved = award.status === 'approved';

  return (
    <div className={`rounded-2xl p-8 mb-6 relative overflow-hidden border ${
      isApproved
        ? 'bg-[#f2faf3] border-[#cfe6d4]'
        : 'bg-[#fef2f2] border-red-200'
    }`}>
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
        {isApproved ? (
          <div className="w-full h-full bg-[#1f5b34] rounded-full transform translate-x-16 -translate-y-16"></div>
        ) : (
          <div className="w-full h-full bg-[#b91c1c] rounded-full transform translate-x-16 -translate-y-16"></div>
        )}
      </div>

      <div className="relative z-10">
        {isApproved ? (
          <>
            {/* Approved Header */}
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-[#1f5b34] rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="font-serif text-2xl font-semibold text-[#1f5b34]">Congratulations!</h2>
                <p className="text-[#3d6b4c]">Your proposal has been approved for the next stage</p>
              </div>
            </div>

            {/* Approved Details */}
            <div className="bg-white/70 rounded-xl p-6 backdrop-blur-sm">
              <h3 className="font-semibold text-[#2b1229] mb-3">Award Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {award.fundingAmount && (
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-[#6b5566] mr-2">Funding Amount:</span>
                    <span className="text-lg font-bold text-[#1f5b34]">₦{award.fundingAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>
              {award.feedbackComments && (
                <div className="mt-4">
                  <span className="text-sm font-medium text-[#6b5566]">Feedback:</span>
                  <p className="text-[#2b1229] mt-1 italic whitespace-pre-wrap">&quot;{linkify(award.feedbackComments)}&quot;</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Declined Header */}
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-[#b91c1c] rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <h2 className="font-serif text-2xl font-semibold text-[#b91c1c]">Thanks for participating</h2>
                <p className="text-red-700">Your proposal was not selected for funding</p>
              </div>
            </div>

            {/* Declined Details */}
            <div className="bg-white/70 rounded-xl p-6 backdrop-blur-sm">
              <p className="text-[#2b1229] mb-4">
                We appreciate the time and effort you put into your proposal. While it wasn&apos;t selected this time,
                we encourage you to consider the feedback and apply again in the future.
              </p>
              {award.feedbackComments && (
                <div>
                  <span className="text-sm font-medium text-[#6b5566]">Feedback from Review Committee:</span>
                  <div className="mt-2 p-3 bg-[#fef2f2] rounded-md border border-red-200">
                    <p className="text-[#2b1229] italic whitespace-pre-wrap">&quot;{linkify(award.feedbackComments)}&quot;</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// FullProposalPoster component
const FullProposalPoster = ({ fullProposal }: {
  fullProposal: FullProposalData;
  projectTitle: string
}) => {
  const isApproved = fullProposal.status === 'approved';

  return (
    <div className={`rounded-2xl p-8 mb-6 relative overflow-hidden border ${
      isApproved
        ? 'bg-[#f2faf3] border-[#cfe6d4]'
        : 'bg-amber-50 border-amber-200'
    }`}>
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
        {isApproved ? (
          <div className="w-full h-full bg-[#1f5b34] rounded-full transform translate-x-16 -translate-y-16"></div>
        ) : (
          <div className="w-full h-full bg-amber-500 rounded-full transform translate-x-16 -translate-y-16"></div>
        )}
      </div>

      <div className="relative z-10">
        {isApproved ? (
          <>
            {/* Approved Header */}
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-[#1f5b34] rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="font-serif text-2xl font-semibold text-[#1f5b34]">Excellent News!</h2>
                <p className="text-[#3d6b4c]">Your full proposal has been shortlisted and approved!</p>
              </div>
            </div>

            {/* Approved Details */}
            <div className="bg-white/70 rounded-xl p-6 backdrop-blur-sm">
              <h3 className="font-semibold text-[#2b1229] mb-3">Next Steps</h3>
              <div className="space-y-3">
                <p className="text-[#2b1229]">
                  📧 You will receive further information and next steps instructions from the directorate soon either below in the review comments or via email.
                </p>
              </div>
              {fullProposal.reviewComments && (
                <div className="mt-4">
                  <span className="text-sm font-medium text-[#6b5566]">Review Feedback:</span>
                  <div className="mt-2 p-3 bg-[#f2faf3] rounded-md border border-[#cfe6d4]">
                    <p className="text-[#2b1229] italic whitespace-pre-wrap">&quot;{linkify(fullProposal.reviewComments)}&quot;</p>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Rejected Header */}
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h2 className="font-serif text-2xl font-semibold text-amber-800">Thank You for Your Submission</h2>
                <p className="text-amber-700">We regret to inform you that your full proposal was not shortlisted for approval</p>
              </div>
            </div>

            {/* Rejected Details */}
            <div className="bg-white/70 rounded-xl p-6 backdrop-blur-sm">
              <div className="space-y-3">
                <p className="text-[#2b1229]">
                  Thank you for submitting your complete research proposal. While your full proposal was not shortlisted this time,  we appreciate your detailed research work and encourage you to consider the feedback and apply again in the future.
                </p>
              </div>
              {fullProposal.reviewComments && (
                <div className="mt-4">
                  <span className="text-sm font-medium text-[#6b5566]">Review Feedback:</span>
                  <div className="mt-2 p-3 bg-amber-50 rounded-md border border-amber-200">
                    <p className="text-[#2b1229] italic whitespace-pre-wrap">&quot;{linkify(fullProposal.reviewComments)}&quot;</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const FullProposalSubmissionBanner = ({
  proposalId,
  fullProposalStatus,
  fullProposal
}: {
  proposalId: string;
  fullProposalStatus: FullProposalStatus;
  fullProposal?: FullProposalData;
}) => {
  const { canSubmit, hasSubmitted, isWithinDeadline, deadline, daysRemaining } = fullProposalStatus;

  if (!fullProposalStatus.isApproved) return null;

  // If full proposal has been reviewed (approved/rejected), don't show this banner
  if (fullProposal && ['approved', 'rejected'].includes(fullProposal.status)) {
    return null;
  }

  const deadlineDate = new Date(deadline);
  const formattedDeadline = deadlineDate.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  if (hasSubmitted) {
    return (
      <div className="rounded-2xl p-6 mb-6 bg-[#f2faf3] border border-[#cfe6d4]">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-[#1f5b34] rounded-full flex items-center justify-center mr-4">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-serif text-xl font-semibold text-[#1f5b34]">Full Proposal Submitted</h3>
            <p className="text-[#3d6b4c]">Your complete proposal has been successfully submitted</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isWithinDeadline) {
    return (
      <div className="rounded-2xl p-6 mb-6 bg-[#faf7fc] border border-[#e6d9e6]">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-[#a48fa0] rounded-full flex items-center justify-center mr-4">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-semibold text-[#2b1229]">Submission Deadline Passed</h3>
            <p className="text-[#6b5566]">The deadline for full proposal submission was {formattedDeadline}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-6 mb-6 bg-gradient-to-br from-[#4a0340] to-[#6d035c] border border-[#e6d9e6]">
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 bg-white/10 ring-1 ring-white/20 rounded-full flex items-center justify-center mr-4">
          <FileText className="w-5 h-5 text-[#e9c96b]" />
        </div>
        <div>
          <h3 className="font-serif text-xl font-semibold text-white">Next Stage: Submit Full Proposal</h3>
          <p className="text-[#e7d3e4]">Your proposal has been approved! Submit your complete proposal document.</p>
        </div>
      </div>

      <div className="bg-white/10 ring-1 ring-white/20 rounded-xl p-4 backdrop-blur-sm mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[#e7d3e4]">Submission Deadline:</span>
          <span className="text-lg font-bold text-[#e9c96b]">{formattedDeadline}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[#e7d3e4]">Days Remaining:</span>
          <span className={`text-lg font-bold ${daysRemaining <= 7 ? 'text-red-300' : 'text-[#e9c96b]'}`}>
            {daysRemaining} days
          </span>
        </div>
      </div>

      {canSubmit && (
        <Link
          href={`/researchers/proposals/${proposalId}/submit`}
          className="inline-flex items-center bg-white hover:bg-[#f3e7d0] text-[#4a0340] px-6 py-3 rounded-full font-semibold transition-colors"
        >
          <FileText className="w-4 h-4 mr-2" />
          Submit Full Proposal
        </Link>
      )}
    </div>
  );
};

const FinalSubmissionBanner = ({
  proposalId,
  finalSubmissionStatus,
}: {
  proposalId: string;
  finalSubmissionStatus: FinalSubmissionStatus;
}) => {
  const { canSubmit, hasSubmitted, isWithinDeadline, deadline, daysRemaining, } = finalSubmissionStatus;

  if (!finalSubmissionStatus.isApproved) return null;

  const deadlineDate = new Date(deadline);
  const formattedDeadline = deadlineDate.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  if (hasSubmitted) {
    return (
      <div className="rounded-2xl p-6 mb-6 bg-[#f2faf3] border border-[#cfe6d4]">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-[#1f5b34] rounded-full flex items-center justify-center mr-4">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-serif text-xl font-semibold text-[#1f5b34]">Final Submission Completed</h3>
            <p className="text-[#3d6b4c]">Your final submission has been successfully submitted</p>
          </div>
        </div>
        <div className="bg-white/70 rounded-xl p-4 backdrop-blur-sm">
          <p className="text-sm text-[#2b1229]">
            <strong>Important:</strong> Remember to also submit the physical documents at the DRID office as instructed in the review comments.
          </p>
        </div>
      </div>
    );
  }

  if (!isWithinDeadline) {
    return (
      <div className="rounded-2xl p-6 mb-6 bg-[#faf7fc] border border-[#e6d9e6]">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-[#a48fa0] rounded-full flex items-center justify-center mr-4">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-semibold text-[#2b1229]">Final Submission Deadline Passed</h3>
            <p className="text-[#6b5566]">The deadline for final submission was {formattedDeadline}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-6 mb-6 bg-gradient-to-br from-[#4a0340] to-[#6d035c] border border-[#e6d9e6]">
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 bg-white/10 ring-1 ring-white/20 rounded-full flex items-center justify-center mr-4">
          <FileText className="w-5 h-5 text-[#e9c96b]" />
        </div>
        <div>
          <h3 className="font-serif text-xl font-semibold text-white">Final Stage: Final Submission</h3>
          <p className="text-[#e7d3e4]">Your full proposal has been approved! Submit your final documents.</p>
        </div>
      </div>

      <div className="bg-white/10 ring-1 ring-white/20 rounded-xl p-4 backdrop-blur-sm mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[#e7d3e4]">Final Submission Deadline:</span>
          <span className="text-lg font-bold text-[#e9c96b]">{formattedDeadline}</span>
        </div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-[#e7d3e4]">Days Remaining:</span>
          <span className={`text-lg font-bold ${daysRemaining <= 7 ? 'text-red-300' : 'text-[#e9c96b]'}`}>
            {daysRemaining} days
          </span>
        </div>
        <div className="border-t border-white/20 pt-3">
          <p className="text-sm text-[#e7d3e4]">
            <strong>Important:</strong> You need to submit both online documents and physical documents at the DRID office as instructed in the review comments.
          </p>
        </div>
      </div>

      {canSubmit && (
        <Link
          href={`/researchers/proposals/${proposalId}/final-submission`}
          className="inline-flex items-center bg-white hover:bg-[#f3e7d0] text-[#4a0340] px-6 py-3 rounded-full font-semibold transition-colors"
        >
          <FileText className="w-4 h-4 mr-2" />
          Submit Final Documents
        </Link>
      )}
    </div>
  );
};

export default function ProposalDetails() {
  const params = useParams();
  const proposalId = params.id as string;
  const { status: fullProposalStatus, loading: statusLoading } = useFullProposalStatus(proposalId);
  const { status: finalSubmissionStatus, loading: finalStatusLoading } = useFinalSubmissionStatus(proposalId);

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProposalDetails = async () => {
      try {
        const response = await getResearcherProposalDetails(proposalId);
        setProposal(response.data);
      } catch (err) {
        console.error('Error fetching proposal details:', err);
        setError('Failed to load proposal details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (proposalId) {
      fetchProposalDetails();
    }
  }, [proposalId]);

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
      month: 'long',
      day: 'numeric'
    });
  };

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <ResearcherLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/researchers/proposals"
            className="flex items-center text-[#6d035c] hover:text-[#4a0340]"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Proposals
          </Link>
        </div>

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
        ) : proposal ? (
          <>
            {/* Header */}
            <div className="bg-white rounded-2xl border border-[#e6d9e6] shadow-[0_20px_60px_-40px_rgba(109,3,92,0.5)] p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="font-serif text-2xl font-semibold tracking-tight text-[#2b1229] mb-2">
                    {proposal.projectTitle || '(check doc file for title)'}
                  </h1>
                  <div className="flex items-center flex-wrap gap-2">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(proposal.status)}`}>
                      {formatStatus(proposal.status)}
                    </span>
                    <span className="text-[#6b5566] text-sm flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Submitted: {formatDate(proposal.createdAt)}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {proposal.award && (
            <AwardPoster award={proposal.award} projectTitle={proposal.projectTitle || 'Your Research Proposal'} />
          )}

          {proposal.fullProposal && (
  <FullProposalPoster
    fullProposal={proposal.fullProposal}
    projectTitle={proposal.projectTitle || 'Your Research Proposal'}
  />
)}

          {proposal.fullProposal && proposal.fullProposal.status === 'approved' && finalSubmissionStatus && !finalStatusLoading && (
          <FinalSubmissionBanner
            proposalId={proposalId}
            finalSubmissionStatus={finalSubmissionStatus}
          />
        )}

          {proposal.award && fullProposalStatus && !statusLoading && (
          <FullProposalSubmissionBanner
          proposalId={proposalId}
          fullProposalStatus={fullProposalStatus}
          fullProposal={proposal.fullProposal}
          />
        )}

            {/* Proposal Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl border border-[#e6d9e6] shadow-[0_20px_60px_-40px_rgba(109,3,92,0.5)] overflow-hidden">
                  <div className="border-b border-[#ecdfec]">
                    <nav className="-mb-px flex">
                      <div className="w-1/2 py-4 px-1 text-center border-b-2 border-[#6d035c]">
                        <span className="text-sm font-medium text-[#4a0340]">Proposal Details</span>
                      </div>
                    </nav>
                  </div>

                  <div className="p-6">
                    <div className="mb-8">
                      <h2 className="font-serif text-lg font-semibold mb-2 text-[#2b1229]">Problem Statement</h2>
                      <p className="text-[#2b1229] whitespace-pre-line">{proposal.problemStatement}</p>
                    </div>

                    <div className="mb-8">
                      <h2 className="font-serif text-lg font-semibold mb-2 text-[#2b1229]">Objectives</h2>
                      <p className="text-[#2b1229] whitespace-pre-line">{proposal.objectives}</p>
                    </div>

                    <div className="mb-8">
                      <h2 className="font-serif text-lg font-semibold mb-2 text-[#2b1229]">Methodology</h2>
                      <p className="text-[#2b1229] whitespace-pre-line">{proposal.methodology}</p>
                    </div>

                    {proposal.expectedOutcomes && (
                      <div className="mb-8">
                        <h2 className="font-serif text-lg font-semibold mb-2 text-[#2b1229]">Expected Outcomes</h2>
                        <p className="text-[#2b1229] whitespace-pre-line">{proposal.expectedOutcomes}</p>
                      </div>
                    )}

                    {proposal.workPlan && (
                      <div className="mb-8">
                        <h2 className="font-serif text-lg font-semibold mb-2 text-[#2b1229]">Work Plan</h2>
                        <p className="text-[#2b1229] whitespace-pre-line">{proposal.workPlan}</p>
                      </div>
                    )}

                    {proposal.estimatedBudget !== undefined && (
                      <div className="mb-8">
                        <h2 className="font-serif text-lg font-semibold mb-2 text-[#2b1229]">Estimated Budget</h2>
                        <p className="text-[#2b1229]">₦{proposal.estimatedBudget.toLocaleString()}</p>
                      </div>
                    )}

                    {proposal.coInvestigators && proposal.coInvestigators.length > 0 && (
                      <div className="mb-8">
                        <h2 className="font-serif text-lg font-semibold mb-2 text-[#2b1229]">Co-Investigators</h2>
                        <ul className="list-disc pl-5">
                          {proposal.coInvestigators.map((person, index) => (
                            <li key={index} className="text-[#2b1229] mb-1">
                              {person.name}
                              {person.department && ` - ${person.department}`}
                              {person.faculty && `, ${person.faculty}`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl border border-[#e6d9e6] shadow-[0_20px_60px_-40px_rgba(109,3,92,0.5)] p-6">
                  <h2 className="font-serif text-lg font-semibold mb-4 text-[#2b1229]">Documents</h2>

                  {(proposal.cvFile || proposal.docFile) ? (
                    <div className="space-y-3">
                      {proposal.cvFile && (
                        <a
                          href={proposal.cvFile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center p-3 border border-[#e6d9e6] rounded-lg hover:bg-[#faf7fc]"
                        >
                          <FileText className="h-5 w-5 text-[#6d035c] mr-2" />
                          <div>
                            <p className="text-sm font-medium text-[#2b1229]">Curriculum Vitae</p>
                            <p className="text-xs text-[#6b5566]">View CV</p>
                          </div>
                        </a>
                      )}

                      {proposal.docFile && (
                        <a
                          href={proposal.docFile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center p-3 border border-[#e6d9e6] rounded-lg hover:bg-[#faf7fc]"
                        >
                          <FileText className="h-5 w-5 text-[#6d035c] mr-2" />
                          <div>
                            <p className="text-sm font-medium text-[#2b1229]">Full Proposal Document</p>
                            <p className="text-xs text-[#6b5566]">View Document</p>
                          </div>
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-[#6b5566] text-sm">No documents attached to this proposal.</p>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-[#e6d9e6] shadow-[0_20px_60px_-40px_rgba(109,3,92,0.5)] p-6 mt-6">
                  <h2 className="font-serif text-lg font-semibold mb-4 text-[#2b1229]">Status Timeline</h2>
                  <div className="border-l-2 border-[#ecdfec] pl-4 space-y-6">
                    <div className="relative">
                      <div className="absolute -left-6 mt-1 w-4 h-4 rounded-full bg-[#1f5b34]"></div>
                      <p className="text-sm font-medium text-[#2b1229]">Submitted</p>
                      <p className="text-xs text-[#6b5566]">{formatDate(proposal.createdAt)}</p>
                    </div>

                    {proposal.status !== 'submitted' && (
                      <div className="relative">
                        <div className="absolute -left-6 mt-1 w-4 h-4 rounded-full bg-amber-500"></div>
                        <p className="text-sm font-medium text-[#2b1229]">Under Review</p>
                        <p className="text-xs text-[#6b5566]">Started review process</p>
                      </div>
                    )}

                    {['approved', 'rejected', 'revision_requested'].includes(proposal.status) && (
                      <div className="relative">
                        <div className={`absolute -left-6 mt-1 w-4 h-4 rounded-full ${
                          proposal.status === 'approved' ? 'bg-[#1f5b34]' :
                          proposal.status === 'rejected' ? 'bg-[#b91c1c]' : 'bg-orange-500'
                        }`}></div>
                        <p className="text-sm font-medium text-[#2b1229]">{formatStatus(proposal.status)}</p>
                        <p className="text-xs text-[#6b5566]">{formatDate(proposal.updatedAt)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </ResearcherLayout>
  );
}
