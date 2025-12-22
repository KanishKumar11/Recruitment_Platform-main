import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/app/lib/db";
import { authenticateRequest } from "@/app/lib/auth";
import Job, { JobVisibility } from "@/app/models/Job";
import { UserRole } from "@/app/models/User";

const formatRecruiterList = (list: any[] = []) =>
  list.map((recruiter) => ({
    id: recruiter?._id?.toString?.() || recruiter?.toString?.() || "",
    name: recruiter?.name || "",
    email: recruiter?.email || "",
    companyName: recruiter?.companyName || "",
  }));

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userData = authenticateRequest(request);
    if (!userData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (userData.role !== UserRole.ADMIN && userData.role !== UserRole.INTERNAL) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await connectDb();
    const { id } = await params;

    const job = await Job.findById(id)
      .populate({
        path: "allowedRecruiters",
        select: "name email companyName",
        options: { strictPopulate: false },
      })
      .populate({
        path: "blockedRecruiters",
        select: "name email companyName",
        options: { strictPopulate: false },
      });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({
      jobId: job._id.toString(),
      visibility: job.visibility || JobVisibility.ALL,
      allowedRecruiters: formatRecruiterList(job.allowedRecruiters),
      blockedRecruiters: formatRecruiterList(job.blockedRecruiters),
    });
  } catch (error) {
    console.error("Error fetching job access settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userData = authenticateRequest(request);
    if (!userData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (userData.role !== UserRole.ADMIN && userData.role !== UserRole.INTERNAL) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await connectDb();
    const { id } = await params;
    const body = await request.json();

    const visibility: JobVisibility = body.visibility || JobVisibility.ALL;
    const allowedRecruiterIds: string[] = body.allowedRecruiterIds || [];
    const blockedRecruiterIds: string[] = body.blockedRecruiterIds || [];

    if (!Object.values(JobVisibility).includes(visibility)) {
      return NextResponse.json({ error: "Invalid visibility value" }, { status: 400 });
    }

    if (visibility === JobVisibility.SELECTED && allowedRecruiterIds.length === 0) {
      return NextResponse.json(
        { error: "Select at least one recruiter when restricting visibility" },
        { status: 400 }
      );
    }

    const job = await Job.findById(id);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const uniqueAllowed = [...new Set(allowedRecruiterIds)];
    const uniqueBlocked = [...new Set(blockedRecruiterIds)];

    job.visibility = visibility;
    job.allowedRecruiters = visibility === JobVisibility.SELECTED ? uniqueAllowed : [];
    job.blockedRecruiters = visibility === JobVisibility.ALL ? uniqueBlocked : [];

    await job.save();

    const updatedJob = await Job.findById(job._id)
      .populate({
        path: "allowedRecruiters",
        select: "name email companyName",
        options: { strictPopulate: false },
      })
      .populate({
        path: "blockedRecruiters",
        select: "name email companyName",
        options: { strictPopulate: false },
      });

    return NextResponse.json({
      jobId: job._id.toString(),
      visibility: job.visibility,
      allowedRecruiters: formatRecruiterList(updatedJob?.allowedRecruiters),
      blockedRecruiters: formatRecruiterList(updatedJob?.blockedRecruiters),
      message: "Job access updated",
    });
  } catch (error) {
    console.error("Error updating job access settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
