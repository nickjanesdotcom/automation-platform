/**
 * Webhook authentication middleware.
 */

import type { Context, Next } from 'hono';
import { createHmac, timingSafeEqual } from 'crypto';
import { config } from '../../config';
import { logger } from '../utils/logger';

/**
 * Verify Slack signature
 */
export async function verifySlackSignature(c: Context, next: Next) {
  const signature = c.req.header('x-slack-signature');
  const timestamp = c.req.header('x-slack-request-timestamp');
  const body = await c.req.text();

  if (!signature || !timestamp) {
    logger.warn('Missing Slack signature headers');
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Check timestamp to prevent replay attacks (5 minutes)
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - parseInt(timestamp)) > 300) {
    logger.warn('Slack request timestamp too old');
    return c.json({ error: 'Request timestamp too old' }, 401);
  }

  // Verify signature
  const sigBasestring = `v0:${timestamp}:${body}`;
  const hmac = createHmac('sha256', config.slack.signingSecret);
  hmac.update(sigBasestring);
  const expectedSignature = `v0=${hmac.digest('hex')}`;

  try {
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
      logger.warn('Invalid Slack signature');
      return c.json({ error: 'Invalid signature' }, 401);
    }
  } catch (error) {
    logger.error('Error verifying Slack signature', error);
    return c.json({ error: 'Invalid signature' }, 401);
  }

  // Store body for later use
  c.set('body', body);

  await next();
}

/**
 * Verify webhook secret via header
 */
export function verifyWebhookSecret(secretKey: string) {
  return async (c: Context, next: Next) => {
    const providedSecret = c.req.header('x-webhook-secret') || c.req.query('secret');

    if (!providedSecret || providedSecret !== secretKey) {
      logger.warn('Invalid webhook secret');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    await next();
  };
}

/**
 * Verify Cal.com webhook signature
 */
export function verifyCalcomSignature(secret: string) {
  return async (c: Context, next: Next) => {
    const signature = c.req.header('x-cal-signature-256');
    const body = await c.req.text();

    if (!signature) {
      logger.warn('Missing Cal.com signature');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const hmac = createHmac('sha256', secret);
    hmac.update(body);
    const expectedSignature = hmac.digest('hex');

    if (signature !== expectedSignature) {
      logger.warn('Invalid Cal.com signature');
      return c.json({ error: 'Invalid signature' }, 401);
    }

    // Store body for later use
    c.set('body', body);

    await next();
  };
}

/**
 * Basic auth middleware
 */
export function basicAuth(username: string, password: string) {
  return async (c: Context, next: Next) => {
    const auth = c.req.header('authorization');

    if (!auth || !auth.startsWith('Basic ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const credentials = Buffer.from(auth.slice(6), 'base64').toString();
    const [user, pass] = credentials.split(':');

    if (user !== username || pass !== password) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    await next();
  };
}
