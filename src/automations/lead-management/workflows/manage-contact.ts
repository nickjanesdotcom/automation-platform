/**
 * Contact/People management: Find or create contacts
 */

import { createPage, findPageByProperty, updatePage } from '../../../shared/services/notion.js';
import { logger } from '../../../shared/utils/logger.js';
import { config } from '../config.js';

/**
 * Find or create a contact by email
 */
export async function findOrCreateContact(
  name: string,
  email: string,
  companyId?: string
): Promise<string> {
  if (!email || email.trim() === '') {
    logger.warn('No email provided for contact');
    return '';
  }

  logger.info('Finding or creating contact', { name, email });

  // Search for existing contact by email
  const existingContact = await findPageByProperty(
    config.peopleDatabase,
    'Email',
    'email',
    email
  );

  if (existingContact) {
    logger.info('Contact found', { contactId: existingContact.id, email });

    // Update contact if we have new info (name or company)
    if (name || companyId) {
      await updateContactInfo(existingContact.id, name, companyId);
    }

    return existingContact.id;
  }

  // Contact doesn't exist, create it
  logger.info('Creating new contact', { name, email });

  const properties: any = {
    Name: {
      title: [
        {
          text: {
            content: name || email,
          },
        },
      ],
    },
    Email: {
      email: email,
    },
  };

  // Link to company if provided
  if (companyId) {
    properties.Company = {
      relation: [{ id: companyId }],
    };
  }

  const newContact = await createPage(config.peopleDatabase, properties);

  logger.info('Contact created', { contactId: newContact.id, email });

  return newContact.id;
}

/**
 * Update contact information
 */
async function updateContactInfo(
  contactId: string,
  name?: string,
  companyId?: string
): Promise<void> {
  const properties: any = {};

  if (name) {
    properties.Name = {
      title: [
        {
          text: {
            content: name,
          },
        },
      ],
    };
  }

  if (companyId) {
    properties.Company = {
      relation: [{ id: companyId }],
    };
  }

  if (Object.keys(properties).length > 0) {
    logger.info('Updating contact', { contactId, hasName: !!name, hasCompany: !!companyId });
    await updatePage(contactId, properties);
  }
}
