/**
 * Cal.com webhook handler for booking events.
 */

import type { Context } from 'hono';
import { logger } from '../../../shared/utils/logger.js';
import { monitor } from '../../../shared/utils/monitor.js';
import {
  handleBookingConfirmation,
  handleBookingCancellation,
  handleBookingRescheduled,
} from '../workflows/handle-booking.js';
import type { CalcomBooking } from '../types.js';

/**
 * Handle Cal.com webhook
 */
export async function handleCalcomWebhook(c: Context) {
  try {
    logger.info('Cal.com webhook received', { automationId: 'lead-management' });

    // Get the webhook payload
    const body = await c.req.json<CalcomBooking>();

    logger.info('Cal.com webhook payload', {
      triggerEvent: body.triggerEvent,
      bookingId: body.payload?.bookingId,
    });

    // Handle different event types
    switch (body.triggerEvent) {
      case 'BOOKING_CREATED':
        await handleBookingConfirmation(body);
        break;

      case 'BOOKING_CANCELLED':
        await handleBookingCancellation(body);
        break;

      case 'BOOKING_RESCHEDULED':
        await handleBookingRescheduled(body);
        break;

      default:
        logger.warn('Unknown Cal.com event type', { triggerEvent: body.triggerEvent });
    }

    return c.json({
      success: true,
      message: 'Booking event processed',
    });
  } catch (error) {
    logger.error('Error handling Cal.com webhook', error);
    monitor.captureException(error, {
      automationId: 'lead-management',
      webhook: 'calcom',
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
