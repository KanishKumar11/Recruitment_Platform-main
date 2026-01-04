// src/app/api/resumes/all-submissions/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDb from "./../../../lib/db";
import ResumeModel from "./../../../models/Resume";
import Job from "./../../../models/Job";
import User from "./../../../models/User";
import {
  authenticateRequest,
  unauthorized,
  forbidden,
} from "./../../../lib/auth";
import { UserRole } from "./../../../models/User";

export async function GET(req: NextRequest) {
  try {
    const userData = authenticateRequest(req);
    if (!userData) {
      return unauthorized();
    }

    // Only admins should access this endpoint
    if (
      userData.role !== UserRole.ADMIN &&
      userData.role !== UserRole.INTERNAL
    ) {
      return forbidden();
    }

    await connectDb();

    // Fetch all resumes
    const resumes = await ResumeModel.find().sort({ updatedAt: -1 }).lean();

    // Get unique job and submitter IDs
    const jobIds = [
      ...new Set(resumes.map((resume) => resume.jobId).filter(Boolean)),
    ];
    const submitterIds = [
      ...new Set(resumes.map((resume) => resume.submittedBy).filter(Boolean)),
    ];

    // Fetch job and submitter information in separate queries
    const [jobs, submitters] = await Promise.all([
      Job.find({ _id: { $in: jobIds } })
        .select("_id title jobCode location")
        .lean(),
      User.find({ _id: { $in: submitterIds } })
        .select("_id name")
        .lean(),
    ]);

    // Create mappings
    const jobMap = jobs.reduce((map, job) => {
      map[(job._id as any).toString()] = {
        title: job.title,
        jobCode: (job as any).jobCode,
        location: (job as any).location,
      };
      return map;
    }, {} as Record<string, { title: string; jobCode?: string; location?: string }>);

    const submitterMap = submitters.reduce((map, user) => {
      map[(user._id as any).toString()] = user.name;
      return map;
    }, {} as Record<string, string>);

    // Enhance resumes with job and submitter information
    const enhancedResumes = resumes.map((resume) => ({
      ...resume,
      jobId: resume.jobId
        ? {
            _id: resume.jobId,
            title: jobMap[resume.jobId.toString()]?.title || "Unknown Job",
            jobCode: jobMap[resume.jobId.toString()]?.jobCode,
            location: jobMap[resume.jobId.toString()]?.location,
          }
        : null,
      submittedBy: resume.submittedBy
        ? {
            _id: resume.submittedBy,
            name: submitterMap[resume.submittedBy.toString()] || "Unknown User",
          }
        : null,
    }));

    return NextResponse.json(enhancedResumes);
  } catch (error) {
    console.error("Get all submissions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
