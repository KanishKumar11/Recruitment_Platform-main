# Help & Support Ticket System - Design Document

## Overview

The Help & Support Ticket System will be integrated into the existing SourcingScreen platform, providing authenticated users with a way to submit support requests through their dashboard. The system will include ticket management for admins, email notifications, and configurable settings. The design follows the existing platform patterns and integrates seamlessly with the current authentication and UI systems.

## Architecture

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Dashboard     │    │   Admin Panel   │    │  Email Service  │
│   Help Page     │    │  Ticket Mgmt    │    │  Notifications  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Support API   │
                    │   & Database    │
                    └─────────────────┘
```

### Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB with Mongoose ODM
- **State Management**: Redux Toolkit with RTK Query
- **Email**: Nodemailer or similar email service
- **Authentication**: Existing JWT-based system

## Components and Interfaces

### Database Models

#### Support Ticket Model

```typescript
interface ISupportTicket {
  _id: ObjectId;
  ticketNumber: string; // Auto-generated unique identifier (e.g., "ST-2024-001")
  subject: string; // Ticket subject/title
  message: string; // Detailed description of the issue
  category: TicketCategory; // Technical, Account, Feature Request, etc.
  priority: TicketPriority; // Low, Medium, High, Critical
  status: TicketStatus; // Open, In Progress, Resolved, Closed
  submittedBy: ObjectId; // Reference to User who submitted
  assignedTo?: ObjectId; // Reference to Admin/Internal user (optional)
  responses: TicketResponse[]; // Array of responses/updates
  attachments?: string[]; // File paths (future enhancement)
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  closedAt?: Date;
}

interface TicketResponse {
  _id: ObjectId;
  message: string;
  respondedBy: ObjectId; // Reference to User (admin/internal)
  isInternal: boolean; // Internal notes vs user-visible responses
  createdAt: Date;
}

enum TicketCategory {
  TECHNICAL_ISSUE = "Technical Issue",
  ACCOUNT_ISSUE = "Account Issue",
  FEATURE_REQUEST = "Feature Request",
  GENERAL_INQUIRY = "General Inquiry",
  BUG_REPORT = "Bug Report",
}

enum TicketPriority {
  LOW = "Low",
  MEDIUM = "Medium",
  HIGH = "High",
  CRITICAL = "Critical",
}

enum TicketStatus {
  OPEN = "Open",
  IN_PROGRESS = "In Progress",
  RESOLVED = "Resolved",
  CLOSED = "Closed",
}
```

#### Settings Extension

```typescript
// Extend existing Settings model with support-related settings
interface SupportSettings {
  support_email: string; // Email address for ticket notifications
  support_auto_response: boolean; // Send auto-response to users
  support_email_template: string; // Custom email template
}
```

### API Endpoints

#### Support Tickets API (`/api/support/tickets`)

```typescript
// GET /api/support/tickets - Get tickets (filtered by user role)
// POST /api/support/tickets - Create new ticket
// GET /api/support/tickets/[id] - Get specific ticket
// PUT /api/support/tickets/[id] - Update ticket (admin only)
// DELETE /api/support/tickets/[id] - Delete ticket (admin only)

interface CreateTicketRequest {
  subject: string;
  message: string;
  category: TicketCategory;
  priority?: TicketPriority; // Default to Medium
}

interface UpdateTicketRequest {
  subject?: string;
  message?: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  status?: TicketStatus;
  assignedTo?: string;
}

interface TicketResponse {
  ticket: ISupportTicket;
}

