# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (needed for build)
RUN npm ci

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p attached_assets dist/public

# Use Docker-compatible vite config and build the application
RUN cp vite.config.docker.ts vite.config.ts && npm run build

# Remove dev dependencies after build
RUN npm ci --only=production && npm cache clean --force

# Expose port 7337
EXPOSE 7337

# Set environment variables
ENV NODE_ENV=production
ENV PORT=7337

# Start the application
CMD ["npm", "start"]