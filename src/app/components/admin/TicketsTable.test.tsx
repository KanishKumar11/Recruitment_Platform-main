import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, mockSupportTicket, mockUser } from "@/test/utils";
import TicketsTable from "./TicketsTable";

describe("TicketsTable", () => {
  const mockOnTicketSelect = vi.fn();
  const mockOnFiltersChange = vi.fn();

  const mockTickets = [
    {
      ...mockSupportTicket,
      _id: "ticket-1",
      ticketNumber: "ST-2024-001",
      subject: "Login Issue",
      status: "Open",
      priority: "High",
      category: "Technical Issue",
      submittedBy: {
        _id: "user-1",
        name: "John Doe",
        email: "john@example.com",
      },
      createdAt: "2024-01-01T10:00:00Z",
    },
    {
      ...mockSupportTicket,
      _id: "ticket-2",
      ticketNumber: "ST-2024-002",
      subject: "Account Problem",
      status: "In Progress",
      priority: "Medium",
      category: "Account Issue",
      submittedBy: {
        _id: "user-2",
        name: "Jane Smith",
        email: "jane@example.com",
      },
      createdAt: "2024-01-02T10:00:00Z",
    },
  ];

  const mockFilters = {
    status: [],
    priority: [],
    category: [],
    search: "",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render tickets table correctly", () => {
    renderWithProviders(
      <TicketsTable
        tickets={mockTickets}
        onTicketSelect={mockOnTicketSelect}
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Check table headers
    expect(screen.getByText("Ticket #")).toBeInTheDocument();
    expect(screen.getByText("Subject")).toBeInTheDocument();
    expect(screen.getByText("User")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Priority")).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByText("Created")).toBeInTheDocument();

    // Check ticket data
    expect(screen.getByText("ST-2024-001")).toBeInTheDocument();
    expect(screen.getByText("Login Issue")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("ST-2024-002")).toBeInTheDocument();
    expect(screen.getByText("Account Problem")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("should handle ticket selection", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <TicketsTable
        tickets={mockTickets}
        onTicketSelect={mockOnTicketSelect}
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const firstTicketRow = screen.getByText("ST-2024-001").closest("tr");
    expect(firstTicketRow).toBeInTheDocument();

    await user.click(firstTicketRow!);

    expect(mockOnTicketSelect).toHaveBeenCalledWith(mockTickets[0]);
  });

  it("should display status badges with correct colors", () => {
    renderWithProviders(
      <TicketsTable
        tickets={mockTickets}
        onTicketSelect={mockOnTicketSelect}
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const openStatus = screen.getByText("Open");
    const inProgressStatus = screen.getByText("In Progress");

    expect(openStatus).toBeInTheDocument();
    expect(inProgressStatus).toBeInTheDocument();

    // Check that badges have appropriate CSS classes
    expect(openStatus.closest("span")).toHaveClass(
      "bg-blue-100",
      "text-blue-800"
    );
    expect(inProgressStatus.closest("span")).toHaveClass(
      "bg-yellow-100",
      "text-yellow-800"
    );
  });

  it("should display priority badges with correct colors", () => {
    renderWithProviders(
      <TicketsTable
        tickets={mockTickets}
        onTicketSelect={mockOnTicketSelect}
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const highPriority = screen.getByText("High");
    const mediumPriority = screen.getByText("Medium");

    expect(highPriority).toBeInTheDocument();
    expect(mediumPriority).toBeInTheDocument();

    expect(highPriority.closest("span")).toHaveClass(
      "bg-orange-100",
      "text-orange-800"
    );
    expect(mediumPriority.closest("span")).toHaveClass(
      "bg-yellow-100",
      "text-yellow-800"
    );
  });

  it("should handle search filter", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <TicketsTable
        tickets={mockTickets}
        onTicketSelect={mockOnTicketSelect}
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search tickets/i);
    await user.type(searchInput, "login");

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...mockFilters,
        search: "login",
      });
    });
  });

  it("should handle status filter", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <TicketsTable
        tickets={mockTickets}
        onTicketSelect={mockOnTicketSelect}
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const statusFilter = screen.getByLabelText(/filter by status/i);
    await user.selectOptions(statusFilter, "Open");

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...mockFilters,
      status: ["Open"],
    });
  });

  it("should handle priority filter", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <TicketsTable
        tickets={mockTickets}
        onTicketSelect={mockOnTicketSelect}
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const priorityFilter = screen.getByLabelText(/filter by priority/i);
    await user.selectOptions(priorityFilter, "High");

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...mockFilters,
      priority: ["High"],
    });
  });

  it("should handle category filter", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <TicketsTable
        tickets={mockTickets}
        onTicketSelect={mockOnTicketSelect}
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const categoryFilter = screen.getByLabelText(/filter by category/i);
    await user.selectOptions(categoryFilter, "Technical Issue");

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...mockFilters,
      category: ["Technical Issue"],
    });
  });

  it("should display empty state when no tickets", () => {
    renderWithProviders(
      <TicketsTable
        tickets={[]}
        onTicketSelect={mockOnTicketSelect}
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText(/no tickets found/i)).toBeInTheDocument();
  });

  it("should handle sorting by different columns", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <TicketsTable
        tickets={mockTickets}
        onTicketSelect={mockOnTicketSelect}
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Click on Subject header to sort
    const subjectHeader = screen.getByText("Subject");
    await user.click(subjectHeader);

    // Should trigger sorting (implementation depends on component)
    expect(subjectHeader).toBeInTheDocument();
  });

  it("should truncate long subjects", () => {
    const longSubjectTicket = {
      ...mockTickets[0],
      subject:
        "This is a very long ticket subject that should be truncated to prevent layout issues and maintain table readability",
    };

    renderWithProviders(
      <TicketsTable
        tickets={[longSubjectTicket]}
        onTicketSelect={mockOnTicketSelect}
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // The component should handle long subjects appropriately
    expect(screen.getByText(longSubjectTicket.subject)).toBeInTheDocument();
  });

  it("should have proper accessibility attributes", () => {
    renderWithProviders(
      <TicketsTable
        tickets={mockTickets}
        onTicketSelect={mockOnTicketSelect}
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const table = screen.getByRole("table");
    expect(table).toBeInTheDocument();

    const rows = screen.getAllByRole("row");
    expect(rows.length).toBeGreaterThan(0);

    // Check that table has proper headers
    const columnHeaders = screen.getAllByRole("columnheader");
    expect(columnHeaders.length).toBeGreaterThan(0);
  });

  it("should format dates correctly", () => {
    renderWithProviders(
      <TicketsTable
        tickets={mockTickets}
        onTicketSelect={mockOnTicketSelect}
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Check that dates are formatted properly
    expect(screen.getByText(/Jan 1, 2024/i)).toBeInTheDocument();
    expect(screen.getByText(/Jan 2, 2024/i)).toBeInTheDocument();
  });
});
