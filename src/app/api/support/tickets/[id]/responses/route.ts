import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/app/lib/db";
import SupportTicket, { ITicketResponse } from "@/app/models/SupportTicket";
import { authenticateRequest, unauthorized, forbidden } from "@/app/lib/auth";
import { UserRole } from "@/app/models/User";
import { sanitizeTicketContent } from "@/app/lib/supportUtils";
import {
  sendTicketResponseEmail,
  logEmailAttempt,
} from "@/app/lib/supportEmailService";
import mongoose from "mongoose";

// Rate limiting map for response creation
const responseRateLimit = new Map<
  string,
  { count: number; resetTime: number }
>();
const RESPONSE_RATE_LIMIT = 10; // Max 10 responses per hour per user
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

// Audit trail logging function
function logAuditTrail(
  action: string,
  ticketId: string,
  userId: string,
  changes?: any,
  metadata?: any
) {
  const auditEntry = {
    timestamp: new Date().toISOString(),
    action,
    ticketId,
    userId,
    changes,
    metadata,
  };

  // Log to console for now - in production, this would go to a proper audit log system
  console.log("AUDIT_TRAIL:", JSON.stringify(auditEntry));
}

// Check rate limit for response creation
function checkResponseRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = responseRateLimit.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or initialize rate limit
    responseRateLimit.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (userLimit.count >= RESPONSE_RATE_LIMIT) {
    return false;
  }

  userLimit.count++;
  return true;
}

// Validate response data
function validateResponseData(data: {
  message?: string;
  isInternal?: boolean;
  notifyUser?: boolean;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.message || data.message.trim().length === 0) {
    errors.push("Response message is required");
  } else if (data.message.length > 5000) {
    errors.push("Response message must be less than 5,000 characters");
  }

  if (data.isInternal !== undefined && typeof data.isInternal !== "boolean") {
    errors.push("isInternal must be a boolean value");
  }

  if (data.notifyUser !== undefined && typeof data.notifyUser !== "boolean") {
    errors.push("notifyUser must be a boolean value");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// GET - Retrieve ticket responses with proper filtering
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userData = authenticateRequest(request);
    if (!userData) {
      return unauthorized();
    }

    await connectDb();

    const { id: ticketId } = await params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return NextResponse.json(
        { error: "Invalid ticket ID format" },
        { status: 400 }
      );
    }

    // Find the ticket
    const ticket = await SupportTicket.findById(ticketId)
      .populate("submittedBy", "name email")
      .populate("responses.respondedBy", "name email role")
      .lean();

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Authorization check: users can only view responses for their own tickets,
    // admins and internal users can view all tickets
    const isOwner =
      (ticket as any).submittedBy._id.toString() === userData.userId;
    const isAdmin = userData.role === UserRole.ADMIN;
    const isInternalUser = userData.role === UserRole.INTERNAL;

    if (!isOwner && !isAdmin && !isInternalUser) {
      return forbidden();
    }

    // Filter internal responses for non-admin/non-internal users
    let responses = (ticket as any).responses;
    if (!isAdmin && !isInternalUser) {
      responses = responses.filter((response: any) => !response.isInternal);
    }

    // Sort responses by creation date (oldest first)
    responses.sort(
      (a: any, b: any) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Log audit trail for response access
    logAuditTrail("VIEW_RESPONSES", ticketId, userData.userId, null, {
      userRole: userData.role,
      isOwner,
      responseCount: responses.length,
    });

    return NextResponse.json({
      responses,
      ticketInfo: {
        ticketNumber: (ticket as any).ticketNumber,
        subject: (ticket as any).subject,
        status: (ticket as any).status,
      },
    });
  } catch (error) {
    console.error("Error fetching ticket responses:", error);
    return NextResponse.json(
      { error: "Failed to fetch ticket responses" },
      { status: 500 }
    );
  }
}

// POST - Add response to ticket with admin/internal user validation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userData = authenticateRequest(request);
    if (!userData) {
      return unauthorized();
    }

    // Check rate limit
    if (!checkResponseRateLimit(userData.userId)) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: `Maximum ${RESPONSE_RATE_LIMIT} responses per hour allowed`,
        },
        { status: 429 }
      );
    }

    await connectDb();

    const { id: ticketId } = await params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return NextResponse.json(
        { error: "Invalid ticket ID format" },
        { status: 400 }
      );
    }

    // Get ticket details to check assignment for authorization
    const ticketToCheck = await SupportTicket.findById(ticketId).lean();
    if (!ticketToCheck) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Authorization check: Only admins and internal users can add responses
    const isAdmin = userData.role === UserRole.ADMIN;
    const isInternalUser = userData.role === UserRole.INTERNAL;

    if (!isAdmin && !isInternalUser) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message:
            "Only admins and internal team members can respond to tickets",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { message, isInternal, notifyUser } = body;
    const isInternalValue = isInternal ?? false;
    const notifyUserValue = notifyUser ?? false;

    // Validate response data
    const validation = validateResponseData({
      message,
      isInternal: isInternalValue,
      notifyUser: notifyUserValue,
    });
    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    // Find the ticket
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Sanitize the response message
    const sanitizedMessage = sanitizeTicketContent(message.trim());

    // Create the response object
    const newResponse: Partial<ITicketResponse> = {
      _id: new mongoose.Types.ObjectId(),
      message: sanitizedMessage,
      respondedBy: new mongoose.Types.ObjectId(userData.userId),
      isInternal: isInternalValue,
      createdAt: new Date(),
    };

    // Add the response to the ticket
    ticket.responses.push(newResponse as ITicketResponse);

    // Update the ticket's updatedAt timestamp
    ticket.updatedAt = new Date();

    // Save the ticket with the new response
    await ticket.save();

    // Populate the response with user details for the response
    const populatedTicket = await SupportTicket.findById(ticketId)
      .populate("responses.respondedBy", "name email role")
      .lean();

    // Find the newly added response
    const addedResponse = (populatedTicket as any)?.responses.find(
      (r: any) => r._id.toString() === newResponse._id?.toString()
    );

    // Log audit trail for response creation
    logAuditTrail(
      "ADD_RESPONSE",
      ticketId,
      userData.userId,
      {
        responseId: newResponse._id?.toString(),
        isInternal: isInternalValue,
        messageLength: sanitizedMessage.length,
      },
      {
        userRole: userData.role,
        notifyUser: notifyUserValue,
        ticketNumber: ticket.ticketNumber,
      }
    );

    // Send email notification to user if requested and not internal
    if (notifyUserValue && !isInternalValue) {
      sendTicketResponseEmail(ticket, newResponse as ITicketResponse, true)
        .then((result) => {
          logEmailAttempt(
            "response",
            ticket.ticketNumber,
            "user",
            result.success,
            result.error
          );
        })
        .catch((error) => {
          console.error("Failed to send ticket response email:", error);
          logEmailAttempt(
            "response",
            ticket.ticketNumber,
            "user",
            false,
            error.message
          );
        });
    }

    return NextResponse.json(
      {
        response: addedResponse,
        message: "Response added successfully",
        ticketInfo: {
          ticketNumber: (ticket as any).ticketNumber,
          subject: (ticket as any).subject,
          status: (ticket as any).status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding ticket response:", error);

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
      { error: "Failed to add response" },
      { status: 500 }
    );
  }
}
