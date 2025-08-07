import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, PUT, DELETE } from "./route";
import { connectTestDB, closeTestDB, clearTestDB } from "@/test/db-utils";
import SupportTicket from "@/app/models/SupportTicket";
import { mockSupportTicket, mockUser, mockAdmin } from "@/test/utils";

// Mock JWT verification
const mockVerifyToken = vi.fn();
vi.mock("@/app/lib/auth", () => ({
  verifyToken: mockVerifyToken,
}));

describe("/api/support/tickets/[id]", () => {
  let testTicket: any;

  beforeEach(async () => {
    await connectTestDB();
    testTicket = await SupportTicket.create({
      ...mockSupportTicket,
      submittedBy: mockUser._id,
    });
  });

  afterEach(async () => {
    await clearTestDB();
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  describe("GET /api/support/tickets/[id]", () => {
    it("should return ticket details for owner", async () => {
      mockVerifyToken.mockResolvedValue(mockUser);

      const request = new NextRequest(
        `http://localhost:3000/api/support/tickets/${testTicket._id}`,
        {
          headers: { authorization: "Bearer test-token" },
        }
      );

      const response = await GET(request, {
        params: { id: testTicket._id.toString() },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ticket._id).toBe(testTicket._id.toString());
      expect(data.ticket.subject).toBe(mockSupportTicket.subject);
    });

    it("should return ticket details for admin", async () => {
      mockVerifyToken.mockResolvedValue(mockAdmin);

      const request = new NextRequest(
        `http://localhost:3000/api/support/tickets/${testTicket._id}`,
        {
          headers: { authorization: "Bearer admin-token" },
        }
      );

      const response = await GET(request, {
        params: { id: testTicket._id.toString() },
      });

      expect(response.status).toBe(200);
    });

    it("should return 403 for unauthorized user", async () => {
      const otherUser = { ...mockUser, _id: "other-user-id" };
      mockVerifyToken.mockResolvedValue(otherUser);

      const request = new NextRequest(
        `http://localhost:3000/api/support/tickets/${testTicket._id}`,
        {
          headers: { authorization: "Bearer other-token" },
        }
      );

      const response = await GET(request, {
        params: { id: testTicket._id.toString() },
      });

      expect(response.status).toBe(403);
    });

    it("should return 404 for non-existent ticket", async () => {
      mockVerifyToken.mockResolvedValue(mockUser);

      const request = new NextRequest(
        "http://localhost:3000/api/support/tickets/nonexistent",
        {
          headers: { authorization: "Bearer test-token" },
        }
      );

      const response = await GET(request, { params: { id: "nonexistent" } });

      expect(response.status).toBe(404);
    });
  });

  describe("PUT /api/support/tickets/[id]", () => {
    it("should allow admin to update ticket status", async () => {
      mockVerifyToken.mockResolvedValue(mockAdmin);

      const updateData = {
        status: "In Progress",
        priority: "High",
      };

      const request = new NextRequest(
        `http://localhost:3000/api/support/tickets/${testTicket._id}`,
        {
          method: "PUT",
          headers: {
            authorization: "Bearer admin-token",
            "content-type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, {
        params: { id: testTicket._id.toString() },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.ticket.status).toBe("In Progress");
      expect(data.ticket.priority).toBe("High");
    });

    it("should prevent regular users from updating tickets", async () => {
      mockVerifyToken.mockResolvedValue(mockUser);

      const updateData = { status: "Closed" };

      const request = new NextRequest(
        `http://localhost:3000/api/support/tickets/${testTicket._id}`,
        {
          method: "PUT",
          headers: {
            authorization: "Bearer test-token",
            "content-type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, {
        params: { id: testTicket._id.toString() },
      });

      expect(response.status).toBe(403);
    });
  });

  describe("DELETE /api/support/tickets/[id]", () => {
    it("should allow admin to delete tickets", async () => {
      mockVerifyToken.mockResolvedValue(mockAdmin);

      const request = new NextRequest(
        `http://localhost:3000/api/support/tickets/${testTicket._id}`,
        {
          method: "DELETE",
          headers: { authorization: "Bearer admin-token" },
        }
      );

      const response = await DELETE(request, {
        params: { id: testTicket._id.toString() },
      });

      expect(response.status).toBe(200);

      // Verify ticket is deleted
      const deletedTicket = await SupportTicket.findById(testTicket._id);
      expect(deletedTicket).toBeNull();
    });

    it("should prevent regular users from deleting tickets", async () => {
      mockVerifyToken.mockResolvedValue(mockUser);

      const request = new NextRequest(
        `http://localhost:3000/api/support/tickets/${testTicket._id}`,
        {
          method: "DELETE",
          headers: { authorization: "Bearer test-token" },
        }
      );

      const response = await DELETE(request, {
        params: { id: testTicket._id.toString() },
      });

      expect(response.status).toBe(403);
    });
  });
});
