// migrate-missing-to-r2.js
// Script to find and upload missing files to Cloudflare R2

const { S3Client, HeadObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const mongoose = require("mongoose");
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

// Resume schema (minimal version for migration)
const ResumeSchema = new mongoose.Schema({
    resumeFile: String,
    additionalDocuments: [{
        filename: String,
        originalName: String,
        uploadedAt: Date,
    }],
    candidateName: String,
    email: String,
}, { collection: 'resumes' });

const Resume = mongoose.model('Resume', ResumeSchema);

// Possible local upload directories
const uploadDirs = [
    path.join(process.cwd(), "public", "uploads"),
    path.join(process.cwd(), "uploads"),
    path.join(process.cwd(), "src", "app", "uploads"),
];

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

// Check if a file exists in R2
async function checkFileExistsInR2(key) {
    try {
        await r2Client.send(new HeadObjectCommand({
            Bucket: bucketName,
            Key: key,
        }));
        return true;
    } catch (error) {
        if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
            return false;
        }
        throw error;
    }
}

// Find file in local directories
function findLocalFile(filename) {
    for (const dir of uploadDirs) {
        // Check direct path
        const directPath = path.join(dir, filename);
        if (fs.existsSync(directPath)) {
            return directPath;
        }

        // Check in subdirectories (resumes, documents, etc.)
        const subdirs = ['resumes', 'documents', 'additional', ''];
        for (const subdir of subdirs) {
            const subPath = path.join(dir, subdir, filename);
            if (fs.existsSync(subPath)) {
                return subPath;
            }
        }
    }

    // Also check by searching recursively in upload dirs
    for (const dir of uploadDirs) {
        if (fs.existsSync(dir)) {
            const found = findFileRecursive(dir, filename);
            if (found) return found;
        }
    }

    return null;
}

// Recursively search for a file
function findFileRecursive(dir, filename) {
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                const found = findFileRecursive(fullPath, filename);
                if (found) return found;
            } else if (entry.name === filename) {
                return fullPath;
            }
        }
    } catch (error) {
        // Ignore permission errors
    }
    return null;
}

