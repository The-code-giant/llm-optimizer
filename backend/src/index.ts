import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import cors from "cors";
import authRouter from "./routes/auth";
import sitesRouter from "./routes/sites";
import pagesRouter from "./routes/pages";
import billingRouter from "./routes/billing";
import webhooksRouter from "./routes/webhooks";
import analysisRouter from "./routes/analysis";
import injectedContentRouter from "./routes/injectedContent";
import trackerRouter from "./routes/tracker";
import usersRouter from "./routes/users";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import winston from "winston";
import expressWinston from "express-winston";
import * as Sentry from "@sentry/node";
import client from "prom-client";
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
import "./utils/sitemapWorker";
import "./utils/analysisWorker";
import "./utils/eventProcessor";

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

// Serve static files for tracker script (MUST be after CORS middleware)
app.use("/tracker", express.static("public/tracker"));

app.use(cors(corsOptions));
app.use(express.json());

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
      title: "Clever Search API",
      version: "1.0.0",
      description: "API documentation for the Clever Search backend",
    },
  },
  apis: apiFiles,
});

// Serve the Swagger JSON specification
app.get("/api-docs/swagger.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Prometheus metrics endpoint
app.get("/metrics", metricsEndpoint);

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
app.use("/api/v1/injected-content", dashboardRateLimit, injectedContentRouter);
app.use("/api/v1/users", dashboardRateLimit, usersRouter);
app.use("/api/v1/billing", dashboardRateLimit, billingRouter);
app.use("/api/v1/webhooks", dashboardRateLimit, webhooksRouter);
app.use("/api/v1", trackerRouter);
app.use("/tracker", trackerRouter); // Direct tracker routes for JavaScript

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

// Global error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    // Log error without sensitive information
    console.error(
      `❌ ERROR: ${err.message} - ${req.method} ${req.originalUrl}`
    );

    if (sentryInitialized) {
      // @ts-ignore
      Sentry.withScope((scope: any) => {
        setSentryUser(scope, req);
        setSentryRequest(scope, req);
        Sentry.captureException(err);
      });
    }
    res.status(err.status || 500).json({
      message: err.message || "Internal Server Error",
      error: process.env.NODE_ENV === "production" ? undefined : err.stack,
    });
  }
);

const PORT = process.env.BACKEND_PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 Swagger docs available at http://localhost:${PORT}/api-docs`);
  console.log(`❤️  Health check available at http://localhost:${PORT}/healthz`);
  console.log(
    `📊 Prometheus metrics available at http://localhost:${PORT}/metrics`
  );
});
