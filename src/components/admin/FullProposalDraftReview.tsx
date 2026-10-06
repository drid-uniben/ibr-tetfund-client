"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveFullProposalDraftReview } from "@/services/api";

export interface DraftReviewSaved {
  score?: number;
  draftReviewComments: string;
  draftFundingAmount: number | null;
  draftReviewedAt?: string;
}

interface FullProposalDraftReviewProps {
  fullProposalId: string;
  status: "submitted" | "under_review" | "approved" | "rejected";
  score?: number;
  draftReviewComments?: string;
  draftFundingAmount?: number;
  draftReviewedAt?: string;
  estimatedBudget?: number;
  firstStageAmount?: number;
  onSaved: (saved: DraftReviewSaved) => void;
}

const formatNaira = (amount?: number | null): string =>
  typeof amount === "number"
    ? `₦${amount.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`
    : "Not set";

const errorMessage = (error: unknown, fallback: string): string => {
  const maybe = error as { response?: { data?: { message?: string } } };
  return maybe?.response?.data?.message || fallback;
};

export default function FullProposalDraftReview({
  fullProposalId,
  status,
  score,
  draftReviewComments,
  draftFundingAmount,
  draftReviewedAt,
  estimatedBudget,
  firstStageAmount,
  onSaved,
}: FullProposalDraftReviewProps) {
  const savedScore = typeof score === "number" ? String(score) : "";
  const savedComments = draftReviewComments ?? "";
  const savedFunding =
    typeof draftFundingAmount === "number" ? String(draftFundingAmount) : "";

  const [scoreText, setScoreText] = useState(savedScore);
  const [commentsText, setCommentsText] = useState(savedComments);
  const [fundingText, setFundingText] = useState(savedFunding);
  const [isSaving, setIsSaving] = useState(false);

  // Re-sync after a successful save (parent passes the new saved values down)
  useEffect(() => {
    setScoreText(savedScore);
    setCommentsText(savedComments);
    setFundingText(savedFunding);
  }, [savedScore, savedComments, savedFunding]);

  const isLocked = status === "approved" || status === "rejected";

  const scoreChanged = scoreText.trim() !== "" && scoreText.trim() !== savedScore;
  const commentsChanged = commentsText.trim() !== savedComments.trim();
  const fundingChanged = fundingText.trim() !== savedFunding;
  const isDirty = scoreChanged || commentsChanged || fundingChanged;

  const scoreNumber = Number(scoreText);
  const fundingNumber = Number(fundingText);
  const scoreError =
    scoreText.trim() !== "" &&
    (!Number.isFinite(scoreNumber) || scoreNumber < 1 || scoreNumber > 100)
      ? "Score must be between 1 and 100"
      : null;
  const fundingError =
    fundingText.trim() !== "" && (!Number.isFinite(fundingNumber) || fundingNumber <= 0)
      ? "Funding amount must be a positive number"
      : null;

  const handleSave = async () => {
    if (scoreError || fundingError || !isDirty) return;
    const payload: Parameters<typeof saveFullProposalDraftReview>[1] = {};
    if (scoreChanged) payload.score = scoreNumber;
    if (commentsChanged) payload.reviewComments = commentsText.trim();
    if (fundingChanged) {
      payload.fundingAmount = fundingText.trim() === "" ? null : fundingNumber;
    }

    try {
      setIsSaving(true);
      const response = await saveFullProposalDraftReview(fullProposalId, payload);
      onSaved(response.data as DraftReviewSaved);
      toast.success("Review saved");
    } catch (error) {
      console.error("Failed to save review:", error);
      toast.error(errorMessage(error, "Failed to save review"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden rounded-lg" data-testid="draft-review-card">
      <div className="px-4 py-5 sm:px-6 bg-muted border-b border-border">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg leading-6 font-medium text-foreground">Admin Review</h3>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {isLocked
                ? "A decision has been made, so this review is locked."
                : "Visible to admins only. Nothing reaches the researcher until you approve or reject from the list and notify them."}
            </p>
          </div>
          {isLocked && (
            <span className="mt-3 md:mt-0 inline-flex items-center text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5 mr-1" /> Locked
            </span>
          )}
        </div>
      </div>

      <div className="px-4 py-5 sm:p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="draft-score">Score (1–100)</Label>
            <Input
              id="draft-score"
              type="number"
              min={1}
              max={100}
              value={scoreText}
              disabled={isLocked || isSaving}
              onChange={(e) => setScoreText(e.target.value)}
              aria-invalid={Boolean(scoreError)}
            />
            {scoreError && <p className="text-xs text-red-600">{scoreError}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="draft-funding">Proposed funding amount (₦)</Label>
            <Input
              id="draft-funding"
              type="number"
              min={0}
              value={fundingText}
              disabled={isLocked || isSaving}
              onChange={(e) => setFundingText(e.target.value)}
              placeholder="Leave blank if not decided"
              aria-invalid={Boolean(fundingError)}
            />
            {fundingError && <p className="text-xs text-red-600">{fundingError}</p>}
            <p className="text-xs text-muted-foreground">
              Researcher&apos;s estimated budget: {formatNaira(estimatedBudget)} · First-stage
              approved amount: {formatNaira(firstStageAmount)}
            </p>
            {!isLocked &&
              typeof estimatedBudget === "number" &&
              fundingNumber > estimatedBudget && (
                <p className="text-xs text-amber-700">
                  This is higher than the researcher&apos;s estimated budget.
                </p>
              )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="draft-comments">Review comments</Label>
          <Textarea
            id="draft-comments"
            rows={6}
            value={commentsText}
            disabled={isLocked || isSaving}
            onChange={(e) => setCommentsText(e.target.value)}
            placeholder="Your review of this full proposal"
          />
        </div>

        {!isLocked && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {draftReviewedAt
                ? `Last saved ${new Date(draftReviewedAt).toLocaleString("en-GB")}`
                : "Not saved yet"}
            </p>
            <Button
              onClick={handleSave}
              disabled={isSaving || !isDirty || Boolean(scoreError) || Boolean(fundingError)}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save review
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
