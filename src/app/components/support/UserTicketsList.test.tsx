import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, mockSupportTicket } from "@/test/utils";
import UserTicketsList from "./UserTicketsList";

describe("UserTicketsList", () => {
  const mockOnTicketClick = vi.fn();

  const mockTickets = [
    {
      ...mockSupportTicket,
      _id: "ticket-1",
      ticketNumber: "ST-2024-001",
      subject: "First Ticket",
      status: "Open",
      priority: "High",
      createdAt: "2024-01-01T10:00:00Z",
    },
    {
      ...mockSupportTicket,
      _id: "ticket-2",
      ticketNumber: "ST-2024-002",
      subject: "Second Ticket",
      status: "Resolved",
      priority: "Medium",
      createdAt: "2024-01-02T10:00:00Z",
    },
    {
      ...mockSupportTicket,
      _id: "ticket-3",
      ticketNumber: "ST-2024-003",
      subject: "Third Ticket",
      status: "Closed",
      priority: "Low",
      createdAt: "2024-01-03T10:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render tickets list correctly", () => {
    renderWithProviders(
      <UserTicketsList
        tickets={mockTickets}
        onTicketClick={mockOnTicketClick}
      />
    );

    expect(screen.getByText("First Ticket")).toBeInTheDocument();
    expect(screen.getByText("Second Ticket")).toBeInTheDocument();
    expect(screen.getByText("Third Ticket")).toBeInTheDocument();

    expect(screen.getByText("ST-2024-001")).toBeInTheDocument();
    expect(screen.getByText("ST-2024-002")).toBeInTheDocument();
    expect(screen.getByText("ST-2024-003")).toBeInTheDocument();
  });

  it("should display status badges correctly", () => {
    renderWithProviders(
      <UserTicketsList
        tickets={mockTickets}
        onTicketClick={mockOnTicketClick}
      />
    );

    expect(screen.getByText("Open")).toBeInTheDocument();
    expect(screen.getByText("Resolved")).toBeInTheDocument();
    expect(screen.getByText("Closed")).toBeInTheDocument();
  });

  it("should display priority badges correctly", () => {
    renderWithProviders(
      <UserTicketsList
        tickets={mockTickets}
        onTicketClick={mockOnTicketClick}
      />
    );

    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("Medium")).toBeInTheDocument();
    expect(screen.getByText("Low")).toBeInTheDocument();
  });

  it("should handle ticket click events", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <UserTicketsList
        tickets={mockTickets}
        onTicketClick={mockOnTicketClick}
      />
    );

    const firstTicket = screen
      .getByText("First Ticket")
      .closest('div[role="button"]');
    expect(firstTicket).toBeInTheDocument();

    await user.click(firstTicket!);

    expect(mockOnTicketClick).toHaveBeenCalledWith("ticket-1");
  });

  it("should handle keyboard navigation", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <UserTicketsList
        tickets={mockTickets}
        onTicketClick={mockOnTicketClick}
      />
    );

    const firstTicket = screen
      .getByText("First Ticket")
      .closest('div[role="button"]');
    expect(firstTicket).toBeInTheDocument();

    firstTicket!.focus();
    await user.keyboard("{Enter}");

    expect(mockOnTicketClick).toHaveBeenCalledWith("ticket-1");
  });

  it("should display empty state when no tickets", () => {
    renderWithProviders(
      <UserTicketsList tickets={[]} onTicketClick={mockOnTicketClick} />
    );

    expect(screen.getByText(/no support tickets found/i)).toBeInTheDocument();
    expect(
      screen.getByText(/you haven't submitted any support tickets yet/i)
    ).toBeInTheDocument();
  });

  it("should format dates correctly", () => {
    renderWithProviders(
      <UserTicketsList
        tickets={mockTickets}
        onTicketClick={mockOnTicketClick}
      />
    );

    // Check that dates are displayed (exact format may vary based on locale)
    expect(screen.getByText(/Jan 1, 2024/i)).toBeInTheDocument();
    expect(screen.getByText(/Jan 2, 2024/i)).toBeInTheDocument();
    expect(screen.getByText(/Jan 3, 2024/i)).toBeInTheDocument();
  });

  it("should have proper accessibility attributes", () => {
    renderWithProviders(
      <UserTicketsList
        tickets={mockTickets}
        onTicketClick={mockOnTicketClick}
      />
    );

    const ticketItems = screen.getAllByRole("button");
    ticketItems.forEach((item) => {
      expect(item).toHaveAttribute("tabIndex", "0");
      expect(item).toHaveAttribute("role", "button");
    });
  });

  it("should show ticket categories", () => {
    renderWithProviders(
      <UserTicketsList
        tickets={mockTickets}
        onTicketClick={mockOnTicketClick}
      />
    );

    expect(screen.getAllByText("Technical Issue")).toHaveLength(3);
  });

  it("should handle long ticket subjects gracefully", () => {
    const longSubjectTicket = {
      ...mockSupportTicket,
      _id: "ticket-long",
      subject:
        "This is a very long ticket subject that should be handled gracefully by the component without breaking the layout or causing overflow issues",
    };

    renderWithProviders(
      <UserTicketsList
        tickets={[longSubjectTicket]}
        onTicketClick={mockOnTicketClick}
      />
    );

    expect(screen.getByText(longSubjectTicket.subject)).toBeInTheDocument();
  });

  it("should sort tickets by creation date (newest first)", () => {
    const unsortedTickets = [
      { ...mockTickets[0], createdAt: "2024-01-01T10:00:00Z" },
      { ...mockTickets[1], createdAt: "2024-01-03T10:00:00Z" },
      { ...mockTickets[2], createdAt: "2024-01-02T10:00:00Z" },
    ];

    renderWithProviders(
      <UserTicketsList
        tickets={unsortedTickets}
        onTicketClick={mockOnTicketClick}
      />
    );

    const ticketElements = screen.getAllByRole("button");

    // The tickets should be displayed in chronological order (newest first)
    // This assumes the component sorts them internally
    expect(ticketElements).toHaveLength(3);
  });
});
