// src/app/api/jobs/resume-counts/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDb from "../../../lib/db";
import ResumeModel from "../../../models/Resume";
import Job from "../../../models/Job";
import { authenticateRequest, unauthorized } from "../../../lib/auth";
import { UserRole } from "../../../models/User";

export async function GET(req: NextRequest) {
  try {
    const userData = authenticateRequest(req);
    if (!userData) {
      return unauthorized();
    }

    // Only allow admin and internal users to access resume counts
    if (userData.role !== UserRole.ADMIN && userData.role !== UserRole.INTERNAL) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    await connectDb();

    // Get all jobs that the user has access to
    const jobs = await Job.find().select('_id').lean();
    const jobIds = jobs.map(job => job._id);

    // Aggregate resume counts by job ID
    const resumeCounts = await ResumeModel.aggregate([
      {
        $match: {
          jobId: { $in: jobIds }
        }
      },
      {
        $group: {
          _id: "$jobId",
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert to a map for easy lookup
    const resumeCountMap = resumeCounts.reduce((acc, item) => {
      acc[item._id.toString()] = item.count;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json(resumeCountMap);
  } catch (error) {
    console.error("Get resume counts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
