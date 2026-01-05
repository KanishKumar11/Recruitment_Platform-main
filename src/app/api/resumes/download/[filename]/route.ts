// src/app/api/resumes/download/[filename]/route.ts
// Updated to use Cloudflare R2 storage
import { NextRequest, NextResponse } from "next/server";
import { downloadFileFromR2 } from "@/app/lib/r2Storage";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Security check - ensure filename doesn't contain path traversal
    if (
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\")
    ) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    // Check if this is a download request or preview request
    const url = new URL(req.url);
    const isDownloadRequest = url.searchParams.get("download") === "true";

    try {
      // Download file from R2
      const { buffer, contentType } = await downloadFileFromR2(filename);

      // Get original filename - handle both UUID-prefixed and regular filenames
      let originalName = filename;
      if (filename.length > 37 && filename.charAt(36) === "_") {
        // If it looks like a UUID-prefixed filename, extract the original name
        originalName = filename.substring(37);
      }

      // Set appropriate headers
      const response = new NextResponse(buffer as any);
      response.headers.set("Content-Type", contentType);

      // Only set attachment disposition if explicitly requested for download
      if (isDownloadRequest) {
        response.headers.set(
          "Content-Disposition",
          `attachment; filename="${originalName}"`
        );
      } else {
        // For preview, use inline disposition
        response.headers.set(
          "Content-Disposition",
          `inline; filename="${originalName}"`
        );
      }

      return response;
    } catch (fileError) {
      console.error("R2 file download error:", filename, fileError);

      // Check if it's a "not found" error
      if ((fileError as Error).message?.includes("not found")) {
        return NextResponse.json(
          {
            error: "File not found",
            requestedFile: filename,
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          error: "Failed to download file",
          details: (fileError as Error).message,
          requestedFile: filename,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Download file error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
