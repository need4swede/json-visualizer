import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import helmet from "helmet";
import { 
  securityConfig, 
  httpsRedirect, 
  securityHeaders, 
  securityAudit 
} from "./security";

const app = express();

// Security middleware - Apply first for maximum protection
app.use(httpsRedirect);
app.use(helmet(securityConfig));
app.use(securityHeaders);
app.use(securityAudit);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use PORT environment variable for Docker deployment, fallback to 5000 for development
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, () => {
    log(`serving on port ${port}`);
  });

  // Start background cleanup process for expired JSON data
  const startCleanupProcess = () => {
    const cleanupInterval = setInterval(async () => {
      try {
        const cleanedCount = await storage.cleanupExpiredData();
        if (cleanedCount > 0) {
          log(`Cleaned up ${cleanedCount} expired JSON records`);
        }
      } catch (error) {
        console.error("Error during cleanup process:", error);
      }
    }, 60 * 60 * 1000); // Run every hour (60 minutes * 60 seconds * 1000 ms)

    // Cleanup on process termination
    process.on('SIGINT', () => {
      clearInterval(cleanupInterval);
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      clearInterval(cleanupInterval);
      process.exit(0);
    });

    log("Background cleanup process started (runs every hour)");
  };

  startCleanupProcess();
})();
