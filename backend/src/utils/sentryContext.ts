import * as Sentry from '@sentry/node';
import { Request } from 'express';

export function setSentryUser(scope: Sentry.Scope, req: Request) {
  if ((req as any).user) {
    scope.setUser({
      id: (req as any).user.userId,
      email: (req as any).user.email,
    });
  }
}

export function setSentryRequest(scope: Sentry.Scope, req: Request) {
  scope.setContext('request', {
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    query: req.query,
    params: req.params,
  });
}

export function addSentryTag(scope: Sentry.Scope, key: string, value: string) {
  scope.setTag(key, value);
}

export function addSentryBreadcrumb(message: string, category = 'custom', level: Sentry.SeverityLevel = 'info') {
  Sentry.addBreadcrumb({ message, category, level });
} 