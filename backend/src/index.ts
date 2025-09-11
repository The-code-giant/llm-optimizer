import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import cors from "cors";
import compression from "compression";
import authRouter from "./routes/auth";
import sitesRouter from "./routes/sites";
import pagesRouter from "./routes/pages";
import billingRouter from "./routes/billing";
import webhooksRouter from "./routes/webhooks";
import analysisRouter from "./routes/analysis";
import trackerRouter from "./routes/tracker";
import usersRouter from "./routes/users";
import toolsRouter from "./routes/tools";
import leadsRouter from "./routes/leads";
import analyticsRouter from "./routes/analytics";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import winston from "winston";
import expressWinston from "express-winston";
import * as Sentry from "@sentry/node";
import helmet from "helmet";
import {
  metricsMiddleware,
  errorMetricsMiddleware,
  metricsEndpoint,
} from "./utils/metrics";
import { setSentryUser, setSentryRequest } from "./utils/sentryContext";
import {
  generalRateLimit,
  dashboardRateLimit,
  authRateLimit,
} from "./middleware/rateLimit";

// Import workers to start background job processing
// Conditionally start background workers (can be disabled in development)
const enableBackgroundJobs = process.env.ENABLE_BACKGROUND_JOBS === "true";
if (enableBackgroundJobs) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("./utils/sitemapWorker");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("./utils/analysisWorker");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("./utils/eventProcessor");
}

// Sentry initialization
let sentryInitialized = false;
if (
  process.env.SENTRY_DSN &&
  process.env.SENTRY_DSN !== "your-sentry-dsn-here"
) {
  try {
    Sentry.init({ dsn: process.env.SENTRY_DSN });
    sentryInitialized = true;
    console.log("✅ Sentry initialized successfully");
  } catch (error) {
    console.warn("⚠️  Failed to initialize Sentry:", error);
  }
}

const app = express();

// Basic hardening
app.disable("x-powered-by");
// If running behind a reverse proxy/load balancer (Heroku/Vercel/Nginx), trust the proxy
app.set("trust proxy", 1);
// Security headers
app.use(
  helmet({
    // Allow tracker assets to be loaded cross-origin (served from this API and embedded on customer sites)
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Enable gzip compression for all responses
app.use(compression({
  level: 6, // Good balance between compression and speed
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req, res) => {
    // Don't compress if the request includes a no-transform directive
    if (req.headers['cache-control'] && req.headers['cache-control'].includes('no-transform')) {
      return false;
    }
    // Compress everything else
    return compression.filter(req, res);
  }
}));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "../public")));

// CORS configuration
const corsOptions = {
  origin: [
    process.env.CORS_ORIGIN || "http://localhost:3000",
    "http://localhost:3002",
    "http://localhost:3001",
    "http://localhost:8080",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3002",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:5500",
    "https://www.cleversearch.ai/",
    "https://www.cleversearch.ai",
    "https://backend.cleversearch.ai",
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Public CORS for tracker static files - allow all origins
app.use("/tracker", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS, POST");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});

// Tracker API CORS: reflect any Origin just for /api/v1/tracker
const trackerCors = cors({
  origin: true, // reflect request Origin header
  methods: ["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
  credentials: false,
  optionsSuccessStatus: 200,
});
app.use("/api/v1/tracker", trackerCors);

app.use(cors(corsOptions));

// Sentry request handler with context
if (sentryInitialized) {
  // @ts-ignore
  app.use((req, res, next) => {
    // @ts-ignore
    Sentry.Handlers.requestHandler()(req, res, () => {
      // @ts-ignore
      Sentry.configureScope((scope: any) => {
        setSentryUser(scope, req);
        setSentryRequest(scope, req);
      });
      next();
    });
  });
}

// Prometheus metrics middleware
app.use(metricsMiddleware);

// DNS scanning detection middleware
app.use((req, res, next) => {
  const hasDnsParams = req.query.dns || req.query.name || req.query.type;
  const isDnsScanning = req.path.includes('resolve') || req.path.includes('dns-query') || req.path.includes('query');
  
  if (hasDnsParams || isDnsScanning) {
    console.log(`🚨 DNS scanning attempt detected: ${req.method} ${req.originalUrl} from ${req.ip}`);
    // You could add IP blocking logic here if needed
  }
  
  next();
});

// General rate limiting for all requests
app.use(generalRateLimit);

// Clean, secure logging middleware
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? "\x1b[31m" : "\x1b[32m"; // Red for errors, green for success
    const resetColor = "\x1b[0m";

    // Only log non-health check requests to reduce noise
    if (req.originalUrl !== "/healthz" && req.originalUrl !== "/metrics") {
      console.log(
        `${statusColor}${req.method}${resetColor} ${req.originalUrl} ${statusColor}${res.statusCode}${resetColor} ${duration}ms`
      );
    }
  });

  next();
});

