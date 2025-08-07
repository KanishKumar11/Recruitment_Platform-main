// src/app/api/resumes/download/[filename]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import jwt from "jsonwebtoken";
import {
  authenticateRequest,
  unauthorized,
  verifyToken,
} from "../../../../lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    // Check for token in query params (for iframe previews) or headers
    const url = new URL(req.url);
    const tokenFromQuery = url.searchParams.get("token");

    let userData;
    if (tokenFromQuery) {
      // First try our standard token verification
      userData = verifyToken(tokenFromQuery);

      if (!userData) {
        // If that fails, try to decode the token to see if it's a different format
        try {
          // Try to decode without verification to see if it's a different format
          const decodedToken = jwt.decode(tokenFromQuery);

          if (decodedToken) {
            // Map the .NET-style claims to our expected format
            const decodedPayload = decodedToken as any;
            const nameIdentifier =
              decodedPayload[
                "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
              ];
            const emailAddress =
              decodedPayload[
                "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
              ];
            const role =
              decodedPayload[
                "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
              ];

            if (nameIdentifier && emailAddress) {
              // Create a compatible user data object
              userData = {
                userId: nameIdentifier,
                email: emailAddress,
                role: role || "USER",
              };
              console.log("Mapped user data:", userData);
            }
          }
        } catch (decodeError) {
          console.error("Failed to decode token:", decodeError);
        }
      }

      if (!userData) {
        console.error("Token validation failed for query token");
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }
    } else {
      // Use standard authentication
      console.log("No token in query, using header authentication");
      const authHeader = req.headers.get("authorization");
      console.log("Authorization header:", authHeader ? "Present" : "Missing");

      if (authHeader) {
        const token = authHeader.startsWith("Bearer ")
          ? authHeader.split(" ")[1]
          : null;
        console.log(
          "Extracted token:",
          token ? "Token extracted" : "No token extracted"
        );

        if (token) {
          // Try to verify the token directly
          const verifiedToken = verifyToken(token);
          console.log(
            "Token verification result:",
            verifiedToken ? "Success" : "Failed"
          );

          if (verifiedToken) {
            userData = verifiedToken;
          } else {
            // Try to decode without verification to see the payload
            try {
              const decodedToken = jwt.decode(token) as any;
              console.log("Token payload (decoded):", decodedToken);

              // Check if it's a .NET-style token
              const nameIdentifier =
                decodedToken?.[
                  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
                ];
              const emailAddress =
                decodedToken?.[
                  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
                ];
              const role =
                decodedToken?.[
                  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
                ];

              if (nameIdentifier && emailAddress) {
                console.log("Mapping .NET-style token");
                userData = {
                  userId: nameIdentifier,
                  email: emailAddress,
                  role: role || "USER",
                };
              }
            } catch (e) {
              console.log("Failed to decode token:", e);
            }
          }
        }
      }

      if (!userData) {
        console.log("Header authentication failed - no valid token found");
        return unauthorized();
      }
      console.log("Header authentication successful:", userData);
    }

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

    try {
      // Read the file
      const fileBuffer = await readFile(filePath);

      // Get original filename - handle both UUID-prefixed and regular filenames
      let originalName = filename;
      if (filename.length > 37 && filename.charAt(36) === "_") {
        // If it looks like a UUID-prefixed filename, extract the original name
        originalName = filename.substring(37);
      }

      // Check if this is a download request or preview request
      const isDownloadRequest = url.searchParams.get("download") === "true";

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
      }

      // Set appropriate headers
      const response = new NextResponse(fileBuffer);
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
      console.error("File not found:", filePath, fileError);
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Download file error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
