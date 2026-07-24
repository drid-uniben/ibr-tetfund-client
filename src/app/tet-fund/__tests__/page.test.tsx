import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usePathname } from "next/navigation";
import TETFundForm from "@/app/tet-fund/page";
import type { AcademicUnit } from "@/services/api";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/tet-fund"),
}));

const mockGetFacultyData = vi.fn();
const mockSubmitStaffProposal = vi.fn();

vi.mock("@/services/api", () => ({
  getFacultyData: (...args: unknown[]) => mockGetFacultyData(...args),
  submitStaffProposal: (...args: unknown[]) => mockSubmitStaffProposal(...args),
}));

const FACULTY_DATA: AcademicUnit[] = [
  {
    code: "FAC-ENG",
    title: "Faculty of Engineering",
    type: "faculty",
    departments: [
      { code: "DEP-CE", title: "Civil Engineering" },
      { code: "DEP-EE", title: "Electrical/Electronic Engineering" },
    ],
  },
  {
    code: "FAC-SCI",
    title: "Faculty of Life Sciences",
    type: "faculty",
    departments: [{ code: "DEP-BIO", title: "Biological Sciences" }],
  },
];

// The Faculty/Department <label> elements in this form are not wired to
// their <select> via htmlFor/id, so getByLabelText can't resolve them.
// Resolve directly by the select's `name` attribute instead.
function selectByName(name: string): HTMLSelectElement {
  const el = document.querySelector(`select[name="${name}"]`);
  if (!el) throw new Error(`select[name="${name}"] not found`);
  return el as HTMLSelectElement;
}

describe("TETFundForm faculty/department selection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (usePathname as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      "/tet-fund"
    );
    localStorage.clear();
    mockGetFacultyData.mockResolvedValue(FACULTY_DATA);
  });

  it("populates the department select with the selected faculty's nested departments, using department titles as option values", async () => {
    const user = userEvent.setup();
    render(<TETFundForm />);

    await waitFor(() => {
      expect(mockGetFacultyData).toHaveBeenCalledTimes(1);
    });

    await waitFor(() =>
      expect(
        screen.getByRole("option", { name: "Faculty of Engineering" })
      ).toBeInTheDocument()
    );

    const facultySelect = selectByName("faculty");

    // Select faculty by its title.
    await user.selectOptions(facultySelect, "Faculty of Engineering");

    const departmentSelect = selectByName("department");

    // Department select is populated from the nested departments of the
    // selected unit, and options use department TITLES as their value.
    const civilOption = screen.getByRole("option", {
      name: "Civil Engineering",
    }) as HTMLOptionElement;
    const eeOption = screen.getByRole("option", {
      name: "Electrical/Electronic Engineering",
    }) as HTMLOptionElement;

    expect(civilOption.value).toBe("Civil Engineering");
    expect(eeOption.value).toBe("Electrical/Electronic Engineering");

    // Departments belonging to the OTHER faculty must not be present.
    expect(
      screen.queryByRole("option", { name: "Biological Sciences" })
    ).not.toBeInTheDocument();

    expect(departmentSelect).not.toBeDisabled();
  });

  it("switching faculty replaces the department options with the newly selected unit's departments", async () => {
    const user = userEvent.setup();
    render(<TETFundForm />);

    await waitFor(() => {
      expect(mockGetFacultyData).toHaveBeenCalledTimes(1);
    });

    await waitFor(() =>
      expect(
        screen.getByRole("option", { name: "Faculty of Life Sciences" })
      ).toBeInTheDocument()
    );

    const facultySelect = selectByName("faculty");

    await user.selectOptions(facultySelect, "Faculty of Engineering");
    expect(
      screen.getByRole("option", { name: "Civil Engineering" })
    ).toBeInTheDocument();

    await user.selectOptions(facultySelect, "Faculty of Life Sciences");
    expect(
      screen.getByRole("option", { name: "Biological Sciences" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "Civil Engineering" })
    ).not.toBeInTheDocument();
  });

  it("department select stays disabled until a faculty is chosen", async () => {
    render(<TETFundForm />);

    await waitFor(() => {
      expect(mockGetFacultyData).toHaveBeenCalledTimes(1);
    });

    const departmentSelect = selectByName("department");
    expect(departmentSelect).toBeDisabled();
  });
});

/*
 * UNIBEN / generic email regex checks.
 *
 * The regexes below live inline in src/app/tet-fund/page.tsx
 * (validateUnibenEmail / validateEmail) and are not exported. Per task
 * instructions we do not refactor app code just to export them for testing;
 * these are local copies of the exact same patterns, kept in sync manually.
 */
describe("email validation regexes (local copies from tet-fund/page.tsx)", () => {
  const unibenEmailRegex = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9-]+\.)*uniben\.edu$/;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  describe("UNIBEN email regex", () => {
    it("accepts a plain uniben.edu address", () => {
      expect(unibenEmailRegex.test("name@uniben.edu")).toBe(true);
    });

    it("accepts a uniben.edu subdomain address", () => {
      expect(unibenEmailRegex.test("name@eng.uniben.edu")).toBe(true);
    });

    it("rejects a non-uniben address", () => {
      expect(unibenEmailRegex.test("name@gmail.com")).toBe(false);
    });

    it("rejects a look-alike domain that is not uniben.edu", () => {
      expect(unibenEmailRegex.test("name@notuniben.edu")).toBe(false);
    });
  });

  describe("generic email regex", () => {
    it("accepts a standard email address", () => {
      expect(emailRegex.test("someone@gmail.com")).toBe(true);
    });

    it("rejects an address without a TLD", () => {
      expect(emailRegex.test("someone@gmail")).toBe(false);
    });

    it("rejects an address missing the @ symbol", () => {
      expect(emailRegex.test("someone.gmail.com")).toBe(false);
    });
  });
});
