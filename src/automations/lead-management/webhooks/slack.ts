/**
 * Slack interactive webhook handler for lead acceptance buttons.
 */

import type { Context } from 'hono';
import { logger } from '../../../shared/utils/logger';
import { monitor } from '../../../shared/utils/monitor';
import { acceptLead, rejectLead } from '../workflows/accept-lead';
import { updateSlackMessage } from '../workflows/accept-lead';
import type { SlackInteractionPayload } from '../types';

/**
 * Handle Slack interactive webhook
 */
export async function handleSlackInteraction(c: Context) {
  try {
    logger.info('Slack interaction received', { automationId: 'lead-management' });

    // Parse the payload from form data
    const body = await c.req.parseBody();
    const payloadStr = body.payload as string;

    if (!payloadStr) {
      logger.warn('No payload in Slack interaction');
      return c.json({ error: 'No payload' }, 400);
    }

    const payload: SlackInteractionPayload = JSON.parse(payloadStr);

    logger.info('Slack interaction payload', {
      type: payload.type,
      actionId: payload.actions?.[0]?.action_id,
      user: payload.user.username,
    });

    // Handle different action types
    if (payload.type === 'block_actions' && payload.actions.length > 0) {
      const action = payload.actions[0];
      const pageId = action.value;
      const actionId = action.action_id;
      const userName = payload.user.name || payload.user.username;

      const channel = payload.container.channel_id;
      const messageTs = payload.container.message_ts;

      if (actionId === 'accept_lead') {
        // Accept the lead
        await acceptLead(pageId, userName);

        // Update Slack message
        await updateSlackMessage(channel, messageTs, 'accepted', userName);

        logger.info('Lead accepted', { pageId, userName });

        // Respond to Slack
        return c.json({
          response_type: 'in_channel',
          replace_original: false,
          text: `✅ Lead accepted by ${userName}. Booking link sent!`,
        });
      } else if (actionId === 'reject_lead') {
        // Reject the lead
        await rejectLead(pageId, userName);

        // Update Slack message
        await updateSlackMessage(channel, messageTs, 'rejected', userName);

        logger.info('Lead rejected', { pageId, userName });

        // Respond to Slack
        return c.json({
          response_type: 'in_channel',
          replace_original: false,
          text: `❌ Lead rejected by ${userName}.`,
        });
      }
    }

    return c.json({ success: true });
  } catch (error) {
    logger.error('Error handling Slack interaction', error);
    monitor.captureException(error, {
      automationId: 'lead-management',
      webhook: 'slack',
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
