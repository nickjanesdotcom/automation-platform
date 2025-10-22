/**
 * Test webhook for manually creating leads (for testing purposes)
 */

import type { Context } from 'hono';
import { logger } from '../../../shared/utils/logger.js';
import { monitor } from '../../../shared/utils/monitor.js';
import { processLead } from '../workflows/process-lead.js';
import type { EmailParsedData } from '../types.js';

/**
 * Handle test lead creation (simple format for testing)
 */
export async function handleTestWebhook(c: Context) {
  try {
    logger.info('Test webhook received', { automationId: 'lead-management' });

    const body = await c.req.json();

    // Validate required fields
    if (!body.from || !body.subject || !body.body) {
      return c.json({ success: false, error: 'Missing required fields: from, subject, body' }, 400);
    }

    // Create email data in the format processLead expects
    const emailData: EmailParsedData = {
      from: body.from,
      subject: body.subject,
      body: body.body,
    };

    // Process the lead
    await processLead(emailData);

    return c.json({
      success: true,
      message: 'Test lead processed successfully',
    });
  } catch (error) {
    logger.error('Error processing test lead', error);
    monitor.captureException(error as Error, { automationId: 'lead-management' });

    return c.json(
      {
        success: false,
        error: 'Failed to process test lead',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
}
