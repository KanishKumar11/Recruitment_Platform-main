// src/app/api/recruiter-jobs/route.ts
import { NextRequest, NextResponse } from "next/server";
import RecruiterJob from "@/app/models/RecruiterJob";
import Job, { JobVisibility } from "@/app/models/Job";
import { authenticateRequest } from "@/app/lib/auth";
import { UserRole } from "@/app/models/User";
import connectDb from "@/app/lib/db";
import mongoose from "mongoose";

const hasJobAccess = (job: any, recruiterId: mongoose.Types.ObjectId) => {
  if (!job) return false;
  if (!["ACTIVE", "PAUSED"].includes(job.status)) return false;

  const recruiterIdStr = recruiterId.toString();
  const visibility = job.visibility || JobVisibility.ALL;

  if (visibility === JobVisibility.ALL) {
    const blocked = (job.blockedRecruiters || []).map((id: any) =>
      id?.toString()
    );
    return !blocked.includes(recruiterIdStr);
  }

  const allowed = (job.allowedRecruiters || []).map((id: any) =>
    id?.toString()
  );
  return allowed.includes(recruiterIdStr);
};

// GET - Get recruiter's saved jobs
export async function GET(request: NextRequest) {
  try {
    await connectDb();

    const userData = authenticateRequest(request);
    if (!userData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only recruiters can access their saved jobs
    if (userData.role !== UserRole.RECRUITER) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const recruiterObjectId = new mongoose.Types.ObjectId(userData.userId);

    // Get recruiter's saved jobs with job details
    const recruiterJobs = await RecruiterJob.find({
      recruiterId: userData.userId,
      isActive: true,
    })
      .populate({
        path: "jobId",
        model: "Job",
        populate: {
          path: "postedBy",
          model: "User",
          select: "name companyName",
        },
      })
      .sort({ addedAt: -1 });

    // Filter out jobs that might have been deleted and extract the populated job data
    const savedJobs = recruiterJobs
      .filter((rj) => rj.jobId && hasJobAccess(rj.jobId, recruiterObjectId))
      .map((rj) => rj.jobId);

    return NextResponse.json({ savedJobs }, { status: 200 });
  } catch (error) {
    console.error("Error fetching recruiter jobs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Add job to recruiter's saved jobs
export async function POST(request: NextRequest) {
  try {
    await connectDb();

    const userData = authenticateRequest(request);
    if (!userData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only recruiters can save jobs
    if (userData.role !== UserRole.RECRUITER) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { jobId } = await request.json();

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    // Check if job exists
    const recruiterObjectId = new mongoose.Types.ObjectId(userData.userId);
    const job = await Job.findById(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (!hasJobAccess(job, recruiterObjectId)) {
      return NextResponse.json(
        { error: "You do not have access to this job" },
        { status: 403 }
      );
    }

    // Check if already saved (upsert will handle this, but we want to return appropriate message)
    const existingEntry = await RecruiterJob.findOne({
      recruiterId: userData.userId,
      jobId: jobId,
    });

    if (existingEntry) {
      if (existingEntry.isActive) {
        return NextResponse.json(
          { message: "Job already in your saved jobs" },
          { status: 200 }
        );
      } else {
        // Reactivate if it was previously removed
        existingEntry.isActive = true;
        existingEntry.addedAt = new Date();
        await existingEntry.save();
        return NextResponse.json(
          { message: "Job added to your saved jobs" },
          { status: 200 }
        );
      }
    }

    // Create new entry
    const recruiterJob = new RecruiterJob({
      recruiterId: userData.userId,
      jobId: jobId,
    });

    await recruiterJob.save();

    return NextResponse.json(
      { message: "Job added to your saved jobs" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding job to saved jobs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove job from recruiter's saved jobs
export async function DELETE(request: NextRequest) {
  try {
    await connectDb();

    const userData = authenticateRequest(request);
    if (!userData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only recruiters can remove saved jobs
    if (userData.role !== UserRole.RECRUITER) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    // Soft delete by setting isActive to false
    const result = await RecruiterJob.findOneAndUpdate(
      {
        recruiterId: userData.userId,
        jobId: jobId,
        isActive: true,
      },
      {
        isActive: false,
      },
      { new: true }
    );

    if (!result) {
      return NextResponse.json(
        { error: "Job not found in your saved jobs" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Job removed from your saved jobs" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error removing job from saved jobs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
