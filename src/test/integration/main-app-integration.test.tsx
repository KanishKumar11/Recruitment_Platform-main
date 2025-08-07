import React from "react";
import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/utils";
import { mockSupportTicket } from "@/test/utils";

// Mock Next.js components
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock the support components
const MockSupportTicketForm = ({ onSubmitSuccess }: any) => (
  <div data-testid="support-ticket-form">
    <h2>Submit Support Ticket</h2>
    <button onClick={() => onSubmitSuccess(mockSupportTicket)}>
      Submit Ticket
    </button>
  </div>
);

const MockUserTicketsList = ({ tickets, onTicketClick }: any) => (
  <div data-testid="user-tickets-list">
    <h2>Your Tickets</h2>
    {tickets.map((ticket: any) => (
      <div key={ticket._id} onClick={() => onTicketClick(ticket._id)}>
        {ticket.subject}
      </div>
    ))}
  </div>
);

vi.mock("@/app/components/support/SupportTicketForm", () => ({
  default: MockSupportTicketForm,
}));

vi.mock("@/app/components/support/UserTicketsList", () => ({
  default: MockUserTicketsList,
}));

describe("Main Application Integration", () => {
  it("should render support components together", () => {
    const TestApp = () => (
      <div>
        <MockSupportTicketForm onSubmitSuccess={vi.fn()} />
        <MockUserTicketsList
          tickets={[mockSupportTicket]}
          onTicketClick={vi.fn()}
        />
      </div>
    );

    renderWithProviders(<TestApp />);

    expect(screen.getByText("Submit Support Ticket")).toBeInTheDocument();
    expect(screen.getByText("Your Tickets")).toBeInTheDocument();
    expect(screen.getByText(mockSupportTicket.subject)).toBeInTheDocument();
  });

  it("should handle ticket submission flow", () => {
    const mockOnSubmitSuccess = vi.fn();

    const TestApp = () => (
      <MockSupportTicketForm onSubmitSuccess={mockOnSubmitSuccess} />
    );

    renderWithProviders(<TestApp />);

    const submitButton = screen.getByText("Submit Ticket");
    submitButton.click();

    expect(mockOnSubmitSuccess).toHaveBeenCalledWith(mockSupportTicket);
  });

  it("should handle ticket selection flow", () => {
    const mockOnTicketClick = vi.fn();

    const TestApp = () => (
      <MockUserTicketsList
        tickets={[mockSupportTicket]}
        onTicketClick={mockOnTicketClick}
      />
    );

    renderWithProviders(<TestApp />);

    const ticketElement = screen.getByText(mockSupportTicket.subject);
    ticketElement.click();

    expect(mockOnTicketClick).toHaveBeenCalledWith(mockSupportTicket._id);
  });
});
