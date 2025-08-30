// api/resumes/route.ts - Updated version
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import connectDb from "./../../lib/db";
import ResumeModel from "./../../models/Resume";
import Job from "./../../models/Job";
import RecruiterJob from "./../../models/RecruiterJob";
import { authenticateRequest, unauthorized } from "./../../lib/auth";
import { UserRole } from "./../../models/User";
import { validateResumeFile, validateAdditionalDocument } from "./../../lib/fileValidation";

export async function POST(req: NextRequest) {
  try {
    const userData = authenticateRequest(req);
    if (!userData) {
      return unauthorized();
    }

    await connectDb();

    const formData = await req.formData();

    const jobId = formData.get("jobId") as string;
    const candidateName = formData.get("candidateName") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const alternativePhone = formData.get("alternativePhone") as string;
    const country = formData.get("country") as string;
    const location = formData.get("location") as string;
    const currentCompany = formData.get("currentCompany") as string;
    const currentDesignation = formData.get("currentDesignation") as string;
    const totalExperience = formData.get("totalExperience") as string;
    const relevantExperience = formData.get("relevantExperience") as string;
    const currentCTC = formData.get("currentCTC") as string;
    const expectedCTC = formData.get("expectedCTC") as string;
    const noticePeriod = formData.get("noticePeriod") as string;
    const qualification = formData.get("qualification") as string;
    const remarks = formData.get("remarks") as string;

    const resumeFile = formData.get("resumeFile") as File;
    if (!resumeFile) {
      return NextResponse.json(
        { error: "Resume file is required" },
        { status: 400 }
      );
    }

    // Validate resume file
    const resumeValidation = validateResumeFile(resumeFile);
    if (!resumeValidation.isValid) {
      return NextResponse.json(
        { 
          error: resumeValidation.error,
          currentSize: resumeValidation.fileSize
        },
        { status: 400 }
      );
    }

    // Get additional documents
    const additionalFiles = formData.getAll("additionalDocuments") as File[];

    // Validate additional document file sizes
    for (let i = 0; i < additionalFiles.length; i++) {
      const file = additionalFiles[i];
      if (file && file.size > 0) {
        const docValidation = validateAdditionalDocument(file);
        if (!docValidation.isValid) {
          return NextResponse.json(
            { 
              error: `Additional document "${file.name}": ${docValidation.error}`,
              currentSize: docValidation.fileSize
            },
            { status: 400 }
          );
        }
      }
    }

    // Validate required fields
    if (
      !jobId ||
      !candidateName ||
      !email ||
      !phone ||
      !country ||
      !location ||
      !currentCompany ||
      !currentDesignation ||
      !totalExperience ||
      !relevantExperience ||
      !currentCTC ||
      !expectedCTC ||
      !noticePeriod ||
      !qualification
    ) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Parse screening question answers
    const screeningAnswers = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("screeningAnswer_")) {
        const questionId = key.replace("screeningAnswer_", "");
        screeningAnswers.push({
          questionId,
          answer: value as string,
        });
      }
    }

    // Save the resume file - Updated to use uploads directory outside public
    const resumeBytes = await resumeFile.arrayBuffer();
    const resumeBuffer = Buffer.from(resumeBytes);

    // Create uploads directory outside public folder
    const uploadsDir = path.join(process.cwd(), "uploads");
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename for resume
    const uniqueResumeFilename = `${uuidv4()}_${resumeFile.name}`;
    const resumeFilePath = path.join(uploadsDir, uniqueResumeFilename);

    // Write the resume file
    await writeFile(resumeFilePath, resumeBuffer);

    // Process additional documents
    const additionalDocuments = [];
    for (const file of additionalFiles) {
      if (file && file.size > 0) {
        const fileBytes = await file.arrayBuffer();
        const fileBuffer = Buffer.from(fileBytes);

        // Generate unique filename for additional document
        const uniqueDocFilename = `${uuidv4()}_${file.name}`;
        const docFilePath = path.join(uploadsDir, uniqueDocFilename);

        // Write the additional document
        await writeFile(docFilePath, fileBuffer);

        additionalDocuments.push({
          filename: uniqueDocFilename,
          originalName: file.name,
          uploadedAt: new Date(),
        });
      }
    }

    // Create resume record - store relative path for API serving
    const resume = new ResumeModel({
      jobId,
      submittedBy: userData.userId,
      candidateName,
      email,
      phone,
      alternativePhone: alternativePhone || undefined,
      country,
      location,
      currentCompany,
      currentDesignation,
      totalExperience,
      relevantExperience,
      currentCTC,
      expectedCTC,
      noticePeriod,
      qualification,
      remarks: remarks || undefined,
      resumeFile: uniqueResumeFilename, // Store just the filename
      additionalDocuments,
      screeningAnswers,
    });

    await resume.save();

    // Auto-add job to recruiter's saved jobs if not already saved
    if (userData.role === UserRole.RECRUITER) {
      try {
        const existingSavedJob = await RecruiterJob.findOne({
          recruiterId: userData.userId,
          jobId: jobId,
          isActive: true,
        });

        if (!existingSavedJob) {
          const recruiterJob = new RecruiterJob({
            recruiterId: userData.userId,
            jobId: jobId,
          });
          await recruiterJob.save();
        }
      } catch (error) {
        console.error("Error auto-saving job for recruiter:", error);
        // Don't fail the resume upload if auto-save fails
      }
    }

    return NextResponse.json(resume);
  } catch (error) {
    console.error("Upload resume error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
