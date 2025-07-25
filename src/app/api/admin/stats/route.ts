// src/app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDb from '../../../lib/db';
import User, { UserRole } from '../../../models/User';
import { authenticateRequest, unauthorized } from '../../../lib/auth';
import Job from '../../../models/Job'; 

export async function GET(req: NextRequest) {
  try {
    const userData = authenticateRequest(req);
    if (!userData) {
      return unauthorized();
    }

    await connectDb();
    
        // Count all users
        const totalUsers = await User.countDocuments();

        // Count users by role
        const companyUsers = await User.countDocuments({ role: UserRole.COMPANY });
        const recruiterUsers = await User.countDocuments({ role: UserRole.RECRUITER });
        const internalUsers = await User.countDocuments({ role: UserRole.INTERNAL });
        const adminUsers = await User.countDocuments({ role: UserRole.ADMIN });
    
        // Count primary companies (only count users with role=COMPANY and isPrimary=true)
        const companyPrimaryUsers = await User.countDocuments({ 
          role: UserRole.COMPANY,
          isPrimary: true
        });
    
        // Count by user type
        const primaryUsers = await User.countDocuments({ isPrimary: true });
        const teamMemberUsers = await User.countDocuments({ isPrimary: false });
    
        // Get recent users
        const recentUsers = await User.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .select('name email role isPrimary createdAt');
    
        const stats = {
          users: {
            total: totalUsers,
            byRole: {
              company: companyUsers,           // All company users (including team members)
              companyPrimary: companyPrimaryUsers, // Primary company users only (actual company count)
              recruiter: recruiterUsers,
              internal: internalUsers,
              admin: adminUsers,
            },
            byType: {
              primary: primaryUsers,
              teamMembers: teamMemberUsers,
            },
          },
        };
    
        return NextResponse.json({
          stats,
          recentUsers,
        });
      } catch (error) {
        console.error('Error fetching admin stats:', error);
        return NextResponse.json(
          { error: 'Failed to fetch admin stats' },
          { status: 500 }
        );
      }
    }
    