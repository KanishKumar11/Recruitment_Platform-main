import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Check if upload directories exist and are writable
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const publicUploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    const checks = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      directories: {
        uploads: {
          exists: fs.existsSync(uploadsDir),
          writable: false
        },
        publicUploads: {
          exists: fs.existsSync(publicUploadsDir),
          writable: false
        }
      }
    };

    // Test write permissions
    try {
      const testFile = path.join(uploadsDir, '.health-check');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      checks.directories.uploads.writable = true;
    } catch (error) {
      // Directory might not exist or not writable
    }

    try {
      const testFile = path.join(publicUploadsDir, '.health-check');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      checks.directories.publicUploads.writable = true;
    } catch (error) {
      // Directory might not exist or not writable
    }

    // If critical directories are not accessible, return unhealthy status
    if (!checks.directories.uploads.exists || !checks.directories.publicUploads.exists) {
      checks.status = 'unhealthy';
      return NextResponse.json(checks, { status: 503 });
    }

    return NextResponse.json(checks, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      },
      { status: 503 }
    );
  }
}