import express from 'express';
import dotenv from 'dotenv';
import authRouter from './routes/auth';
import sitesRouter from './routes/sites';
import pagesRouter from './routes/pages';
import analysisRouter from './routes/analysis';
import injectedContentRouter from './routes/injectedContent';
import trackerRouter from './routes/tracker';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import winston from 'winston';
import expressWinston from 'express-winston';
import * as Sentry from '@sentry/node';
import client from 'prom-client';
import { metricsMiddleware, errorMetricsMiddleware, metricsEndpoint } from './utils/metrics';
import { setSentryUser, setSentryRequest } from './utils/sentryContext';

dotenv.config();

// Sentry initialization
if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN });
}

const app = express();
app.use(express.json());

// Sentry request handler with context
if (process.env.SENTRY_DSN) {
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

// Logging middleware
app.use(expressWinston.logger({
  transports: [new winston.transports.Console()],
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  ),
  meta: true,
  expressFormat: true,
  colorize: true,
}));

const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI SEO Optimizer API',
      version: '1.0.0',
      description: 'API documentation for the AI SEO Optimizer backend',
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
app.use('/api/v1', trackerRouter);

// Error logging middleware
app.use(expressWinston.errorLogger({
  transports: [new winston.transports.Console()],
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  ),
}));

// Prometheus error metrics middleware
app.use(errorMetricsMiddleware);

// Sentry error handler
if (process.env.SENTRY_DSN) {
  // @ts-ignore
  app.use(Sentry.Handlers.errorHandler());
}

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (process.env.SENTRY_DSN) {
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
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
  console.log(`Health check available at http://localhost:${PORT}/healthz`);
  console.log(`Prometheus metrics available at http://localhost:${PORT}/metrics`);
});
