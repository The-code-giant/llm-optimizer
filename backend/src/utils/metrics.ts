import client from 'prom-client';
import { Request, Response, NextFunction } from 'express';

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

export const requestCounter = new client.Counter({
  name: 'api_requests_total',
  help: 'Total number of API requests',
  labelNames: ['method', 'route', 'status'],
});
export const errorCounter = new client.Counter({
  name: 'api_errors_total',
  help: 'Total number of API errors',
  labelNames: ['method', 'route', 'status'],
});
export const responseTimeHistogram = new client.Histogram({
  name: 'api_response_time_seconds',
  help: 'API response time in seconds',
  labelNames: ['method', 'route', 'status'],
});

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime();
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const responseTime = diff[0] + diff[1] / 1e9;
    requestCounter.inc({ method: req.method, route: req.path, status: res.statusCode });
    responseTimeHistogram.observe({ method: req.method, route: req.path, status: res.statusCode }, responseTime);
  });
  next();
}

export function errorMetricsMiddleware(err: any, req: Request, res: Response, next: NextFunction) {
  errorCounter.inc({ method: req.method, route: req.path, status: res.statusCode });
  next(err);
}

export async function metricsEndpoint(req: Request, res: Response) {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
} 