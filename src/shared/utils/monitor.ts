/**
 * Error monitoring with Sentry.
 */

import * as Sentry from '@sentry/node';
import { config } from '../../config.js';
import { logger } from './logger.js';

/**
 * Initialize Sentry
 */
export function initMonitoring() {
  if (config.observability.sentry.dsn) {
    Sentry.init({
      dsn: config.observability.sentry.dsn,
      environment: config.env,
      tracesSampleRate: config.env === 'production' ? 0.1 : 1.0,
    });

    logger.info('Sentry monitoring initialized');
  }
}

/**
 * Capture an exception
 */
export function captureException(error: Error | unknown, context?: Record<string, any>) {
  logger.error('Exception captured', error);

  if (config.observability.sentry.dsn) {
    Sentry.captureException(error, {
      extra: context,
    });
  }
}

/**
 * Capture a message
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  if (config.observability.sentry.dsn) {
    Sentry.captureMessage(message, level);
  }
}

/**
 * Set user context
 */
export function setUser(user: { id: string; email?: string; username?: string }) {
  if (config.observability.sentry.dsn) {
    Sentry.setUser(user);
  }
}

/**
 * Add breadcrumb
 */
export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb) {
  if (config.observability.sentry.dsn) {
    Sentry.addBreadcrumb(breadcrumb);
  }
}

export const monitor = {
  initMonitoring,
  captureException,
  captureMessage,
  setUser,
  addBreadcrumb,
};
