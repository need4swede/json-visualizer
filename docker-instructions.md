# Docker Setup Instructions for JSON Parser

This document outlines all the modifications required to make this Replit application run locally using Docker.

## Issues Encountered & Solutions

### 1. **Replit-Specific Dependencies**

**Problem**: The original `vite.config.ts` included Replit-specific plugins that would fail in a standard Docker environment:
- `@replit/vite-plugin-runtime-error-modal`
- `@replit/vite-plugin-cartographer`

**Solution**: Created `vite.config.docker.ts` with a clean configuration excluding Replit plugins.

```typescript
// vite.config.docker.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
```

### 2. **Missing Runtime Dependencies**

**Problem**: The server code imports `vite` at runtime, but it was only listed as a dev dependency and got removed during production build.

**Solution**: Added `vite` and `nanoid` as production dependencies to ensure they're available at runtime.

### 3. **Build Process Issues**

**Problem**: The original Dockerfile tried to install only production dependencies first, then build, which failed because build tools were needed.

**Solution**: Modified the build process to:
1. Install ALL dependencies (including dev dependencies for build)
2. Build the application
3. Keep all dependencies for runtime (since server imports dev packages)

### 4. **Directory Structure**

**Problem**: The build process expected certain directories to exist that weren't guaranteed in a fresh Docker environment.

**Solution**: Created necessary directories before building:
```dockerfile
RUN mkdir -p attached_assets dist/public
```

### 5. **Port Configuration**

**Problem**: The server was hardcoded to use port 5000, but Docker needed to use port 7337.

**Solution**: Modified `server/index.ts` to use the PORT environment variable:
```javascript
const port = parseInt(process.env.PORT || "5000", 10);
```

## Files Created/Modified

### New Files

1. **`Dockerfile`**
   - Multi-stage build process
   - Uses Node.js 20 Alpine for efficiency
   - Handles Replit-to-Docker compatibility issues

2. **`docker-compose.yml`**
   - Simple orchestration
   - Maps port 7337:7337
   - Sets production environment variables

3. **`.dockerignore`**
   - Excludes unnecessary files
   - Specifically excludes Replit configuration files
   - Reduces image size

4. **`vite.config.docker.ts`**
   - Clean Vite configuration without Replit plugins
   - Used automatically during Docker build

5. **`.env.docker`**
   - Production environment variables
   - PORT=7337, NODE_ENV=production

6. **`docker-test.sh`**
   - Automated testing script to verify Docker functionality

7. **`docker-instructions.md`** (this file)
   - Complete documentation of all changes

### Modified Files

1. **`server/index.ts`**
   - Added PORT environment variable support
   - Changed from hardcoded port 5000 to configurable port

## Dependencies Added

```bash
npm install vite nanoid
```

These packages were already being used but not properly declared as production dependencies.

## Final Docker Configuration

### Dockerfile
```dockerfile
FROM node:20-alpine
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and create directories
COPY . .
RUN mkdir -p attached_assets dist/public

# Use Docker-compatible config and build
RUN cp vite.config.docker.ts vite.config.ts && npm run build

# Clean cache but keep all dependencies (server needs them at runtime)
RUN npm cache clean --force

# Configure environment
EXPOSE 7337
ENV NODE_ENV=production
ENV PORT=7337

# Start application
CMD ["npm", "start"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  json-parser:
    build: .
    ports:
      - "7337:7337"
    environment:
      - NODE_ENV=production
      - PORT=7337
    volumes:
      - ./data:/app/data
    restart: unless-stopped
    container_name: json-parser-app
```

## Usage

1. Clone the repository
2. Run `docker-compose up -d`
3. Access the application at `http://localhost:7337`

## Key Lessons

1. **Replit apps often have platform-specific dependencies** that need to be excluded or replaced for Docker
2. **Build-time vs runtime dependencies** must be carefully managed - some "dev" dependencies are actually needed at runtime
3. **Port configuration** should always use environment variables for flexibility
4. **Directory structure** assumptions made in development may not hold in fresh Docker environments
5. **Vite configuration** needs to be environment-aware to exclude platform-specific plugins

## Testing

Use the included `docker-test.sh` script to verify the Docker setup works correctly:

```bash
chmod +x docker-test.sh
./docker-test.sh
```

This script will build the image, test container startup, verify port accessibility, and clean up test resources.