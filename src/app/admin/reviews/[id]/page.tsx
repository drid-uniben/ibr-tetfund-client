"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  RefreshCw,
  Loader2,
  User,
  Bot,
  FileText,
  Calendar,
  MessageSquare,
  BarChart3,
  Mail,
  Building,
  GraduationCap
} from 'lucide-react';
import { getProposalReviewDetailsById } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface ReviewScore {
  relevanceToNationalPriorities: number;
  originalityAndInnovation: number;
  clarityOfResearchProblem: number;
  methodology: number;
  literatureReview: number;
  teamComposition: number;
  feasibilityAndTimeline: number;
  budgetJustification: number;
  expectedOutcomes: number;
  sustainabilityAndScalability: number;
}

interface Review {
  id: string;
  reviewType: 'ai' | 'human' | 'reconciliation';
  status: string;
  scores: ReviewScore;
  totalScore: number;
  comments: string;
  dueDate: string;
  completedAt?: string;
  createdAt: string;
  reviewer?: {
    name: string;
    email: string;
    academicTitle?: string;
    faculty?: string;
    department?: string;
  };
}

interface DiscrepancyInfo {
  hasDiscrepancy: boolean;
  overallScores: {
    scores: number[];
    max: number;
    min: number;
    avg: number;
    percentDifference: number;
  };
  criteriaDiscrepancies: {
    criterion: string;
    scores: number[];
    max: number;
    min: number;
    avg: number;
    percentDifference: number;
  }[];
  threshold: number;
}

interface ProposalReviewDetails {
  proposal: {
    id: string;
    projectTitle: string;
    submitterType: string;
    status: string;
    reviewStatus: string;
    createdAt: string;
    updatedAt: string;
    submitter: {
      name: string;
      email: string;
      academicTitle?: string;
      faculty?: string;
      department?: string;
    };
  };
  reviewSummary: {
    totalReviews: number;
    completedReviews: number;
    pendingReviews: number;
    hasAI: boolean;
    hasHuman: boolean;
    hasReconciliation: boolean;
  };
  reviews: {
    ai: Review[];
    human: Review[];
    reconciliation: Review[];
  };
  discrepancyInfo?: DiscrepancyInfo;
}

const criteriaLabels: { [key: string]: string } = {
  relevanceToNationalPriorities: 'Relevance to National Priorities',
  originalityAndInnovation: 'Originality and Innovation',
  clarityOfResearchProblem: 'Clarity of Research Problem',
  methodology: 'Methodology',
  literatureReview: 'Literature Review',
  teamComposition: 'Team Composition',
  feasibilityAndTimeline: 'Feasibility and Timeline',
  budgetJustification: 'Budget Justification',
  expectedOutcomes: 'Expected Outcomes',
  sustainabilityAndScalability: 'Sustainability and Scalability'
};

const criteriaMaxScores: { [key: string]: number } = {
  relevanceToNationalPriorities: 10,
  originalityAndInnovation: 15,
  clarityOfResearchProblem: 10,
  methodology: 15,
  literatureReview: 10,
  teamComposition: 10,
  feasibilityAndTimeline: 10,
  budgetJustification: 10,
  expectedOutcomes: 5,
  sustainabilityAndScalability: 5
};

