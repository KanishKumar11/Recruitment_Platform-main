import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/utils";
import SupportTicketForm from "./SupportTicketForm";

// Mock the supportApi
const mockCreateTicket = vi.fn();
vi.mock("@/app/store/services/supportApi", () => ({
  supportApi: {
    useCreateTicketMutation: () => [mockCreateTicket, { isLoading: false }],
  },
}));

// Mock toast
vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("SupportTicketForm", () => {
  const mockOnSubmitSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render form fields correctly", () => {
    renderWithProviders(
      <SupportTicketForm onSubmitSuccess={mockOnSubmitSuccess} />
    );

    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /submit ticket/i })
    ).toBeInTheDocument();
  });

  it("should validate required fields", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SupportTicketForm onSubmitSuccess={mockOnSubmitSuccess} />
    );

    const submitButton = screen.getByRole("button", { name: /submit ticket/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/subject is required/i)).toBeInTheDocument();
      expect(screen.getByText(/message is required/i)).toBeInTheDocument();
    });
  });

  it("should submit form with valid data", async () => {
    const user = userEvent.setup();
    const mockTicket = {
      _id: "ticket-123",
      ticketNumber: "ST-2024-001",
      subject: "Test Subject",
      message: "Test message",
      category: "Technical Issue",
      priority: "Medium",
      status: "Open",
    };

    mockCreateTicket.mockResolvedValue({ data: { ticket: mockTicket } });

    renderWithProviders(
      <SupportTicketForm onSubmitSuccess={mockOnSubmitSuccess} />
    );

    // Fill out form
    await user.type(screen.getByLabelText(/subject/i), "Test Subject");
    await user.selectOptions(
      screen.getByLabelText(/category/i),
      "Technical Issue"
    );
    await user.selectOptions(screen.getByLabelText(/priority/i), "Medium");
    await user.type(screen.getByLabelText(/message/i), "Test message");

    // Submit form
    await user.click(screen.getByRole("button", { name: /submit ticket/i }));

    await waitFor(() => {
      expect(mockCreateTicket).toHaveBeenCalledWith({
        subject: "Test Subject",
        category: "Technical Issue",
        priority: "Medium",
        message: "Test message",
      });
      expect(mockOnSubmitSuccess).toHaveBeenCalledWith(mockTicket);
    });
  });

  it("should handle form submission errors", async () => {
    const user = userEvent.setup();
    mockCreateTicket.mockRejectedValue(new Error("Submission failed"));

    renderWithProviders(
      <SupportTicketForm onSubmitSuccess={mockOnSubmitSuccess} />
    );

    // Fill out form
    await user.type(screen.getByLabelText(/subject/i), "Test Subject");
    await user.type(screen.getByLabelText(/message/i), "Test message");

    // Submit form
    await user.click(screen.getByRole("button", { name: /submit ticket/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to submit ticket/i)).toBeInTheDocument();
    });
  });

  it("should reset form after successful submission", async () => {
    const user = userEvent.setup();
    const mockTicket = {
      _id: "ticket-123",
      ticketNumber: "ST-2024-001",
      subject: "Test Subject",
      message: "Test message",
    };

    mockCreateTicket.mockResolvedValue({ data: { ticket: mockTicket } });

    renderWithProviders(
      <SupportTicketForm onSubmitSuccess={mockOnSubmitSuccess} />
    );

    const subjectInput = screen.getByLabelText(/subject/i) as HTMLInputElement;
    const messageInput = screen.getByLabelText(
      /message/i
    ) as HTMLTextAreaElement;

    // Fill out form
    await user.type(subjectInput, "Test Subject");
    await user.type(messageInput, "Test message");

    expect(subjectInput.value).toBe("Test Subject");
    expect(messageInput.value).toBe("Test message");

    // Submit form
    await user.click(screen.getByRole("button", { name: /submit ticket/i }));

    await waitFor(() => {
      expect(subjectInput.value).toBe("");
      expect(messageInput.value).toBe("");
    });
  });

  it("should show loading state during submission", async () => {
    const user = userEvent.setup();

    // Mock loading state
    vi.mocked(mockCreateTicket).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ data: { ticket: {} } }), 100)
        )
    );

    renderWithProviders(
      <SupportTicketForm onSubmitSuccess={mockOnSubmitSuccess} />
    );

    // Fill out form
    await user.type(screen.getByLabelText(/subject/i), "Test Subject");
    await user.type(screen.getByLabelText(/message/i), "Test message");

    // Submit form
    await user.click(screen.getByRole("button", { name: /submit ticket/i }));

    // Should show loading state
    expect(
      screen.getByRole("button", { name: /submitting/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submitting/i })).toBeDisabled();
  });

  it("should have proper accessibility attributes", () => {
    renderWithProviders(
      <SupportTicketForm onSubmitSuccess={mockOnSubmitSuccess} />
    );

    const subjectInput = screen.getByLabelText(/subject/i);
    const messageInput = screen.getByLabelText(/message/i);

    expect(subjectInput).toHaveAttribute("required");
    expect(messageInput).toHaveAttribute("required");
    expect(subjectInput).toHaveAttribute("aria-describedby");
    expect(messageInput).toHaveAttribute("aria-describedby");
  });
});
