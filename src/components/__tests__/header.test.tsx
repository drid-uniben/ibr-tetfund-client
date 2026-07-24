import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import Header from "@/components/header";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

function mockPathname(path: string) {
  (usePathname as unknown as ReturnType<typeof vi.fn>).mockReturnValue(path);
}

/** Nav links render both a short (mobile) and full (desktop) label as
 * separate <span> children of the same <a>, so we resolve to the anchor via
 * closest("a") instead of relying on accessible-name computation (which
 * would otherwise concatenate both spans' text). */
function linkContainingText(text: string) {
  // "Home" has identical short/full labels so there may be two matching
  // spans (mobile + desktop) inside the same anchor — either resolves to
  // the same <a>.
  const [el] = screen.getAllByText(text);
  return el.closest("a");
}

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("on / shows both funding links but not Home", () => {
    mockPathname("/");
    render(<Header />);

    expect(screen.queryByText("Home")).not.toBeInTheDocument();

    expect(linkContainingText("TETFund IBR (Staff)")).toHaveAttribute(
      "href",
      "/tet-fund"
    );
    expect(linkContainingText("Master's Funding")).toHaveAttribute(
      "href",
      "/masters-funding"
    );

    // Short mobile labels are present too.
    expect(screen.getByText("Staff")).toBeInTheDocument();
    expect(screen.getByText("Master's")).toBeInTheDocument();
  });

  it("on /tet-fund shows Home + Master's but not the TETFund link", () => {
    mockPathname("/tet-fund");
    render(<Header />);

    expect(linkContainingText("Home")).toHaveAttribute("href", "/");
    expect(linkContainingText("Master's Funding")).toHaveAttribute(
      "href",
      "/masters-funding"
    );

    expect(screen.queryByText("TETFund IBR (Staff)")).not.toBeInTheDocument();
    expect(screen.queryByText("Staff")).not.toBeInTheDocument();
  });

  it("on /masters-funding shows Home + Staff/TETFund but not Master's", () => {
    mockPathname("/masters-funding");
    render(<Header />);

    expect(linkContainingText("Home")).toHaveAttribute("href", "/");
    expect(linkContainingText("TETFund IBR (Staff)")).toHaveAttribute(
      "href",
      "/tet-fund"
    );

    expect(screen.queryByText("Master's Funding")).not.toBeInTheDocument();
    expect(screen.queryByText("Master's")).not.toBeInTheDocument();
  });

  it("renders both short mobile labels and full labels for each visible link", () => {
    mockPathname("/tet-fund");
    render(<Header />);

    // "Home" has identical short/full labels, so both spans render the same
    // text — assert there are two occurrences (mobile + desktop).
    expect(screen.getAllByText("Home")).toHaveLength(2);
    expect(screen.getByText("Master's")).toBeInTheDocument();
    expect(screen.getByText("Master's Funding")).toBeInTheDocument();
  });

  it("renders the 'Staff' short label and full staff label on the home page", () => {
    mockPathname("/");
    render(<Header />);

    expect(screen.getByText("Staff")).toBeInTheDocument();
    expect(screen.getByText("TETFund IBR (Staff)")).toBeInTheDocument();
  });
});
