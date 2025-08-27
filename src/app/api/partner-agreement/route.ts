// src/app/api/partner-agreement/route.ts
import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    // Construct file path to the PDF in public folder
    const publicDir = path.join(process.cwd(), "public");
    const filePath = path.join(publicDir, "SourcingScreen – Partner Agreement & Sourcing Guidelines.pdf");

    // Check if this is a download request or preview request
    const url = new URL(req.url);
    const isDownloadRequest = url.searchParams.get("download") === "true";

    try {
      // Check if file exists
      const fs = require("fs").promises;
      await fs.access(filePath);

      // Read the file
      const fileBuffer = await readFile(filePath);

      // Set appropriate headers
      const response = new NextResponse(fileBuffer as any);
      response.headers.set("Content-Type", "application/pdf");

      // Set filename for download - encode special characters for HTTP header
      const filename = "SourcingScreen - Partner Agreement & Sourcing Guidelines.pdf";
      const encodedFilename = encodeURIComponent(filename);
      
      if (isDownloadRequest) {
        response.headers.set(
          "Content-Disposition",
          `attachment; filename="${filename.replace(/[^\x00-\x7F]/g, "-")}"; filename*=UTF-8''${encodedFilename}`
        );
      } else {
        // For preview, use inline disposition
        response.headers.set(
          "Content-Disposition",
          `inline; filename="${filename.replace(/[^\x00-\x7F]/g, "-")}"; filename*=UTF-8''${encodedFilename}`
        );
      }

      return response;
    } catch (fileError) {
      console.error("Partner agreement file read error:", filePath, fileError);
      return NextResponse.json(
        {
          error: "Partner agreement file not found",
          details: (fileError as Error).message,
        },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Partner agreement download error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}