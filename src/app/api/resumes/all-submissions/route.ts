// src/app/api/resumes/all-submissions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from './../../../lib/db';
import Resume from './../../../models/Resume';
import { authenticateRequest, unauthorized, forbidden } from './../../../lib/auth';
import { UserRole } from './../../../models/User';

export async function GET(req: NextRequest) {
  try {
    const userData = authenticateRequest(req);
    if (!userData) {
      return unauthorized();
    }

    // Only admins should access this endpoint
    if (userData.role !== UserRole.ADMIN && userData.role !== UserRole.INTERNAL) {
      return forbidden();
    }

    await connectDb();

    // Fetch all resumes
    const resumes = await Resume.find().populate('jobId', 'title').populate('submittedBy', 'name').sort({ updatedAt: -1 }).lean();

    return NextResponse.json(resumes);
  } catch (error) {
    console.error('Get all submissions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}