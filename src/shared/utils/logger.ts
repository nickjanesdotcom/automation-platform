/**
 * Centralized logging with Axiom integration.
 */

import { Axiom } from '@axiomhq/js';
import { config } from '../../config.js';
import type { LogContext, LogLevel } from '../../types.js';

// Initialize Axiom client
let axiom: Axiom | null = null;

if (config.observability.axiom.token) {
  axiom = new Axiom({
    token: config.observability.axiom.token,
  });
}

/**
 * Log a message with context
 */
function log(level: LogLevel, message: string, context: LogContext = {}) {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    level,
    message,
    environment: config.env,
    ...context,
  };

  // Console output (development)
  if (config.env === 'development') {
    const emoji =
      level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'debug' ? '🔍' : 'ℹ️';
    console.log(`${emoji} [${level.toUpperCase()}] ${message}`, context);
  }

  // Send to Axiom (if configured)
  if (axiom) {
    try {
      axiom.ingest(config.observability.axiom.dataset, [logData]);
    } catch (error) {
      console.error('Failed to send log to Axiom:', error);
    }
  }
}

/**
 * Log info message
 */
export function info(message: string, context: LogContext = {}) {
  log('info', message, context);
}

/**
 * Log warning message
 */
export function warn(message: string, context: LogContext = {}) {
  log('warn', message, context);
}

/**
 * Log error message
 */
export function error(message: string, errorObj?: Error | unknown, context: LogContext = {}) {
  const errorContext = errorObj instanceof Error
    ? {
        error: errorObj.message,
        stack: errorObj.stack,
      }
    : { error: String(errorObj) };

  log('error', message, { ...context, ...errorContext });
}

/**
 * Log debug message
 */
export function debug(message: string, context: LogContext = {}) {
  if (config.env === 'development') {
    log('debug', message, context);
  }
}

/**
 * Flush logs (for serverless environments)
 */
export async function flush() {
  if (axiom) {
    try {
      await axiom.flush();
    } catch (error) {
      console.error('Failed to flush logs:', error);
    }
  }
}

export const logger = {
  info,
  warn,
  error,
  debug,
  flush,
};
