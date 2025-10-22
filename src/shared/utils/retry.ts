/**
 * Retry logic with exponential backoff using p-retry.
 */

import pRetry from 'p-retry';
import { logger } from './logger.js';

export interface RetryOptions {
  retries?: number;
  minTimeout?: number;
  maxTimeout?: number;
  onFailedAttempt?: (error: any) => void;
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    retries = 3,
    minTimeout = 1000,
    maxTimeout = 5000,
    onFailedAttempt,
  } = options;

  return pRetry(fn, {
    retries,
    minTimeout,
    maxTimeout,
    onFailedAttempt: (error) => {
      logger.warn(`Retry attempt ${error.attemptNumber} failed`, {
        error: error.message,
        retriesLeft: error.retriesLeft,
      });

      if (onFailedAttempt) {
        onFailedAttempt(error);
      }
    },
  });
}
