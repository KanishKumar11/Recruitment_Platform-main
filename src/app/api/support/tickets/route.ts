import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/app/lib/db";
import SupportTicket, {
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "@/app/models/SupportTicket";
import {
  authenticateRequest,
  authorizeRoles,
  unauthorized,
  forbidden,
} from "@/app/lib/auth";
import { UserRole } from "@/app/models/User";
import {
  validateTicketData,
  sanitizeTicketContent,
} from "@/app/lib/supportUtils";
import {
  sendNewTicketEmail,
  logEmailAttempt,
} from "@/app/lib/supportEmailService";

// Simple in-memory rate limiting (for production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 tickets per 15 minutes per user

function checkRateLimit(userId: string): {
  allowed: boolean;
  resetTime?: number;
} {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or create new limit
    rateLimitMap.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return { allowed: true };
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, resetTime: userLimit.resetTime };
  }

  // Increment count
  userLimit.count++;
  rateLimitMap.set(userId, userLimit);
  return { allowed: true };
}

// GET - Fetch user's support tickets with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const userData = authenticateRequest(request);
    if (!userData) {
      return unauthorized();
    }

    await connectDb();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50); // Max 50 per page
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    // Build query based on user role
    let query: any = {};

    // Regular users can only see their own tickets
    if (
      userData.role === UserRole.COMPANY ||
      userData.role === UserRole.RECRUITER
    ) {
      query.submittedBy = userData.userId;
    }
    // Admin and internal users can see all tickets (no additional filter)

    // Apply filters
    if (
      status &&
      Object.values(TicketStatus).includes(status as TicketStatus)
    ) {
      query.status = status;
    }

    if (
      priority &&
      Object.values(TicketPriority).includes(priority as TicketPriority)
    ) {
      query.priority = priority;
    }

    if (
      category &&
      Object.values(TicketCategory).includes(category as TicketCategory)
    ) {
      query.category = category;
    }

    // Apply search if provided
    if (search && search.trim()) {
      query.$text = { $search: search.trim() };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const [tickets, total] = await Promise.all([
      SupportTicket.find(query)
        .populate("submittedBy", "name email companyName")
        .populate("assignedTo", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SupportTicket.countDocuments(query),
    ]);

    // Calculate pagination info
    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      tickets,
      pagination: {
        total,
        page,
        limit,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching support tickets:", error);
    return NextResponse.json(
      { error: "Failed to fetch support tickets" },
      { status: 500 }
    );
  }
}

// POST - Create new support ticket
export async function POST(request: NextRequest) {
  try {
    const userData = authenticateRequest(request);
    if (!userData) {
      return unauthorized();
    }

    // Check rate limit
    const rateLimitCheck = checkRateLimit(userData.userId);
    if (!rateLimitCheck.allowed) {
      const resetTime = rateLimitCheck.resetTime!;
      const resetDate = new Date(resetTime);
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please try again later.",
          resetTime: resetDate.toISOString(),
        },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(
              (resetTime - Date.now()) / 1000
            ).toString(),
          },
        }
      );
    }

    await connectDb();

    const body = await request.json();
    const { subject, message, category, priority } = body;

    // Validate input data
    const validation = validateTicketData({
      subject,
      message,
      category,
      priority,
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    // Sanitize content to prevent XSS
    const sanitizedSubject = sanitizeTicketContent(subject.trim());
    const sanitizedMessage = sanitizeTicketContent(message.trim());

    // Create new ticket
    const ticket = new SupportTicket({
      subject: sanitizedSubject,
      message: sanitizedMessage,
      category: category || TicketCategory.GENERAL_INQUIRY,
      priority: priority || TicketPriority.MEDIUM,
      status: TicketStatus.OPEN,
      submittedBy: userData.userId,
    });

    await ticket.save();

    // Populate user information for response
    await ticket.populate("submittedBy", "name email companyName");

    // Send email notification (async, don't block response)
    sendNewTicketEmail(ticket)
      .then((result) => {
        logEmailAttempt(
          "new_ticket",
          ticket.ticketNumber,
          "admin",
          result.success,
          result.error
        );
      })
      .catch((error) => {
        console.error("Failed to send new ticket email:", error);
        logEmailAttempt(
          "new_ticket",
          ticket.ticketNumber,
          "admin",
          false,
          error.message
        );
      });

    return NextResponse.json(
      {
        ticket,
        message: "Support ticket created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating support ticket:", error);

    // Handle validation errors
    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "ValidationError"
    ) {
      return NextResponse.json(
        { error: "Validation failed", details: (error as any).message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create support ticket" },
      { status: 500 }
    );
  }
}
