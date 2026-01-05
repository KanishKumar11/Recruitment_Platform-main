import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { authenticateRequest, unauthorized } from "../../../lib/auth";
import { validateProfilePicture, validateCompanyProfile } from "../../../lib/fileValidation";
import { uploadFileToR2, getContentType, getR2PublicUrl } from "../../../lib/r2Storage";

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

    // Generate unique filename with folder prefix
    const timestamp = Date.now();
    const fileExtension = path.extname(file.name);
    const folderPrefix = fileType === "profile" ? "profiles" : "resumes";
    const fileName = `${folderPrefix}/${userId}_${timestamp}${fileExtension}`;

    // Convert file to buffer and upload to R2
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const contentType = getContentType(file.name);
    await uploadFileToR2(buffer, fileName, contentType);

    // Return the file URL
    const fileUrl = getR2PublicUrl(fileName);

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
