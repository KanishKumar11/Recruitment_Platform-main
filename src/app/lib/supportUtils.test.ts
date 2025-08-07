import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { connectTestDB, closeTestDB, clearTestDB } from "@/test/db-utils";
import SupportTicket from "@/app/models/SupportTicket";
import {
  generateTicketNumber,
  validateTicketData,
  formatTicketForEmail,
  getTicketStatusColor,
  getPriorityColor,
  canUserAccessTicket,
  canUserModifyTicket,
} from "./supportUtils";
import { mockSupportTicket, mockUser, mockAdmin } from "@/test/utils";

describe("Support Utils", () => {
  beforeEach(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  describe("generateTicketNumber", () => {
    it("should generate unique ticket numbers", async () => {
      const ticketNumber1 = await generateTicketNumber();
      const ticketNumber2 = await generateTicketNumber();

      expect(ticketNumber1).toMatch(/^ST-\d{4}-\d{3}$/);
      expect(ticketNumber2).toMatch(/^ST-\d{4}-\d{3}$/);
      expect(ticketNumber1).not.toBe(ticketNumber2);
    });

    it("should include current year in ticket number", async () => {
      const ticketNumber = await generateTicketNumber();
      const currentYear = new Date().getFullYear();

      expect(ticketNumber).toContain(currentYear.toString());
    });

    it("should handle existing ticket numbers", async () => {
      // Create a ticket with a specific number
      await SupportTicket.create({
        ...mockSupportTicket,
        ticketNumber: "ST-2024-001",
        submittedBy: mockUser._id,
      });

      const newTicketNumber = await generateTicketNumber();
      expect(newTicketNumber).not.toBe("ST-2024-001");
    });
  });

  describe("validateTicketData", () => {
    it("should validate valid ticket data", () => {
      const validData = {
        subject: "Test Subject",
        message: "Test message",
        category: "Technical Issue",
        priority: "Medium",
      };

      const result = validateTicketData(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should reject empty subject", () => {
      const invalidData = {
        subject: "",
        message: "Test message",
        category: "Technical Issue",
      };

      const result = validateTicketData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Subject is required");
    });

    it("should reject empty message", () => {
      const invalidData = {
        subject: "Test Subject",
        message: "",
        category: "Technical Issue",
      };

      const result = validateTicketData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Message is required");
    });

    it("should reject invalid category", () => {
      const invalidData = {
        subject: "Test Subject",
        message: "Test message",
        category: "Invalid Category",
      };

      const result = validateTicketData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Invalid category");
    });

    it("should reject invalid priority", () => {
      const invalidData = {
        subject: "Test Subject",
        message: "Test message",
        category: "Technical Issue",
        priority: "Invalid Priority",
      };

      const result = validateTicketData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Invalid priority");
    });

    it("should reject subject that is too long", () => {
      const invalidData = {
        subject: "A".repeat(201), // Too long
        message: "Test message",
        category: "Technical Issue",
      };

      const result = validateTicketData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Subject must be less than 200 characters"
      );
    });
  });

  describe("formatTicketForEmail", () => {
    it("should format ticket data for email", () => {
      const ticket = {
        ...mockSupportTicket,
        submittedBy: mockUser,
      };

      const formatted = formatTicketForEmail(ticket);

      expect(formatted).toContain(ticket.ticketNumber);
      expect(formatted).toContain(ticket.subject);
      expect(formatted).toContain(ticket.message);
      expect(formatted).toContain(mockUser.name);
      expect(formatted).toContain(mockUser.email);
    });

    it("should handle missing user data gracefully", () => {
      const ticket = {
        ...mockSupportTicket,
        submittedBy: null,
      };

      const formatted = formatTicketForEmail(ticket);
      expect(formatted).toContain("Unknown User");
    });
  });

  describe("getTicketStatusColor", () => {
    it("should return correct colors for each status", () => {
      expect(getTicketStatusColor("Open")).toBe("bg-blue-100 text-blue-800");
      expect(getTicketStatusColor("In Progress")).toBe(
        "bg-yellow-100 text-yellow-800"
      );
      expect(getTicketStatusColor("Resolved")).toBe(
        "bg-green-100 text-green-800"
      );
      expect(getTicketStatusColor("Closed")).toBe("bg-gray-100 text-gray-800");
    });

    it("should return default color for unknown status", () => {
      expect(getTicketStatusColor("Unknown Status")).toBe(
        "bg-gray-100 text-gray-800"
      );
    });
  });

  describe("getPriorityColor", () => {
    it("should return correct colors for each priority", () => {
      expect(getPriorityColor("Low")).toBe("bg-green-100 text-green-800");
      expect(getPriorityColor("Medium")).toBe("bg-yellow-100 text-yellow-800");
      expect(getPriorityColor("High")).toBe("bg-orange-100 text-orange-800");
      expect(getPriorityColor("Critical")).toBe("bg-red-100 text-red-800");
    });

    it("should return default color for unknown priority", () => {
      expect(getPriorityColor("Unknown Priority")).toBe(
        "bg-gray-100 text-gray-800"
      );
    });
  });

  describe("canUserAccessTicket", () => {
    it("should allow ticket owner to access", () => {
      const ticket = {
        ...mockSupportTicket,
        submittedBy: mockUser._id,
      };

      expect(canUserAccessTicket(ticket, mockUser)).toBe(true);
    });

    it("should allow admin to access any ticket", () => {
      const ticket = {
        ...mockSupportTicket,
        submittedBy: "other-user-id",
      };

      expect(canUserAccessTicket(ticket, mockAdmin)).toBe(true);
    });

    it("should deny access to other users", () => {
      const ticket = {
        ...mockSupportTicket,
        submittedBy: "other-user-id",
      };

      expect(canUserAccessTicket(ticket, mockUser)).toBe(false);
    });
  });

  describe("canUserModifyTicket", () => {
    it("should allow admin to modify tickets", () => {
      const ticket = {
        ...mockSupportTicket,
        submittedBy: "other-user-id",
      };

      expect(canUserModifyTicket(ticket, mockAdmin)).toBe(true);
    });

    it("should deny regular users from modifying tickets", () => {
      const ticket = {
        ...mockSupportTicket,
        submittedBy: mockUser._id,
      };

      expect(canUserModifyTicket(ticket, mockUser)).toBe(false);
    });

    it("should allow internal users to modify tickets", () => {
      const internalUser = { ...mockUser, role: "internal" };
      const ticket = {
        ...mockSupportTicket,
        submittedBy: "other-user-id",
      };

      expect(canUserModifyTicket(ticket, internalUser)).toBe(true);
    });
  });
});
