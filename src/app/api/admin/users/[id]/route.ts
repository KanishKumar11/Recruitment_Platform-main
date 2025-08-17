// src/app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '../../../../lib/db';
import User, { UserRole } from '../../../../models/User';
import { authenticateRequest, unauthorized } from '../../../../lib/auth';

// GET endpoint to fetch any user (admin only)
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
    
    // Check if current user is admin
    const admin = await User.findById(userData.userId);
    if (!admin || admin.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Only admins can access any user data' },
        { status: 403 }
      );
    }

    const { id } = await params;
    
    const user = await User.findById(id).select('-password');
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Admin user fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT endpoint to update any user (admin only)
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
        { error: 'Only admins can update any user' },
        { status: 403 }
      );
    }

    const updates = await req.json();
    const { id } = await params; // Await the params Promise
    
    // Remove password from updates if it's empty
    if (updates.password === '') {
      delete updates.password;
    }

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    ).select('-password');

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Admin user update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove any user (admin only)
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
    
    // Check if current user is admin
    const admin = await User.findById(userData.userId);
    if (!admin || admin.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Only admins can delete users' },
        { status: 403 }
      );
    }
    
    const { id } = await params; // Await the params Promise
    
    // Find the user to delete
    const userToDelete = await User.findById(id);
    if (!userToDelete) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if trying to delete another admin user
    if (userToDelete.role === UserRole.ADMIN && userToDelete._id.toString() !== userData.userId) {
      return NextResponse.json(
        { error: 'Cannot delete other admin accounts' },
        { status: 403 }
      );
    }

    // Delete the user
    await User.findByIdAndDelete(id);

    // If user had team members, delete them as well (or orphan them)
    await User.deleteMany({ parentId: id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin user delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}