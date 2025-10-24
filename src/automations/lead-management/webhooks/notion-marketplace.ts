/**
 * Notion Marketplace webhook handler
 * Processes template purchase notifications and syncs to Attio + sends welcome email
 */

import type { Context } from 'hono';
import { logger } from '../../../shared/utils/logger.js';
import { assertCompany, assertPerson, addToListWithAttributes } from '../../../shared/services/attio.js';
import { sendWelcomeEmail } from '../../../shared/services/resend.js';
import { findOrCreateCompany } from '../workflows/manage-company.js';
import { findOrCreateContact } from '../workflows/manage-contact.js';
import { config } from '../../../config.js';
import type { MarketplacePurchase } from '../types.js';

/**
 * Extract company name from email domain (best effort)
 */
function extractCompanyFromEmail(email: string): string | undefined {
  const domain = email.split('@')[1]?.toLowerCase();

  if (!domain) return undefined;

  // Skip common consumer email domains
  const consumerDomains = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'icloud.com',
    'aol.com',
    'protonmail.com',
    'mail.com',
  ];

  if (consumerDomains.includes(domain)) {
    return undefined;
  }

  // Extract company name from domain (e.g., "acme.com" → "Acme")
  const companyName = domain
    .split('.')[0] // Get first part before TLD
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return companyName;
}

/**
 * Extract person name from email (fallback if no name provided)
 */
function extractNameFromEmail(email: string): string {
  const localPart = email.split('@')[0];

  // Convert common patterns: john.doe, john_doe, johndoe → John Doe
  const name = localPart
    .replace(/[._-]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return name || email;
}

/**
 * Handle Notion Marketplace purchase webhook
 */
export async function handleNotionMarketplaceWebhook(c: Context) {
  try {
    const body: MarketplacePurchase = await c.req.json();

    logger.info('Received Notion Marketplace purchase', {
      acquisitionId: body.acquisitionId,
      email: body.customerEmail,
      template: body.templateName,
    });

    // Validate required fields
    if (!body.customerEmail || !body.templateName) {
      return c.json({
        success: false,
        error: 'Missing required fields: customerEmail, templateName',
      }, 400);
    }

    // Extract customer info
    const email = body.customerEmail.toLowerCase();
    const name = extractNameFromEmail(email);
    const companyName = extractCompanyFromEmail(email);
    const purchaseDate = new Date(body.time);

    logger.info('Processing marketplace purchase', {
      email,
      name,
      companyName,
      template: body.templateName,
    });

    // Step 1: Create Company (if applicable) in Notion
    let notionCompanyId: string | undefined;
    if (companyName) {
      notionCompanyId = await findOrCreateCompany(companyName);
    }

    // Step 2: Create Contact in Notion
    const notionContactId = await findOrCreateContact(
      name,
      email,
      notionCompanyId
    );

    // Step 3: Sync to Attio
    let attioCompanyId: string | undefined;
    let attioPersonId: string | undefined;
    let attioError: string | undefined;

    try {
      logger.info('Starting Attio sync', {
        hasApiKey: !!config.attio.apiKey,
        hasListId: !!config.attio.marketplaceListId,
        listId: config.attio.marketplaceListId,
      });

      // Create/update company in Attio
      if (companyName) {
        const domain = email.split('@')[1];
        logger.info('Creating company in Attio', { companyName, domain });
        attioCompanyId = await assertCompany(companyName, domain);
        logger.info('Company created in Attio', { attioCompanyId });
      }

      // Create/update person in Attio
      logger.info('Creating person in Attio', { name, email, attioCompanyId });
      attioPersonId = await assertPerson(name, email, attioCompanyId);
      logger.info('Person created in Attio', { attioPersonId });

      // Add person to "Notion Marketplace" list with attributes
      logger.info('Adding to Notion Marketplace list', {
        listId: config.attio.marketplaceListId,
        personId: attioPersonId,
        templateName: body.templateName,
      });
      await addToListWithAttributes(
        config.attio.marketplaceListId,
        attioPersonId,
        {
          templatePurchased: body.templateName,
          datePurchased: purchaseDate,
        }
      );

      logger.info('Successfully synced to Attio', {
        attioPersonId,
        attioCompanyId,
        addedToList: true,
      });
    } catch (error: any) {
      // Log Attio sync error but don't fail the webhook
      attioError = error.message || String(error);
      logger.error('Failed to sync to Attio', {
        error: error.message,
        stack: error.stack,
        email,
      });
    }

    // Step 4: Send welcome email via Resend
    let emailSent = false;
    let emailError: string | undefined;
    try {
      logger.info('Sending welcome email', {
        hasApiKey: !!config.resend.apiKey,
        hasFromEmail: !!config.resend.fromEmail,
        to: email,
      });
      await sendWelcomeEmail(email, name, body.templateName);
      emailSent = true;
      logger.info('Welcome email sent successfully');
    } catch (error: any) {
      // Log email error but don't fail the webhook
      emailError = error.message || String(error);
      logger.error('Failed to send welcome email', {
        error: error.message,
        stack: error.stack,
        email,
      });
    }

    // Prepare response data
    const responseData = {
      success: true,
      message: 'Marketplace purchase processed successfully',
      data: {
        acquisitionId: body.acquisitionId,
        contactId: notionContactId,
        companyId: notionCompanyId,
        attioPersonId,
        attioCompanyId,
        emailSent,
      },
      debug: {
        attioError,
        emailError,
        hasAttioApiKey: !!config.attio.apiKey,
        hasResendApiKey: !!config.resend.apiKey,
        attioListId: config.attio.marketplaceListId,
      },
    };

    // Log complete result (including any errors that occurred)
    if (attioError || emailError) {
      logger.warn('Marketplace purchase completed with errors', {
        acquisitionId: body.acquisitionId,
        email,
        templateName: body.templateName,
        attioError,
        emailError,
        emailSent,
        attioPersonId,
        attioCompanyId,
        notionContactId,
        notionCompanyId,
      });
    } else {
      logger.info('Marketplace purchase completed successfully', {
        acquisitionId: body.acquisitionId,
        email,
        templateName: body.templateName,
        emailSent,
        attioPersonId,
        notionContactId,
      });
    }

    // Return success response with debug info
    return c.json(responseData);
  } catch (error: any) {
    logger.error('Failed to process marketplace purchase', {
      error: error.message,
      stack: error.stack,
    });

    return c.json({
      success: false,
      error: 'Failed to process marketplace purchase',
      details: error.message,
    }, 500);
  }
}
