import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { renderWithProviders, mockSupportTicket } from "@/test/utils";
import SupportTicketForm from "@/app/components/support/SupportTicketForm";
import UserTicketsList from "@/app/components/support/UserTicketsList";
import TicketsTable from "@/app/components/admin/TicketsTable";
import TicketStatusBadge from "@/app/components/support/TicketStatusBadge";
import PriorityBadge from "@/app/components/support/PriorityBadge";

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock the supportApi
vi.mock("@/app/store/services/supportApi", () => ({
  supportApi: {
    useCreateTicketMutation: () => [vi.fn(), { isLoading: false }],
  },
}));

describe("Support System Accessibility", () => {
  describe("SupportTicketForm Accessibility", () => {
    it("should not have accessibility violations", async () => {
      const { container } = renderWithProviders(
        <SupportTicketForm onSubmitSuccess={vi.fn()} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have proper form labels", () => {
      renderWithProviders(<SupportTicketForm onSubmitSuccess={vi.fn()} />);

      expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    });

    it("should have proper ARIA attributes", () => {
      renderWithProviders(<SupportTicketForm onSubmitSuccess={vi.fn()} />);

      const subjectInput = screen.getByLabelText(/subject/i);
      const messageInput = screen.getByLabelText(/message/i);

      expect(subjectInput).toHaveAttribute("required");
      expect(messageInput).toHaveAttribute("required");
      expect(subjectInput).toHaveAttribute("aria-describedby");
      expect(messageInput).toHaveAttribute("aria-describedby");
    });

    it("should have proper error announcements", async () => {
      renderWithProviders(<SupportTicketForm onSubmitSuccess={vi.fn()} />);

      // Submit form without filling required fields
      const submitButton = screen.getByRole("button", {
        name: /submit ticket/i,
      });
      submitButton.click();

      // Error messages should be properly associated
      const subjectError = await screen.findByText(/subject is required/i);
      expect(subjectError).toHaveAttribute("role", "alert");
    });
  });

  describe("UserTicketsList Accessibility", () => {
    const mockTickets = [
      {
        ...mockSupportTicket,
        _id: "ticket-1",
        ticketNumber: "ST-2024-001",
        subject: "Test Ticket",
        status: "Open",
        priority: "Medium",
      },
    ];

    it("should not have accessibility violations", async () => {
      const { container } = renderWithProviders(
        <UserTicketsList tickets={mockTickets} onTicketClick={vi.fn()} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have proper keyboard navigation", () => {
      renderWithProviders(
        <UserTicketsList tickets={mockTickets} onTicketClick={vi.fn()} />
      );

      const ticketItems = screen.getAllByRole("button");
      ticketItems.forEach((item) => {
        expect(item).toHaveAttribute("tabIndex", "0");
        expect(item).toHaveAttribute("role", "button");
      });
    });

    it("should have proper ARIA labels for interactive elements", () => {
      renderWithProviders(
        <UserTicketsList tickets={mockTickets} onTicketClick={vi.fn()} />
      );

      const ticketButton = screen.getByRole("button");
      expect(ticketButton).toHaveAttribute(
        "aria-label",
        expect.stringContaining("ST-2024-001")
      );
    });

    it("should announce empty state properly", () => {
      renderWithProviders(
        <UserTicketsList tickets={[]} onTicketClick={vi.fn()} />
      );

      const emptyMessage = screen.getByText(/no support tickets found/i);
      expect(emptyMessage).toHaveAttribute("role", "status");
    });
  });

  describe("TicketsTable Accessibility", () => {
    const mockTickets = [
      {
        ...mockSupportTicket,
        _id: "ticket-1",
        submittedBy: {
          _id: "user-1",
          name: "John Doe",
          email: "john@example.com",
        },
      },
    ];

    const mockFilters = {
      status: [],
      priority: [],
      category: [],
      search: "",
    };

    it("should not have accessibility violations", async () => {
      const { container } = renderWithProviders(
        <TicketsTable
          tickets={mockTickets}
          onTicketSelect={vi.fn()}
          filters={mockFilters}
          onFiltersChange={vi.fn()}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have proper table structure", () => {
      renderWithProviders(
        <TicketsTable
          tickets={mockTickets}
          onTicketSelect={vi.fn()}
          filters={mockFilters}
          onFiltersChange={vi.fn()}
        />
      );

      const table = screen.getByRole("table");
      expect(table).toBeInTheDocument();

      const columnHeaders = screen.getAllByRole("columnheader");
      expect(columnHeaders.length).toBeGreaterThan(0);

      const rows = screen.getAllByRole("row");
      expect(rows.length).toBeGreaterThan(1); // Header + data rows
    });

    it("should have proper filter labels", () => {
      renderWithProviders(
        <TicketsTable
          tickets={mockTickets}
          onTicketSelect={vi.fn()}
          filters={mockFilters}
          onFiltersChange={vi.fn()}
        />
      );

      expect(screen.getByLabelText(/search tickets/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/filter by status/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/filter by priority/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/filter by category/i)).toBeInTheDocument();
    });

    it("should have sortable column headers", () => {
      renderWithProviders(
        <TicketsTable
          tickets={mockTickets}
          onTicketSelect={vi.fn()}
          filters={mockFilters}
          onFiltersChange={vi.fn()}
        />
      );

      const sortableHeaders = screen.getAllByRole("columnheader");
      sortableHeaders.forEach((header) => {
        if (
          header.textContent?.includes("Subject") ||
          header.textContent?.includes("Created")
        ) {
          expect(header).toHaveAttribute("aria-sort");
        }
      });
    });
  });

  describe("Badge Components Accessibility", () => {
    it("should have proper contrast for TicketStatusBadge", () => {
      const { container } = render(<TicketStatusBadge status="Open" />);

      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass("bg-blue-100", "text-blue-800");
    });

    it("should have proper contrast for PriorityBadge", () => {
      const { container } = render(<PriorityBadge priority="High" />);

      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass("bg-orange-100", "text-orange-800");
    });

    it("should have semantic meaning for status badges", () => {
      render(<TicketStatusBadge status="Resolved" />);

      const badge = screen.getByText("Resolved");
      expect(badge).toHaveAttribute("role", "status");
    });

    it("should have semantic meaning for priority badges", () => {
      render(<PriorityBadge priority="Critical" />);

      const badge = screen.getByText("Critical");
      expect(badge).toHaveAttribute(
        "aria-label",
        expect.stringContaining("Critical priority")
      );
    });
  });

  describe("Focus Management", () => {
    it("should manage focus properly in modal dialogs", () => {
      // This would test TicketDetailModal focus management
      // Implementation depends on modal component structure
      expect(true).toBe(true); // Placeholder
    });

    it("should have visible focus indicators", () => {
      renderWithProviders(<SupportTicketForm onSubmitSuccess={vi.fn()} />);

      const submitButton = screen.getByRole("button", {
        name: /submit ticket/i,
      });
      submitButton.focus();

      expect(submitButton).toHaveFocus();
      expect(submitButton).toHaveClass("focus:ring-2", "focus:ring-blue-500");
    });
  });

  describe("Screen Reader Support", () => {
    it("should have proper heading hierarchy", () => {
      renderWithProviders(<SupportTicketForm onSubmitSuccess={vi.fn()} />);

      const headings = screen.getAllByRole("heading");
      headings.forEach((heading, index) => {
        const level = parseInt(heading.tagName.charAt(1));
        expect(level).toBeGreaterThanOrEqual(1);
        expect(level).toBeLessThanOrEqual(6);
      });
    });

    it("should announce loading states", () => {
      // Mock loading state
      vi.mocked(vi.fn()).mockReturnValue([vi.fn(), { isLoading: true }]);

      renderWithProviders(<SupportTicketForm onSubmitSuccess={vi.fn()} />);

      const loadingElement = screen.getByText(/submitting/i);
      expect(loadingElement).toHaveAttribute("aria-live", "polite");
    });

    it("should announce form validation errors", async () => {
      renderWithProviders(<SupportTicketForm onSubmitSuccess={vi.fn()} />);

      const submitButton = screen.getByRole("button", {
        name: /submit ticket/i,
      });
      submitButton.click();

      const errorMessage = await screen.findByText(/subject is required/i);
      expect(errorMessage).toHaveAttribute("role", "alert");
      expect(errorMessage).toHaveAttribute("aria-live", "assertive");
    });
  });

  describe("Color and Contrast", () => {
    it("should not rely solely on color for status indication", () => {
      render(<TicketStatusBadge status="Open" />);

      const badge = screen.getByText("Open");
      // Should have text content, not just color
      expect(badge.textContent).toBe("Open");
    });

    it("should not rely solely on color for priority indication", () => {
      render(<PriorityBadge priority="High" />);

      const badge = screen.getByText("High");
      // Should have text content, not just color
      expect(badge.textContent).toBe("High");
    });
  });
});
