"use client";

import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface ScoreData {
  backgroundAndProblemStatement: number;
  researchObjectives: number;
  methodology: number;
  expectedOutcomesAndImpact: number;
  workPlanAndFeasibility: number;
  estimatedBudget: number;
  capacityOfLeadResearcherAndTeam: number;
  relevanceAndOriginality: number;
}

interface DiscrepancyInfo {
  message: string;
  conflictingReviews: Array<{
    reviewId: string;
    scores: ScoreData;
    totalScore: number;
    comments: string;
    submittedAt: string;
  }>;
  discrepancyAnalysis: {
    overallScoreRange: {
      highest: number;
      lowest: number;
      average: number;
      percentageDifference: number;
    };
    criteriaWithHighestDiscrepancy: Array<{
      criterion: string;
      scores: number[];
      averageScore: number;
      percentageDifference: number;
    }>;
  };
  reconciliationGuidance: {
    purpose: string;
    instruction: string;
    weightage: string;
  };
}

interface DiscrepancyAlertProps {
  discrepancyInfo: DiscrepancyInfo;
}

const DiscrepancyAlert = ({ discrepancyInfo }: DiscrepancyAlertProps) => {
  const { discrepancyAnalysis, conflictingReviews } = discrepancyInfo;
  const { overallScoreRange, criteriaWithHighestDiscrepancy } = discrepancyAnalysis;

  // Get severity level based on percentage difference
  const getSeverityLevel = (percentage: number) => {
    if (percentage >= 20) return 'high';
    if (percentage >= 5) return 'medium';
    return 'low';
  };

  const overallSeverity = getSeverityLevel(overallScoreRange.percentageDifference);
  
  const severityColors = {
    high: {
      bg: 'bg-red-50',
      border: 'border-red-400',
      text: 'text-red-800',
      icon: 'text-red-400',
      accent: 'text-red-600'
    },
    medium: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-400',
      text: 'text-yellow-800',
      icon: 'text-yellow-400',
      accent: 'text-yellow-600'
    },
    low: {
      bg: 'bg-orange-50',
      border: 'border-orange-400',
      text: 'text-orange-800',
      icon: 'text-orange-400',
      accent: 'text-orange-600'
    }
  };

  const colors = severityColors[overallSeverity];

  return (
    <div className={`${colors.bg} border-l-4 ${colors.border} rounded-lg shadow-md p-6 mb-6`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className={`h-6 w-6 ${colors.icon}`} />
        </div>
        <div className="ml-4 flex-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-bold ${colors.text}`}>
              Review Discrepancy Alert
            </h3>
          </div>

          <div className={`mb-4 ${colors.text}`}>
            <p className="text-sm leading-relaxed">
              {discrepancyInfo.message}
            </p>
          </div>

          {/* Score Range Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-white/50 rounded-lg">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-lg font-bold text-green-600">
                  {overallScoreRange.highest}
                </span>
              </div>
              <div className="text-xs text-gray-600">Highest Score</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="text-lg font-bold text-red-600">
                  {overallScoreRange.lowest}
                </span>
              </div>
              <div className="text-xs text-gray-600">Lowest Score</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {overallScoreRange.average}
              </div>
              <div className="text-xs text-gray-600">Average Score</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {conflictingReviews.length}
              </div>
              <div className="text-xs text-gray-600">Reviews</div>
            </div>
          </div>

          {/* Top Discrepant Criteria */}
          {criteriaWithHighestDiscrepancy.length > 0 && (
            <div>
              <h4 className={`font-semibold ${colors.text} mb-3`}>
                Criteria Requiring Special Attention:
              </h4>
              <div className="space-y-2">
                {criteriaWithHighestDiscrepancy.slice(0, 3).map((criteria, index) => {
                  const criteriaSeverity = getSeverityLevel(criteria.percentageDifference);
                  return (
                    <div key={index} className="flex items-center justify-between bg-white/70 rounded-lg p-3">
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">
                          {criteria.criterion}
                        </div>
                        <div className="text-sm text-gray-600">
                          Scores: {criteria.scores.join(' vs ')} (Avg: {criteria.averageScore})
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${
                          criteriaSeverity === 'high' ? 'text-red-600' :
                          criteriaSeverity === 'medium' ? 'text-yellow-600' : 'text-orange-600'
                        }`}>
                          {criteria.percentageDifference}%
                        </div>
                        <div className="text-xs text-gray-500">difference</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Items */}
          <div className={`mt-4 p-3 bg-white/50 rounded-lg border-l-2 ${colors.border}`}>
            <h4 className={`font-semibold ${colors.text} mb-2`}>
              Reconciliation Focus:
            </h4>
            <ul className={`text-sm ${colors.text} space-y-1`}>
              <li>• Review the highlighted criteria with significant score differences</li>
              <li>• Consider the reasoning behind each previous reviewer&apos;s assessment</li>
              <li>• Provide detailed justification for your reconciliation scores</li>
              {criteriaWithHighestDiscrepancy.length > 0 && (
                <li>• Pay special attention to: {criteriaWithHighestDiscrepancy[0]?.criterion}</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscrepancyAlert;