import {
  sendNewTicketNotification,
  sendTicketResponseNotification,
} from "./emailService";
import { getSupportSetting, SUPPORT_SETTINGS } from "./supportSettings";
import { ISupportTicket, ITicketResponse } from "@/app/models/SupportTicket";
import User from "@/app/models/User";

/**
 * Send email notification for a new support ticket
 */
export async function sendNewTicketEmail(
  ticket: ISupportTicket
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if email notifications are enabled
    const notificationsEnabled = await getSupportSetting(
      SUPPORT_SETTINGS.SUPPORT_NOTIFICATION_ENABLED,
      true
    );

    if (!notificationsEnabled) {
      console.log("Support email notifications are disabled");
      return { success: true }; // Not an error, just disabled
    }

    // Get the support email address
    const supportEmail = await getSupportSetting(
      SUPPORT_SETTINGS.SUPPORT_EMAIL,
      "support@sourcingscreen.com"
    );

    // Get user information
    const user = await User.findById(ticket.submittedBy).select("name email");
    if (!user) {
      console.error("User not found for ticket:", ticket.ticketNumber);
      return { success: false, error: "User not found" };
    }

    // Prepare ticket data for email
    const ticketData = {
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      message: ticket.message,
      category: ticket.category,
      priority: ticket.priority,
      userName: user.name,
      userEmail: user.email,
      createdAt: ticket.createdAt,
    };

    // Send the email
    const result = await sendNewTicketNotification(ticketData, supportEmail);

    if (result.success) {
      console.log(
        `New ticket email sent for ${ticket.ticketNumber} to ${supportEmail}`
      );
    } else {
      console.error(
        `Failed to send new ticket email for ${ticket.ticketNumber}:`,
        result.error
      );
    }

    return result;
  } catch (error) {
    console.error("Error in sendNewTicketEmail:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Send email notification for a ticket response (to the user)
 */
export async function sendTicketResponseEmail(
  ticket: ISupportTicket,
  response: ITicketResponse,
  notifyUser: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    // Only send if explicitly requested
    if (!notifyUser) {
      return { success: true }; // Not an error, just not requested
    }

    // Check if auto-response is enabled
    const autoResponseEnabled = await getSupportSetting(
      SUPPORT_SETTINGS.SUPPORT_AUTO_RESPONSE,
      true
    );

    if (!autoResponseEnabled) {
      console.log("Support auto-response emails are disabled");
      return { success: true }; // Not an error, just disabled
    }

    // Get user information (ticket submitter)
    const user = await User.findById(ticket.submittedBy).select("name email");
    if (!user) {
      console.error("User not found for ticket:", ticket.ticketNumber);
      return { success: false, error: "User not found" };
    }

    // Get responder information
    const responder = await User.findById(response.respondedBy).select("name");
    const responderName = responder ? responder.name : "Support Team";

    // Prepare response data for email
    const responseData = {
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      responseMessage: response.message,
      respondedBy: responderName,
      userName: user.name,
      userEmail: user.email,
      createdAt: response.createdAt,
    };

    // Send the email
    const result = await sendTicketResponseNotification(responseData);

    if (result.success) {
      console.log(
        `Ticket response email sent for ${ticket.ticketNumber} to ${user.email}`
      );
    } else {
      console.error(
        `Failed to send ticket response email for ${ticket.ticketNumber}:`,
        result.error
      );
    }

    return result;
  } catch (error) {
    console.error("Error in sendTicketResponseEmail:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Test email configuration by sending a test email
 */
export async function sendTestSupportEmail(
  testEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const testTicketData = {
      ticketNumber: "TEST-2024-001",
      subject: "Test Support Email Configuration",
      message:
        "This is a test email to verify that your support email configuration is working correctly. If you receive this email, your setup is functioning properly.",
      category: "Technical Issue",
      priority: "Medium",
      userName: "Test User",
      userEmail: testEmail,
      createdAt: new Date(),
    };

    const result = await sendNewTicketNotification(testTicketData, testEmail);

    if (result.success) {
      console.log(`Test support email sent successfully to ${testEmail}`);
    } else {
      console.error(
        `Failed to send test support email to ${testEmail}:`,
        result.error
      );
    }

    return result;
  } catch (error) {
    console.error("Error in sendTestSupportEmail:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Log email sending attempts for audit purposes
 */
export function logEmailAttempt(
  type: "new_ticket" | "response" | "test",
  ticketNumber: string,
  recipient: string,
  success: boolean,
  error?: string
): void {
  const logData = {
    timestamp: new Date().toISOString(),
    type,
    ticketNumber,
    recipient,
    success,
    error: error || null,
  };

  console.log("Support Email Log:", JSON.stringify(logData));

  // In a production environment, you might want to store this in a database
  // or send it to a logging service like Winston, Sentry, etc.
}

/**
 * Validate email configuration
 */
export async function validateEmailConfiguration(): Promise<{
  isValid: boolean;
  issues: string[];
}> {
  const issues: string[] = [];

  try {
    // Check environment variables
    if (!process.env.ZOHO_EMAIL) {
      issues.push("ZOHO_EMAIL environment variable is not set");
    }

    if (!process.env.ZOHO_APP_PASSWORD) {
      issues.push("ZOHO_APP_PASSWORD environment variable is not set");
    }

    // Check support settings
    const supportEmail = await getSupportSetting(
      SUPPORT_SETTINGS.SUPPORT_EMAIL
    );
    if (!supportEmail) {
      issues.push("Support email is not configured in settings");
    } else {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(supportEmail)) {
        issues.push("Support email format is invalid");
      }
    }

    const notificationsEnabled = await getSupportSetting(
      SUPPORT_SETTINGS.SUPPORT_NOTIFICATION_ENABLED
    );
    if (notificationsEnabled === undefined) {
      issues.push("Support notification setting is not configured");
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  } catch (error) {
    issues.push(
      `Error validating configuration: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    return {
      isValid: false,
      issues,
    };
  }
}
