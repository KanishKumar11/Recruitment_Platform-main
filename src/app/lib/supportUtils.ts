import {
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "@/app/models/SupportTicket";

/**
 * Generate a unique ticket number
 * Format: ST-YYYY-XXX (e.g., ST-2024-001)
 */
export function generateTicketNumber(count: number): string {
  const year = new Date().getFullYear();
  return `ST-${year}-${String(count + 1).padStart(3, "0")}`;
}

/**
 * Get priority color for UI display
 */
export function getPriorityColor(priority: TicketPriority): string {
  switch (priority) {
    case TicketPriority.CRITICAL:
      return "bg-red-100 text-red-800";
    case TicketPriority.HIGH:
      return "bg-orange-100 text-orange-800";
    case TicketPriority.MEDIUM:
      return "bg-yellow-100 text-yellow-800";
    case TicketPriority.LOW:
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Get status color for UI display
 */
export function getStatusColor(status: TicketStatus): string {
  switch (status) {
    case TicketStatus.OPEN:
      return "bg-blue-100 text-blue-800";
    case TicketStatus.IN_PROGRESS:
      return "bg-yellow-100 text-yellow-800";
    case TicketStatus.RESOLVED:
      return "bg-green-100 text-green-800";
    case TicketStatus.CLOSED:
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Get category icon for UI display
 */
export function getCategoryIcon(category: TicketCategory): string {
  switch (category) {
    case TicketCategory.TECHNICAL_ISSUE:
      return "🔧";
    case TicketCategory.ACCOUNT_ISSUE:
      return "👤";
    case TicketCategory.FEATURE_REQUEST:
      return "💡";
    case TicketCategory.BUG_REPORT:
      return "🐛";
    case TicketCategory.GENERAL_INQUIRY:
      return "❓";
    default:
      return "📝";
  }
}

/**
 * Validate ticket data
 */
export function validateTicketData(data: {
  subject?: string;
  message?: string;
  category?: string;
  priority?: string;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.subject || data.subject.trim().length === 0) {
    errors.push("Subject is required");
  } else if (data.subject.length > 200) {
    errors.push("Subject must be less than 200 characters");
  }

  if (!data.message || data.message.trim().length === 0) {
    errors.push("Message is required");
  } else if (data.message.length > 10000) {
    errors.push("Message must be less than 10,000 characters");
  }

  if (
    data.category &&
    !Object.values(TicketCategory).includes(data.category as TicketCategory)
  ) {
    errors.push("Invalid category");
  }

  if (
    data.priority &&
    !Object.values(TicketPriority).includes(data.priority as TicketPriority)
  ) {
    errors.push("Invalid priority");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize ticket content to prevent XSS
 */
export function sanitizeTicketContent(content: string): string {
  return content
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Format ticket number for display
 */
export function formatTicketNumber(ticketNumber: string): string {
  return ticketNumber.toUpperCase();
}

/**
 * Calculate ticket age in days
 */
export function getTicketAge(createdAt: Date): number {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - createdAt.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if ticket is overdue (based on priority)
 */
export function isTicketOverdue(
  createdAt: Date,
  priority: TicketPriority,
  status: TicketStatus
): boolean {
  if (status === TicketStatus.RESOLVED || status === TicketStatus.CLOSED) {
    return false;
  }

  const age = getTicketAge(createdAt);

  switch (priority) {
    case TicketPriority.CRITICAL:
      return age > 1; // 1 day
    case TicketPriority.HIGH:
      return age > 3; // 3 days
    case TicketPriority.MEDIUM:
      return age > 7; // 1 week
    case TicketPriority.LOW:
      return age > 14; // 2 weeks
    default:
      return false;
  }
}

/**
 * Get all available ticket categories for dropdowns
 */
export function getTicketCategories(): {
  value: TicketCategory;
  label: string;
}[] {
  return Object.values(TicketCategory).map((category) => ({
    value: category,
    label: category,
  }));
}

/**
 * Get all available ticket priorities for dropdowns
 */
export function getTicketPriorities(): {
  value: TicketPriority;
  label: string;
}[] {
  return Object.values(TicketPriority).map((priority) => ({
    value: priority,
    label: priority,
  }));
}

/**
 * Get all available ticket statuses for dropdowns
 */
export function getTicketStatuses(): { value: TicketStatus; label: string }[] {
  return Object.values(TicketStatus).map((status) => ({
    value: status,
    label: status,
  }));
}

/**
 * Check if user can access a specific ticket
 */
export function canUserAccessTicket(ticket: any, user: any): boolean {
  // Ticket owner can always access their own tickets
  if (ticket.submittedBy === user._id || ticket.submittedBy.toString() === user._id) {
    return true;
  }

  // Admin users can access all tickets
  if (user.role === "ADMIN") {
    return true;
  }

  // Internal users can access all tickets
  if (user.role === "INTERNAL") {
    return true;
  }

  return false;
}

/**
 * Check if user can modify a specific ticket
 */
export function canUserModifyTicket(ticket: any, user: any): boolean {
  // Admin users can modify all tickets
  if (user.role === "ADMIN") {
    return true;
  }

  // Internal users can modify all tickets
  if (user.role === "INTERNAL") {
    return true;
  }

  // Regular users cannot modify tickets
  return false;
}
