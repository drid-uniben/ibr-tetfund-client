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
import { assignSoloReviewer, getSoloReviewers } from "@/services/api";

interface SoloReviewer {
  _id: string;
  name: string;
  email: string;
  facultyTitle: string;
}

interface UnavailableReviewer {
  id: string;
  reason: string;
}

interface SoloAssignDialogProps {
  proposalId: string | null;
  onClose: () => void;
  onAssigned: () => void;
}

const errorMessage = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data
    ?.message || fallback;

// Radix can leave `pointer-events: none` / `overflow: hidden` on <body> after a
// Dialog that was opened from a DropdownMenu closes, which freezes the whole
// page until refresh. The other modals on the proposals page work around it the
// same way, so do it here too.
const releaseBody = () => {
  if (document.querySelector('[role="dialog"], [role="menu"]')) return;
  document.body.style.pointerEvents = "";
  document.body.style.overflow = "";
};

export default function SoloAssignDialog({
  proposalId,
  onClose,
  onAssigned,
}: SoloAssignDialogProps) {
  const [reviewers, setReviewers] = useState<SoloReviewer[]>([]);
  const [unavailable, setUnavailable] = useState<UnavailableReviewer[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!proposalId) return;

    let cancelled = false;
    setReviewers([]);
    setUnavailable([]);
    setSelected(null);
    setError(null);
    setLoading(true);

    getSoloReviewers(proposalId)
      .then((response) => {
        if (cancelled) return;
        const list: SoloReviewer[] = response.data.reviewers;
        setReviewers(list);
        setUnavailable(response.data.unavailable ?? []);
        if (list.length === 1) setSelected(list[0]._id); // only one -> preselect
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(errorMessage(err, "Failed to load solo reviewers"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [proposalId]);

  // Once the dialog has closed (after its exit animation), make sure the page
  // is clickable again. Also on unmount.
  useEffect(() => {
    if (proposalId) return;
    const timer = setTimeout(releaseBody, 350);
    return () => clearTimeout(timer);
  }, [proposalId]);

  useEffect(() => releaseBody, []);

  const handleConfirm = async () => {
    if (!proposalId || !selected) return;
    try {
      setSubmitting(true);
      const response = await assignSoloReviewer(proposalId, selected);
      if (response.success) {
        toast.success("Assigned to solo reviewer");
        onClose();
        // refresh the list only after the dialog has finished closing
        setTimeout(onAssigned, 300);
      } else {
        toast.error(response.message || "Assignment failed");
      }
    } catch (err: unknown) {
      toast.error(errorMessage(err, "Error while assigning solo reviewer"));
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
          ) : error ? (
            <p className="text-center text-sm text-red-600 py-8">{error}</p>
          ) : reviewers.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-6 space-y-2">
              <p>No solo reviewer is available for this proposal.</p>
              {unavailable.map((u) => (
                <p key={u.id} className="text-xs">
                  Reviewer …{u.id.slice(-6)}: {u.reason}
                </p>
              ))}
            </div>
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
