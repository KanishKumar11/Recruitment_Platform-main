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
import mongoose from "mongoose";

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

// GET - Fetch specific ticket details with authorization checks
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
      .populate("submittedBy", "name email companyName")
      .populate("assignedTo", "name email")
      .populate("responses.respondedBy", "name email")
      .lean();

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Authorization check: users can only view their own tickets,
    // admins can view all, and assigned internal users can view assigned tickets
    const isOwner =
      (ticket as any).submittedBy._id.toString() === userData.userId;
    const isAdmin = userData.role === UserRole.ADMIN;
    const isAssignedInternal =
      userData.role === UserRole.INTERNAL &&
      (ticket as any).assignedTo?.toString() === userData.userId;

    if (!isOwner && !isAdmin && !isAssignedInternal) {
      return forbidden();
    }

    // Filter internal responses for non-admin/non-assigned users
    if (!isAdmin && !isAssignedInternal) {
      (ticket as any).responses = (ticket as any).responses.filter(
        (response: any) => !response.isInternal
      );
    }

    // Log audit trail for ticket access
    logAuditTrail("VIEW_TICKET", ticketId, userData.userId, null, {
      userRole: userData.role,
      isOwner,
    });

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json(
      { error: "Failed to fetch ticket" },
      { status: 500 }
    );
  }
}

// PUT - Update ticket (admin-only for status/priority changes)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userData = authenticateRequest(request);
    if (!userData) {
      return unauthorized();
    }

    // Only admins and internal users can update tickets
    if (![UserRole.ADMIN, UserRole.INTERNAL].includes(userData.role)) {
      return forbidden();
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

    const body = await request.json();
    const { subject, message, category, priority, status, assignedTo } = body;

    // Find the existing ticket
    const existingTicket = await SupportTicket.findById(ticketId);
    if (!existingTicket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Store original values for audit trail
    const originalValues = {
      subject: existingTicket.subject,
      message: existingTicket.message,
      category: existingTicket.category,
      priority: existingTicket.priority,
      status: existingTicket.status,
      assignedTo: existingTicket.assignedTo?.toString(),
    };

    // Build update object with only provided fields
    const updateData: any = {};
    const changes: any = {};

    if (subject !== undefined && subject.trim()) {
      const sanitizedSubject = sanitizeTicketContent(subject.trim());
      if (sanitizedSubject !== existingTicket.subject) {
        updateData.subject = sanitizedSubject;
        changes.subject = {
          from: existingTicket.subject,
          to: sanitizedSubject,
        };
      }
    }

    if (message !== undefined && message.trim()) {
      const sanitizedMessage = sanitizeTicketContent(message.trim());
      if (sanitizedMessage !== existingTicket.message) {
        updateData.message = sanitizedMessage;
        changes.message = {
          from: existingTicket.message,
          to: sanitizedMessage,
        };
      }
    }

    if (
      category &&
      Object.values(TicketCategory).includes(category as TicketCategory)
    ) {
      if (category !== existingTicket.category) {
        updateData.category = category;
        changes.category = { from: existingTicket.category, to: category };
      }
    }

    if (
      priority &&
      Object.values(TicketPriority).includes(priority as TicketPriority)
    ) {
      if (priority !== existingTicket.priority) {
        updateData.priority = priority;
        changes.priority = { from: existingTicket.priority, to: priority };
      }
    }

    if (
      status &&
      Object.values(TicketStatus).includes(status as TicketStatus)
    ) {
      if (status !== existingTicket.status) {
        updateData.status = status;
        changes.status = { from: existingTicket.status, to: status };

        // Set resolved/closed dates based on status
        if (status === TicketStatus.RESOLVED && !existingTicket.resolvedAt) {
          updateData.resolvedAt = new Date();
        }
        if (status === TicketStatus.CLOSED && !existingTicket.closedAt) {
          updateData.closedAt = new Date();
        }
      }
    }

    if (assignedTo !== undefined) {
      // Handle assignment (can be null to unassign)
      const newAssignedTo = assignedTo
        ? mongoose.Types.ObjectId.isValid(assignedTo)
          ? assignedTo
          : null
        : null;

      const currentAssignedTo = existingTicket.assignedTo?.toString();
      if (newAssignedTo !== currentAssignedTo) {
        updateData.assignedTo = newAssignedTo;
        changes.assignedTo = { from: currentAssignedTo, to: newAssignedTo };
      }
    }

    // If no changes, return current ticket
    if (Object.keys(changes).length === 0) {
      const ticket = await SupportTicket.findById(ticketId)
        .populate("submittedBy", "name email companyName")
        .populate("assignedTo", "name email")
        .lean();

      return NextResponse.json({
        ticket,
        message: "No changes detected",
      });
    }

    // Validate the update data if it contains subject/message
    if (updateData.subject || updateData.message) {
      const validation = validateTicketData({
        subject: updateData.subject || existingTicket.subject,
        message: updateData.message || existingTicket.message,
        category: updateData.category || existingTicket.category,
        priority: updateData.priority || existingTicket.priority,
      });

      if (!validation.isValid) {
        return NextResponse.json(
          { error: "Validation failed", details: validation.errors },
          { status: 400 }
        );
      }
    }

    // Update the ticket
    const updatedTicket = await SupportTicket.findByIdAndUpdate(
      ticketId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("submittedBy", "name email companyName")
      .populate("assignedTo", "name email")
      .lean();

    // Log audit trail for ticket update
    logAuditTrail("UPDATE_TICKET", ticketId, userData.userId, changes, {
      userRole: userData.role,
      updateFields: Object.keys(changes),
    });

    return NextResponse.json({
      ticket: updatedTicket,
      message: "Ticket updated successfully",
      changes: Object.keys(changes),
    });
  } catch (error) {
    console.error("Error updating ticket:", error);

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
      { error: "Failed to update ticket" },
      { status: 500 }
    );
  }
}

// DELETE - Delete ticket with proper permissions
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userData = authenticateRequest(request);
    if (!userData) {
      return unauthorized();
    }

    // Only admins can delete tickets
    if (userData.role !== UserRole.ADMIN) {
      return forbidden();
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

    // Find the ticket first to get details for audit trail
    const ticket = await SupportTicket.findById(ticketId).lean();
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Store ticket details for audit trail before deletion
    const ticketDetails = {
      ticketNumber: (ticket as any).ticketNumber,
      subject: (ticket as any).subject,
      status: (ticket as any).status,
      submittedBy: (ticket as any).submittedBy.toString(),
      createdAt: (ticket as any).createdAt,
    };

    // Delete the ticket
    await SupportTicket.findByIdAndDelete(ticketId);

    // Log audit trail for ticket deletion
    logAuditTrail("DELETE_TICKET", ticketId, userData.userId, null, {
      userRole: userData.role,
      deletedTicket: ticketDetails,
    });

    return NextResponse.json({
      message: "Ticket deleted successfully",
      ticketNumber: (ticket as any).ticketNumber,
    });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    return NextResponse.json(
      { error: "Failed to delete ticket" },
      { status: 500 }
    );
  }
}
