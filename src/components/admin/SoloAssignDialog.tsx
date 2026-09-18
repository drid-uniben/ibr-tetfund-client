"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { assignSoloReviewer, getEligibleReviewers } from "@/services/api";

interface SoloReviewer {
  _id: string;
  name: string;
  email: string;
  facultyTitle: string;
  isSpecialReviewer?: boolean;
}

interface SoloAssignDialogProps {
  proposalId: string | null;
  onClose: () => void;
  onAssigned: () => void;
}

export default function SoloAssignDialog({
  proposalId,
  onClose,
  onAssigned,
}: SoloAssignDialogProps) {
  const [reviewers, setReviewers] = useState<SoloReviewer[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!proposalId) return;

    let cancelled = false;
    setSelected(null);
    setLoading(true);

    getEligibleReviewers(proposalId)
      .then((response) => {
        if (cancelled) return;
        const solo: SoloReviewer[] = (
          response.data.eligibleReviewers as SoloReviewer[]
        ).filter((r) => r.isSpecialReviewer);
        setReviewers(solo);
        if (solo.length === 1) setSelected(solo[0]._id); // only one -> preselect
      })
      .catch(() => toast.error("Failed to load solo reviewers"))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [proposalId]);

  const handleConfirm = async () => {
    if (!proposalId || !selected) return;
    try {
      setSubmitting(true);
      const response = await assignSoloReviewer(proposalId, selected);
      if (response.success) {
        toast.success("Assigned to solo reviewer");
        onAssigned();
        onClose();
      } else {
        toast.error(response.message || "Assignment failed");
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Error while assigning solo reviewer";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!proposalId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Assign Solo Reviewer
          </DialogTitle>
          <DialogDescription>
            This reviewer will be the only reviewer. No AI review is run, there
            is no discrepancy check, and their submitted review sends the
            proposal straight to the decision page.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : reviewers.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              No solo reviewer is available for this proposal.
            </p>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              {reviewers.map((reviewer) => (
                <div
                  key={reviewer._id}
                  onClick={() => setSelected(reviewer._id)}
                  className={`p-4 cursor-pointer border-b border-border last:border-b-0 hover:bg-muted transition-colors ${
                    selected === reviewer._id
                      ? "bg-secondary ring-1 ring-inset ring-primary/40"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {reviewer.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {reviewer.email}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selected || submitting}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Assign as Solo Reviewer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
