/**
 * Company management: Find or create companies
 */

import { createPage, findPageByProperty } from '../../../shared/services/notion.js';
import { logger } from '../../../shared/utils/logger.js';
import { config } from '../config.js';

/**
 * Find or create a company by name
 */
export async function findOrCreateCompany(companyName: string): Promise<string> {
  if (!companyName || companyName.trim() === '') {
    logger.warn('No company name provided');
    return '';
  }

  logger.info('Finding or creating company', { companyName });

  // Search for existing company by name
  const existingCompany = await findPageByProperty(
    config.companiesDatabase,
    'Name',
    'title',
    companyName
  );

  if (existingCompany) {
    logger.info('Company found', { companyId: existingCompany.id, companyName });
    return existingCompany.id;
  }

  // Company doesn't exist, create it
  logger.info('Creating new company', { companyName });

  const properties = {
    Name: {
      title: [
        {
          text: {
            content: companyName,
          },
        },
      ],
    },
    Status: {
      select: {
        name: 'Active',
      },
    },
  };

  const newCompany = await createPage(config.companiesDatabase, properties);

  logger.info('Company created', { companyId: newCompany.id, companyName });

  return newCompany.id;
}
