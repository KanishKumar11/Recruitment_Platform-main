# Deployment Guide - Persistent Storage Setup

This guide explains how to set up persistent storage for file uploads in the Recruitment Platform application.

## Overview

The application uses two main directories for file uploads:
- `/uploads/` - Stores job application resumes (private files)
- `/public/uploads/` - Stores user profile pictures and public resume files

## Docker Deployment

### Using Docker Compose

1. **Build and run with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

2. **Volume Configuration:**
   - `recruitment-uploads` → `/app/uploads`
   - `recruitment-public-uploads` → `/app/public/uploads`

### Manual Docker Setup

1. **Create named volumes:**
   ```bash
   docker volume create recruitment-uploads
   docker volume create recruitment-public-uploads
   ```

2. **Run container with volumes:**
   ```bash
   docker run -d \
     --name recruitment-platform \
     -p 3000:3000 \
     -v recruitment-uploads:/app/uploads \
     -v recruitment-public-uploads:/app/public/uploads \
     -e MONGODB_URI="your-mongodb-uri" \
     recruitment-platform:latest
   ```

## Coolify Deployment

### Prerequisites

1. **Create host directories on your server:**
   ```bash
   sudo mkdir -p /data/recruitment-platform/uploads
   sudo mkdir -p /data/recruitment-platform/public-uploads
   sudo chown -R 1001:1001 /data/recruitment-platform/
   ```

### Coolify Configuration

1. **Upload the `coolify.yml` file** to your Coolify project

2. **Set Environment Variables in Coolify:**
   - `MONGODB_URI` - Your MongoDB connection string
   - `NEXTAUTH_SECRET` - Secret for NextAuth.js
   - `NEXTAUTH_URL` - Your application URL
   - `GOOGLE_CLIENT_ID` - Google OAuth client ID
   - `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

3. **Configure Persistent Volumes in Coolify UI:**
   
   **Volume 1: Root Uploads**
   - Name: `recruitment-uploads`
   - Host Path: `/data/recruitment-platform/uploads`
   - Container Path: `/app/uploads`
   - Type: `bind`
   
   **Volume 2: Public Uploads**
   - Name: `recruitment-public-uploads`
   - Host Path: `/data/recruitment-platform/public-uploads`
   - Container Path: `/app/public/uploads`
   - Type: `bind`

4. **Deploy the application** through Coolify

### Alternative Coolify Setup (Manual Volume Configuration)

If you prefer to configure volumes manually in Coolify:

1. **Go to your service settings**
2. **Navigate to "Storages" section**
3. **Add two persistent storages:**

   **Storage 1:**
   - Name: `uploads`
   - Source: `/data/recruitment-platform/uploads`
   - Destination: `/app/uploads`
   - Type: `bind`

   **Storage 2:**
   - Name: `public-uploads`
   - Source: `/data/recruitment-platform/public-uploads`
   - Destination: `/app/public/uploads`
   - Type: `bind`

## File Upload Paths

### Current File Structure

```
/app/
├── uploads/                    # Private resume files (job applications)
│   └── [filename].pdf
├── public/
│   └── uploads/
│       ├── profiles/           # User profile pictures
│       │   └── [user-id].[ext]
│       └── resumes/            # Public resume files
│           └── [filename].pdf
```

### API Endpoints

- **Resume Upload:** `POST /api/resumes` → saves to `/uploads/`
- **Profile Picture Upload:** `POST /api/user/upload` → saves to `/public/uploads/profiles/`
- **Resume Download:** `GET /api/resumes/download/[filename]` → serves from `/uploads/`
- **File Serving:** `GET /api/files/[...path]` → serves from `/uploads/`

## Important Notes

⚠️ **Critical:** Without persistent storage, all uploaded files will be lost on container restart/redeployment.

✅ **Best Practices:**
- Always backup your persistent volumes
- Set proper file permissions (1001:1001 for Node.js user)
- Monitor disk space usage
- Implement file cleanup policies for old uploads

## Troubleshooting

### Permission Issues
```bash
# Fix permissions on host directories
sudo chown -R 1001:1001 /data/recruitment-platform/
sudo chmod -R 755 /data/recruitment-platform/
```

### Volume Not Mounting
1. Check if host directories exist
2. Verify Coolify volume configuration
3. Check container logs for permission errors
4. Ensure the Node.js user (1001) has write access

### File Upload Failures
1. Check available disk space
2. Verify upload directory permissions
3. Check application logs for specific errors
4. Ensure volume mounts are working correctly

## Migration from Existing Deployment

If you have an existing deployment without persistent storage:

1. **Backup existing files** (if any)
2. **Create host directories** as described above
3. **Copy existing files** to new persistent locations
4. **Update deployment** with volume configurations
5. **Redeploy** the application
6. **Verify** file uploads and downloads work correctly