// src/app/api/jobs/[id]/questions/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDb from "../../../../lib/db";
import Job from "../../../../models/Job";
import ScreeningQuestion from "../../../../models/ScreeningQuestion";
import {
  authenticateRequest,
  unauthorized,
  forbidden,
  JwtPayload,
} from "../../../../lib/auth";
import User, { UserRole } from "../../../../models/User";
import mongoose from "mongoose";

// Helper function to check if user has access to modify job questions
async function hasAccessToModifyJobQuestions(
  userData: JwtPayload,
  jobId: string
) {
  // Admin and internal users have access to modify all job questions
  if (userData.role === UserRole.ADMIN || userData.role === UserRole.INTERNAL) {
    return true;
  }

  // Get the job to check ownership and other permissions
  const job = await Job.findById(jobId);
  if (!job) {
    return false;
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

  // Recruiters cannot modify job questions
  return false;
}

// GET - List questions for a specific job
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

    // Check if job exists
    const job = await Job.findById(id);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // For listing questions, we use the same access rules as viewing the job
    // Check if user has access to this job based on role
    let hasAccess = false;

    // Admin and internal users have access to all jobs
    if (
      userData.role === UserRole.ADMIN ||
      userData.role === UserRole.INTERNAL
    ) {
      hasAccess = true;
    }
    // Recruiters can access screening questions for active jobs
    else if (userData.role === UserRole.RECRUITER && job.status === "ACTIVE") {
      hasAccess = true;
    }
    // Job creator always has access
    else if (job.postedBy.toString() === userData.userId) {
      hasAccess = true;
    }
    // Primary company users can access jobs from their team members
    else if (userData.role === UserRole.COMPANY) {
      const currentUser = await User.findById(userData.userId);

      if (currentUser?.isPrimary) {
        const teamMember = await User.findOne({
          _id: job.postedBy,
          parentId: userData.userId,
        });

        if (teamMember) {
          hasAccess = true;
        }
      }
    }

    if (!hasAccess) {
      return forbidden();
    }

    // Get all screening questions for this job
    const questions = await ScreeningQuestion.find({ jobId: id });

    return NextResponse.json(questions);
  } catch (error) {
    console.error("Get screening questions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Add a screening question to a job
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

    // Ensure id is a valid ObjectId format
    if (!id || id.length !== 24) {
      return NextResponse.json(
        { error: "Invalid job ID format" },
        { status: 400 }
      );
    }

    // Validate input data
    const {
      question,
      questionType,
      required = true,
      options,
    } = await req.json();

    if (!question || !questionType) {
      return NextResponse.json(
        { error: "Question and question type are required" },
        { status: 400 }
      );
    }

    // Validate question type is one of the supported types
    if (
      !["NUMERIC", "TEXT", "YES_NO", "MCQ", "MULTI_SELECT"].includes(
        questionType
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid question type. Must be "TEXT", "NUMERIC", "YES_NO", "MCQ", or "MULTI_SELECT"',
        },
        { status: 400 }
      );
    }

    // Validate options for MCQ and MULTI_SELECT
    if (["MCQ", "MULTI_SELECT"].includes(questionType)) {
      if (!options || !Array.isArray(options) || options.length < 2) {
        return NextResponse.json(
          {
            error:
              "MCQ and Multi-select questions must have at least 2 options",
          },
          { status: 400 }
        );
      }
    }

    // Check if job exists
    const job = await Job.findById(id);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check if user has permission to add questions to this job
    const hasAccess = await hasAccessToModifyJobQuestions(userData, id);
    if (!hasAccess) {
      return forbidden();
    }

    // Create the new screening question
    const screeningQuestion = new ScreeningQuestion({
      jobId: id,
      question,
      questionType,
      required,
      ...(options && { options }),
    });

    await screeningQuestion.save();

    // Update the job with the new question ID in the screeningQuestions array
    await Job.findByIdAndUpdate(id, {
      $push: { screeningQuestions: screeningQuestion._id },
    });

    return NextResponse.json({
      success: true,
      question: screeningQuestion,
    });
  } catch (error: any) {
    console.error("Add screening question error:", error);
    console.log("Error details:", error.message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update an existing screening question
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

    // Ensure id is a valid ObjectId format
    if (!id || id.length !== 24) {
      return NextResponse.json(
        { error: "Invalid job ID format" },
        { status: 400 }
      );
    }

    // Get question data from the request
    const { questionId, question, questionType, required } = await req.json();

    if (!questionId || !mongoose.Types.ObjectId.isValid(questionId)) {
      return NextResponse.json(
        { error: "Invalid question ID" },
        { status: 400 }
      );
    }

    // Check if job exists
    const job = await Job.findById(id);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Verify the question is associated with this job
    const existingQuestion = await ScreeningQuestion.findById(questionId);
    if (!existingQuestion || existingQuestion.jobId.toString() !== id) {
      return NextResponse.json(
        { error: "Question not found for this job" },
        { status: 404 }
      );
    }

    // Check if user has permission to modify questions for this job
    const hasAccess = await hasAccessToModifyJobQuestions(userData, id);
    if (!hasAccess) {
      return forbidden();
    }

    // Update fields that were provided
    const updateData: any = {};
    if (question) updateData.question = question;
    if (questionType) {
      // Validate question type
      if (!["NUMERIC", "TEXT", "YES_NO"].includes(questionType)) {
        return NextResponse.json(
          {
            error:
              'Invalid question type. Must be "Numeric", "Text Line", or "Yes/No"',
          },
          { status: 400 }
        );
      }
      updateData.questionType = questionType;
    }
    if (required !== undefined) updateData.required = required;

    // Update the question
    const updatedQuestion = await ScreeningQuestion.findByIdAndUpdate(
      questionId,
      { $set: updateData },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      question: updatedQuestion,
    });
  } catch (error) {
    console.error("Update screening question error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a screening question
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
    const url = new URL(req.url);
    const questionId = url.searchParams.get("questionId");

    // Ensure ids are valid ObjectId format
    if (!id || id.length !== 24) {
      return NextResponse.json(
        { error: "Invalid job ID format" },
        { status: 400 }
      );
    }

    if (!questionId || !mongoose.Types.ObjectId.isValid(questionId)) {
      return NextResponse.json(
        { error: "Invalid question ID" },
        { status: 400 }
      );
    }

    // Check if job exists
    const job = await Job.findById(id);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Verify the question is associated with this job
    const question = await ScreeningQuestion.findById(questionId);
    if (!question || question.jobId.toString() !== id) {
      return NextResponse.json(
        { error: "Question not found for this job" },
        { status: 404 }
      );
    }

    // Check if user has permission to delete questions for this job
    const hasAccess = await hasAccessToModifyJobQuestions(userData, id);
    if (!hasAccess) {
      return forbidden();
    }

    // Delete the question
    await ScreeningQuestion.findByIdAndDelete(questionId);

    // Remove the question ID from the job's screeningQuestions array
    await Job.findByIdAndUpdate(id, {
      $pull: { screeningQuestions: questionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete screening question error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
