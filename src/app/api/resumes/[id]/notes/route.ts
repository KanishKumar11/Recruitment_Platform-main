// src/app/api/resumes/[id]/notes/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDb from "./../../../../lib/db";
import Resume from "./../../../../models/Resume";
import User, { UserRole } from "./../../../../models/User";
import mongoose from "mongoose";
import {
  authenticateRequest,
  unauthorized,
  forbidden,
} from "./../../../../lib/auth";
import { NotificationService } from "./../../../../lib/notificationService";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userData = authenticateRequest(req);
    if (!userData) {
      return unauthorized();
    }

    // Only allow certain roles to add notes
    if (
      !["COMPANY", "ADMIN", "INTERNAL", "RECRUITER"].includes(
        userData.role || ""
      )
    ) {
      return forbidden();
    }

    const { id } = await params;
    const { note } = await req.json();

    if (!note || typeof note !== "string" || note.trim().length === 0) {
      return NextResponse.json(
        { error: "Note content is required" },
        { status: 400 }
      );
    }

    await connectDb();

    // Find the resume
    const resume = await Resume.findById(id);
    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    // Add the note
    const newNote = {
      note: note.trim(),
      userId: new mongoose.Types.ObjectId(userData.userId),
      createdAt: new Date(),
    };

    resume.notes = resume.notes || [];
    resume.notes.push(newNote);
    resume.updatedAt = new Date();

    await resume.save();

    // Create notification for new note
    try {
      // Find the recruiter who submitted this resume to notify them
      if (resume.submittedBy && resume.submittedBy.toString() !== userData.userId) {
        await NotificationService.createNewNoteNotification(
          resume.submittedBy.toString(),
          resume.candidateName,
          "Job Application", // jobTitle - we'll use a default since we don't have job info here
          note.substring(0, 100), // notePreview
          "", // jobId - empty string since we don't have job info
          (resume._id as mongoose.Types.ObjectId).toString() // resumeId
        );
      }
    } catch (notificationError) {
      console.error('Failed to create new note notification:', notificationError);
      // Continue with the response even if notification fails
    }

    // Return the updated resume with populated user names
    const updatedResume = await Resume.findById(id)
      .populate({
        path: "notes.userId",
        model: "User",
        select: "name email",
      })
      .lean();

    return NextResponse.json(updatedResume);
  } catch (error) {
    console.error("Add resume note error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