// Upload a file to R2
async function uploadToR2(localPath, r2Key) {
    try {
        const fileBuffer = fs.readFileSync(localPath);
        const contentType = getContentType(localPath);

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

async function main() {
    console.log("🚀 Starting migration of missing files to R2...\n");

    // Check environment variables
    if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID ||
        !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET_NAME ||
        !process.env.MONGODB_URI) {
        console.error("❌ Missing environment variables!");
        console.error("   Required: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, MONGODB_URI");
        process.exit(1);
    }

    console.log(`📦 Target bucket: ${bucketName}`);
    console.log(`📁 Searching in local directories:`);
    uploadDirs.forEach(dir => console.log(`   - ${dir}`));

    // Connect to MongoDB
    console.log("\n📊 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Get all resumes
    const resumes = await Resume.find({}).lean();
    console.log(`📋 Found ${resumes.length} total resumes\n`);

    const stats = {
        additionalDocs: { checked: 0, inR2: 0, uploaded: 0, notFound: 0 },
        resumeFiles: { checked: 0, inR2: 0, uploaded: 0, notFound: 0 },
    };

    const missingFiles = [];

    // Process additional documents
    console.log("=".repeat(60));
    console.log("📄 PROCESSING ADDITIONAL DOCUMENTS");
    console.log("=".repeat(60));

    for (const resume of resumes) {
        if (resume.additionalDocuments && resume.additionalDocuments.length > 0) {
            for (const doc of resume.additionalDocuments) {
                stats.additionalDocs.checked++;
                const filename = doc.filename;

                try {
                    const existsInR2 = await checkFileExistsInR2(filename);

                    if (existsInR2) {
                        stats.additionalDocs.inR2++;
                        continue;
                    }

                    // File not in R2, try to find locally
                    console.log(`\n❌ Missing in R2: ${filename}`);
                    console.log(`   Candidate: ${resume.candidateName || resume.email || 'Unknown'}`);
                    console.log(`   Original: ${doc.originalName}`);

                    const localPath = findLocalFile(filename);

                    if (localPath) {
                        console.log(`   ✅ Found locally: ${localPath}`);
                        process.stdout.write(`   📤 Uploading to R2...`);

                        const uploaded = await uploadToR2(localPath, filename);
                        if (uploaded) {
                            console.log(" ✅ SUCCESS");
                            stats.additionalDocs.uploaded++;
                        } else {
                            console.log(" ❌ FAILED");
                            missingFiles.push({
                                type: 'additional',
                                resumeId: resume._id,
                                candidate: resume.candidateName || resume.email,
                                filename,
                                originalName: doc.originalName,
                                reason: 'Upload failed',
                            });
                        }
                    } else {
                        console.log(`   ❌ NOT found locally`);
                        stats.additionalDocs.notFound++;
                        missingFiles.push({
                            type: 'additional',
                            resumeId: resume._id,
                            candidate: resume.candidateName || resume.email,
                            filename,
                            originalName: doc.originalName,
                            reason: 'File not found locally',
                        });
                    }
                } catch (error) {
                    console.error(`   ⚠️ Error checking ${filename}: ${error.message}`);
                }
            }
        }
    }

    // Process resume files
    console.log("\n" + "=".repeat(60));
    console.log("📋 PROCESSING RESUME FILES");
    console.log("=".repeat(60));

    for (const resume of resumes) {
        if (resume.resumeFile) {
            stats.resumeFiles.checked++;
            const filename = resume.resumeFile;

            try {
                const existsInR2 = await checkFileExistsInR2(filename);

                if (existsInR2) {
                    stats.resumeFiles.inR2++;
                    continue;
                }

                // File not in R2, try to find locally
                console.log(`\n❌ Missing in R2: ${filename}`);
                console.log(`   Candidate: ${resume.candidateName || resume.email || 'Unknown'}`);

                const localPath = findLocalFile(filename);

                if (localPath) {
                    console.log(`   ✅ Found locally: ${localPath}`);
                    process.stdout.write(`   📤 Uploading to R2...`);

                    const uploaded = await uploadToR2(localPath, filename);
                    if (uploaded) {
                        console.log(" ✅ SUCCESS");
                        stats.resumeFiles.uploaded++;
                    } else {
                        console.log(" ❌ FAILED");
                        missingFiles.push({
                            type: 'resume',
                            resumeId: resume._id,
                            candidate: resume.candidateName || resume.email,
                            filename,
                            reason: 'Upload failed',
                        });
                    }
                } else {
                    console.log(`   ❌ NOT found locally`);
                    stats.resumeFiles.notFound++;
                    missingFiles.push({
                        type: 'resume',
                        resumeId: resume._id,
                        candidate: resume.candidateName || resume.email,
                        filename,
                        reason: 'File not found locally',
                    });
                }
            } catch (error) {
                console.error(`   ⚠️ Error checking ${filename}: ${error.message}`);
            }
        }
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 MIGRATION SUMMARY");
    console.log("=".repeat(60));

    console.log("\n📄 ADDITIONAL DOCUMENTS:");
    console.log(`   Checked: ${stats.additionalDocs.checked}`);
    console.log(`   Already in R2: ${stats.additionalDocs.inR2}`);
    console.log(`   ✅ Uploaded: ${stats.additionalDocs.uploaded}`);
    console.log(`   ❌ Not found locally: ${stats.additionalDocs.notFound}`);

    console.log("\n📋 RESUME FILES:");
    console.log(`   Checked: ${stats.resumeFiles.checked}`);
    console.log(`   Already in R2: ${stats.resumeFiles.inR2}`);
    console.log(`   ✅ Uploaded: ${stats.resumeFiles.uploaded}`);
    console.log(`   ❌ Not found locally: ${stats.resumeFiles.notFound}`);

    if (missingFiles.length > 0) {
        console.log("\n" + "=".repeat(60));
        console.log("⚠️ FILES THAT COULD NOT BE MIGRATED:");
        console.log("=".repeat(60));

        // Save to JSON file for reference
        const reportPath = path.join(process.cwd(), 'missing-files-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(missingFiles, null, 2));
        console.log(`\n📝 Full report saved to: ${reportPath}`);

        console.log("\nFirst 10 missing files:");
        missingFiles.slice(0, 10).forEach((file, index) => {
            console.log(`\n${index + 1}. ${file.type.toUpperCase()}`);
            console.log(`   Resume ID: ${file.resumeId}`);
            console.log(`   Candidate: ${file.candidate}`);
            console.log(`   Filename: ${file.filename}`);
            console.log(`   Reason: ${file.reason}`);
        });

        if (missingFiles.length > 10) {
            console.log(`\n   ... and ${missingFiles.length - 10} more (see report file)`);
        }
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Migration complete!");
    console.log("=".repeat(60));

    await mongoose.disconnect();
}

main().catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
});
