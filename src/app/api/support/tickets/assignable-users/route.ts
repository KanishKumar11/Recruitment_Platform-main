import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/lib/auth";
import User from "@/app/models/User";
import connectDb from "@/app/lib/db";

export async function GET(request: NextRequest) {
  try {
    await connectDb();

    // Verify authentication and admin/internal role
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (!decoded || !["ADMIN", "INTERNAL"].includes(decoded.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get all users who can be assigned to tickets (admin and internal users)
    const assignableUsers = await User.find(
      {
        role: { $in: ["admin", "internal"] },
        isActive: { $ne: false },
      },
      {
        _id: 1,
        name: 1,
        email: 1,
        role: 1,
      }
    ).sort({ name: 1 });

    return NextResponse.json({
      users: assignableUsers,
    });
  } catch (error) {
    console.error("Error fetching assignable users:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignable users" },
      { status: 500 }
    );
  }
}
