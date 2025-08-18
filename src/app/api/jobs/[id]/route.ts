// src/app/api/jobs/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDb from "./../../../lib/db";
import Job from "./../../../models/Job";
import User from "./../../../models/User";
import ScreeningQuestion from "./../../../models/ScreeningQuestion";
import {
  authenticateRequest,
  authorizeRoles,
  unauthorized,
  forbidden,
  JwtPayload,
} from "./../../../lib/auth";
import { UserRole } from "./../../../models/User";
import mongoose from "mongoose";
import { transformJobForUser } from "@/app/lib/jobUtils";
import { NotificationService } from "@/app/lib/notificationService";

// Helper function to validate commission data
function validateCommissionData(commission: any) {
  if (!commission || typeof commission !== "object") {
    return { isValid: false, error: "Commission data is required" };
  }

  const { type, originalPercentage, fixedAmount } = commission;

  if (!type || !["percentage", "fixed"].includes(type)) {
    return {
      isValid: false,
      error: 'Commission type must be either "percentage" or "fixed"',
    };
  }

  if (type === "percentage") {
    if (
      typeof originalPercentage !== "number" ||
      originalPercentage <= 0 ||
      originalPercentage > 50
    ) {
      return {
        isValid: false,
        error: "Commission percentage must be between 1 and 50",
      };
    }
  }

  if (type === "fixed") {
    if (typeof fixedAmount !== "number" || fixedAmount <= 0) {
      return {
        isValid: false,
        error: "Fixed commission amount must be greater than 0",
      };
    }
  }

  return { isValid: true };
}

