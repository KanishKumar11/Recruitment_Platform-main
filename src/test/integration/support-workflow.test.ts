import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { connectTestDB, closeTestDB, clearTestDB } from "@/test/db-utils";
import SupportTicket from "@/app/models/SupportTicket";
import { mockUser, mockAdmin } from "@/test/utils";

// Import API handlers
import {
  GET as getTickets,
  POST as createTicket,
} from "@/app/api/support/tickets/route";
import {
  GET as getTicket,
  PUT as updateTicket,
} from "@/app/api/support/tickets/[id]/route";
import {
  GET as getResponses,
  POST as addResponse,
} from "@/app/api/support/tickets/[id]/responses/route";

// Mock JWT verification
const mockVerifyToken = vi.fn();
vi.mock("@/app/lib/auth", () => ({
  verifyToken: mockVerifyToken,
}));

// Mock email service
const mockSendNewTicketNotification = vi.fn();
const mockSendResponseNotification = vi.fn();
vi.mock("@/app/lib/supportEmailService", () => ({
  sendNewTicketNotification: mockSendNewTicketNotification,
  sendResponseNotification: mockSendResponseNotification,
}));

describe("Support System Integration Tests", () => {
  beforeEach(async () => {
    await connectTestDB();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  describe("Complete Ticket Lifecycle", () => {
    it("should handle complete ticket creation to resolution workflow", async () => {
      // Step 1: User creates a ticket
      mockVerifyToken.mockResolvedValue(mockUser);
      mockSendNewTicketNotification.mockResolvedValue(true);

      const ticketData = {
        subject: "Integration Test Ticket",
        message: "This is an integration test ticket",
        category: "Technical Issue",
        priority: "High",
      };

      const createRequest = new NextRequest(
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

      const createResponse = await createTicket(createRequest);
      const createData = await createResponse.json();

      expect(createResponse.status).toBe(201);
      expect(createData.ticket.subject).toBe(ticketData.subject);
      expect(mockSendNewTicketNotification).toHaveBeenCalledOnce();

      const ticketId = createData.ticket._id;

      // Step 2: User views their ticket
      const viewRequest = new NextRequest(
        `http://localhost:3000/api/support/tickets/${ticketId}`,
        {
          headers: { authorization: "Bearer test-token" },
        }
      );

      const viewResponse = await getTicket(viewRequest, {
        params: { id: ticketId },
      });
      const viewData = await viewResponse.json();

      expect(viewResponse.status).toBe(200);
      expect(viewData.ticket._id).toBe(ticketId);

      // Step 3: Admin updates ticket status
      mockVerifyToken.mockResolvedValue(mockAdmin);

      const updateData = {
        status: "In Progress",
        assignedTo: mockAdmin._id,
      };

      const updateRequest = new NextRequest(
        `http://localhost:3000/api/support/tickets/${ticketId}`,
        {
          method: "PUT",
          headers: {
            authorization: "Bearer admin-token",
            "content-type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );

      const updateResponse = await updateTicket(updateRequest, {
        params: { id: ticketId },
      });
      const updateResponseData = await updateResponse.json();

      expect(updateResponse.status).toBe(200);
      expect(updateResponseData.ticket.status).toBe("In Progress");
      expect(updateResponseData.ticket.assignedTo).toBe(mockAdmin._id);

      // Step 4: Admin adds a response
      mockSendResponseNotification.mockResolvedValue(true);

      const responseData = {
        message: "Thank you for your ticket. We are investigating this issue.",
        isInternal: false,
        notifyUser: true,
      };

      const responseRequest = new NextRequest(
        `http://localhost:3000/api/support/tickets/${ticketId}/responses`,
        {
          method: "POST",
          headers: {
            authorization: "Bearer admin-token",
            "content-type": "application/json",
          },
          body: JSON.stringify(responseData),
        }
      );

      const responseResponse = await addResponse(responseRequest, {
        params: { id: ticketId },
      });
      const responseResponseData = await responseResponse.json();

      expect(responseResponse.status).toBe(201);
      expect(responseResponseData.response.message).toBe(responseData.message);
      expect(mockSendResponseNotification).toHaveBeenCalledOnce();

      // Step 5: User views responses
      mockVerifyToken.mockResolvedValue(mockUser);

      const getResponsesRequest = new NextRequest(
        `http://localhost:3000/api/support/tickets/${ticketId}/responses`,
        {
          headers: { authorization: "Bearer test-token" },
        }
      );

      const getResponsesResponse = await getResponses(getResponsesRequest, {
        params: { id: ticketId },
      });
      const getResponsesData = await getResponsesResponse.json();

      expect(getResponsesResponse.status).toBe(200);
      expect(getResponsesData.responses).toHaveLength(1);
      expect(getResponsesData.responses[0].message).toBe(responseData.message);

      // Step 6: Admin resolves ticket
      mockVerifyToken.mockResolvedValue(mockAdmin);

      const resolveData = { status: "Resolved" };

      const resolveRequest = new NextRequest(
        `http://localhost:3000/api/support/tickets/${ticketId}`,
        {
          method: "PUT",
          headers: {
            authorization: "Bearer admin-token",
            "content-type": "application/json",
          },
          body: JSON.stringify(resolveData),
        }
      );

      const resolveResponse = await updateTicket(resolveRequest, {
        params: { id: ticketId },
      });
      const resolveResponseData = await resolveResponse.json();

      expect(resolveResponse.status).toBe(200);
      expect(resolveResponseData.ticket.status).toBe("Resolved");
      expect(resolveResponseData.ticket.resolvedAt).toBeDefined();

      // Step 7: Verify final ticket state
      const finalTicket = await SupportTicket.findById(ticketId);
      expect(finalTicket?.status).toBe("Resolved");
      expect(finalTicket?.responses).toHaveLength(1);
      expect(finalTicket?.resolvedAt).toBeDefined();
    });

    it("should handle internal admin workflow with internal notes", async () => {
      // Create ticket as user
      mockVerifyToken.mockResolvedValue(mockUser);

      const ticket = await SupportTicket.create({
        ticketNumber: "ST-2024-INT-001",
        subject: "Internal Workflow Test",
        message: "Testing internal admin workflow",
        category: "Technical Issue",
        priority: "Medium",
        status: "Open",
        submittedBy: mockUser._id,
      });

      // Admin adds internal note
      mockVerifyToken.mockResolvedValue(mockAdmin);

      const internalNoteData = {
        message:
          "Internal note: This is a known issue, will fix in next release",
        isInternal: true,
      };

      const internalNoteRequest = new NextRequest(
        `http://localhost:3000/api/support/tickets/${ticket._id}/responses`,
        {
          method: "POST",
          headers: {
            authorization: "Bearer admin-token",
            "content-type": "application/json",
          },
          body: JSON.stringify(internalNoteData),
        }
      );

      const internalNoteResponse = await addResponse(internalNoteRequest, {
        params: { id: ticket._id.toString() },
      });
      expect(internalNoteResponse.status).toBe(201);

      // Admin adds public response
      const publicResponseData = {
        message: "We have identified the issue and are working on a fix",
        isInternal: false,
        notifyUser: true,
      };

      const publicResponseRequest = new NextRequest(
        `http://localhost:3000/api/support/tickets/${ticket._id}/responses`,
        {
          method: "POST",
          headers: {
            authorization: "Bearer admin-token",
            "content-type": "application/json",
          },
          body: JSON.stringify(publicResponseData),
        }
      );

      const publicResponseResponse = await addResponse(publicResponseRequest, {
        params: { id: ticket._id.toString() },
      });
      expect(publicResponseResponse.status).toBe(201);

      // User views responses (should only see public response)
      mockVerifyToken.mockResolvedValue(mockUser);

      const userViewRequest = new NextRequest(
        `http://localhost:3000/api/support/tickets/${ticket._id}/responses`,
        {
          headers: { authorization: "Bearer test-token" },
        }
      );

      const userViewResponse = await getResponses(userViewRequest, {
        params: { id: ticket._id.toString() },
      });
      const userViewData = await userViewResponse.json();

      expect(userViewResponse.status).toBe(200);
      expect(userViewData.responses).toHaveLength(1); // Only public response
      expect(userViewData.responses[0].isInternal).toBe(false);

      // Admin views responses (should see both)
      mockVerifyToken.mockResolvedValue(mockAdmin);

      const adminViewRequest = new NextRequest(
        `http://localhost:3000/api/support/tickets/${ticket._id}/responses`,
        {
          headers: { authorization: "Bearer admin-token" },
        }
      );

      const adminViewResponse = await getResponses(adminViewRequest, {
        params: { id: ticket._id.toString() },
      });
      const adminViewData = await adminViewResponse.json();

      expect(adminViewResponse.status).toBe(200);
      expect(adminViewData.responses).toHaveLength(2); // Both responses
    });
  });

  describe("Error Handling Workflows", () => {
    it("should handle email notification failures gracefully", async () => {
      mockVerifyToken.mockResolvedValue(mockUser);
      mockSendNewTicketNotification.mockRejectedValue(
        new Error("Email service unavailable")
      );

      const ticketData = {
        subject: "Email Failure Test",
        message: "Testing email failure handling",
        category: "General Inquiry",
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

      const response = await createTicket(request);
      const data = await response.json();

      // Ticket should still be created despite email failure
      expect(response.status).toBe(201);
      expect(data.ticket.subject).toBe(ticketData.subject);

      // Verify ticket exists in database
      const savedTicket = await SupportTicket.findById(data.ticket._id);
      expect(savedTicket).toBeTruthy();
    });

    it("should handle database errors appropriately", async () => {
      mockVerifyToken.mockResolvedValue(mockUser);

      // Try to create ticket with invalid data that will cause DB error
      const invalidData = {
        subject: "A".repeat(1000), // Exceeds max length
        message: "Test message",
        category: "Technical Issue",
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

      const response = await createTicket(request);
      expect(response.status).toBe(400);
    });
  });

  describe("Permission and Security Workflows", () => {
    it("should enforce proper access controls throughout workflow", async () => {
      // Create ticket as user A
      const userA = { ...mockUser, _id: "user-a-id" };
      const userB = { ...mockUser, _id: "user-b-id" };

      mockVerifyToken.mockResolvedValue(userA);

      const ticket = await SupportTicket.create({
        ticketNumber: "ST-2024-SEC-001",
        subject: "Security Test Ticket",
        message: "Testing security controls",
        category: "Account Issue",
        priority: "Low",
        status: "Open",
        submittedBy: userA._id,
      });

      // User B tries to access User A's ticket
      mockVerifyToken.mockResolvedValue(userB);

      const unauthorizedRequest = new NextRequest(
        `http://localhost:3000/api/support/tickets/${ticket._id}`,
        {
          headers: { authorization: "Bearer user-b-token" },
        }
      );

      const unauthorizedResponse = await getTicket(unauthorizedRequest, {
        params: { id: ticket._id.toString() },
      });
      expect(unauthorizedResponse.status).toBe(403);

      // User B tries to add response to User A's ticket
      const unauthorizedResponseRequest = new NextRequest(
        `http://localhost:3000/api/support/tickets/${ticket._id}/responses`,
        {
          method: "POST",
          headers: {
            authorization: "Bearer user-b-token",
            "content-type": "application/json",
          },
          body: JSON.stringify({ message: "Unauthorized response" }),
        }
      );

      const unauthorizedResponseResponse = await addResponse(
        unauthorizedResponseRequest,
        { params: { id: ticket._id.toString() } }
      );
      expect(unauthorizedResponseResponse.status).toBe(403);

      // Admin can access and modify any ticket
      mockVerifyToken.mockResolvedValue(mockAdmin);

      const adminRequest = new NextRequest(
        `http://localhost:3000/api/support/tickets/${ticket._id}`,
        {
          headers: { authorization: "Bearer admin-token" },
        }
      );

      const adminResponse = await getTicket(adminRequest, {
        params: { id: ticket._id.toString() },
      });
      expect(adminResponse.status).toBe(200);
    });
  });
});
