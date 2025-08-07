import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { connectTestDB, closeTestDB, clearTestDB } from "@/test/db-utils";
import SupportTicket from "./SupportTicket";
import { mockSupportTicket, mockUser } from "@/test/utils";

describe("SupportTicket Model", () => {
  beforeEach(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  describe("Schema Validation", () => {
    it("should create a valid support ticket", async () => {
      const ticketData = {
        ticketNumber: "ST-2024-001",
        subject: "Test Ticket",
        message: "This is a test ticket message",
        category: "Technical Issue",
        priority: "Medium",
        status: "Open",
        submittedBy: mockUser._id,
      };

      const ticket = new SupportTicket(ticketData);
      const savedTicket = await ticket.save();

      expect(savedTicket._id).toBeDefined();
      expect(savedTicket.ticketNumber).toBe(ticketData.ticketNumber);
      expect(savedTicket.subject).toBe(ticketData.subject);
      expect(savedTicket.createdAt).toBeDefined();
      expect(savedTicket.updatedAt).toBeDefined();
    });

    it("should require mandatory fields", async () => {
      const invalidTicket = new SupportTicket({});

      await expect(invalidTicket.save()).rejects.toThrow();
    });

    it("should validate category enum values", async () => {
      const ticketData = {
        ...mockSupportTicket,
        category: "Invalid Category",
      };

      const ticket = new SupportTicket(ticketData);
      await expect(ticket.save()).rejects.toThrow();
    });

    it("should validate priority enum values", async () => {
      const ticketData = {
        ...mockSupportTicket,
        priority: "Invalid Priority",
      };

      const ticket = new SupportTicket(ticketData);
      await expect(ticket.save()).rejects.toThrow();
    });

    it("should validate status enum values", async () => {
      const ticketData = {
        ...mockSupportTicket,
        status: "Invalid Status",
      };

      const ticket = new SupportTicket(ticketData);
      await expect(ticket.save()).rejects.toThrow();
    });

    it("should enforce unique ticket numbers", async () => {
      const ticketData = {
        ...mockSupportTicket,
        submittedBy: mockUser._id,
      };

      await SupportTicket.create(ticketData);

      const duplicateTicket = new SupportTicket({
        ...ticketData,
        _id: undefined,
        subject: "Different Subject",
      });

      await expect(duplicateTicket.save()).rejects.toThrow();
    });
  });

  describe("Response Handling", () => {
    it("should add responses to ticket", async () => {
      const ticket = await SupportTicket.create({
        ...mockSupportTicket,
        submittedBy: mockUser._id,
      });

      const response = {
        message: "Thank you for your ticket",
        respondedBy: mockUser._id,
        isInternal: false,
      };

      ticket.responses.push(response);
      await ticket.save();

      const updatedTicket = await SupportTicket.findById(ticket._id);
      expect(updatedTicket?.responses).toHaveLength(1);
      expect(updatedTicket?.responses[0].message).toBe(response.message);
    });

    it("should handle internal responses", async () => {
      const ticket = await SupportTicket.create({
        ...mockSupportTicket,
        submittedBy: mockUser._id,
      });

      const internalResponse = {
        message: "Internal admin note",
        respondedBy: mockUser._id,
        isInternal: true,
      };

      ticket.responses.push(internalResponse);
      await ticket.save();

      const updatedTicket = await SupportTicket.findById(ticket._id);
      expect(updatedTicket?.responses[0].isInternal).toBe(true);
    });
  });

  describe("Timestamps", () => {
    it("should automatically set createdAt and updatedAt", async () => {
      const ticket = await SupportTicket.create({
        ...mockSupportTicket,
        submittedBy: mockUser._id,
      });

      expect(ticket.createdAt).toBeDefined();
      expect(ticket.updatedAt).toBeDefined();
      expect(ticket.createdAt).toEqual(ticket.updatedAt);
    });

    it("should update updatedAt on modification", async () => {
      const ticket = await SupportTicket.create({
        ...mockSupportTicket,
        submittedBy: mockUser._id,
      });

      const originalUpdatedAt = ticket.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      ticket.status = "In Progress";
      await ticket.save();

      expect(ticket.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });

    it("should set resolvedAt when status changes to Resolved", async () => {
      const ticket = await SupportTicket.create({
        ...mockSupportTicket,
        submittedBy: mockUser._id,
        status: "Open",
      });

      expect(ticket.resolvedAt).toBeUndefined();

      ticket.status = "Resolved";
      await ticket.save();

      expect(ticket.resolvedAt).toBeDefined();
    });

    it("should set closedAt when status changes to Closed", async () => {
      const ticket = await SupportTicket.create({
        ...mockSupportTicket,
        submittedBy: mockUser._id,
        status: "Open",
      });

      expect(ticket.closedAt).toBeUndefined();

      ticket.status = "Closed";
      await ticket.save();

      expect(ticket.closedAt).toBeDefined();
    });
  });

  describe("Queries and Indexes", () => {
    it("should find tickets by submittedBy", async () => {
      await SupportTicket.create({
        ...mockSupportTicket,
        submittedBy: mockUser._id,
      });

      const userTickets = await SupportTicket.find({
        submittedBy: mockUser._id,
      });
      expect(userTickets).toHaveLength(1);
    });

    it("should find tickets by status", async () => {
      await SupportTicket.create({
        ...mockSupportTicket,
        submittedBy: mockUser._id,
        status: "Open",
      });
      await SupportTicket.create({
        ...mockSupportTicket,
        _id: undefined,
        ticketNumber: "ST-2024-002",
        submittedBy: mockUser._id,
        status: "Closed",
      });

      const openTickets = await SupportTicket.find({ status: "Open" });
      expect(openTickets).toHaveLength(1);
    });

    it("should support text search", async () => {
      await SupportTicket.create({
        ...mockSupportTicket,
        subject: "Login Issue",
        message: "Cannot login to my account",
        submittedBy: mockUser._id,
      });

      const searchResults = await SupportTicket.find({
        $text: { $search: "login" },
      });

      expect(searchResults).toHaveLength(1);
    });
  });
});
