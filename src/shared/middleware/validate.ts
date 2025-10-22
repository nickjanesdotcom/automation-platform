/**
 * Request validation middleware.
 */

import type { Context, Next } from 'hono';
import { logger } from '../utils/logger.js';

/**
 * Validate required fields in request body
 */
export function validateBody(requiredFields: string[]) {
  return async (c: Context, next: Next) => {
    let body: any;

    try {
      body = await c.req.json();
    } catch (error) {
      logger.warn('Invalid JSON body');
      return c.json({ error: 'Invalid JSON body' }, 400);
    }

    const missingFields: string[] = [];

    for (const field of requiredFields) {
      if (!(field in body) || body[field] === null || body[field] === undefined) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      logger.warn('Missing required fields', { missingFields });
      return c.json(
        {
          error: 'Missing required fields',
          missingFields,
        },
        400
      );
    }

    // Store parsed body for later use
    c.set('validatedBody', body);

    await next();
  };
}

/**
 * Validate required query parameters
 */
export function validateQuery(requiredParams: string[]) {
  return async (c: Context, next: Next) => {
    const missingParams: string[] = [];

    for (const param of requiredParams) {
      const value = c.req.query(param);
      if (!value) {
        missingParams.push(param);
      }
    }

    if (missingParams.length > 0) {
      logger.warn('Missing required query params', { missingParams });
      return c.json(
        {
          error: 'Missing required query parameters',
          missingParams,
        },
        400
      );
    }

    await next();
  };
}

/**
 * Validate request content type
 */
export function validateContentType(allowedTypes: string[]) {
  return async (c: Context, next: Next) => {
    const contentType = c.req.header('content-type');

    if (!contentType || !allowedTypes.some((type) => contentType.includes(type))) {
      logger.warn('Invalid content type', { contentType, allowedTypes });
      return c.json(
        {
          error: 'Invalid content type',
          expected: allowedTypes,
          received: contentType,
        },
        415
      );
    }

    await next();
  };
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Custom validator function type
 */
export type ValidatorFn = (value: any) => boolean | string;

/**
 * Validate body with custom validators
 */
export function validateWithSchema(schema: Record<string, ValidatorFn>) {
  return async (c: Context, next: Next) => {
    let body: any;

    try {
      body = await c.req.json();
    } catch (error) {
      logger.warn('Invalid JSON body');
      return c.json({ error: 'Invalid JSON body' }, 400);
    }

    const errors: Record<string, string> = {};

    for (const [field, validator] of Object.entries(schema)) {
      const value = body[field];
      const result = validator(value);

      if (result !== true) {
        errors[field] = typeof result === 'string' ? result : 'Validation failed';
      }
    }

    if (Object.keys(errors).length > 0) {
      logger.warn('Validation errors', { errors });
      return c.json(
        {
          error: 'Validation failed',
          errors,
        },
        400
      );
    }

    // Store validated body
    c.set('validatedBody', body);

    await next();
  };
}