// Determine which files to use based on environment
const isDevelopment = process.env.NODE_ENV !== "production";
const apiFiles = isDevelopment ? ["./src/routes/*.ts"] : ["./dist/routes/*.js"];

console.log(`📚 Loading Swagger docs from: ${apiFiles.join(", ")}`);

const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Cleversearch API",
      version: "1.0.0",
      description: "API documentation for the Cleversearch backend",
    },
  },
  apis: apiFiles,
});


app.use("/api/v1/webhooks", dashboardRateLimit, express.json({
  verify: (req, res, buf) => {
    // @ts-ignore
    req.rawBody = buf.toString();
  },
}), webhooksRouter);

// Tighten body size limits (leave Stripe/webhooks raw-body handling above intact)
app.use(express.json({ limit: "200kb" }));
app.use(express.urlencoded({ extended: false, limit: "200kb" }));
//!Notes new route must add after webhooks router.

// Minimal root endpoint to reduce noisy 404 scans
app.get("/", (_req, res) => {
  // Check if this looks like a DNS query attempt
  const hasDnsParams = _req.query.dns || _req.query.name || _req.query.type;
  if (hasDnsParams) {
    // Return 404 for DNS query attempts to discourage scanning
    res.status(404).json({ message: "Not Found" });
    return;
  }
  res.status(200).send("Cleversearch backend is running");
});

// Serve robots.txt to reduce crawler 404 noise
app.get("/robots.txt", (_req, res) => {
  res.type("text/plain").send("User-agent: *\nDisallow: /");
});

// Avoid favicon 404 noise
app.get("/favicon.ico", (_req, res) => {
  res.sendStatus(204);
});

// Internal access guard (only enforced in production)
const requireInternalApiKey: express.RequestHandler = (req, res, next) => {
  if (isDevelopment) {
    return next();
  }
  const provided = req.header("x-api-key");
  const expected = process.env.INTERNAL_API_KEY;
  if (expected && provided === expected) {
    return next();
  }
  res.status(403).json({ message: "Forbidden" });
};

// Serve the Swagger JSON specification (protected in production)
app.get("/api-docs/swagger.json", requireInternalApiKey, (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});
app.use("/api-docs", requireInternalApiKey, swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Prometheus metrics endpoint (protected in production)
app.get("/metrics", requireInternalApiKey, metricsEndpoint);

// Health check endpoint with Redis status
app.get("/healthz", async (req, res) => {
  try {
    const redisHealthy = await require("./utils/redis").default.ping();
    const cacheStats = await require("./utils/cache").default.getCacheStats();

    res.status(200).json({
      status: "ok",
      redis: redisHealthy,
      cache: cacheStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      redis: false,
      error: "Health check failed",
      timestamp: new Date().toISOString(),
    });
  }
});

app.use("/api/v1/auth", authRateLimit, authRouter);
app.use("/api/v1/sites", dashboardRateLimit, sitesRouter);
app.use("/api/v1/pages", dashboardRateLimit, pagesRouter);
app.use("/api/v1/analysis", dashboardRateLimit, analysisRouter);
app.use("/api/v1/users", dashboardRateLimit, usersRouter);
app.use("/api/v1/billing", dashboardRateLimit, billingRouter);
app.use("/api/v1/tools", generalRateLimit, toolsRouter);
app.use("/api/v1/leads", generalRateLimit, leadsRouter);
app.use("/api/v1/analytics", dashboardRateLimit, analyticsRouter);
app.use("/api/v1/tracker", trackerRouter);

// Serve static files for tracker script (MUST be after API routes)
app.use("/tracker", express.static("public/tracker"));

// Use refactored error handling middleware
app.use(notFoundHandler);
// Error logging middleware - only for actual errors
app.use(
  expressWinston.errorLogger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ level, message, meta }) => {
        return `${level}: ${message}`;
      })
    ),
    meta: false, // Don't include request/response metadata for errors
  })
);

// Prometheus error metrics middleware
app.use(errorMetricsMiddleware);

// Sentry error handler
if (sentryInitialized) {
  // @ts-ignore
  app.use(Sentry.Handlers.errorHandler());
}

// Use refactored error handler (must be last)
app.use(errorHandler);

const PORT = process.env.BACKEND_PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 Swagger docs available at http://localhost:${PORT}/api-docs`);
  console.log(`❤️  Health check available at http://localhost:${PORT}/healthz`);
  console.log(
    `📊 Prometheus metrics available at http://localhost:${PORT}/metrics`
  );
});
