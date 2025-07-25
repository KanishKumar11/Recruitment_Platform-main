// app/api/files/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { authenticateRequest, unauthorized } from '../../../lib/auth';
import jwt from 'jsonwebtoken';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Await the params Promise
    const resolvedParams = await params;
    
    let userData = null;
    
    // Try multiple authentication methods
    
    // Method 1: Standard Authorization header
    userData = authenticateRequest(req);
    
    // Method 2: Token from URL query parameter (for iframe)
    if (!userData) {
      const token = req.nextUrl.searchParams.get('token');
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
          userData = decoded;
        } catch (tokenError) {
          console.error('URL Token verification failed:', tokenError);
        }
      }
    }
    
    // Method 3: Try to get token from cookies (if your app uses cookie-based auth)
    if (!userData) {
      const cookieToken = req.cookies.get('auth-token')?.value;
      if (cookieToken) {
        try {
          const decoded = jwt.verify(cookieToken, process.env.JWT_SECRET || 'your-secret-key') as any;
          userData = decoded;
        } catch (cookieError) {
          console.error('Cookie token verification failed:', cookieError);
        }
      }
    }
    
    // If still no valid authentication, return unauthorized
    if (!userData) {
      console.log('No valid authentication found for file access');
      return NextResponse.json(
        { error: 'Unauthorized access to file' },
        { status: 401 }
      );
    }

    const filePath = resolvedParams.path.join('/');
    const fullPath = path.join(process.cwd(), 'uploads', filePath);
    
    // Security check: ensure the file is within the uploads directory
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const resolvedPath = path.resolve(fullPath);
    const resolvedUploadsDir = path.resolve(uploadsDir);
    
    if (!resolvedPath.startsWith(resolvedUploadsDir)) {
      return NextResponse.json(
        { error: 'Access denied - invalid file path' },
        { status: 403 }
      );
    }

    try {
      const fileBuffer = await readFile(resolvedPath);
      const fileName = path.basename(filePath);
      const fileExtension = path.extname(fileName).toLowerCase();
      
      // Set appropriate content type based on file extension
      let contentType = 'application/octet-stream';
      switch (fileExtension) {
        case '.pdf':
          contentType = 'application/pdf';
          break;
        case '.doc':
          contentType = 'application/msword';
          break;
        case '.docx':
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        case '.txt':
          contentType = 'text/plain';
          break;
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg';
          break;
        case '.png':
          contentType = 'image/png';
          break;
      }

      // Check if it's a download request
      const isDownload = req.nextUrl.searchParams.get('download') === 'true';
      
      const response = new NextResponse(fileBuffer);
      response.headers.set('Content-Type', contentType);
      
      // Add security headers
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'SAMEORIGIN');
      
      if (isDownload) {
        response.headers.set(
          'Content-Disposition', 
          `attachment; filename="${encodeURIComponent(fileName)}"`
        );
      } else {
        response.headers.set(
          'Content-Disposition', 
          `inline; filename="${encodeURIComponent(fileName)}"`
        );
      }
      
      return response;
    } catch (fileError) {
      console.error('File read error:', fileError);
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('File serving error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}