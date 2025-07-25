// src/app/api/validation/candidate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '../../../lib/db';
import Resume from '../../../models/Resume';
import { authenticateRequest, unauthorized } from '../../../lib/auth';

export async function POST(request: NextRequest) {
  try {
    const userData = authenticateRequest(request);
    if (!userData) {
      return unauthorized();
    }

    await connectDb();
    
    const { email, phone, jobId } = await request.json();

    if (!email || !phone || !jobId) {
      return NextResponse.json(
        { error: 'Email, phone, and jobId are required' },
        { status: 400 }
      );
    }

    // Check for existing candidate with same email for this specific job
    const existingByEmail = await Resume.findOne({
      email: email.toLowerCase().trim(),
      jobId: jobId
    }).select('candidateName email submittedBy createdAt');

    // Check for existing candidate with same phone for this specific job
    const existingByPhone = await Resume.findOne({
      phone: phone.trim(),
      jobId: jobId
    }).select('candidateName phone submittedBy createdAt');

    // Check for existing candidate with same email across all jobs (for warnings)
    const existingEmailGlobal = await Resume.countDocuments({
      email: email.toLowerCase().trim(),
      jobId: { $ne: jobId }
    });

    // Check for existing candidate with same phone across all jobs (for warnings)
    const existingPhoneGlobal = await Resume.countDocuments({
      phone: phone.trim(),
      jobId: { $ne: jobId }
    });

    const validationResult = {
      isValid: true,
      errors: [] as Array<{ field: string; message: string; details?: any }>,
      warnings: [] as Array<{ field: string; message: string; count?: number }>
    };

    // Check for duplicates in the same job
    if (existingByEmail) {
      validationResult.isValid = false;
      validationResult.errors.push({
        field: 'email',
        message: 'This is a Duplicate application for this job position, please do not submit again',
        details: {
          candidateName: existingByEmail.candidateName,
          submittedAt: existingByEmail.createdAt
        }
      });
    }

    if (existingByPhone) {
      validationResult.isValid = false;
      validationResult.errors.push({
        field: 'phone',
        message: 'This phone number has already been used to apply for this job position',
        details: {
          candidateName: existingByPhone.candidateName,
          submittedAt: existingByPhone.createdAt
        }
      });
    }

    // Add warnings for global duplicates (same candidate applying to different jobs)
    if (existingEmailGlobal > 0 && !existingByEmail) {
      validationResult.warnings.push({
        field: 'email',
        message: `This candidate has applied to ${existingEmailGlobal} other job position(s)`,
        count: existingEmailGlobal
      });
    }

    if (existingPhoneGlobal > 0 && !existingByPhone) {
      validationResult.warnings.push({
        field: 'phone',
        message: `This phone number is associated with ${existingPhoneGlobal} other job application(s)`,
        count: existingPhoneGlobal
      });
    }

    return NextResponse.json(validationResult, { status: 200 });

  } catch (error) {
    console.error('Candidate validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error during validation' },
      { status: 500 }
    );
  }
}