import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import sitesRouter from './routes/sites';
import pagesRouter from './routes/pages';
import analysisRouter from './routes/analysis';
import injectedContentRouter from './routes/injectedContent';
import trackerRouter from './routes/tracker';
import usersRouter from './routes/users';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import winston from 'winston';
import expressWinston from 'express-winston';
import * as Sentry from '@sentry/node';
import client from 'prom-client';
import { metricsMiddleware, errorMetricsMiddleware, metricsEndpoint } from './utils/metrics';
import { setSentryUser, setSentryRequest } from './utils/sentryContext';

// Import workers to start background job processing
import './utils/sitemapWorker';
import './utils/analysisWorker';

// Sentry initialization
let sentryInitialized = false;
if (process.env.SENTRY_DSN && process.env.SENTRY_DSN !== 'your-sentry-dsn-here') {
  try {
    Sentry.init({ dsn: process.env.SENTRY_DSN });
    sentryInitialized = true;
    console.log('✅ Sentry initialized successfully');
  } catch (error) {
    console.warn('⚠️  Failed to initialize Sentry:', error);
  }
}

const app = express();

// CORS configuration
const corsOptions = {
  origin: [
    process.env.CORS_ORIGIN || 'http://localhost:3000',
    'http://localhost:3002',
    'http://localhost:3001',
    'http://localhost:8080',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3002',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:5500'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

// Serve static files for tracker script
app.use('/tracker', express.static('public/tracker'));

// Sentry request handler with context
if (sentryInitialized) {
  // @ts-ignore
  app.use((req, res, next) => {
    // @ts-ignore
    Sentry.Handlers.requestHandler()(
      req,
      res,
      () => {
        // @ts-ignore
        Sentry.configureScope((scope: any) => {
          setSentryUser(scope, req);
          setSentryRequest(scope, req);
        });
        next();
      }
    );
  });
}

// Prometheus metrics middleware
app.use(metricsMiddleware);

// Clean, secure logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m'; // Red for errors, green for success
    const resetColor = '\x1b[0m';
    
    // Only log non-health check requests to reduce noise
    if (req.originalUrl !== '/healthz' && req.originalUrl !== '/metrics') {
      console.log(
        `${statusColor}${req.method}${resetColor} ${req.originalUrl} ${statusColor}${res.statusCode}${resetColor} ${duration}ms`
      );
    }
  });
  
  next();
});

const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: {
        title: 'Cleaver Search API',
  version: '1.0.0',
  description: 'API documentation for the Cleaver Search backend',
    },
  },
  apis: ['./src/routes/*.ts'],
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Prometheus metrics endpoint
app.get('/metrics', metricsEndpoint);

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/sites', sitesRouter);
app.use('/api/v1/pages', pagesRouter);
app.use('/api/v1/analysis', analysisRouter);
app.use('/api/v1/injected-content', injectedContentRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1', trackerRouter);
app.use('/tracker', trackerRouter); // Direct tracker routes for JavaScript

// Error logging middleware - only for actual errors
app.use(expressWinston.errorLogger({
  transports: [new winston.transports.Console()],
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.printf(({ level, message, meta }) => {
      return `${level}: ${message}`;
    })
  ),
  meta: false, // Don't include request/response metadata for errors
}));

// Prometheus error metrics middleware
app.use(errorMetricsMiddleware);

// Sentry error handler
if (sentryInitialized) {
  // @ts-ignore
  app.use(Sentry.Handlers.errorHandler());
}

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Log error without sensitive information
  console.error(`❌ ERROR: ${err.message} - ${req.method} ${req.originalUrl}`);
  
  if (sentryInitialized) {
    // @ts-ignore
    Sentry.withScope((scope: any) => {
      setSentryUser(scope, req);
      setSentryRequest(scope, req);
      Sentry.captureException(err);
    });
  }
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 Swagger docs available at http://localhost:${PORT}/api-docs`);
  console.log(`❤️  Health check available at http://localhost:${PORT}/healthz`);
  console.log(`📊 Prometheus metrics available at http://localhost:${PORT}/metrics`);
});
