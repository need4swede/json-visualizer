import helmet from "helmet";
import { Request, Response, NextFunction } from "express";

// Security configuration for production deployment
export const securityConfig = {
  // Content Security Policy - Allow only necessary sources
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // unsafe-eval needed for JSON parsing
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"], // WebSocket for Vite HMR in development
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      childSrc: ["'none'"],
      workerSrc: ["'self'", "blob:"],
      upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
    },
  },
  
  // HTTP Strict Transport Security - Force HTTPS for 1 year
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },
  
  // Prevent clickjacking attacks
  frameguard: {
    action: "deny" as const,
  },
  
  // Prevent MIME type sniffing
  noSniff: true,
  
  // Hide X-Powered-By header
  hidePoweredBy: true,
  
  // Enable XSS protection
  xssFilter: true,
  
  // Referrer Policy - Limit referrer information
  referrerPolicy: {
    policy: "strict-origin-when-cross-origin" as const,
  },
};

// HTTPS redirect middleware for production
export const httpsRedirect = (req: Request, res: Response, next: NextFunction) => {
  // Skip redirect in development or if already HTTPS
  if (process.env.NODE_ENV !== "production" || req.secure || req.headers["x-forwarded-proto"] === "https") {
    return next();
  }
  
  // Redirect HTTP to HTTPS
  const httpsUrl = `https://${req.headers.host}${req.url}`;
  res.redirect(301, httpsUrl);
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Additional custom security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), magnetometer=(), gyroscope=(), accelerometer=()");
  
  // Remove server identification
  res.removeHeader("X-Powered-By");
  res.removeHeader("Server");
  
  next();
};

// Rate limiting configuration
export const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
};

// CORS configuration for production
export const corsConfig = {
  origin: process.env.NODE_ENV === "production" 
    ? [process.env.FRONTEND_URL || "https://your-domain.com"] 
    : true, // Allow all origins in development
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

// Security audit logging
export const securityAudit = (req: Request, res: Response, next: NextFunction) => {
  const securityEvent = {
    timestamp: new Date().toISOString(),
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers["user-agent"],
    method: req.method,
    url: req.url,
    headers: {
      origin: req.headers.origin,
      referer: req.headers.referer,
      "x-forwarded-for": req.headers["x-forwarded-for"],
    },
  };
  
  // Log suspicious patterns
  const suspiciousPatterns = [
    /\.\.\//, // Directory traversal
    /<script/i, // XSS attempts
    /union.*select/i, // SQL injection
    /javascript:/i, // JavaScript protocol
    /data:.*base64/i, // Base64 data URLs
  ];
  
  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(req.url) || 
    pattern.test(String(req.headers.referer || "")) ||
    pattern.test(String(req.headers["user-agent"] || ""))
  );
  
  if (isSuspicious) {
    console.warn("[SECURITY] Suspicious request detected:", securityEvent);
  }
  
  next();
};

export default {
  securityConfig,
  httpsRedirect,
  securityHeaders,
  rateLimitConfig,
  corsConfig,
  securityAudit,
};