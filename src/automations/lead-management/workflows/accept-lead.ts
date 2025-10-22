/**
 * Accept lead workflow: Update Notion → Send booking link email → Update Slack
 */

import { updatePage, retrievePage } from '../../../shared/services/notion.js';
import { sendTemplatedEmail } from '../../../shared/services/email.js';
import { updateMessage } from '../../../shared/services/slack.js';
import { logger } from '../../../shared/utils/logger.js';
import { config } from '../config.js';

/**
 * Update lead status in Notion
 */
export async function updateLeadStatus(
  pageId: string,
  status: 'accepted' | 'rejected' | 'booked'
): Promise<void> {
  logger.info('Updating lead status in Notion', { pageId, status });

  await updatePage(pageId, {
    Status: {
      select: {
        name: status,
      },
    },
  });

  logger.info('Lead status updated', { pageId, status });
}

/**
 * Get lead email from Notion page
 */
export async function getLeadEmail(pageId: string): Promise<string> {
  const page = await retrievePage(pageId);

  // Extract email from page properties
  const properties = (page as any).properties;
  const email = properties.Email?.email;

  if (!email) {
    throw new Error('Email not found in Notion page');
  }

  return email;
}

/**
 * Get lead name from Notion page
 */
export async function getLeadName(pageId: string): Promise<string> {
  const page = await retrievePage(pageId);

  // Extract name from page properties
  const properties = (page as any).properties;
  const titleProperty = properties.Name || properties.title;

  if (titleProperty?.title?.[0]?.text?.content) {
    return titleProperty.title[0].text.content;
  }

  return 'there'; // Fallback
}

/**
 * Send booking link email to lead
 */
export async function sendBookingLinkEmail(
  email: string,
  name: string = 'there'
): Promise<void> {
  logger.info('Sending booking link email', { email });

  await sendTemplatedEmail(email, 'Let\'s schedule a discovery call!', {
    greeting: `Hi ${name},`,
    body: `
      <p>Thanks for reaching out! We'd love to learn more about your project.</p>
      <p>Please use the link below to schedule a discovery call at a time that works best for you:</p>
    `,
    cta: {
      text: 'Schedule Discovery Call',
      url: config.calcomLink,
    },
    footer: 'Looking forward to speaking with you!',
  });

  logger.info('Booking link email sent', { email });
}

/**
 * Update Slack message to show lead accepted
 */
export async function updateSlackMessage(
  channel: string,
  ts: string,
  status: 'accepted' | 'rejected',
  acceptedBy?: string
): Promise<void> {
  logger.info('Updating Slack message', { channel, ts, status });

  const emoji = status === 'accepted' ? '✅' : '❌';
  const statusText = status === 'accepted' ? 'Accepted' : 'Rejected';
  const byText = acceptedBy ? ` by ${acceptedBy}` : '';

  // We'll need to get the original message and update it
  // For now, we'll just add a simple update block
  await updateMessage(
    channel,
    ts,
    `Lead ${statusText.toLowerCase()}${byText}`,
    [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${emoji} *${statusText}*${byText}`,
        },
      },
    ]
  );

  logger.info('Slack message updated', { channel, ts, status });
}

/**
 * Complete accept workflow
 */
export async function acceptLead(
  pageId: string,
  acceptedBy?: string
): Promise<void> {
  logger.info('Accepting lead', { pageId, acceptedBy });

  // Update status in Notion
  await updateLeadStatus(pageId, 'accepted');

  // Get lead info
  const email = await getLeadEmail(pageId);
  const name = await getLeadName(pageId);

  // Send booking link email
  await sendBookingLinkEmail(email, name);

  logger.info('Lead accepted successfully', {
    pageId,
    email,
    acceptedBy,
  });
}

/**
 * Complete reject workflow
 */
export async function rejectLead(
  pageId: string,
  rejectedBy?: string
): Promise<void> {
  logger.info('Rejecting lead', { pageId, rejectedBy });

  // Update status in Notion
  await updateLeadStatus(pageId, 'rejected');

  logger.info('Lead rejected successfully', {
    pageId,
    rejectedBy,
  });
}
