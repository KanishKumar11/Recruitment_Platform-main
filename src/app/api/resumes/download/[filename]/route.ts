// src/app/api/resumes/download/[filename]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
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

    // Construct file path
    const uploadsDir = path.join(process.cwd(), "uploads");
    const filePath = path.join(uploadsDir, filename);

    // Check if this is a download request or preview request
    const url = new URL(req.url);
    const isDownloadRequest = url.searchParams.get("download") === "true";

    try {
      // First check if file exists using fs.access
      const fs = require("fs").promises;

      try {
        await fs.access(filePath);
      } catch (accessError) {
        console.error("File access failed:", filePath, accessError);

        // Try to find similar files in the uploads directory
        try {
          const uploadsFiles = await fs.readdir(uploadsDir);
          const similarFiles = uploadsFiles.filter(
            (file: string) =>
              file
                .toLowerCase()
                .includes(filename.toLowerCase().split("_")[0]) ||
              filename.toLowerCase().includes(file.toLowerCase().split("_")[0])
          );

          console.log("Similar files found:", similarFiles);

          if (similarFiles.length > 0) {
            return NextResponse.json(
              {
                error: "File not found",
                suggestion: `Similar files available: ${similarFiles.join(
                  ", "
                )}`,
                availableFiles: similarFiles,
              },
              { status: 404 }
            );
          }
        } catch (dirError) {
          console.error("Failed to read uploads directory:", dirError);
        }

        return NextResponse.json(
          {
            error: "File not found",
            requestedFile: filename,
            filePath: filePath,
          },
          { status: 404 }
        );
      }

      // Read the file
      const fileBuffer = await readFile(filePath);

      // Get original filename - handle both UUID-prefixed and regular filenames
      let originalName = filename;
      if (filename.length > 37 && filename.charAt(36) === "_") {
        // If it looks like a UUID-prefixed filename, extract the original name
        originalName = filename.substring(37);
      }

      // Determine content type based on file extension
      const ext = path.extname(filename).toLowerCase();
      let contentType = "application/octet-stream";

      switch (ext) {
        case ".pdf":
          contentType = "application/pdf";
          break;
        case ".jpg":
        case ".jpeg":
          contentType = "image/jpeg";
          break;
        case ".png":
          contentType = "image/png";
          break;
        case ".gif":
          contentType = "image/gif";
          break;
        case ".txt":
          contentType = "text/plain";
          break;
        case ".docx":
          contentType =
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
          break;
        case ".doc":
          contentType = "application/msword";
          break;
        case ".webp":
          contentType = "image/webp";
          break;
        case ".bmp":
          contentType = "image/bmp";
          break;
        case ".zip":
          contentType = "application/zip";
          break;
      }

      // Set appropriate headers
      const response = new NextResponse(fileBuffer as any);
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
      console.error("File read error:", filePath, fileError);
      return NextResponse.json(
        {
          error: "Failed to read file",
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
