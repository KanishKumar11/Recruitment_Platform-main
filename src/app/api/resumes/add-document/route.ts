import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/app/lib/db';
import ResumeModel from '@/app/models/Resume';
import { verifyToken } from '@/app/lib/auth';
import { writeFile } from 'fs/promises';
import path from 'path';
import { validateAdditionalDocument } from '@/app/lib/fileValidation';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check user role permissions
    const allowedRoles = ['COMPANY', 'ADMIN', 'INTERNAL', 'RECRUITER'];
    if (!allowedRoles.includes(decoded.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const resumeId = formData.get('resumeId') as string;

    if (!file || !resumeId) {
      return NextResponse.json({ error: 'File and resumeId are required' }, { status: 400 });
    }

    // Validate additional document
    const validation = validateAdditionalDocument(file);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    await connectDb();

    // Find the resume
    const resume = await ResumeModel.findById(resumeId);
    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    // Check if resume status allows editing
    if (resume.status !== 'SUBMITTED') {
      return NextResponse.json({ error: 'Can only edit files when status is SUBMITTED' }, { status: 403 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = path.extname(file.name);
    const newFilename = `doc_${resumeId}_${timestamp}${fileExtension}`;
    const uploadPath = path.join(process.cwd(), 'uploads', newFilename);

    // Save new file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(uploadPath, buffer);

    // Add document to resume record
    if (!resume.additionalDocuments) {
      resume.additionalDocuments = [];
    }
    resume.additionalDocuments.push({
      filename: newFilename,
      originalName: file.name,
      uploadedAt: new Date()
    });
    resume.updatedAt = new Date();
    await resume.save();

    return NextResponse.json({ 
      message: 'Document added successfully',
      filename: newFilename 
    });

  } catch (error) {
    console.error('Error adding document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}