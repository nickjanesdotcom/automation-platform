/**
 * Configuration specific to Lead Management automation.
 */

export const config = {
  notionDatabase: process.env.LEAD_NOTION_DATABASE_ID!,
  slackChannel: process.env.LEAD_SLACK_CHANNEL_ID!,
  calcomLink: process.env.LEAD_CALCOM_LINK!,
  calcomWebhookSecret: process.env.LEAD_CALCOM_WEBHOOK_SECRET || '',

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN || '',
  },

  features: {
    minimumBudget: parseInt(process.env.LEAD_MINIMUM_BUDGET || '0'),
    autoAccept: process.env.LEAD_AUTO_ACCEPT === 'true',
  },
};

// Validate required config
if (!config.notionDatabase) {
  throw new Error('LEAD_NOTION_DATABASE_ID is required');
}

if (!config.slackChannel) {
  throw new Error('LEAD_SLACK_CHANNEL_ID is required');
}
