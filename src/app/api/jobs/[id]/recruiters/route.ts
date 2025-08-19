import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/app/lib/db";
import { authenticateRequest } from "@/app/lib/auth";
import { UserRole } from "@/app/models/User";
import RecruiterJob from "@/app/models/RecruiterJob";
import Job from "@/app/models/Job";

// GET - Get recruiters who saved a specific job
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();

    const userData = authenticateRequest(request);
    if (!userData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin and internal users can view recruiters who saved jobs
    if (userData.role !== UserRole.ADMIN && userData.role !== UserRole.INTERNAL) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id: jobId } = await params;

    // Verify job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Get all recruiters who have saved this job
    const recruiterJobs = await RecruiterJob.find({
      jobId: jobId,
      isActive: true,
    })
      .populate({
        path: "recruiterId",
        select: "name email phone recruiterType companyName",
        match: { role: UserRole.RECRUITER },
      })
      .lean();

    // Filter out null populated recruiters and format the response
    const recruiters = recruiterJobs
      .filter((rj: any) => rj.recruiterId)
      .map((rj: any) => ({
        id: rj.recruiterId._id.toString(),
        name: rj.recruiterId.name,
        email: rj.recruiterId.email,
        phone: rj.recruiterId.phone || "N/A",
        type: rj.recruiterId.recruiterType === "company" ? "Company" : "Individual",
        companyName: rj.recruiterId.companyName || "N/A",
        savedAt: rj.addedAt,
      }));

    return NextResponse.json({ recruiters }, { status: 200 });
  } catch (error) {
    console.error("Error fetching recruiters for job:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}