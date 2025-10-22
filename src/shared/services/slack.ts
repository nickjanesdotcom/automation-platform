/**
 * Generic Slack service used by all automations.
 */

import { WebClient } from '@slack/web-api';
import { config } from '../../config.js';
import { withRetry } from '../utils/retry.js';
import { logger } from '../utils/logger.js';

const slack = new WebClient(config.slack.botToken);

/**
 * Send a message to a channel
 */
export async function sendMessage(channel: string, text: string, blocks?: any[]) {
  logger.info('Sending Slack message', { channel });

  const result = await withRetry(() =>
    slack.chat.postMessage({
      channel,
      text,
      blocks,
    })
  );

  return {
    ts: result.ts!,
    channel: result.channel!,
  };
}

/**
 * Send a threaded reply
 */
export async function sendThreadReply(
  channel: string,
  threadTs: string,
  text: string,
  blocks?: any[]
) {
  logger.info('Sending Slack thread reply', { channel, threadTs });

  return withRetry(() =>
    slack.chat.postMessage({
      channel,
      thread_ts: threadTs,
      text,
      blocks,
    })
  );
}

/**
 * Update a message
 */
export async function updateMessage(
  channel: string,
  ts: string,
  text: string,
  blocks?: any[]
) {
  logger.info('Updating Slack message', { channel, ts });

  return withRetry(() =>
    slack.chat.update({
      channel,
      ts,
      text,
      blocks,
    })
  );
}

/**
 * Send alert to alerts channel
 */
export async function sendAlert(
  title: string,
  message: string,
  severity: 'info' | 'warning' | 'error' = 'error'
) {
  const emoji = severity === 'error' ? '🚨' : severity === 'warning' ? '⚠️' : 'ℹ️';

  // Use a dedicated alerts channel if configured
  const alertsChannel = process.env.SLACK_ALERTS_CHANNEL_ID || config.slack.botToken;

  return sendMessage(alertsChannel, `${emoji} ${title}`, [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${emoji} ${title}`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: message,
      },
    },
  ]);
}

/**
 * Send a direct message to a user
 */
export async function sendDM(userId: string, text: string, blocks?: any[]) {
  logger.info('Sending Slack DM', { userId });

  // Open a conversation with the user
  const conversation = await slack.conversations.open({
    users: userId,
  });

  if (!conversation.channel?.id) {
    throw new Error('Failed to open conversation');
  }

  return sendMessage(conversation.channel.id, text, blocks);
}

/**
 * Get user info
 */
export async function getUserInfo(userId: string) {
  return withRetry(() => slack.users.info({ user: userId }));
}

/**
 * Add reaction to message
 */
export async function addReaction(channel: string, timestamp: string, emoji: string) {
  return withRetry(() =>
    slack.reactions.add({
      channel,
      timestamp,
      name: emoji,
    })
  );
}
