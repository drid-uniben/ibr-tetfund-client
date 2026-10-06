"use client";

import { useState } from "react";
import { Loader2, FileDown } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FULL_PROPOSAL_EXPORT_FIELDS,
  exportFullProposalsDocx,
  type FullProposalExportField,
  type FullProposalExportParams,
} from "@/services/api";

interface FullProposalExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  faculties: { _id: string; title: string }[];
}

type SortKey = FullProposalExportParams["sort"];
type ThenBy = FullProposalExportParams["thenBy"];
type Order = FullProposalExportParams["order"];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "title", label: "Project title" },
  { value: "name", label: "Researcher name" },
  { value: "score", label: "Score" },
  { value: "submittedAt", label: "Submission date" },
  { value: "faculty", label: "Faculty (grouped together)" },
  { value: "faculty_department", label: "Faculty, then department (grouped)" },
];

const THEN_BY_OPTIONS: { value: ThenBy; label: string }[] = [
  { value: "title", label: "Project title" },
  { value: "name", label: "Researcher name" },
  { value: "score", label: "Score" },
  { value: "submittedAt", label: "Submission date" },
];

const defaultOrderFor = (key: ThenBy): Order =>
  key === "score" || key === "submittedAt" ? "desc" : "asc";

const orderLabels = (key: ThenBy): { asc: string; desc: string } => {
  if (key === "score") return { desc: "Highest first", asc: "Lowest first" };
  if (key === "submittedAt") return { desc: "Newest first", asc: "Oldest first" };
  return { asc: "A to Z", desc: "Z to A" };
};

const ALL_FIELDS = FULL_PROPOSAL_EXPORT_FIELDS.map((f) => f.key);

export default function FullProposalExportDialog({
  open,
  onOpenChange,
  faculties,
}: FullProposalExportDialogProps) {
  const [fields, setFields] = useState<FullProposalExportField[]>([...ALL_FIELDS]);
  const [sort, setSort] = useState<SortKey>("title");
  const [thenBy, setThenBy] = useState<ThenBy>("title");
  const [order, setOrder] = useState<Order>("asc");
  const [selectedFaculties, setSelectedFaculties] = useState<string[]>([]);
  const [status, setStatus] = useState<FullProposalExportParams["status"]>("all");
  const [reviewedOnly, setReviewedOnly] = useState(true);
  const [requireScore, setRequireScore] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const grouped = sort === "faculty" || sort === "faculty_department";
  const orderKey: ThenBy = grouped ? thenBy : (sort as ThenBy);
  const labels = orderLabels(orderKey);

  const toggleField = (key: FullProposalExportField) =>
    setFields((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
    );

  const toggleFaculty = (title: string) =>
    setSelectedFaculties((prev) =>
      prev.includes(title) ? prev.filter((f) => f !== title) : [...prev, title]
    );

  const handleSortChange = (value: SortKey) => {
    setSort(value);
    const isGrouped = value === "faculty" || value === "faculty_department";
    setOrder(defaultOrderFor(isGrouped ? thenBy : (value as ThenBy)));
  };

  const handleThenByChange = (value: ThenBy) => {
    setThenBy(value);
    setOrder(defaultOrderFor(value));
  };

  const handleExport = async () => {
    if (fields.length === 0) {
      toast.error("Select at least one field to include");
      return;
    }
    try {
      setIsExporting(true);
      await exportFullProposalsDocx({
        // keep the document's column order stable regardless of tick order
        fields: ALL_FIELDS.filter((f) => fields.includes(f)),
        sort,
        thenBy,
        order,
        faculties: selectedFaculties,
        status,
        includeUnreviewed: !reviewedOnly,
        requireScore,
      });
      toast.success("Export downloaded");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : "Failed to export");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isExporting && onOpenChange(next)}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export to Word</DialogTitle>
          <DialogDescription>
            Exports every full proposal that has review comments, as one document.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <fieldset className="space-y-2">
            <div className="flex items-center justify-between">
              <legend className="text-sm font-medium">What to include</legend>
              <div className="flex gap-3 text-xs">
                <button type="button" className="text-primary hover:underline" onClick={() => setFields([...ALL_FIELDS])}>
                  Select all
                </button>
                <button type="button" className="text-primary hover:underline" onClick={() => setFields([])}>
                  Clear
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FULL_PROPOSAL_EXPORT_FIELDS.map((field) => (
                <label key={field.key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fields.includes(field.key)}
                    onChange={() => toggleField(field.key)}
                  />
                  {field.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="space-y-3">
            <p className="text-sm font-medium">Order</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Order by</Label>
                <Select value={sort} onValueChange={(v) => handleSortChange(v as SortKey)}>
                  <SelectTrigger aria-label="Order by"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {grouped && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Within each group</Label>
                  <Select value={thenBy} onValueChange={(v) => handleThenByChange(v as ThenBy)}>
                    <SelectTrigger aria-label="Within each group"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {THEN_BY_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Direction</Label>
                <Select value={order} onValueChange={(v) => setOrder(v as Order)}>
                  <SelectTrigger aria-label="Direction"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">{labels.asc}</SelectItem>
                    <SelectItem value="desc">{labels.desc}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Filter</p>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Decision status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as FullProposalExportParams["status"])}>
                <SelectTrigger aria-label="Decision status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="submitted">Pending decision</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {faculties.length > 0 && (
              <fieldset className="space-y-1">
                <legend className="text-xs text-muted-foreground">
                  Faculties {selectedFaculties.length === 0 ? "(all)" : `(${selectedFaculties.length} selected)`}
                </legend>
                <div className="max-h-40 overflow-y-auto rounded-md border border-border p-2 space-y-1">
                  {faculties.map((faculty) => (
                    <label key={faculty._id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFaculties.includes(faculty.title)}
                        onChange={() => toggleFaculty(faculty.title)}
                      />
                      {faculty.title}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={reviewedOnly} onChange={(e) => setReviewedOnly(e.target.checked)} />
              Only proposals that have review comments
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={requireScore} onChange={(e) => setRequireScore(e.target.checked)} />
              Only proposals that have a score
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || fields.length === 0}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
