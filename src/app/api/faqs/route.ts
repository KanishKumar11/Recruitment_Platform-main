import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/app/lib/db";
import FAQ from "@/app/models/FAQ";
import {
  authenticateRequest,
  authorizeRoles,
  unauthorized,
  forbidden,
} from "@/app/lib/auth";
import { UserRole } from "@/app/models/User";

// GET - Fetch all FAQs (public endpoint for active FAQs, admin endpoint for all)
export async function GET(request: NextRequest) {
  try {
    await connectDb();

    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get("admin") === "true";
    const category = searchParams.get("category");

    let query: any = {};

    if (isAdmin) {
      // Admin endpoint - verify admin or internal access
      console.log("DEBUG: Admin endpoint requested");
      const hasAdminRole = authorizeRoles(request, [
        UserRole.ADMIN,
        UserRole.INTERNAL,
      ]);
      console.log("DEBUG: Admin/Internal role authorized:", hasAdminRole);

      if (!hasAdminRole) {
        console.log("DEBUG: Admin/Internal authorization failed");
        return forbidden();
      }
      console.log("DEBUG: Admin/Internal access granted");
      // Admin and Internal can see all FAQs
    } else {
      // Public endpoint - only active FAQs
      query.isActive = true;
    }

    if (category) {
      query.category = category;
    }

    const faqs = await FAQ.find(query).sort({
      category: 1,
      order: 1,
      createdAt: -1,
    });
    return NextResponse.json({ faqs });
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    return NextResponse.json(
      { error: "Failed to fetch FAQs" },
      { status: 500 }
    );
  }
}

// POST - Create new FAQ (Admin and Internal only)
export async function POST(request: NextRequest) {
  try {
    await connectDb();

    // Use the same authentication pattern as other working APIs
    if (!authorizeRoles(request, [UserRole.ADMIN, UserRole.INTERNAL])) {
      return forbidden();
    }

    const userData = authenticateRequest(request);
    if (!userData) {
      return unauthorized();
    }

    const { question, answer, category, isActive, order } =
      await request.json();

    if (!question || !answer) {
      return NextResponse.json(
        { error: "Question and answer are required" },
        { status: 400 }
      );
    }

    const faq = new FAQ({
      question: question.trim(),
      answer: answer.trim(),
      category: category?.trim() || "General",
      isActive: isActive !== undefined ? isActive : true,
      order: order || 0,
      createdBy: userData.userId,
    });

    await faq.save();
    await faq.populate("createdBy", "name email");

    return NextResponse.json({ faq }, { status: 201 });
  } catch (error) {
    console.error("Error creating FAQ:", error);
    return NextResponse.json(
      { error: "Failed to create FAQ" },
      { status: 500 }
    );
  }
}
