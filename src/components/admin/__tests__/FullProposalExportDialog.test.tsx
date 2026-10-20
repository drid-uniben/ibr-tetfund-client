import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FullProposalExportDialog from "@/components/admin/FullProposalExportDialog";

const exportFullProposalsDocx = vi.fn();

vi.mock("@/services/api", () => ({
  FULL_PROPOSAL_EXPORT_FIELDS: [
    { key: "title", label: "Project title" },
    { key: "name", label: "Researcher name" },
    { key: "faculty", label: "Faculty" },
    { key: "department", label: "Department" },
    { key: "score", label: "Score" },
    { key: "status", label: "Decision status" },
    { key: "comments", label: "Review comments" },
    { key: "funding", label: "Funding amount" },
    { key: "link", label: "Link to full proposal document" },
  ],
  exportFullProposalsDocx: (...a: unknown[]) => exportFullProposalsDocx(...a),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const faculties = [
  { _id: "Science", title: "Science" },
  { _id: "Arts", title: "Arts" },
];

beforeEach(() => {
  vi.clearAllMocks();
  document.body.style.pointerEvents = "";
  document.body.style.overflow = "";
});

describe("FullProposalExportDialog", () => {
  it("has every field ticked by default and exports them all", async () => {
    exportFullProposalsDocx.mockResolvedValue(undefined);
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(<FullProposalExportDialog open onOpenChange={onOpenChange} faculties={faculties} />);

    expect(screen.getByLabelText("Researcher name")).toBeChecked();
    await user.click(screen.getByRole("button", { name: /^export$/i }));

    await waitFor(() => expect(exportFullProposalsDocx).toHaveBeenCalledTimes(1));
    const params = exportFullProposalsDocx.mock.calls[0][0];
    expect(params.fields).toHaveLength(9);
    expect(params).toMatchObject({
      sort: "title",
      order: "asc",
      faculties: [],
      status: "all",
      includeUnreviewed: false,
      requireScore: false,
      layout: "cards",
      linkStyle: "url",
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("leaves out an unticked field and passes selected faculties", async () => {
    exportFullProposalsDocx.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<FullProposalExportDialog open onOpenChange={vi.fn()} faculties={faculties} />);

    await user.click(screen.getByLabelText("Researcher name"));
    await user.click(screen.getByLabelText("Arts"));
    await user.click(screen.getByLabelText(/only proposals that have review comments/i));
    await user.click(screen.getByRole("button", { name: /^export$/i }));

    await waitFor(() => expect(exportFullProposalsDocx).toHaveBeenCalled());
    const params = exportFullProposalsDocx.mock.calls[0][0];
    expect(params.fields).not.toContain("name");
    expect(params.fields).toContain("title");
    expect(params.faculties).toEqual(["Arts"]);
    expect(params.includeUnreviewed).toBe(true);
  });

  it("exports as a table with a short View link when chosen", async () => {
    exportFullProposalsDocx.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<FullProposalExportDialog open onOpenChange={vi.fn()} faculties={faculties} />);

    await user.click(screen.getByLabelText(/table \(one row per proposal/i));
    await user.click(screen.getByLabelText(/short "view" link/i));
    await user.click(screen.getByRole("button", { name: /^export$/i }));

    await waitFor(() => expect(exportFullProposalsDocx).toHaveBeenCalled());
    expect(exportFullProposalsDocx.mock.calls[0][0]).toMatchObject({
      layout: "table",
      linkStyle: "view",
    });
  });

  it("hides the link style choice when the link field is unticked", async () => {
    const user = userEvent.setup();
    render(<FullProposalExportDialog open onOpenChange={vi.fn()} faculties={faculties} />);
    expect(screen.getByLabelText(/full url/i)).toBeInTheDocument();
    await user.click(screen.getByLabelText("Link to full proposal document"));
    expect(screen.queryByLabelText(/full url/i)).not.toBeInTheDocument();
  });

  it("disables export when no field is selected", async () => {
    const user = userEvent.setup();
    render(<FullProposalExportDialog open onOpenChange={vi.fn()} faculties={faculties} />);
    await user.click(screen.getByRole("button", { name: /clear/i }));
    expect(screen.getByRole("button", { name: /^export$/i })).toBeDisabled();
  });
});
