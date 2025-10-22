/**
 * Handle booking workflow: Update Notion → Send Slack confirmation
 */

import { updatePage, findPageByProperty } from '../../../shared/services/notion.js';
import { sendThreadReply } from '../../../shared/services/slack.js';
import { logger } from '../../../shared/utils/logger.js';
import { formatDateTime } from '../../../shared/utils/format.js';
import { config } from '../config.js';
import type { CalcomBooking } from '../types.js';

/**
 * Find lead by email in Notion
 */
export async function findLeadByEmail(email: string): Promise<string | null> {
  logger.info('Finding lead by email', { email });

  const page = await findPageByProperty(
    config.notionDatabase,
    'Email',
    'email',
    email
  );

  return page ? page.id : null;
}

/**
 * Update lead with booking information
 */
export async function updateLeadWithBooking(
  pageId: string,
  booking: CalcomBooking
): Promise<void> {
  logger.info('Updating lead with booking info', { pageId, bookingId: booking.payload.bookingId });

  const properties: Record<string, any> = {
    Status: {
      select: {
        name: 'booked',
      },
    },
    'Booking Date': {
      date: {
        start: booking.payload.startTime,
      },
    },
  };

  // Add booking ID if available
  if (booking.payload.bookingId) {
    properties['Booking ID'] = {
      number: booking.payload.bookingId,
    };
  }

  await updatePage(pageId, properties);

  logger.info('Lead updated with booking info', { pageId });
}

/**
 * Send Slack confirmation message
 */
export async function sendSlackBookingConfirmation(
  email: string,
  booking: CalcomBooking,
  threadTs?: string
): Promise<void> {
  logger.info('Sending Slack booking confirmation', { email, bookingId: booking.payload.bookingId });

  const { payload } = booking;
  const attendee = payload.attendees[0];

  const message = `
🎉 *Booking Confirmed!*

*Lead:* ${attendee.name} (${attendee.email})
*Meeting:* ${payload.title}
*Time:* ${formatDateTime(new Date(payload.startTime))}
*Duration:* ${payload.description || 'N/A'}

The discovery call has been scheduled!
  `.trim();

  if (threadTs) {
    // Reply in thread if we have the thread timestamp
    await sendThreadReply(config.slackChannel, threadTs, message);
  } else {
    // Otherwise, just send a new message (we'll need to import sendMessage)
    const { sendMessage } = await import('../../../shared/services/slack');
    await sendMessage(config.slackChannel, message);
  }

  logger.info('Slack booking confirmation sent', { email });
}

/**
 * Complete booking confirmation workflow
 */
export async function handleBookingConfirmation(
  booking: CalcomBooking
): Promise<void> {
  logger.info('Handling booking confirmation', {
    triggerEvent: booking.triggerEvent,
    bookingId: booking.payload.bookingId,
  });

  // Get attendee email
  const attendeeEmail = booking.payload.attendees[0]?.email;

  if (!attendeeEmail) {
    logger.warn('No attendee email found in booking', { bookingId: booking.payload.bookingId });
    return;
  }

  // Find lead in Notion
  const pageId = await findLeadByEmail(attendeeEmail);

  if (!pageId) {
    logger.warn('Lead not found for email', { email: attendeeEmail });
    return;
  }

  // Update lead with booking info
  await updateLeadWithBooking(pageId, booking);

  // Send Slack confirmation
  await sendSlackBookingConfirmation(attendeeEmail, booking);

  logger.info('Booking confirmation handled successfully', {
    email: attendeeEmail,
    pageId,
    bookingId: booking.payload.bookingId,
  });
}

/**
 * Handle booking cancellation
 */
export async function handleBookingCancellation(
  booking: CalcomBooking
): Promise<void> {
  logger.info('Handling booking cancellation', {
    bookingId: booking.payload.bookingId,
  });

  const attendeeEmail = booking.payload.attendees[0]?.email;

  if (!attendeeEmail) {
    logger.warn('No attendee email found in booking', { bookingId: booking.payload.bookingId });
    return;
  }

  // Find lead in Notion
  const pageId = await findLeadByEmail(attendeeEmail);

  if (!pageId) {
    logger.warn('Lead not found for email', { email: attendeeEmail });
    return;
  }

  // Update status back to accepted
  await updatePage(pageId, {
    Status: {
      select: {
        name: 'accepted',
      },
    },
  });

  logger.info('Booking cancellation handled', {
    email: attendeeEmail,
    pageId,
  });
}

/**
 * Handle booking rescheduled
 */
export async function handleBookingRescheduled(
  booking: CalcomBooking
): Promise<void> {
  logger.info('Handling booking rescheduled', {
    bookingId: booking.payload.bookingId,
  });

  const attendeeEmail = booking.payload.attendees[0]?.email;

  if (!attendeeEmail) {
    return;
  }

  const pageId = await findLeadByEmail(attendeeEmail);

  if (!pageId) {
    return;
  }

  // Update with new booking time
  await updateLeadWithBooking(pageId, booking);

  logger.info('Booking rescheduled handled', {
    email: attendeeEmail,
    pageId,
  });
}
