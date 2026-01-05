// migrate-to-r2.js
// Script to migrate local files to Cloudflare R2

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Initialize S3 client for Cloudflare R2
const r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

const bucketName = process.env.R2_BUCKET_NAME;

// Get content type based on file extension
function getContentType(filename) {
    const ext = filename.toLowerCase().split(".").pop();
    const contentTypes = {
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
    return contentTypes[ext] || "application/octet-stream";
}

// Upload a single file to R2
async function uploadFile(filePath, r2Key) {
    try {
        const fileBuffer = fs.readFileSync(filePath);
        const contentType = getContentType(filePath);

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: r2Key,
            Body: fileBuffer,
            ContentType: contentType,
        });

        await r2Client.send(command);
        return true;
    } catch (error) {
        console.error(`Failed to upload ${r2Key}:`, error.message);
        return false;
    }
}

// Recursively get all files in a directory
function getAllFiles(dirPath, arrayOfFiles = [], baseDir = dirPath) {
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getAllFiles(fullPath, arrayOfFiles, baseDir);
        } else {
            const relativePath = path.relative(baseDir, fullPath);
            arrayOfFiles.push({ fullPath, relativePath });
        }
    });

    return arrayOfFiles;
}

async function migrateDirectory(sourceDir, description) {
    if (!fs.existsSync(sourceDir)) {
        console.log(`⚠️  Directory not found: ${sourceDir}`);
        return { success: 0, failed: 0 };
    }

    console.log(`\n📁 Migrating ${description}...`);
    console.log(`   Source: ${sourceDir}`);

    const files = getAllFiles(sourceDir);
    console.log(`   Found ${files.length} files`);

    let success = 0;
    let failed = 0;

    for (let i = 0; i < files.length; i++) {
        const { fullPath, relativePath } = files[i];
        const r2Key = relativePath.replace(/\\/g, "/"); // Normalize path separators

        process.stdout.write(`   [${i + 1}/${files.length}] Uploading: ${r2Key}...`);

        const uploaded = await uploadFile(fullPath, r2Key);
        if (uploaded) {
            console.log(" ✅");
            success++;
        } else {
            console.log(" ❌");
            failed++;
        }
    }

    return { success, failed };
}

async function main() {
    console.log("🚀 Starting migration to Cloudflare R2...\n");

    // Check environment variables
    if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID ||
        !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET_NAME) {
        console.error("❌ Missing R2 environment variables!");
        console.error("   Required: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME");
        process.exit(1);
    }

    console.log(`📦 Target bucket: ${bucketName}`);

    const results = [];

    // Migrate src/app/uploads
    const srcAppUploads = path.join(process.cwd(), "src", "app", "uploads");
    results.push(await migrateDirectory(srcAppUploads, "src/app/uploads"));

    // Migrate public/uploads
    const publicUploads = path.join(process.cwd(), "public", "uploads");
    results.push(await migrateDirectory(publicUploads, "public/uploads"));

    // Migrate root uploads (if exists)
    const rootUploads = path.join(process.cwd(), "uploads");
    results.push(await migrateDirectory(rootUploads, "uploads"));

    // Summary
    const totalSuccess = results.reduce((sum, r) => sum + r.success, 0);
    const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);

    console.log("\n" + "=".repeat(50));
    console.log("📊 MIGRATION COMPLETE");
    console.log("=".repeat(50));
    console.log(`   ✅ Successfully uploaded: ${totalSuccess} files`);
    console.log(`   ❌ Failed: ${totalFailed} files`);
    console.log("=".repeat(50));

    if (totalFailed > 0) {
        process.exit(1);
    }
}

main().catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
});
