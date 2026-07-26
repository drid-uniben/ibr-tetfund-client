"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  adminGetSubmissionWindows,
  adminUpdateSubmissionWindow,
  SubmissionWindow,
  SubmissionPhase,
} from '@/services/api';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  CalendarClock,
  CheckCircle2,
  AlertCircle,
  Lock,
} from 'lucide-react';

const PHASE_LABELS: Record<SubmissionPhase, string> = {
  staff_concept: "Staff Concept Note",
  masters_concept: "Master's Concept Note",
  full_proposal: 'Full Proposal',
  final_submission: 'Final Submission',
};

const PHASE_ORDER: SubmissionPhase[] = [
  'staff_concept',
  'masters_concept',
  'full_proposal',
  'final_submission',
];

interface PhaseFormState {
  opensAt: string; // datetime-local value, local time, no timezone
  closesAt: string;
  isManuallyClosed: boolean;
  note: string;
  isOpen: boolean;
  saving: boolean;
  status: { type: 'success' | 'error'; message: string } | null;
}

// datetime-local expects "YYYY-MM-DDTHH:mm" in local time, no timezone suffix.
const isoToLocalInput = (iso: string | null): string => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// datetime-local values have no timezone; the browser interprets them as
// local time, so `new Date(value)` parses them as local and toISOString()
// converts to the correct absolute instant.
const localInputToIso = (value: string): string | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const buildFormState = (win: SubmissionWindow): PhaseFormState => ({
  opensAt: isoToLocalInput(win.opensAt),
  closesAt: isoToLocalInput(win.closesAt),
  isManuallyClosed: Boolean(win.isManuallyClosed),
  note: win.note || '',
  isOpen: win.isOpen,
  saving: false,
  status: null,
});

export default function AdminDeadlinesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [forms, setForms] = useState<Record<string, PhaseFormState>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const loadWindows = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const windows = await adminGetSubmissionWindows();
      const nextForms: Record<string, PhaseFormState> = {};
      for (const phase of PHASE_ORDER) {
        const found = windows.find((w) => w.phase === phase);
        nextForms[phase] = found
          ? buildFormState(found)
          : buildFormState({
              phase,
              opensAt: null,
              closesAt: null,
              isOpen: false,
              note: null,
              isManuallyClosed: false,
            });
      }
      setForms(nextForms);
    } catch (err) {
      console.error('Failed to load submission windows:', err);
      setLoadError('Failed to load submission windows. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadWindows();
  }, [isAuthenticated, loadWindows]);

  const updateForm = (phase: SubmissionPhase, patch: Partial<PhaseFormState>) => {
    setForms((prev) => ({
      ...prev,
      [phase]: { ...prev[phase], ...patch },
    }));
  };

  const handleSave = async (phase: SubmissionPhase) => {
    const form = forms[phase];
    if (!form) return;

    updateForm(phase, { saving: true, status: null });

    try {
      const updated = await adminUpdateSubmissionWindow(phase, {
        opensAt: localInputToIso(form.opensAt),
        closesAt: localInputToIso(form.closesAt),
        isManuallyClosed: form.isManuallyClosed,
        note: form.note.trim() ? form.note.trim() : null,
      });

      setForms((prev) => ({
        ...prev,
        [phase]: {
          ...buildFormState(updated),
          status: { type: 'success', message: 'Saved successfully.' },
        },
      }));
    } catch (err) {
      console.error(`Failed to update submission window for ${phase}:`, err);
      updateForm(phase, {
        saving: false,
        status: {
          type: 'error',
          message: 'Failed to save changes. Please try again.',
        },
      });
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary mb-1">
            Submission Windows
          </p>
          <h1 className="font-serif text-2xl md:text-3xl font-semibold text-foreground">
            Deadlines
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
            Control when each submission phase opens and closes. Times are shown
            and saved in your local timezone.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : loadError ? (
          <div className="rounded-2xl border border-[#fecaca] bg-[#fef2f2] p-6 text-center">
            <AlertCircle className="h-6 w-6 text-destructive mx-auto mb-2" />
            <p className="text-sm text-destructive">{loadError}</p>
            <Button variant="outline" className="mt-4" onClick={loadWindows}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {PHASE_ORDER.map((phase) => {
              const form = forms[phase];
              if (!form) return null;

              return (
                <div
                  key={phase}
                  className="rounded-2xl border border-border bg-white p-6 shadow-[0_20px_60px_-40px_rgba(109,3,92,0.5)]"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#ecdfec] mb-5">
                    <div className="flex items-center gap-2">
                      <CalendarClock className="h-5 w-5 text-primary" />
                      <h2 className="font-serif text-lg font-semibold text-foreground">
                        {PHASE_LABELS[phase]}
                      </h2>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                        form.isOpen
                          ? 'bg-[#f2faf3] text-[#1f5b34] border border-[#cfe6d4]'
                          : 'bg-secondary text-secondary-foreground border border-[#e9c96b]'
                      }`}
                    >
                      {form.isOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor={`${phase}-opensAt`} className="text-muted-foreground">
                        Opens At
                      </Label>
                      <Input
                        id={`${phase}-opensAt`}
                        type="datetime-local"
                        value={form.opensAt}
                        onChange={(e) =>
                          updateForm(phase, { opensAt: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`${phase}-closesAt`} className="text-muted-foreground">
                        Closes At
                      </Label>
                      <Input
                        id={`${phase}-closesAt`}
                        type="datetime-local"
                        value={form.closesAt}
                        onChange={(e) =>
                          updateForm(phase, { closesAt: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label htmlFor={`${phase}-note`} className="text-muted-foreground">
                      Note
                    </Label>
                    <Input
                      id={`${phase}-note`}
                      type="text"
                      value={form.note}
                      onChange={(e) => updateForm(phase, { note: e.target.value })}
                      placeholder="Optional note shown to applicants"
                      className="mt-1"
                    />
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <input
                      id={`${phase}-manual`}
                      type="checkbox"
                      checked={form.isManuallyClosed}
                      onChange={(e) =>
                        updateForm(phase, { isManuallyClosed: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                    />
                    <Label
                      htmlFor={`${phase}-manual`}
                      className="flex items-center gap-1 text-sm text-foreground cursor-pointer"
                    >
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                      Manually close this window (overrides the schedule)
                    </Label>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <div className="min-h-[1.5rem]">
                      {form.status?.type === 'success' && (
                        <span className="inline-flex items-center gap-1.5 text-sm text-[#1f5b34]">
                          <CheckCircle2 className="h-4 w-4" />
                          {form.status.message}
                        </span>
                      )}
                      {form.status?.type === 'error' && (
                        <span className="inline-flex items-center gap-1.5 text-sm text-destructive">
                          <AlertCircle className="h-4 w-4" />
                          {form.status.message}
                        </span>
                      )}
                    </div>
                    <Button
                      onClick={() => handleSave(phase)}
                      disabled={form.saving}
                      className="rounded-full"
                    >
                      {form.saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save'
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
