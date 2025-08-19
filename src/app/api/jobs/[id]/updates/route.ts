// src/app/api/jobs/[id]/updates/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDb from "../../../../lib/db";
import Job from "../../../../models/Job";
import JobUpdate from "../../../../models/JobUpdate";
import User from "../../../../models/User";
import {
  authenticateRequest,
  unauthorized,
  forbidden,
  JwtPayload,
} from "../../../../lib/auth";
import { UserRole } from "../../../../constants/userRoles";
import { JobUpdateNotificationService } from "../../../../lib/jobUpdateNotificationService";
import mongoose from "mongoose";

// Helper function to check if user has access to job
async function hasAccessToJob(
  userData: JwtPayload,
  jobId: string
): Promise<boolean> {
  const job = await Job.findById(jobId);
  if (!job) return false;

  // Admin and internal users have access to all jobs
  if (
    userData.role === UserRole.ADMIN ||
    userData.role === UserRole.INTERNAL
  ) {
    return true;
  }

  // Recruiters can view updates for active jobs
  if (userData.role === UserRole.RECRUITER && job.status === "ACTIVE") {
    return true;
  }

  // Job creator always has access
  if (job.postedBy.toString() === userData.userId) {
    return true;
  }

  // Primary company users have access to jobs posted by their team members
  if (userData.role === UserRole.COMPANY) {
    // Get the current user to check isPrimary status
    const currentUser = await User.findById(userData.userId);
    
    if (currentUser?.isPrimary) {
      // Check if the job was posted by a team member
      const teamMember = await User.findOne({
        _id: job.postedBy,
        parentId: userData.userId
      });
      
      if (teamMember) {
        return true;
      }
    }
  }

  return false;
}

// Helper function to check if user can post updates
function canPostUpdates(userData: JwtPayload): boolean {
  return [
    UserRole.ADMIN,
    UserRole.INTERNAL,
    UserRole.COMPANY,
  ].includes(userData.role);
}

// GET - Fetch job updates
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userData = authenticateRequest(req);
    if (!userData) {
      return unauthorized();
    }

    await connectDb();

    const { id } = await params;

    // Validate job ID format
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid job ID format" },
        { status: 400 }
      );
    }

    // Check if user has access to this job
    const hasAccess = await hasAccessToJob(userData, id);
    if (!hasAccess) {
      return forbidden();
    }

    // Fetch job updates
    const updates = await JobUpdate.find({ jobId: id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: updates,
    });
  } catch (error) {
    console.error("Error fetching job updates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new job update
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userData = authenticateRequest(req);
    if (!userData) {
      return unauthorized();
    }

    await connectDb();

    const { id } = await params;

    // Validate job ID format
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid job ID format" },
        { status: 400 }
      );
    }

    // Check if user can post updates
    if (!canPostUpdates(userData)) {
      return NextResponse.json(
        { error: "You don't have permission to post job updates" },
        { status: 403 }
      )
    }

    // Check if user has access to this job
    const hasAccess = await hasAccessToJob(userData, id);
    if (!hasAccess) {
      return forbidden();
    }

    // Verify job exists
    const job = await Job.findById(id);
    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { title, content } = body;

    // Validate required fields
    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Use default title if not provided
    const updateTitle = title && title.trim() ? title.trim() : "Job Update";

    // Validate field lengths
    if (updateTitle.length > 200) {
      return NextResponse.json(
        { error: "Title must be 200 characters or less" },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: "Content must be 2000 characters or less" },
        { status: 400 }
      );
    }

    // Get user details
    const user = await User.findById(userData.userId).select('name role');
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Create job update
    const jobUpdate = new JobUpdate({
      jobId: id,
      title: updateTitle,
      content: content.trim(),
      postedBy: userData.userId,
      postedByName: user.name,
      postedByRole: user.role,
    });

    await jobUpdate.save();

    // Send notifications to eligible recruiters (those who saved the job or uploaded resumes)
    try {
      await JobUpdateNotificationService.sendJobUpdateNotifications(
        id,
        updateTitle,
        content.trim(),
        user.name
      );
    } catch (notificationError) {
      console.error('Failed to send job update notifications:', notificationError);
      // Continue with the response even if notification fails
    }

    return NextResponse.json(
      {
        success: true,
        message: "Job update posted successfully",
        data: jobUpdate,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating job update:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}