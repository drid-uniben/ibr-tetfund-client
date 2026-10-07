import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FullProposalDecisionsPanelWrapper from "@/app/admin/decisions_2/page";

const getFullProposalsForDecision = vi.fn();
const updateFullProposalStatus = vi.fn();

vi.mock("@/services/api", () => ({
  getFullProposalsForDecision: (...a: unknown[]) => getFullProposalsForDecision(...a),
  updateFullProposalStatus: (...a: unknown[]) => updateFullProposalStatus(...a),
  getFacultiesWithProposals: vi.fn().mockResolvedValue([]),
  assignFullProposalScore: vi.fn(),
  editFullProposalScore: vi.fn(),
  editFullProposalFundingAmount: vi.fn(),
  notifyFullProposalApplicants: vi.fn(),
  FULL_PROPOSAL_EXPORT_FIELDS: [],
  exportFullProposalsDocx: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ isAuthenticated: true, isLoading: false }),
}));
vi.mock("@/components/admin/AdminLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const row = (over: Record<string, unknown> = {}) => ({
  _id: "fp1",
  status: "submitted",
  score: 80,
  submittedAt: "2026-09-01T00:00:00Z",
  deadline: null,
  originalProposal: { projectTitle: "Soil study" },
  submitter: { name: "Ada Obi", email: "a@b.c" },
  faculty: { _id: "Science", title: "Science" },
  award: { fundingAmount: 500000 },
  ...over,
});

const load = (rows: unknown[]) =>
  getFullProposalsForDecision.mockResolvedValue({
    data: rows,
    totalPages: 1,
    total: rows.length,
    statistics: { totalFullProposals: rows.length, pendingDecisions: rows.length, approved: 0, rejected: 0, approvedBudget: 0, submittedThisMonth: 0, nearingDeadline: 0 },
  });

const openAction = async (user: ReturnType<typeof userEvent.setup>, name: RegExp) => {
  await user.click(await screen.findByRole("button", { name: "" }));
  await user.click(await screen.findByRole("menuitem", { name }));
  return screen.findByRole("dialog");
};

beforeEach(() => {
  vi.clearAllMocks();
  document.body.style.pointerEvents = "";
  document.body.style.overflow = "";
  updateFullProposalStatus.mockResolvedValue({ success: true });
});

describe("decisions_2 decision dialog with a saved draft review", { timeout: 15000 }, () => {
  it("prefills the approve dialog with the draft comments and budget", async () => {
    load([row({ draftReviewComments: "Strong methodology", draftFundingAmount: 750000 })]);
    const user = userEvent.setup();
    render(<FullProposalDecisionsPanelWrapper />);

    const dialog = await openAction(user, /approve/i);
    expect(within(dialog).getByDisplayValue("Strong methodology")).toBeInTheDocument();
    expect(within(dialog).getByDisplayValue("750000")).toBeInTheDocument();
  });

  it("offers send / don't send on reject and can withhold the comments", async () => {
    load([row({ draftReviewComments: "Internal note" })]);
    const user = userEvent.setup();
    render(<FullProposalDecisionsPanelWrapper />);

    const dialog = await openAction(user, /reject/i);
    expect(within(dialog).getByDisplayValue("Internal note")).toBeInTheDocument();
    await user.click(within(dialog).getByLabelText(/do not send comments/i));
    await user.click(within(dialog).getByRole("button", { name: /^reject$/i }));

    await waitFor(() =>
      expect(updateFullProposalStatus).toHaveBeenCalledWith("fp1", {
        status: "rejected",
        reviewComments: "Internal note",
        sendComments: false,
      })
    );
  });

  it("does not show the choice when there is no draft review", async () => {
    load([row()]);
    const user = userEvent.setup();
    render(<FullProposalDecisionsPanelWrapper />);

    const dialog = await openAction(user, /reject/i);
    expect(within(dialog).queryByLabelText(/do not send comments/i)).not.toBeInTheDocument();
    await user.type(within(dialog).getByRole("textbox"), "Not suitable");
    await user.click(within(dialog).getByRole("button", { name: /^reject$/i }));

    await waitFor(() =>
      expect(updateFullProposalStatus).toHaveBeenCalledWith("fp1", {
        status: "rejected",
        reviewComments: "Not suitable",
      })
    );
  });
});
