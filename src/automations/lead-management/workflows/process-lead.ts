/**
 * Process lead workflow: Parse email → Create Notion record → Send Slack notification
 */

import { createPage } from '../../../shared/services/notion';
import { sendMessage } from '../../../shared/services/slack';
import { logger } from '../../../shared/utils/logger';
import { extractEmail, parseCurrency, cleanText } from '../../../shared/utils/parser';
import { config } from '../config';
import type { EmailParsedData, Lead } from '../types';

/**
 * Parse booking email to extract lead information
 */
export function parseBookingEmail(emailData: {
  from: string;
  subject: string;
  body: string;
}): EmailParsedData {
  const { from, subject, body } = emailData;

  // Extract email
  const email = extractEmail(from) || '';

  // Try to extract name from "Name <email@domain.com>" format
  const nameMatch = from.match(/^([^<]+)</);
  const name = nameMatch ? nameMatch[1].trim() : '';

  // Extract company (look for common patterns)
  const companyMatch = body.match(/company:?\s*([^\n]+)/i);
  const company = companyMatch ? companyMatch[1].trim() : undefined;

  // Extract project description
  const projectMatch = body.match(/project:?\s*([^\n]+(?:\n(?!\w+:)[^\n]+)*)/i);
  const projectDescription = projectMatch ? cleanText(projectMatch[1]) : body.slice(0, 500);

  // Extract budget
  const budget = parseCurrency(body) || undefined;

  // Extract timeline
  const timelineMatch = body.match(/timeline:?\s*([^\n]+)/i);
  const timeline = timelineMatch ? timelineMatch[1].trim() : undefined;

  return {
    from,
    subject,
    body,
    name,
    company,
    projectDescription,
    budget,
    timeline,
  };
}

/**
 * Create lead in Notion
 */
export async function createLeadInNotion(lead: Lead): Promise<string> {
  logger.info('Creating lead in Notion', { email: lead.email });

  const properties = {
    Email: {
      email: lead.email,
    },
    Name: {
      title: [
        {
          text: {
            content: lead.name || lead.email,
          },
        },
      ],
    },
    Status: {
      select: {
        name: lead.status || 'new',
      },
    },
  };

  // Add optional properties
  if (lead.company) {
    (properties as any).Company = {
      rich_text: [{ text: { content: lead.company } }],
    };
  }

  if (lead.projectDescription) {
    (properties as any)['Project Description'] = {
      rich_text: [{ text: { content: lead.projectDescription } }],
    };
  }

  if (lead.budget) {
    (properties as any).Budget = {
      number: lead.budget,
    };
  }

  if (lead.timeline) {
    (properties as any).Timeline = {
      rich_text: [{ text: { content: lead.timeline } }],
    };
  }

  const page = await createPage(config.notionDatabase, properties);

  logger.info('Lead created in Notion', { pageId: page.id, email: lead.email });

  return page.id;
}

/**
 * Send Slack notification with interactive buttons
 */
export async function sendSlackNotification(
  lead: Lead,
  notionPageId: string
): Promise<{ ts: string; channel: string }> {
  logger.info('Sending Slack notification', { email: lead.email });

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `🎯 New Lead: ${lead.name || lead.email}`,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Email:*\n${lead.email}`,
        },
        {
          type: 'mrkdwn',
          text: `*Company:*\n${lead.company || 'N/A'}`,
        },
        {
          type: 'mrkdwn',
          text: `*Budget:*\n${lead.budget ? `$${lead.budget.toLocaleString()}` : 'N/A'}`,
        },
        {
          type: 'mrkdwn',
          text: `*Timeline:*\n${lead.timeline || 'N/A'}`,
        },
      ],
    },
  ];

  // Add project description
  if (lead.projectDescription) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Project:*\n${lead.projectDescription}`,
      },
    } as any);
  }

  // Add Notion link
  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `<https://notion.so/${notionPageId.replace(/-/g, '')}|View in Notion>`,
    },
  } as any);

  // Add action buttons
  blocks.push({
    type: 'actions',
    block_id: 'lead_actions',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: '✅ Accept Lead',
        },
        style: 'primary',
        action_id: 'accept_lead',
        value: notionPageId,
      },
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: '❌ Reject Lead',
        },
        style: 'danger',
        action_id: 'reject_lead',
        value: notionPageId,
      },
    ],
  } as any);

  const result = await sendMessage(
    config.slackChannel,
    `New lead: ${lead.name || lead.email}`,
    blocks
  );

  logger.info('Slack notification sent', { ts: result.ts, channel: result.channel });

  return result;
}

/**
 * Complete workflow: Process email → Create Notion → Send Slack
 */
export async function processLead(emailData: EmailParsedData): Promise<void> {
  logger.info('Processing new lead', { email: emailData.from });

  // Parse email
  const parsedData = parseBookingEmail({
    from: emailData.from,
    subject: emailData.subject,
    body: emailData.body,
  });

  // Create lead object
  const lead: Lead = {
    email: extractEmail(parsedData.from)!,
    name: parsedData.name,
    company: parsedData.company,
    projectDescription: parsedData.projectDescription,
    budget: parsedData.budget,
    timeline: parsedData.timeline,
    status: 'new',
  };

  // Create in Notion
  const notionPageId = await createLeadInNotion(lead);

  // Send Slack notification
  const { ts, channel } = await sendSlackNotification(lead, notionPageId);

  // Update lead with Slack thread info
  lead.notionPageId = notionPageId;
  lead.slackThreadTs = ts;

  logger.info('Lead processed successfully', {
    email: lead.email,
    notionPageId,
    slackThreadTs: ts,
  });
}
