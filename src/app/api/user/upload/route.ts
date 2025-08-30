import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { authenticateRequest, unauthorized } from "../../../lib/auth";
import { validateProfilePicture, validateCompanyProfile } from "../../../lib/fileValidation";

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = authenticateRequest(request);
    if (!authResult) {
      return unauthorized();
    }

    const { userId } = authResult;
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const fileType = formData.get("fileType") as string; // 'profile' or 'resume'

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file based on type
    let validation;
    if (fileType === "profile") {
      validation = validateProfilePicture(file);
    } else if (fileType === "resume") {
      validation = validateCompanyProfile(file);
    } else {
      return NextResponse.json(
        { error: "Invalid file type specified" },
        { status: 400 }
      );
    }

    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      fileType === "profile" ? "profiles" : "resumes"
    );
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = path.extname(file.name);
    const fileName = `${userId}_${timestamp}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Return the file URL
    const fileUrl = `/uploads/${
      fileType === "profile" ? "profiles" : "resumes"
    }/${fileName}`;

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName,
      fileSize: file.size,
      fileType: file.type,
    });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
