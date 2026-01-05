// src/app/lib/r2Storage.ts
// Cloudflare R2 Storage Service using AWS SDK S3 Client

import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
} from "@aws-sdk/client-s3";

// Initialize S3 client for Cloudflare R2
const getR2Client = () => {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    if (!accountId || !accessKeyId || !secretAccessKey) {
        throw new Error(
            "R2 credentials not configured. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY environment variables."
        );
    }

    return new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
    });
};

const getBucketName = () => {
    const bucketName = process.env.R2_BUCKET_NAME;
    if (!bucketName) {
        throw new Error(
            "R2_BUCKET_NAME environment variable is not configured."
        );
    }
    return bucketName;
};

/**
 * Upload a file to Cloudflare R2
 * @param buffer - File buffer to upload
 * @param filename - Filename to store in R2
 * @param contentType - MIME type of the file
 * @returns The filename (key) of the uploaded file
 */
export async function uploadFileToR2(
    buffer: Buffer,
    filename: string,
    contentType: string
): Promise<string> {
    const client = getR2Client();
    const bucketName = getBucketName();

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: filename,
        Body: buffer,
        ContentType: contentType,
    });

    await client.send(command);
    console.log(`File uploaded to R2: ${filename}`);
    return filename;
}

/**
 * Download a file from Cloudflare R2
 * @param filename - Filename to download from R2
 * @returns File buffer and content type
 */
export async function downloadFileFromR2(
    filename: string
): Promise<{ buffer: Buffer; contentType: string }> {
    const client = getR2Client();
    const bucketName = getBucketName();

    const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: filename,
    });

    const response = await client.send(command);

    if (!response.Body) {
        throw new Error(`File not found in R2: ${filename}`);
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
        chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    return {
        buffer,
        contentType: response.ContentType || "application/octet-stream",
    };
}

/**
 * Delete a file from Cloudflare R2
 * @param filename - Filename to delete from R2
 */
export async function deleteFileFromR2(filename: string): Promise<void> {
    const client = getR2Client();
    const bucketName = getBucketName();

    const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: filename,
    });

    await client.send(command);
    console.log(`File deleted from R2: ${filename}`);
}

/**
 * Get the public URL for a file in R2 (if public access is configured)
 * @param filename - Filename in R2
 * @returns Public URL for the file
 */
export function getR2PublicUrl(filename: string): string {
    const publicUrl = process.env.R2_PUBLIC_URL;
    if (publicUrl) {
        return `${publicUrl}/${filename}`;
    }
    // Return API download URL as fallback
    return `/api/resumes/download/${encodeURIComponent(filename)}`;
}

/**
 * Get content type based on file extension
 * @param filename - Filename to determine content type
 * @returns MIME type string
 */
export function getContentType(filename: string): string {
    const ext = filename.toLowerCase().split(".").pop();

    const contentTypes: Record<string, string> = {
        pdf: "application/pdf",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        webp: "image/webp",
        bmp: "image/bmp",
        txt: "text/plain",
        doc: "application/msword",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        zip: "application/zip",
    };

    return contentTypes[ext || ""] || "application/octet-stream";
}
