import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/app/lib/db";
import FAQ from "@/app/models/FAQ";
import Settings from "@/app/models/Settings";
import { verifyToken } from "@/app/lib/auth";
import { UserRole } from "@/app/models/User";

// GET - Fetch single FAQ
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();

    const { id } = await params;

    const faq = await FAQ.findById(id)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!faq) {
      return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
    }

    return NextResponse.json({ faq });
  } catch (error) {
    console.error("Error fetching FAQ:", error);
    return NextResponse.json({ error: "Failed to fetch FAQ" }, { status: 500 });
  }
}

// PUT - Update FAQ
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();

    const { id } = await params;

    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization header required" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Find the FAQ first
    const existingFaq = await FAQ.findById(id);
    if (!existingFaq) {
      return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
    }

    // Check permissions using global setting
    const isAdmin = decoded.role === UserRole.ADMIN;
    const isInternal = decoded.role === UserRole.INTERNAL;

    let canEdit = isAdmin;

    // If internal user, check global setting
    if (isInternal && !isAdmin) {
      const internalEditSetting = await Settings.findOne({
        key: "faq_internal_edit_enabled",
      });
      canEdit = internalEditSetting?.value === true;
    }

    if (!canEdit) {
      return NextResponse.json(
        {
          error: "You do not have permission to edit FAQs",
        },
        { status: 403 }
      );
    }

    const { question, answer, category, isActive, order } =
      await request.json();

    if (!question || !answer) {
      return NextResponse.json(
        { error: "Question and answer are required" },
        { status: 400 }
      );
    }

    const updateData: any = {
      question: question.trim(),
      answer: answer.trim(),
      category: category?.trim() || "General",
      order: order || 0,
      updatedBy: decoded.userId,
    };

    // Only admin can change status
    if (isAdmin && isActive !== undefined) {
      updateData.isActive = isActive;
    }

    const faq = await FAQ.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    return NextResponse.json({ faq });
  } catch (error) {
    console.error("Error updating FAQ:", error);
    return NextResponse.json(
      { error: "Failed to update FAQ" },
      { status: 500 }
    );
  }
}

// DELETE - Delete FAQ (Admin and Internal only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();

    const { id } = await params;

    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization header required" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (
      !decoded ||
      (decoded.role !== UserRole.ADMIN && decoded.role !== UserRole.INTERNAL)
    ) {
      return NextResponse.json(
        { error: "Admin or Internal access required" },
        { status: 403 }
      );
    }

    const faq = await FAQ.findByIdAndDelete(id);

    if (!faq) {
      return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "FAQ deleted successfully" });
  } catch (error) {
    console.error("Error deleting FAQ:", error);
    return NextResponse.json(
      { error: "Failed to delete FAQ" },
      { status: 500 }
    );
  }
}
