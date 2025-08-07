import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";
import { connectTestDB, closeTestDB, clearTestDB } from "@/test/db-utils";
import SupportTicket from "@/app/models/SupportTicket";
import {
  mockSupportTicket,
  mockUser,
  mockAdmin,
  mockTicketResponse,
} from "@/test/utils";

// Mock JWT verification
const mockVerifyToken = vi.fn();
vi.mock("@/app/lib/auth", () => ({
  verifyToken: mockVerifyToken,
}));

// Mock email service
vi.mock("@/app/lib/supportEmailService", () => ({
  sendResponseNotification: vi.fn().mockResolvedValue(true),
}));

describe("/api/support/tickets/[id]/responses", () => {
  let testTicket: any;

  beforeEach(async () => {
    await connectTestDB();
    testTicket = await SupportTicket.create({
      ...mockSupportTicket,
      submittedBy: mockUser._id,
      responses: [mockTicketResponse],
    });
  });

  afterEach(async () => {
    await clearTestDB();
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  describe("GET /api/support/tickets/[id]/responses", () => {
    it("should return all responses for admin", async () => {
      mockVerifyToken.mockResolvedValue(mockAdmin);

      const request = new NextRequest(
        `http://localhost:3000/api/support/tickets/${testTicket._id}/responses`,
        {
          headers: { authorization: "Bearer admin-token" },
        }
      );

      const response = await GET(request, {
        params: { id: testTicket._id.toString() },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.responses).toHaveLength(1);
      expect(data.responses[0].message).toBe(mockTicketResponse.message);
    });

    it("should filter internal responses for regular users", async () => {
      // Add internal response
      await SupportTicket.findByIdAndUpdate(testTicket._id, {
        $push: {
          responses: {
            ...mockTicketResponse,
            _id: "internal-response",
            message: "Internal admin note",
            isInternal: true,
          },
        },
      });

      mockVerifyToken.mockResolvedValue(mockUser);

      const request = new NextRequest(
        `http://localhost:3000/api/support/tickets/${testTicket._id}/responses`,
        {
          headers: { authorization: "Bearer test-token" },
        }
      );

      const response = await GET(request, {
        params: { id: testTicket._id.toString() },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.responses).toHaveLength(1); // Only non-internal response
      expect(data.responses[0].isInternal).toBe(false);
    });

    it("should return 403 for unauthorized user", async () => {
      const otherUser = { ...mockUser, _id: "other-user-id" };
      mockVerifyToken.mockResolvedValue(otherUser);

      const request = new NextRequest(
        `http://localhost:3000/api/support/tickets/${testTicket._id}/responses`,
        {
          headers: { authorization: "Bearer other-token" },
        }
      );

      const response = await GET(request, {
        params: { id: testTicket._id.toString() },
      });

      expect(response.status).toBe(403);
    });
  });

  describe("POST /api/support/tickets/[id]/responses", () => {
    it("should allow admin to add response", async () => {
      mockVerifyToken.mockResolvedValue(mockAdmin);

      const responseData = {
        message: "Thank you for your ticket. We are looking into this issue.",
        isInternal: false,
        notifyUser: true,
      };

      const request = new NextRequest(
        `http://localhost:3000/api/support/tickets/${testTicket._id}/responses`,
        {
          method: "POST",
          headers: {
            authorization: "Bearer admin-token",
            "content-type": "application/json",
          },
          body: JSON.stringify(responseData),
        }
      );

      const response = await POST(request, {
        params: { id: testTicket._id.toString() },
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.response.message).toBe(responseData.message);
      expect(data.response.respondedBy).toBe(mockAdmin._id);
    });

    it("should allow admin to add internal response", async () => {
      mockVerifyToken.mockResolvedValue(mockAdmin);

      const responseData = {
        message: "Internal note: This is a known issue",
        isInternal: true,
      };

      const request = new NextRequest(
        `http://localhost:3000/api/support/tickets/${testTicket._id}/responses`,
        {
          method: "POST",
          headers: {
            authorization: "Bearer admin-token",
            "content-type": "application/json",
          },
          body: JSON.stringify(responseData),
        }
      );

      const response = await POST(request, {
        params: { id: testTicket._id.toString() },
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.response.isInternal).toBe(true);
    });

    it("should prevent regular users from adding responses", async () => {
      mockVerifyToken.mockResolvedValue(mockUser);

      const responseData = {
        message: "User trying to respond",
      };

      const request = new NextRequest(
        `http://localhost:3000/api/support/tickets/${testTicket._id}/responses`,
        {
          method: "POST",
          headers: {
            authorization: "Bearer test-token",
            "content-type": "application/json",
          },
          body: JSON.stringify(responseData),
        }
      );

      const response = await POST(request, {
        params: { id: testTicket._id.toString() },
      });

      expect(response.status).toBe(403);
    });

    it("should validate response message", async () => {
      mockVerifyToken.mockResolvedValue(mockAdmin);

      const invalidData = {
        message: "", // Empty message
      };

      const request = new NextRequest(
        `http://localhost:3000/api/support/tickets/${testTicket._id}/responses`,
        {
          method: "POST",
          headers: {
            authorization: "Bearer admin-token",
            "content-type": "application/json",
          },
          body: JSON.stringify(invalidData),
        }
      );

      const response = await POST(request, {
        params: { id: testTicket._id.toString() },
      });

      expect(response.status).toBe(400);
    });
  });
});
