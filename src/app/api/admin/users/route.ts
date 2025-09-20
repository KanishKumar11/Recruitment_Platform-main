// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDb from "../../../lib/db";
import User, { UserRole } from "../../../models/User";
import { authenticateRequest, unauthorized } from "../../../lib/auth";

// GET endpoint to fetch all users (admin only)
export async function GET(req: NextRequest) {
  try {
    const userData = authenticateRequest(req);
    if (!userData) {
      return unauthorized();
    }

    await connectDb();

    // Check if user is admin
    const admin = await User.findById(userData.userId);
    if (!admin || admin.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Only admins can access this endpoint" },
        { status: 403 }
      );
    }

    // Get query params for filtering
    const url = new URL(req.url);
    const role = url.searchParams.get("role");
    const isPrimary = url.searchParams.get("isPrimary");
    const isActive = url.searchParams.get("isActive");
    const search = url.searchParams.get("search");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const isExport = url.searchParams.get("export") === "true";
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (role && Object.values(UserRole).includes(role as UserRole)) {
      query.role = role;
    }
    if (isPrimary !== null) {
      query.isPrimary = isPrimary === "true";
    }
    if (isActive !== null) {
      query.isActive = isActive === "true";
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    // Count total users matching query
    const total = await User.countDocuments(query);

    // Fetch users - skip pagination for export
    const queryBuilder = User.find(query)
      .select("-password")
      .sort({ createdAt: -1 });

    if (!isExport) {
      queryBuilder.skip(skip).limit(limit);
    }

    const users = await queryBuilder;

    if (isExport) {
      return NextResponse.json({
        users,
        total,
      });
    }

    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin users fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST endpoint to create internal team member (admin only)
export async function POST(req: NextRequest) {
  try {
    const userData = authenticateRequest(req);
    if (!userData) {
      return unauthorized();
    }

    await connectDb();

    // Check if user is admin
    const admin = await User.findById(userData.userId);
    if (!admin || admin.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Only admins can create internal team members" },
        { status: 403 }
      );
    }

    const { name, email, password, phone, role } = await req.json();

    // Validate input
    if (!name || !email || !password || !phone) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check role - admin can only create INTERNAL or ADMIN users
    if (role !== UserRole.INTERNAL && role !== UserRole.ADMIN) {
      return NextResponse.json(
        {
          error: "Admin can only create internal team members or other admins",
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    // Create new team member
    const newUser = new User({
      name,
      email,
      password,
      phone,
      role,
      isPrimary: true, // Internal team members are primary by default
    });

    await newUser.save();

    return NextResponse.json({
      success: true,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Internal team member creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
