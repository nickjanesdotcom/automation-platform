/**
 * Types specific to Lead Management automation.
 */

export interface Lead {
  email: string;
  name?: string;
  company?: string;
  projectDescription?: string;
  budget?: number;
  timeline?: string;
  referralSource?: string;
  notionPageId?: string;
  slackThreadTs?: string;
  status: 'new' | 'review' | 'accepted' | 'rejected' | 'booked';
}

export interface EmailParsedData {
  from: string;
  subject: string;
  body: string;
  htmlBody?: string;
  name?: string;
  company?: string;
  projectDescription?: string;
  budget?: number;
  timeline?: string;
}

export interface SlackInteractionPayload {
  type: string;
  user: {
    id: string;
    username: string;
    name: string;
  };
  actions: Array<{
    action_id: string;
    block_id: string;
    value: string;
    type: string;
  }>;
  response_url: string;
  message: {
    ts: string;
  };
  container: {
    channel_id: string;
    message_ts: string;
  };
}

export interface CalcomBooking {
  triggerEvent: string;
  createdAt: string;
  payload: {
    type: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    organizer: {
      id: number;
      name: string;
      email: string;
      timeZone: string;
    };
    attendees: Array<{
      email: string;
      name: string;
      timeZone: string;
    }>;
    uid: string;
    bookingId: number;
    metadata?: {
      leadEmail?: string;
      notionPageId?: string;
    };
  };
}

export interface MarketplacePurchase {
  acquisitionId: string;
  time: number; // milliseconds since epoch
  customerEmail: string;
  templateName: string;
  templateSlug: string;
  totalPrice: number;
  discountedPrice: number;
  listingPrice: number;
  couponCode: string;
  event: 'marketplace.purchase';
  locale: string;
  source: string;
  totalCustomerPayment: number;
}