interface TicketsResponse {
  tickets: ISupportTicket[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
```

#### Ticket Responses API (`/api/support/tickets/[id]/responses`)

```typescript
// GET /api/support/tickets/[id]/responses - Get ticket responses
// POST /api/support/tickets/[id]/responses - Add response to ticket

interface CreateResponseRequest {
  message: string;
  isInternal?: boolean; // Default false
  notifyUser?: boolean; // Send email to user
}
```

#### Support Settings API (`/api/admin/support/settings`)

```typescript
// GET /api/admin/support/settings - Get support settings
// PUT /api/admin/support/settings - Update support settings

interface SupportSettingsRequest {
  support_email?: string;
  support_auto_response?: boolean;
  support_email_template?: string;
}
```

### Frontend Components

#### Dashboard Help Page (`/dashboard/help`)

```typescript
// Components:
// - HelpPage: Main container component
// - SupportTicketForm: Form for creating new tickets
// - UserTicketsList: List of user's previous tickets
// - TicketStatusBadge: Status indicator component
// - PriorityBadge: Priority indicator component

interface HelpPageProps {
  // No props - uses RTK Query hooks for data
}

interface SupportTicketFormProps {
  onSubmitSuccess: (ticket: ISupportTicket) => void;
}

interface UserTicketsListProps {
  tickets: ISupportTicket[];
  onTicketClick: (ticketId: string) => void;
}
```

#### Admin Support Management (`/dashboard/admin/support`)

```typescript
// Components:
// - AdminSupportDashboard: Main admin interface
// - TicketsTable: Sortable/filterable table of all tickets
// - TicketDetailModal: Detailed view of individual ticket
// - TicketResponseForm: Form for adding responses
// - SupportSettingsPanel: Configuration panel for support settings

interface AdminSupportDashboardProps {
  // No props - uses RTK Query hooks
}

interface TicketsTableProps {
  tickets: ISupportTicket[];
  onTicketSelect: (ticket: ISupportTicket) => void;
  filters: TicketFilters;
  onFiltersChange: (filters: TicketFilters) => void;
}

interface TicketFilters {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  category?: TicketCategory[];
  assignedTo?: string;
  dateRange?: { start: Date; end: Date };
  search?: string;
}
```

### RTK Query Services

#### Support API Service

```typescript
// src/app/store/services/supportApi.ts
export const supportApi = createApi({
  reducerPath: "supportApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/support",
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["SupportTicket", "TicketResponse"],
  endpoints: (builder) => ({
    // User endpoints
    getUserTickets: builder.query<
      TicketsResponse,
      { page?: number; limit?: number }
    >(),
    createTicket: builder.mutation<TicketResponse, CreateTicketRequest>(),
    getTicket: builder.query<TicketResponse, string>(),

    // Admin endpoints
    getAllTickets: builder.query<
      TicketsResponse,
      TicketFilters & { page?: number; limit?: number }
    >(),
    updateTicket: builder.mutation<
      TicketResponse,
      { id: string } & UpdateTicketRequest
    >(),
    deleteTicket: builder.mutation<{ success: boolean }, string>(),

    // Response endpoints
    getTicketResponses: builder.query<
      { responses: TicketResponse[] },
      string
    >(),
    addTicketResponse: builder.mutation<
      { response: TicketResponse },
      { ticketId: string } & CreateResponseRequest
    >(),
  }),
});
```

## Data Models

### MongoDB Schema Design

#### Support Tickets Collection

```javascript
{
  _id: ObjectId,
  ticketNumber: "ST-2024-001",
  subject: "Unable to post job listing",
  message: "I'm getting an error when trying to post a new job...",
  category: "Technical Issue",
  priority: "Medium",
  status: "Open",
  submittedBy: ObjectId("user_id"),
  assignedTo: ObjectId("admin_id"), // Optional
  responses: [
    {
      _id: ObjectId,
      message: "Thank you for reporting this issue...",
      respondedBy: ObjectId("admin_id"),
      isInternal: false,
      createdAt: ISODate
    }
  ],
  attachments: [], // Future enhancement
  createdAt: ISODate,
  updatedAt: ISODate,
  resolvedAt: ISODate, // Optional
  closedAt: ISODate     // Optional
}
```

#### Indexes for Performance

```javascript
// Compound indexes for efficient querying
db.supporttickets.createIndex({ submittedBy: 1, createdAt: -1 });
db.supporttickets.createIndex({ status: 1, priority: -1, createdAt: -1 });
db.supporttickets.createIndex({ assignedTo: 1, status: 1 });
db.supporttickets.createIndex({ ticketNumber: 1 }, { unique: true });
db.supporttickets.createIndex({ category: 1, createdAt: -1 });

// Text index for search functionality
db.supporttickets.createIndex({
  subject: "text",
  message: "text",
  "responses.message": "text",
});
```

## Error Handling

### API Error Responses

```typescript
interface APIError {
  error: string;
  code?: string;
  details?: any;
}

// Common error scenarios:
// - 401: Unauthorized (not logged in)
// - 403: Forbidden (insufficient permissions)
// - 404: Ticket not found
// - 400: Invalid input data
// - 429: Rate limit exceeded
// - 500: Internal server error
```

### Frontend Error Handling

```typescript
// Error boundaries for React components
// Toast notifications for user feedback
// Retry mechanisms for failed API calls
// Graceful degradation when services are unavailable
```

## Testing Strategy

### Unit Tests

- API route handlers
- Database model validation
- Utility functions (ticket number generation, email formatting)
- React component rendering and interactions

### Integration Tests

- Complete ticket creation flow
- Email notification system
- Admin ticket management workflows
- Authentication and authorization

### End-to-End Tests

- User submits support ticket
- Admin receives notification and responds
- User receives response notification
- Ticket status updates and resolution

## Security Considerations

### Authentication & Authorization

- All endpoints require valid JWT tokens
- Role-based access control (users see only their tickets, admins see all)
- Input validation and sanitization
- Rate limiting on ticket creation to prevent spam

### Data Protection

- Sensitive information logging restrictions
- Secure email transmission
- File upload validation (future enhancement)
- GDPR compliance for user data

## Performance Optimizations

### Database

- Proper indexing for common query patterns
- Pagination for large ticket lists
- Aggregation pipelines for statistics

### Frontend

- RTK Query caching for ticket data
- Lazy loading of ticket details
- Optimistic updates for status changes
- Debounced search functionality

### Email System

- Asynchronous email sending
- Queue system for high volume (future enhancement)
- Template caching
- Retry mechanism for failed sends

## Monitoring and Analytics

### Metrics to Track

- Ticket volume by category and priority
- Response times by admin
- Resolution rates
- User satisfaction (future enhancement)
- Email delivery success rates

### Logging

- Ticket creation and updates
- Email sending attempts and results
- Admin actions and responses
- System errors and performance issues

## Future Enhancements

### Phase 2 Features

- File attachments for tickets
- Real-time notifications (WebSocket)
- Ticket templates for common issues
- Knowledge base integration
- Customer satisfaction surveys
- SLA tracking and reporting
- Automated ticket routing
- Integration with external support tools

### Scalability Considerations

- Message queue for email processing
- Microservice architecture for support system
- CDN for file attachments
- Database sharding for high volume
- Caching layer for frequently accessed data
