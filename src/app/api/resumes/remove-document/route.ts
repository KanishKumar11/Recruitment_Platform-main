import { NextRequest, NextResponse } from 'next/server';
import connectDb from '@/app/lib/db';
import ResumeModel from '@/app/models/Resume';
import { verifyToken } from '@/app/lib/auth';
import { unlink } from 'fs/promises';
import path from 'path';

export async function DELETE(request: NextRequest) {
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

    const body = await request.json();
    const { resumeId, filename } = body;

    if (!resumeId || !filename) {
      return NextResponse.json({ error: 'ResumeId and filename are required' }, { status: 400 });
    }

    await connectDb();

    // Find the resume
    const resume = await ResumeModel.findById(resumeId);
    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    // Check if resume status allows editing
    if (resume.status === 'SUBMITTED') {
      return NextResponse.json({ error: 'Cannot edit files after submission is finalized' }, { status: 403 });
    }

    // Check if document exists in resume
    if (!resume.additionalDocuments || !resume.additionalDocuments.includes(filename)) {
      return NextResponse.json({ error: 'Document not found in resume' }, { status: 404 });
    }

    // Remove file from filesystem
    const filePath = path.join(process.cwd(), 'uploads', filename);
    try {
      await unlink(filePath);
    } catch (error) {
      console.warn('Could not delete file from filesystem:', error);
    }

    // Remove document from resume record
    resume.additionalDocuments = resume.additionalDocuments.filter(doc => doc !== filename);
    resume.updatedAt = new Date();
    await resume.save();

    return NextResponse.json({ 
      message: 'Document removed successfully'
    });

  } catch (error) {
    console.error('Error removing document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}