// Helper function to check if user has access to the job
async function hasAccessToJob(
  userData: JwtPayload,
  job: { status: string; postedBy: { toString: () => any } }
) {
  // Admin and internal users have access to all jobs
  if (userData.role === UserRole.ADMIN || userData.role === UserRole.INTERNAL) {
    return true;
  }

  // Recruiters can access active jobs
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
        parentId: userData.userId,
      });

      if (teamMember) {
        return true;
      }
    }
  }

  return false;
}

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

    // Ensure id is a valid ObjectId format
    if (!id || id.length !== 24) {
      return NextResponse.json(
        { error: "Invalid job ID format" },
        { status: 400 }
      );
    }

    // First load the job without population
    const job = await Job.findById(id);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check if user has access to this job
    const hasAccess = await hasAccessToJob(userData, job);
    if (!hasAccess) {
      return forbidden();
    }

    // Import and register ScreeningQuestion model before using it
    // This ensures the model is properly registered when we need it
    await import("./../../../models/ScreeningQuestion");

    // Now populate if needed
    if (job.screeningQuestions && job.screeningQuestions.length > 0) {
      await job.populate("screeningQuestions");
    }

    // Transform job based on user role FIRST - this handles commission adjustments for recruiters
    let transformedJob = transformJobForUser(job, userData.role);

    // Get job poster details for company name and user name
    const jobPoster = await User.findById(job.postedBy).select(
      "name companyName"
    );

    if (jobPoster) {
      // For recruiters, show the company name
      if (
        userData.role === UserRole.RECRUITER ||
        userData.role === UserRole.ADMIN ||
        userData.role === UserRole.INTERNAL
      ) {
        transformedJob.postedByCompany = jobPoster.companyName || "Company";
        transformedJob.postedByName = jobPoster.name || "Unknown";
      }

      // If this job was not posted by the current user and user is primary company user,
      // add postedByName for context
      if (
        job.postedBy.toString() !== userData.userId &&
        userData.role === UserRole.COMPANY
      ) {
        transformedJob.postedByName = jobPoster.name || "Team Member";
        transformedJob.postedByCompany = jobPoster.companyName || "Company";
      }
    }

    return NextResponse.json(transformedJob);
  } catch (error) {
    console.error("Get job error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    // Validate ID
    if (!id || id.length !== 24) {
      return NextResponse.json(
        { error: "Invalid job ID format" },
        { status: 400 }
      );
    }

    const jobData = await req.json();
    const job = await Job.findById(id);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check if user has access to update this job
    // For updates, we need to check if user is primary and can edit team member jobs
    let canEdit = job.postedBy.toString() === userData.userId; // Default: own jobs

    if (!canEdit && userData.role === UserRole.COMPANY) {
      // Check if primary user trying to edit team member's job
      const currentUser = await User.findById(userData.userId);

      if (currentUser?.isPrimary) {
        // Check if the job was posted by a team member
        const teamMember = await User.findOne({
          _id: job.postedBy,
          parentId: userData.userId,
        });

        if (teamMember) {
          canEdit = true;
        }
      }
    }

    // Allow admin and internal users to edit
    if (
      userData.role === UserRole.ADMIN ||
      userData.role === UserRole.INTERNAL
    ) {
      canEdit = true;
    }

    if (!canEdit) {
      return forbidden();
    }

    // Recruiters cannot edit jobs
    if (userData.role === UserRole.RECRUITER) {
      return forbidden();
    }

    // Validate commission data if it's being updated
    if (jobData.commission) {
      const validationResult = validateCommissionData(jobData.commission);
      if (!validationResult.isValid) {
        return NextResponse.json(
          { error: validationResult.error },
          { status: 400 }
        );
      }
    }

    // Validate salary data for commission calculations
    if (jobData.salary) {
      if (
        !jobData.salary.min ||
        !jobData.salary.max ||
        jobData.salary.min <= 0 ||
        jobData.salary.max <= 0
      ) {
        return NextResponse.json(
          {
            error: "Valid salary range is required for commission calculations",
          },
          { status: 400 }
        );
      }

      if (jobData.salary.min > jobData.salary.max) {
        return NextResponse.json(
          { error: "Minimum salary cannot be greater than maximum salary" },
          { status: 400 }
        );
      }
    }

    // Handle company name based on user role
    if (userData.role === UserRole.COMPANY) {
      // For company users, use their profile company name if not provided
      if (!jobData.companyName) {
        const currentUser = await User.findById(userData.userId);
        jobData.companyName =
          currentUser?.companyName ||
          currentUser?.name ||
          job.companyName ||
          "Unknown Company";
      }
    } else if (
      userData.role === UserRole.INTERNAL ||
      userData.role === UserRole.ADMIN
    ) {
      // For internal/admin users, company name is required
      if (!jobData.companyName && !job.companyName) {
        return NextResponse.json(
          { error: "Company name is required for internal job postings" },
          { status: 400 }
        );
      }
    }

    // Import and register ScreeningQuestion model before using it
    await import("./../../../models/ScreeningQuestion");

    // Update the job - the pre-save hook will handle commission calculations
    const updatedJob = await Job.findByIdAndUpdate(
      id,
      { $set: jobData },
      { new: true, runValidators: true }
    );

    // Populate only if needed
    if (
      updatedJob &&
      updatedJob.screeningQuestions &&
      updatedJob.screeningQuestions.length > 0
    ) {
      await updatedJob.populate("screeningQuestions");
    }

    // Create notification for job modification
    try {
      // Find all recruiters who might be interested in this job
      const recruiters = await User.find({ role: UserRole.RECRUITER }).select('_id');
      
      if (recruiters.length > 0 && updatedJob) {
        const recruiterIds = recruiters.map(r => r._id.toString());
        // Create notifications for each recruiter
        for (const recruiterId of recruiterIds) {
          await NotificationService.createJobModificationNotification(
            recruiterId,
            updatedJob.title,
            ['job'], // modifiedFields - we'll use a generic field for now
            (updatedJob._id as mongoose.Types.ObjectId).toString()
          );
        }
      }
    } catch (notificationError) {
      console.error('Failed to create job modification notification:', notificationError);
      // Continue with the response even if notification fails
    }

    // Transform the updated job for the response based on user role
    const transformedJob = transformJobForUser(updatedJob, userData.role);

    return NextResponse.json(transformedJob);
  } catch (error) {
    console.error("Update job error:", error);

    // Handle validation errors
    if (
      typeof error === "object" &&
      error !== null &&
      "name" in error &&
      (error as any).name === "ValidationError"
    ) {
      return NextResponse.json(
        { error: "Validation failed", details: (error as any).message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Validate ID
    if (!id || id.length !== 24) {
      return NextResponse.json(
        { error: "Invalid job ID format" },
        { status: 400 }
      );
    }

    const job = await Job.findById(id);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check if user has access to delete this job
    // For deletions, we need to check if user is primary and can delete team member jobs
    let canDelete = job.postedBy.toString() === userData.userId; // Default: own jobs

    if (!canDelete && userData.role === UserRole.COMPANY) {
      // Check if primary user trying to delete team member's job
      const currentUser = await User.findById(userData.userId);

      if (currentUser?.isPrimary) {
        // Check if the job was posted by a team member
        const teamMember = await User.findOne({
          _id: job.postedBy,
          parentId: userData.userId,
        });

        if (teamMember) {
          canDelete = true;
        }
      }
    }

    // Allow admin and internal users to delete
    if (
      userData.role === UserRole.ADMIN ||
      userData.role === UserRole.INTERNAL
    ) {
      canDelete = true;
    }

    if (!canDelete) {
      return forbidden();
    }

    if (userData.role === UserRole.RECRUITER) {
      return forbidden();
    }

    // Delete the job
    await Job.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete job error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
