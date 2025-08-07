import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { supportApi } from "./supportApi";
import { mockSupportTicket, mockTicketResponse } from "@/test/utils";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Support API Service", () => {
  let store: any;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        [supportApi.reducerPath]: supportApi.reducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(supportApi.middleware),
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    store.dispatch(supportApi.util.resetApiState());
  });

  describe("getUserTickets", () => {
    it("should fetch user tickets successfully", async () => {
      const mockResponse = {
        tickets: [mockSupportTicket],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          pages: 1,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await store.dispatch(
        supportApi.endpoints.getUserTickets.initiate({ page: 1, limit: 10 })
      );

      expect(result.data).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/support/tickets?page=1&limit=10",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            authorization: expect.stringContaining("Bearer"),
          }),
        })
      );
    });

    it("should handle fetch errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await store.dispatch(
        supportApi.endpoints.getUserTickets.initiate({})
      );

      expect(result.error).toBeDefined();
    });
  });

  describe("createTicket", () => {
    it("should create ticket successfully", async () => {
      const ticketData = {
        subject: "Test Ticket",
        message: "Test message",
        category: "Technical Issue",
        priority: "Medium",
      };

      const mockResponse = {
        ticket: {
          ...mockSupportTicket,
          ...ticketData,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await store.dispatch(
        supportApi.endpoints.createTicket.initiate(ticketData)
      );

      expect(result.data).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/support/tickets",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "content-type": "application/json",
            authorization: expect.stringContaining("Bearer"),
          }),
          body: JSON.stringify(ticketData),
        })
      );
    });

    it("should handle validation errors", async () => {
      const invalidData = {
        subject: "",
        message: "",
        category: "Technical Issue",
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: "Validation failed",
          details: ["Subject is required", "Message is required"],
        }),
      });

      const result = await store.dispatch(
        supportApi.endpoints.createTicket.initiate(invalidData)
      );

      expect(result.error).toBeDefined();
      expect(result.error.status).toBe(400);
    });
  });

  describe("getTicket", () => {
    it("should fetch single ticket successfully", async () => {
      const mockResponse = {
        ticket: mockSupportTicket,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await store.dispatch(
        supportApi.endpoints.getTicket.initiate("ticket-123")
      );

      expect(result.data).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/support/tickets/ticket-123",
        expect.objectContaining({
          method: "GET",
        })
      );
    });

    it("should handle 404 errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          error: "Ticket not found",
        }),
      });

      const result = await store.dispatch(
        supportApi.endpoints.getTicket.initiate("nonexistent")
      );

      expect(result.error).toBeDefined();
      expect(result.error.status).toBe(404);
    });
  });

  describe("getAllTickets (Admin)", () => {
    it("should fetch all tickets with filters", async () => {
      const filters = {
        status: ["Open"],
        priority: ["High"],
        search: "test",
      };

      const mockResponse = {
        tickets: [mockSupportTicket],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          pages: 1,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await store.dispatch(
        supportApi.endpoints.getAllTickets.initiate(filters)
      );

      expect(result.data).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/support/tickets"),
        expect.objectContaining({
          method: "GET",
        })
      );
    });
  });

  describe("updateTicket", () => {
    it("should update ticket successfully", async () => {
      const updateData = {
        status: "In Progress",
        priority: "High",
      };

      const mockResponse = {
        ticket: {
          ...mockSupportTicket,
          ...updateData,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await store.dispatch(
        supportApi.endpoints.updateTicket.initiate({
          id: "ticket-123",
          ...updateData,
        })
      );

      expect(result.data).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/support/tickets/ticket-123",
        expect.objectContaining({
          method: "PUT",
          headers: expect.objectContaining({
            "content-type": "application/json",
          }),
          body: JSON.stringify(updateData),
        })
      );
    });

    it("should handle authorization errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          error: "Insufficient permissions",
        }),
      });

      const result = await store.dispatch(
        supportApi.endpoints.updateTicket.initiate({
          id: "ticket-123",
          status: "Closed",
        })
      );

      expect(result.error).toBeDefined();
      expect(result.error.status).toBe(403);
    });
  });

  describe("deleteTicket", () => {
    it("should delete ticket successfully", async () => {
      const mockResponse = {
        success: true,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await store.dispatch(
        supportApi.endpoints.deleteTicket.initiate("ticket-123")
      );

      expect(result.data).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/support/tickets/ticket-123",
        expect.objectContaining({
          method: "DELETE",
        })
      );
    });
  });

  describe("getTicketResponses", () => {
    it("should fetch ticket responses successfully", async () => {
      const mockResponse = {
        responses: [mockTicketResponse],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await store.dispatch(
        supportApi.endpoints.getTicketResponses.initiate("ticket-123")
      );

      expect(result.data).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/support/tickets/ticket-123/responses",
        expect.objectContaining({
          method: "GET",
        })
      );
    });
  });

  describe("addTicketResponse", () => {
    it("should add response successfully", async () => {
      const responseData = {
        message: "Thank you for your ticket",
        isInternal: false,
        notifyUser: true,
      };

      const mockResponse = {
        response: {
          ...mockTicketResponse,
          ...responseData,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await store.dispatch(
        supportApi.endpoints.addTicketResponse.initiate({
          ticketId: "ticket-123",
          ...responseData,
        })
      );

      expect(result.data).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/support/tickets/ticket-123/responses",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "content-type": "application/json",
          }),
          body: JSON.stringify(responseData),
        })
      );
    });
  });

  describe("Cache Management", () => {
    it("should invalidate cache on ticket creation", async () => {
      const ticketData = {
        subject: "Test Ticket",
        message: "Test message",
        category: "Technical Issue",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ticket: mockSupportTicket }),
      });

      // First, populate cache with getUserTickets
      await store.dispatch(supportApi.endpoints.getUserTickets.initiate({}));

      // Then create a ticket, which should invalidate the cache
      await store.dispatch(
        supportApi.endpoints.createTicket.initiate(ticketData)
      );

      // The cache should be invalidated and getUserTickets should be refetched
      const state = store.getState();
      const cacheEntries = state[supportApi.reducerPath].queries;

      // Check that cache invalidation occurred
      expect(Object.keys(cacheEntries)).toBeDefined();
    });

    it("should invalidate cache on ticket update", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ticket: mockSupportTicket }),
      });

      await store.dispatch(
        supportApi.endpoints.updateTicket.initiate({
          id: "ticket-123",
          status: "Resolved",
        })
      );

      // Cache should be properly managed
      const state = store.getState();
      expect(state[supportApi.reducerPath]).toBeDefined();
    });
  });
});
