/**
 * Gmail webhook handler for incoming lead emails.
 */

import type { Context } from 'hono';
import { google } from 'googleapis';
import { logger } from '../../../shared/utils/logger.js.js';
import { monitor } from '../../../shared/utils/monitor.js.js';
import { processLead } from '../workflows/process-lead.js';
import { config } from '../config.js';
import type { EmailParsedData } from '../types.js';

/**
 * Handle Gmail push notification
 */
export async function handleGmailWebhook(c: Context) {
  try {
    logger.info('Gmail webhook received', { automationId: 'lead-management' });

    // Parse the Gmail push notification
    const body = await c.req.json();
    const message = body.message;

    if (!message || !message.data) {
      logger.warn('Invalid Gmail webhook payload');
      return c.json({ success: false, error: 'Invalid payload' }, 400);
    }

    // Decode the message data
    const decodedData = Buffer.from(message.data, 'base64').toString('utf-8');
    const data = JSON.parse(decodedData);

    logger.info('Gmail push notification decoded', { data });

    // Get the message details from Gmail API
    const emailData = await fetchGmailMessage(data.historyId);

    if (!emailData) {
      logger.warn('Could not fetch email message');
      return c.json({ success: false, error: 'Could not fetch email' }, 400);
    }

    // Process the lead
    await processLead(emailData);

    return c.json({
      success: true,
      message: 'Lead processed successfully',
    });
  } catch (error) {
    logger.error('Error handling Gmail webhook', error);
    monitor.captureException(error, {
      automationId: 'lead-management',
      webhook: 'gmail',
    });

    return c.json(
      {
        success: false,
        error: 'Internal server error',
      },
      500
    );
  }
}

/**
 * Fetch email message from Gmail API
 */
async function fetchGmailMessage(historyId: string): Promise<EmailParsedData | null> {
  try {
    // Initialize Gmail API client
    const oauth2Client = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret
    );

    oauth2Client.setCredentials({
      refresh_token: config.google.refreshToken,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Get the latest message
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 1,
      q: 'is:unread', // Only fetch unread messages
    });

    const messages = response.data.messages;

    if (!messages || messages.length === 0) {
      return null;
    }

    const messageId = messages[0].id!;

    // Get full message details
    const message = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    // Extract headers
    const headers = message.data.payload?.headers || [];
    const from = headers.find((h) => h.name?.toLowerCase() === 'from')?.value || '';
    const subject = headers.find((h) => h.name?.toLowerCase() === 'subject')?.value || '';

    // Extract body
    let body = '';
    if (message.data.payload?.body?.data) {
      body = Buffer.from(message.data.payload.body.data, 'base64').toString('utf-8');
    } else if (message.data.payload?.parts) {
      // Handle multipart messages
      for (const part of message.data.payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          body = Buffer.from(part.body.data, 'base64').toString('utf-8');
          break;
        }
      }
    }

    // Mark as read
    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: ['UNREAD'],
      },
    });

    logger.info('Email fetched successfully', { messageId, from, subject });

    return {
      from,
      subject,
      body,
    };
  } catch (error) {
    logger.error('Error fetching Gmail message', error);
    return null;
  }
}
