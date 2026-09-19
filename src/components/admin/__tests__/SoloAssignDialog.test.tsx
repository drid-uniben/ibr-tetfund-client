import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SoloAssignDialog from "@/components/admin/SoloAssignDialog";

const getSoloReviewers = vi.fn();
const assignSoloReviewer = vi.fn();

vi.mock("@/services/api", () => ({
  getSoloReviewers: (...a: unknown[]) => getSoloReviewers(...a),
  assignSoloReviewer: (...a: unknown[]) => assignSoloReviewer(...a),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const reviewer = { _id: "r1", name: "Solo Person", email: "solo@uniben.edu", facultyTitle: "Faculty of Law" };

beforeEach(() => {
  vi.clearAllMocks();
  document.body.style.pointerEvents = "";
  document.body.style.overflow = "";
});

describe("SoloAssignDialog", () => {
  it("lists the solo reviewer and assigns on confirm", async () => {
    getSoloReviewers.mockResolvedValue({ success: true, data: { reviewers: [reviewer], unavailable: [] } });
    assignSoloReviewer.mockResolvedValue({ success: true });
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<SoloAssignDialog proposalId="p1" onClose={onClose} onAssigned={vi.fn()} />);

    expect(await screen.findByText("Solo Person")).toBeInTheDocument();
    // a single reviewer is preselected
    await user.click(screen.getByRole("button", { name: /assign as solo reviewer/i }));

    await waitFor(() => expect(assignSoloReviewer).toHaveBeenCalledWith("p1", "r1"));
    expect(onClose).toHaveBeenCalled();
  });

  it("shows the server error instead of claiming nobody is available", async () => {
    getSoloReviewers.mockRejectedValue({ response: { data: { message: "Proposal not found" } } });

    render(<SoloAssignDialog proposalId="p1" onClose={vi.fn()} onAssigned={vi.fn()} />);

    expect(await screen.findByText("Proposal not found")).toBeInTheDocument();
    expect(screen.queryByText(/No solo reviewer is available/i)).toBeNull();
  });

  it("explains why a configured reviewer is unavailable", async () => {
    getSoloReviewers.mockResolvedValue({
      success: true,
      data: { reviewers: [], unavailable: [{ id: "6aad151852aeaa4b64d0060f", reason: "Reviewer account is inactive" }] },
    });

    render(<SoloAssignDialog proposalId="p1" onClose={vi.fn()} onAssigned={vi.fn()} />);

    expect(await screen.findByText(/No solo reviewer is available/i)).toBeInTheDocument();
    expect(screen.getByText(/d0060f: Reviewer account is inactive/)).toBeInTheDocument();
  });

  it("does not leave the page frozen after closing", async () => {
    getSoloReviewers.mockResolvedValue({ success: true, data: { reviewers: [reviewer], unavailable: [] } });
    const { rerender } = render(<SoloAssignDialog proposalId="p1" onClose={vi.fn()} onAssigned={vi.fn()} />);
    await screen.findByText("Solo Person");

    // simulate the Radix bug: body stays locked after the dialog closes
    document.body.style.pointerEvents = "none";
    document.body.style.overflow = "hidden";
    rerender(<SoloAssignDialog proposalId={null} onClose={vi.fn()} onAssigned={vi.fn()} />);

    await waitFor(
      () => {
        expect(document.body.style.pointerEvents).toBe("");
        expect(document.body.style.overflow).toBe("");
      },
      { timeout: 2000 }
    );
  });
});