export default function ProposalReviewDetailsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const proposalId = params.id as string;

  const [details, setDetails] = useState<ProposalReviewDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const loadProposalDetails = useCallback(async () => {
  try {
    setIsLoading(true);
    setError(null);
    const response = await getProposalReviewDetailsById(proposalId);
    setDetails(response.data);
  } catch (err) {
    console.error('Failed to load proposal details:', err);
    setError('Failed to load proposal review details');
  } finally {
    setIsLoading(false);
  }
}, [proposalId, setIsLoading, setError, setDetails]);

  useEffect(() => {
    if (isAuthenticated && proposalId) {
      loadProposalDetails();
    }
  }, [isAuthenticated, proposalId, loadProposalDetails]);


  const getReviewTypeIcon = (type: string) => {
    switch (type) {
      case 'ai':
        return <Bot size={16} className="text-primary" />;
      case 'human':
        return <User size={16} className="text-primary" />;
      case 'reconciliation':
        return <RefreshCw size={16} className="text-orange-600" />;
      default:
        return <FileText size={16} className="text-muted-foreground" />;
    }
  };

  const getReviewTypeLabel = (type: string) => {
    switch (type) {
      case 'ai':
        return 'AI Review';
      case 'human':
        return 'Human Review';
      case 'reconciliation':
        return 'Reconciliation Review';
      default:
        return 'Review';
    }
  };

  const getReviewTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'ai':
        return 'bg-secondary text-secondary-foreground border-[#e9c96b]';
      case 'human':
        return 'bg-[#6d035c]/10 text-[#4a0340] border-[#6d035c]/20';
      case 'reconciliation':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle size={12} className="mr-1" />
            Completed
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-[#6d035c]/10 text-[#4a0340] border-[#6d035c]/20">
            <Clock size={12} className="mr-1" />
            In Progress
          </Badge>
        );
      case 'overdue':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <AlertTriangle size={12} className="mr-1" />
            Overdue
          </Badge>
        );
      default:
        return (
          <Badge className="bg-muted text-muted-foreground border-border">
            {status}
          </Badge>
        );
    }
  };

  const renderScoreBreakdown = (review: Review) => {
    return (
      <div className="space-y-3">
        {Object.entries(review.scores).map(([criterion, score]) => {
          const maxScore = criteriaMaxScores[criterion] || 10;
          const percentage = (score / maxScore) * 100;
          
          return (
            <div key={criterion}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-muted-foreground">
                  {criteriaLabels[criterion] || criterion}
                </span>
                <span className="text-sm font-bold text-foreground">
                  {score}/{maxScore}
                </span>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          );
        })}
        <div className="pt-2 border-t">
          <div className="flex justify-between items-center">
            <span className="text-base font-semibold text-foreground">Total Score</span>
            <span className="text-lg font-bold text-primary">
              {review.totalScore}/100
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderDiscrepancyAnalysis = () => {
    if (!details?.discrepancyInfo?.hasDiscrepancy) return null;

    const { discrepancyInfo } = details;

    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertTriangle size={20} />
            Discrepancy Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Score Discrepancy */}
          <div>
            <h4 className="font-semibold text-foreground mb-3">Overall Score Variance</h4>
            <div className="bg-white rounded-lg p-4 border border-orange-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {discrepancyInfo.overallScores.max}
                  </div>
                  <div className="text-xs text-muted-foreground">Highest</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {discrepancyInfo.overallScores.avg}
                  </div>
                  <div className="text-xs text-muted-foreground">Average</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {discrepancyInfo.overallScores.min}
                  </div>
                  <div className="text-xs text-muted-foreground">Lowest</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {discrepancyInfo.overallScores.percentDifference}%
                  </div>
                  <div className="text-xs text-muted-foreground">Variance</div>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                Individual scores: {discrepancyInfo.overallScores.scores.join(', ')}
              </div>
            </div>
          </div>

          {/* Criteria-level Discrepancies */}
          <div>
            <h4 className="font-semibold text-foreground mb-3">Top Criteria Discrepancies</h4>
            <div className="space-y-3">
              {discrepancyInfo.criteriaDiscrepancies.map((item) => (
                <div key={item.criterion} className="bg-white rounded-lg p-4 border border-orange-200">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-foreground">
                      {criteriaLabels[item.criterion] || item.criterion}
                    </div>
                    <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                      {item.percentDifference}% variance
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Scores: {item.scores.join(', ')}</span>
                    <span>Avg: {item.avg}</span>
                    <span>Range: {item.min}-{item.max}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderReviewCard = (review: Review, index: number) => {
    return (
      <Card key={review.id} className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getReviewTypeIcon(review.reviewType)}
              <div>
                <CardTitle className="text-lg">
                  {getReviewTypeLabel(review.reviewType)}
                  {review.reviewType === 'human' && ` #${index + 1}`}
                </CardTitle>
                {review.reviewer && (
                  <div className="text-sm text-muted-foreground mt-1">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <User size={12} />
                        {review.reviewer.name}
                      </span>
                      {review.reviewer.academicTitle && (
                        <span className="flex items-center gap-1">
                          <GraduationCap size={12} />
                          {review.reviewer.academicTitle}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1">
                        <Mail size={12} />
                        {review.reviewer.email}
                      </span>
                      {review.reviewer.faculty && (
                        <span className="flex items-center gap-1">
                          <Building size={12} />
                          {review.reviewer.faculty}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getReviewTypeBadgeColor(review.reviewType)}>
                {getReviewTypeIcon(review.reviewType)}
                <span className="ml-1">{getReviewTypeLabel(review.reviewType)}</span>
              </Badge>
              {getStatusBadge(review.status)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Score Breakdown */}
            <div>
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 size={16} />
                Score Breakdown
              </h4>
              {renderScoreBreakdown(review)}
            </div>

            {/* Comments and Details */}
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <MessageSquare size={16} />
                  Comments & Feedback
                </h4>
                <div className="bg-muted rounded-lg p-4 min-h-[120px]">
                  {review.comments ? (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {review.comments}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No comments provided
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="flex items-center gap-1 text-muted-foreground mb-1">
                    <Calendar size={12} />
                    Due Date
                  </div>
                  <div className="font-medium">
                    {new Date(review.dueDate).toLocaleDateString()}
                  </div>
                </div>
                {review.completedAt && (
                  <div>
                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                      <CheckCircle size={12} />
                      Completed
                    </div>
                    <div className="font-medium">
                      {new Date(review.completedAt).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading proposal details...</span>
        </div>
      </AdminLayout>
    );
  }

  if (error || !details) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p>{error || 'Proposal not found'}</p>
          </div>
          <Button 
            onClick={() => router.back()} 
            variant="outline" 
            className="mt-4"
          >
            <ArrowLeft size={16} className="mr-2" />
            Go Back
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const allReviews = [
    ...details.reviews.ai,
    ...details.reviews.human,
    ...details.reviews.reconciliation
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => router.back()} 
              variant="outline" 
              size="sm"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Reviews
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Proposal Review Details
              </h1>
              <p className="text-muted-foreground mt-1">
                Comprehensive review analysis and scoring breakdown
              </p>
            </div>
          </div>
          <Button onClick={loadProposalDetails} variant="outline" size="sm">
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
        </div>

        {/* Proposal Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText size={20} />
              Proposal Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg text-foreground">
                    {details.proposal.projectTitle || 'Untitled Proposal'}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">
                      {details.proposal.submitterType === 'staff' ? 'Staff' : 'Master Student'}
                    </Badge>
                    <Badge className="bg-[#6d035c]/10 text-[#4a0340] border-[#6d035c]/20">
                      {details.proposal.status}
                    </Badge>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-foreground mb-2">Submitter Information</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-muted-foreground" />
                      <span>{details.proposal.submitter.name}</span>
                      {details.proposal.submitter.academicTitle && (
                        <Badge variant="outline" className="text-xs">
                          {details.proposal.submitter.academicTitle}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-muted-foreground" />
                      <span>{details.proposal.submitter.email}</span>
                    </div>
                    {details.proposal.submitter.faculty && (
                      <div className="flex items-center gap-2">
                        <Building size={14} className="text-muted-foreground" />
                        <span>{details.proposal.submitter.faculty}</span>
                        {details.proposal.submitter.department && (
                          <span className="text-muted-foreground">
                            • {details.proposal.submitter.department}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-foreground mb-3">Review Summary</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-secondary rounded-lg p-3 border border-[#e9c96b]">
                      <div className="text-2xl font-bold text-primary">
                        {details.reviewSummary.totalReviews}
                      </div>
                      <div className="text-sm text-primary">Total Reviews</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <div className="text-2xl font-bold text-green-600">
                        {details.reviewSummary.completedReviews}
                      </div>
                      <div className="text-sm text-green-700">Completed</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span>Review Progress</span>
                      <span>{details.reviewSummary.completedReviews}/{details.reviewSummary.totalReviews}</span>
                    </div>
                    <Progress 
                      value={details.reviewSummary.totalReviews > 0 ? 
                        (details.reviewSummary.completedReviews / details.reviewSummary.totalReviews) * 100 : 0
                      } 
                      className="h-2" 
                    />
                  </div>

                  <div className="flex gap-2 mt-4">
                    {details.reviewSummary.hasAI && (
                      <Badge className="bg-secondary text-secondary-foreground border-[#e9c96b]">
                        <Bot size={12} className="mr-1" />
                        AI Review
                      </Badge>
                    )}
                    {details.reviewSummary.hasHuman && (
                      <Badge className="bg-[#6d035c]/10 text-[#4a0340] border-[#6d035c]/20">
                        <User size={12} className="mr-1" />
                        Human Review
                      </Badge>
                    )}
                    {details.reviewSummary.hasReconciliation && (
                      <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                        <RefreshCw size={12} className="mr-1" />
                        Reconciliation
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  <div>Created: {new Date(details.proposal.createdAt).toLocaleString()}</div>
                  <div>Updated: {new Date(details.proposal.updatedAt).toLocaleString()}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Discrepancy Analysis */}
        {renderDiscrepancyAnalysis()}

        {/* Reviews Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              All Reviews ({allReviews.length})
            </h2>
            <div className="flex gap-2">
              {details.reviews.ai.length > 0 && (
                <Badge className="bg-secondary text-secondary-foreground border-[#e9c96b]">
                  {details.reviews.ai.length} AI
                </Badge>
              )}
              {details.reviews.human.length > 0 && (
                <Badge className="bg-[#6d035c]/10 text-[#4a0340] border-[#6d035c]/20">
                  {details.reviews.human.length} Human
                </Badge>
              )}
              {details.reviews.reconciliation.length > 0 && (
                <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                  {details.reviews.reconciliation.length} Reconciliation
                </Badge>
              )}
            </div>
          </div>

          {/* AI Reviews */}
          {details.reviews.ai.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                <Bot size={18} className="text-primary" />
                AI Reviews
              </h3>
              {details.reviews.ai.map((review, index) => renderReviewCard(review, index))}
            </div>
          )}

          {/* Human Reviews */}
          {details.reviews.human.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                <User size={18} className="text-primary" />
                Human Reviews
              </h3>
              {details.reviews.human.map((review, index) => renderReviewCard(review, index))}
            </div>
          )}

          {/* Reconciliation Reviews */}
          {details.reviews.reconciliation.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                <RefreshCw size={18} className="text-orange-600" />
                Reconciliation Reviews
              </h3>
              {details.reviews.reconciliation.map((review, index) => renderReviewCard(review, index))}
            </div>
          )}

          {allReviews.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Reviews Available</h3>
                <p className="text-muted-foreground">
                  This proposal has not been reviewed yet.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}