// check-additional-docs-r2.js
// Script to check if all additional documents are uploaded to Cloudflare R2

const { S3Client, HeadObjectCommand } = require("@aws-sdk/client-s3");
const mongoose = require("mongoose");
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

// Resume schema (minimal version for checking)
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

// Check if a file exists in R2
async function checkFileExists(key) {
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

async function main() {
    console.log("🔍 Checking additional documents in R2...\n");

    // Check environment variables
    if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID ||
        !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET_NAME ||
        !process.env.MONGODB_URI) {
        console.error("❌ Missing environment variables!");
        console.error("   Required: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, MONGODB_URI");
        process.exit(1);
    }

    // Connect to MongoDB
    console.log("📊 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Get all resumes with additional documents
    const resumes = await Resume.find({
        additionalDocuments: { $exists: true, $ne: [] }
    }).lean();

    console.log(`📁 Found ${resumes.length} resumes with additional documents\n`);

    let totalDocs = 0;
    let inR2 = 0;
    let notInR2 = 0;
    const missingDocs = [];

    for (const resume of resumes) {
        console.log(`\n📋 Candidate: ${resume.candidateName || resume.email || 'Unknown'}`);
        console.log(`   Resume ID: ${resume._id}`);

        for (const doc of resume.additionalDocuments || []) {
            totalDocs++;
            const filename = doc.filename;

            process.stdout.write(`   Checking: ${filename}...`);

            try {
                const exists = await checkFileExists(filename);

                if (exists) {
                    console.log(" ✅ In R2");
                    inR2++;
                } else {
                    console.log(" ❌ NOT in R2");
                    notInR2++;
                    missingDocs.push({
                        resumeId: resume._id,
                        candidateName: resume.candidateName,
                        email: resume.email,
                        filename: filename,
                        originalName: doc.originalName,
                    });
                }
            } catch (error) {
                console.log(` ⚠️ Error: ${error.message}`);
                notInR2++;
                missingDocs.push({
                    resumeId: resume._id,
                    candidateName: resume.candidateName,
                    email: resume.email,
                    filename: filename,
                    originalName: doc.originalName,
                    error: error.message,
                });
            }
        }
    }

    // Also check resume files
    console.log("\n" + "=".repeat(60));
    console.log("🔍 Checking main resume files...");
    console.log("=".repeat(60));

    const allResumes = await Resume.find({
        resumeFile: { $exists: true, $ne: null }
    }).lean();

    let resumeFilesTotal = 0;
    let resumeFilesInR2 = 0;
    let resumeFilesNotInR2 = 0;
    const missingResumeFiles = [];

    for (const resume of allResumes) {
        if (resume.resumeFile) {
            resumeFilesTotal++;

            try {
                const exists = await checkFileExists(resume.resumeFile);

                if (exists) {
                    resumeFilesInR2++;
                } else {
                    resumeFilesNotInR2++;
                    missingResumeFiles.push({
                        resumeId: resume._id,
                        candidateName: resume.candidateName,
                        email: resume.email,
                        filename: resume.resumeFile,
                    });
                }
            } catch (error) {
                resumeFilesNotInR2++;
            }
        }
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 SUMMARY");
    console.log("=".repeat(60));
    console.log("\n📄 ADDITIONAL DOCUMENTS:");
    console.log(`   Total documents: ${totalDocs}`);
    console.log(`   ✅ In R2: ${inR2}`);
    console.log(`   ❌ NOT in R2: ${notInR2}`);

    console.log("\n📋 RESUME FILES:");
    console.log(`   Total resume files: ${resumeFilesTotal}`);
    console.log(`   ✅ In R2: ${resumeFilesInR2}`);
    console.log(`   ❌ NOT in R2: ${resumeFilesNotInR2}`);

    if (missingDocs.length > 0) {
        console.log("\n❌ MISSING ADDITIONAL DOCUMENTS:");
        console.log("-".repeat(60));
        for (const doc of missingDocs) {
            console.log(`   Resume: ${doc.resumeId}`);
            console.log(`   Candidate: ${doc.candidateName || doc.email}`);
            console.log(`   File: ${doc.filename} (${doc.originalName})`);
            console.log("-".repeat(60));
        }
    }

    if (missingResumeFiles.length > 0 && missingResumeFiles.length <= 20) {
        console.log("\n❌ MISSING RESUME FILES (first 20):");
        console.log("-".repeat(60));
        for (const doc of missingResumeFiles.slice(0, 20)) {
            console.log(`   Resume: ${doc.resumeId}`);
            console.log(`   Candidate: ${doc.candidateName || doc.email}`);
            console.log(`   File: ${doc.filename}`);
            console.log("-".repeat(60));
        }
    }

    console.log("\n" + "=".repeat(60));

    await mongoose.disconnect();
    console.log("\n✅ Done!");
}

main().catch((error) => {
    console.error("Check failed:", error);
    process.exit(1);
});
