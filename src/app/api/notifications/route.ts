// src/app/api/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/app/lib/db";
import Notification, { NotificationType } from "@/app/models/Notification";
import Resume from "@/app/models/Resume";
import Job from "@/app/models/Job";
import { authenticateRequest, authorizeRoles } from "@/app/lib/auth";
import { UserRole } from "@/app/models/User";
import mongoose from "mongoose";

// GET - Fetch notifications for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const authResult = authenticateRequest(request);
    
    if (!authResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only recruiters can access notifications
    if (authResult.role !== UserRole.RECRUITER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDb();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const type = searchParams.get("type") as NotificationType;

    const skip = (page - 1) * limit;

    // Build query
    const query: any = { recipientId: authResult.userId };
    if (unreadOnly) {
      query.isRead = false;
    }
    if (type && Object.values(NotificationType).includes(type)) {
      query.type = type;
    }

    // Fetch notifications with pagination
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("jobId", "title")
      .populate("resumeId", "candidateName")
      .lean();

    // Get total count for pagination
    const totalCount = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      recipientId: authResult.userId,
      isRead: false,
    });

    return NextResponse.json({
      notifications,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1,
      },
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new notification (internal use)
export async function POST(request: NextRequest) {
  try {
    const authResult = authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin and internal users can create notifications directly
    if (
      authResult.role !== UserRole.ADMIN &&
      authResult.role !== UserRole.INTERNAL
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDb();

    const body = await request.json();
    const {
      recipientId,
      type,
      title,
      message,
      jobId,
      resumeId,
      candidateName,
      jobTitle,
      metadata,
    } = body;

    // Validate required fields
    if (!recipientId || !type || !title || !message) {
      return NextResponse.json(
        { error: "Missing required fields: recipientId, type, title, message" },
        { status: 400 }
      );
    }

    // Validate notification type
    if (!Object.values(NotificationType).includes(type)) {
      return NextResponse.json(
        { error: "Invalid notification type" },
        { status: 400 }
      );
    }

    // Validate recipientId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      return NextResponse.json(
        { error: "Invalid recipientId" },
        { status: 400 }
      );
    }

    // Create notification
    const notification = new Notification({
      recipientId,
      type,
      title,
      message,
      jobId: jobId || undefined,
      resumeId: resumeId || undefined,
      candidateName: candidateName || undefined,
      jobTitle: jobTitle || undefined,
      metadata: metadata || undefined,
    });

    await notification.save();

    return NextResponse.json(
      {
        message: "Notification created successfully",
        notification,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const authResult = authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only recruiters can mark their notifications as read
    if (authResult.role !== UserRole.RECRUITER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDb();

    const body = await request.json();
    const { notificationIds, markAllAsRead } = body;

    if (markAllAsRead) {
      // Mark all notifications as read for the user
      await Notification.updateMany(
        { recipientId: authResult.userId, isRead: false },
        { isRead: true }
      );

      return NextResponse.json({
        message: "All notifications marked as read",
      });
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Validate all IDs are valid ObjectIds
      const invalidIds = notificationIds.filter(
        (id) => !mongoose.Types.ObjectId.isValid(id)
      );
      if (invalidIds.length > 0) {
        return NextResponse.json(
          { error: "Invalid notification IDs provided" },
          { status: 400 }
        );
      }

      // Mark specific notifications as read (only if they belong to the user)
      const result = await Notification.updateMany(
        {
          _id: { $in: notificationIds },
          recipientId: authResult.userId,
        },
        { isRead: true }
      );

      return NextResponse.json({
        message: `${result.modifiedCount} notifications marked as read`,
        modifiedCount: result.modifiedCount,
      });
    } else {
      return NextResponse.json(
        {
          error:
            "Either provide notificationIds array or set markAllAsRead to true",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete notifications
export async function DELETE(request: NextRequest) {
  try {
    const authResult = authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only recruiters can delete their notifications
    if (authResult.role !== UserRole.RECRUITER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDb();

    const { searchParams } = new URL(request.url);
    const notificationIds = searchParams.get("ids")?.split(",") || [];
    const deleteAll = searchParams.get("deleteAll") === "true";
    const deleteRead = searchParams.get("deleteRead") === "true";

    if (deleteAll) {
      // Delete all notifications for the user
      const result = await Notification.deleteMany({
        recipientId: authResult.userId,
      });

      return NextResponse.json({
        message: `${result.deletedCount} notifications deleted`,
        deletedCount: result.deletedCount,
      });
    } else if (deleteRead) {
      // Delete only read notifications for the user
      const result = await Notification.deleteMany({
        recipientId: authResult.userId,
        isRead: true,
      });

      return NextResponse.json({
        message: `${result.deletedCount} read notifications deleted`,
        deletedCount: result.deletedCount,
      });
    } else if (notificationIds.length > 0) {
      // Validate all IDs are valid ObjectIds
      const invalidIds = notificationIds.filter(
        (id) => !mongoose.Types.ObjectId.isValid(id)
      );
      if (invalidIds.length > 0) {
        return NextResponse.json(
          { error: "Invalid notification IDs provided" },
          { status: 400 }
        );
      }

      // Delete specific notifications (only if they belong to the user)
      const result = await Notification.deleteMany({
        _id: { $in: notificationIds },
        recipientId: authResult.userId,
      });

      return NextResponse.json({
        message: `${result.deletedCount} notifications deleted`,
        deletedCount: result.deletedCount,
      });
    } else {
      return NextResponse.json(
        {
          error:
            "Provide notification IDs, set deleteAll=true, or deleteRead=true",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error deleting notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
