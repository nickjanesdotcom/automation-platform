/**
 * Global platform configuration.
 * Shared settings across all automations.
 */

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8787'),

  // Shared service credentials
  notion: {
    apiKey: process.env.NOTION_API_KEY!,
  },

  slack: {
    botToken: process.env.SLACK_BOT_TOKEN!,
    signingSecret: process.env.SLACK_SIGNING_SECRET || '',
  },

  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
    from: process.env.FROM_EMAIL || '',
    fromName: process.env.FROM_NAME || 'Automation Platform',
  },

  resend: {
    apiKey: process.env.RESEND_API_KEY || '',
    fromEmail: process.env.RESEND_FROM_EMAIL || '',
    replyTo: process.env.RESEND_REPLY_TO || '',
  },

  attio: {
    apiKey: process.env.ATTIO_API_KEY || '',
    marketplaceListId: process.env.ATTIO_MARKETPLACE_LIST_ID || '',
  },

  observability: {
    axiom: {
      token: process.env.AXIOM_TOKEN || '',
      dataset: process.env.AXIOM_DATASET || 'automation-platform',
    },
    sentry: {
      dsn: process.env.SENTRY_DSN || '',
    },
  },
} as const;

// Validate required variables
if (!config.notion.apiKey) {
  throw new Error('NOTION_API_KEY is required');
}

if (!config.slack.botToken) {
  throw new Error('SLACK_BOT_TOKEN is required');
}
