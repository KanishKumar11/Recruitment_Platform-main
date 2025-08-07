import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";
import { connectTestDB, closeTestDB, clearTestDB } from "@/test/db-utils";
import SupportTicket from "@/app/models/SupportTicket";
import { mockSupportTicket, mockUser } from "@/test/utils";

// Mock JWT verification
vi.mock("@/app/lib/auth", () => ({
  verifyToken: vi.fn().mockResolvedValue(mockUser),
}));

// Mock email service
vi.mock("@/app/lib/supportEmailService", () => ({
  sendNewTicketNotification: vi.fn().mockResolvedValue(true),
}));

describe("/api/support/tickets", () => {
  beforeEach(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  describe("GET /api/support/tickets", () => {
    it("should return user tickets with pagination", async () => {
      // Create test tickets
      await SupportTicket.create({
        ...mockSupportTicket,
        submittedBy: mockUser._id,
      });

      const request = new NextRequest(
        "http://localhost:3000/api/support/tickets",
        {
          headers: { authorization: "Bearer test-token" },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tickets).toHaveLength(1);
      expect(data.tickets[0].subject).toBe(mockSupportTicket.subject);
      expect(data.pagination).toBeDefined();
    });

    it("should filter tickets by status", async () => {
      await SupportTicket.create({
        ...mockSupportTicket,
        submittedBy: mockUser._id,
        status: "Open",
      });
      await SupportTicket.create({
        ...mockSupportTicket,
        _id: "ticket-456",
        ticketNumber: "ST-2024-002",
        submittedBy: mockUser._id,
        status: "Closed",
      });

      const request = new NextRequest(
        "http://localhost:3000/api/support/tickets?status=Open",
        {
          headers: { authorization: "Bearer test-token" },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tickets).toHaveLength(1);
      expect(data.tickets[0].status).toBe("Open");
    });

    it("should return 401 for unauthenticated requests", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/support/tickets"
      );

      const response = await GET(request);

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/support/tickets", () => {
    it("should create a new support ticket", async () => {
      const ticketData = {
        subject: "New Test Ticket",
        message: "This is a new test ticket",
        category: "Technical Issue",
        priority: "High",
      };

      const request = new NextRequest(
        "http://localhost:3000/api/support/tickets",
        {
          method: "POST",
          headers: {
            authorization: "Bearer test-token",
            "content-type": "application/json",
          },
          body: JSON.stringify(ticketData),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.ticket.subject).toBe(ticketData.subject);
      expect(data.ticket.submittedBy).toBe(mockUser._id);
      expect(data.ticket.ticketNumber).toMatch(/^ST-\d{4}-\d{3}$/);
    });

    it("should validate required fields", async () => {
      const invalidData = {
        subject: "", // Empty subject
        message: "Test message",
      };

      const request = new NextRequest(
        "http://localhost:3000/api/support/tickets",
        {
          method: "POST",
          headers: {
            authorization: "Bearer test-token",
            "content-type": "application/json",
          },
          body: JSON.stringify(invalidData),
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("should handle rate limiting", async () => {
      // Create multiple tickets quickly to trigger rate limiting
      const ticketData = {
        subject: "Rate Limit Test",
        message: "Testing rate limiting",
        category: "General Inquiry",
      };

      const requests = Array(6)
        .fill(null)
        .map(
          () =>
            new NextRequest("http://localhost:3000/api/support/tickets", {
              method: "POST",
              headers: {
                authorization: "Bearer test-token",
                "content-type": "application/json",
              },
              body: JSON.stringify(ticketData),
            })
        );

      const responses = await Promise.all(requests.map((req) => POST(req)));

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(
        (res) => res.status === 429
      );
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});
