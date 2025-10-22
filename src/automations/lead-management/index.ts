/**
 * Lead Management Automation
 *
 * Handles: Email leads → Notion → Slack → Cal.com bookings
 */

import type { Hono } from 'hono';
import type { Automation } from '../../core/types.js';
import { config } from './config.js';
import { handleGmailWebhook } from './webhooks/gmail.js';
import { handleCalcomWebhook } from './webhooks/calcom.js';
import { handleSlackInteraction } from './webhooks/slack.js';
import { verifyCalcomSignature } from '../../shared/middleware/auth.js';

/**
 * Setup function - registers all routes for this automation
 */
function setup(app: Hono) {
  const base = '/automations/lead-management';

  // Webhook routes
  app.post(`${base}/webhooks/gmail`, handleGmailWebhook);

  // Cal.com webhook with signature verification
  if (config.calcomWebhookSecret) {
    app.post(
      `${base}/webhooks/calcom`,
      verifyCalcomSignature(config.calcomWebhookSecret),
      handleCalcomWebhook
    );
  } else {
    app.post(`${base}/webhooks/calcom`, handleCalcomWebhook);
  }

  app.post(`${base}/webhooks/slack`, handleSlackInteraction);

  // Health check
  app.get(`${base}/health`, (c) => {
    return c.json({
      automation: 'lead-management',
      status: 'ok',
      config: {
        notionDatabase: config.notionDatabase,
        slackChannel: config.slackChannel,
        minimumBudget: config.features.minimumBudget,
        autoAccept: config.features.autoAccept,
      },
      timestamp: new Date().toISOString(),
    });
  });
}

/**
 * Export automation definition
 */
export const leadManagementAutomation: Automation = {
  id: 'lead-management',
  name: 'Lead Management',
  description: 'Automated lead processing from email to booking',
  enabled: process.env.LEAD_ENABLED !== 'false',
  baseRoute: '/automations/lead-management',
  setup,
};
