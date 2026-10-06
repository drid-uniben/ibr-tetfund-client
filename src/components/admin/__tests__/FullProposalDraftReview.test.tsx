import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FullProposalDraftReview from "@/components/admin/FullProposalDraftReview";

const saveFullProposalDraftReview = vi.fn();

vi.mock("@/services/api", () => ({
  saveFullProposalDraftReview: (...a: unknown[]) => saveFullProposalDraftReview(...a),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const baseProps = {
  fullProposalId: "fp1",
  status: "submitted" as const,
  estimatedBudget: 1000000,
  firstStageAmount: 800000,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("FullProposalDraftReview", () => {
  it("saves only the changed fields and reports the saved values", async () => {
    saveFullProposalDraftReview.mockResolvedValue({
      data: { score: 82, draftReviewComments: "Strong", draftFundingAmount: 900000, draftReviewedAt: "2026-10-06T10:00:00Z" },
    });
    const onSaved = vi.fn();
    const user = userEvent.setup();
    render(<FullProposalDraftReview {...baseProps} onSaved={onSaved} />);

    const save = screen.getByRole("button", { name: /save review/i });
    expect(save).toBeDisabled();

    await user.type(screen.getByLabelText(/score/i), "82");
    await user.type(screen.getByLabelText(/review comments/i), "Strong");
    await user.type(screen.getByLabelText(/proposed funding/i), "900000");
    await user.click(save);

    await waitFor(() =>
      expect(saveFullProposalDraftReview).toHaveBeenCalledWith("fp1", {
        score: 82,
        reviewComments: "Strong",
        fundingAmount: 900000,
      })
    );
    expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ score: 82 }));
  });

  it("blocks an out-of-range score", async () => {
    const user = userEvent.setup();
    render(<FullProposalDraftReview {...baseProps} onSaved={vi.fn()} />);
    await user.type(screen.getByLabelText(/score/i), "150");
    expect(screen.getByText(/between 1 and 100/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save review/i })).toBeDisabled();
  });

  it("is read-only once a decision exists", () => {
    render(
      <FullProposalDraftReview
        {...baseProps}
        status="approved"
        score={90}
        draftReviewComments="Done"
        onSaved={vi.fn()}
      />
    );
    expect(screen.getByLabelText(/review comments/i)).toBeDisabled();
    expect(screen.queryByRole("button", { name: /save review/i })).not.toBeInTheDocument();
  });
});
