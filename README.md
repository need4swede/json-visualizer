# JSON Parser - Sophisticated JSON Visualization Tool

A beautiful JSON visualization tool that transforms complex, deeply nested data structures into an intuitive, visually engaging web interface with dynamic navigation and enhanced user interaction.

## Features

- **Apple-style Glassmorphism Design** - Enhanced blur effects and sophisticated UI
- **Dynamic JSON Rendering** - Transforms JSON into readable web content
- **Shareable URLs** - 9-digit IDs for truly shareable JSON visualizations
- **Advanced Search** - Find specific content within complex JSON structures
- **Anchor Navigation** - Direct links to specific JSON sections
- **Focus Animations** - Elegant fade-and-border highlighting system
- **Copy Functionality** - One-click copying of values and anchor links
- **Dark Mode** - Optimized for dark theme viewing

## Tech Stack

- **Frontend**: React.js, Tailwind CSS, Framer Motion
- **Backend**: Express.js, Node.js
- **Build**: Vite
- **Styling**: Apple-inspired glassmorphism with enhanced blur effects

## Docker Setup (Recommended)

### Quick Start

1. **Clone and build**:
   ```bash
   git clone <repository-url>
   cd json-parser
   ```

2. **Run with Docker Compose**:
   ```bash
   docker-compose up -d
   ```

3. **Access the application**:
   Open [http://localhost:7337](http://localhost:7337)

### Docker Compatibility Notes

This setup has been specifically configured to work outside of Replit environments:

- **Removed Replit Dependencies**: Uses `vite.config.docker.ts` to avoid Replit-specific plugins
- **Fixed Build Process**: Installs all dependencies first, builds, then removes dev dependencies
- **Added Missing Dependencies**: Includes `nanoid` and other required packages
- **Directory Structure**: Creates necessary directories for assets and build output

### Manual Docker Build

```bash
# Build the image
docker build -t json-parser .

# Run the container
docker run -p 7337:7337 json-parser
```

## Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Access development server**:
   Open [http://localhost:5000](http://localhost:5000)

## Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Environment Variables

- `PORT` - Server port (default: 5000, Docker: 7337)
- `NODE_ENV` - Environment (development/production)

## Usage

1. **Parse JSON**: Paste or upload JSON data
2. **Navigate**: Use the sidebar navigation to jump to specific sections
3. **Search**: Find specific content with the search functionality
4. **Share**: Generate shareable URLs with 9-digit IDs
5. **Copy**: Click copy icons to copy values or anchor links
6. **Focus**: Click navigation items to see elegant focus animations

## Docker Configuration

The application includes complete Docker setup:

- **Dockerfile**: Multi-stage build optimized for production
- **docker-compose.yml**: Simple orchestration with port 7337
- **.dockerignore**: Optimized for smaller image sizes

## API Endpoints

- `POST /api/json` - Store JSON data, returns shareable ID
- `GET /api/json/:id` - Retrieve JSON data by ID

## License

MIT License