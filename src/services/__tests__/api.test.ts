import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the default-exported axios instance created inside api.ts. vi.mock
// factories are hoisted above imports/consts, so the shared spy object must
// be created via vi.hoisted to be visible inside the factory.
const { mockAxiosInstance } = vi.hoisted(() => ({
  mockAxiosInstance: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

vi.mock("axios", () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance),
    isCancel: vi.fn(() => false),
  },
}));

import {
  getFacultyData,
  submitStaffProposal,
  submitMasterProposal,
  type AcademicUnit,
} from "@/services/api";

describe("api service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getFacultyData", () => {
    it("GETs /faculties/data and returns response.data.data as AcademicUnit[]", async () => {
      const payload: AcademicUnit[] = [
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
          title: "Faculty of Science",
          type: "faculty",
          departments: [{ code: "DEP-CS", title: "Computer Science" }],
        },
      ];

      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { data: payload },
      });

      const result = await getFacultyData();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/faculties/data");
      expect(result).toEqual(payload);
      expect(result[0].departments[0]).toEqual({
        code: "DEP-CE",
        title: "Civil Engineering",
      });
    });

    it("propagates errors from the GET request", async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error("network down"));

      await expect(getFacultyData()).rejects.toThrow("network down");
    });
  });

  describe("submitStaffProposal", () => {
    it("POSTs the FormData to /submit/staff-proposal as multipart/form-data", async () => {
      const formData = new FormData();
      formData.append("fullName", "Jane Doe");

      mockAxiosInstance.post.mockResolvedValueOnce({
        data: { success: true },
      });

      const result = await submitStaffProposal(formData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/submit/staff-proposal",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      expect(result).toEqual({ success: true });
    });
  });

  describe("submitMasterProposal", () => {
    it("POSTs the FormData to /submit/master-proposal as multipart/form-data", async () => {
      const formData = new FormData();
      formData.append("fullName", "John Smith");

      mockAxiosInstance.post.mockResolvedValueOnce({
        data: { success: true },
      });

      const result = await submitMasterProposal(formData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/submit/master-proposal",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      expect(result).toEqual({ success: true });
    });
  });
});
