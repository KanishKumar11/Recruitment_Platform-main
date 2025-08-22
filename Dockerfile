# Use Node.js 20 LTS Alpine as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create upload directories with proper permissions
RUN mkdir -p /app/uploads && \
    mkdir -p /app/public/uploads/profiles && \
    mkdir -p /app/public/uploads/resumes && \
    chown -R node:node /app/uploads && \
    chown -R node:node /app/public/uploads

# Build the Next.js application
RUN npm run build

# Switch to non-root user
USER node

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]