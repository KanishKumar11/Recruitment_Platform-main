// src/app/api/admin/users/[id]/change-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '../../../../../lib/db';
import User, { UserRole } from '../../../../../models/User';
import { authenticateRequest, unauthorized } from '../../../../../lib/auth';

// PUT endpoint for admin to change any user's password
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
    
    // Check if current user is admin
    const admin = await User.findById(userData.userId);
    if (!admin || admin.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Only admins can change user passwords' },
        { status: 403 }
      );
    }

    const { newPassword } = await req.json();
    const { id } = await params;
    
    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Find the user to update
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update password (the User model should handle hashing)
    user.password = newPassword;
    await user.save();

    return NextResponse.json({
      success: true,
      message: `Password updated successfully for ${user.name}`
    });
    
  } catch (error) {
    console.error('Admin password change error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}