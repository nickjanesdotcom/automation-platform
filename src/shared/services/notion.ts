/**
 * Generic Notion service used by all automations.
 * Provides reusable CRUD operations.
 */

import { Client } from '@notionhq/client';
import { config } from '../../config.js';
import { withRetry } from '../utils/retry.js';
import { logger } from '../utils/logger.js';

const notion = new Client({ auth: config.notion.apiKey });

/**
 * Create a page in any database
 */
export async function createPage(databaseId: string, properties: Record<string, any>) {
  logger.info('Creating Notion page', { databaseId });

  return withRetry(() =>
    notion.pages.create({
      parent: { database_id: databaseId },
      properties,
    })
  );
}

/**
 * Update any page
 */
export async function updatePage(pageId: string, properties: Record<string, any>) {
  logger.info('Updating Notion page', { pageId });

  return withRetry(() =>
    notion.pages.update({
      page_id: pageId,
      properties,
    })
  );
}

/**
 * Query a database with optional filter
 */
export async function queryDatabase(databaseId: string, filter?: any) {
  return withRetry(() =>
    notion.databases.query({
      database_id: databaseId,
      filter,
    })
  );
}

/**
 * Find page by property value
 */
export async function findPageByProperty(
  databaseId: string,
  propertyName: string,
  propertyType: 'email' | 'rich_text' | 'title',
  value: string
): Promise<any | null> {
  const filter: any = { property: propertyName };

  if (propertyType === 'email') {
    filter.email = { equals: value };
  } else if (propertyType === 'rich_text') {
    filter.rich_text = { equals: value };
  } else if (propertyType === 'title') {
    filter.title = { equals: value };
  }

  const results = await queryDatabase(databaseId, filter);
  return results.results[0] || null;
}

/**
 * Retrieve a page
 */
export async function retrievePage(pageId: string) {
  return withRetry(() => notion.pages.retrieve({ page_id: pageId }));
}

/**
 * Retrieve a database
 */
export async function retrieveDatabase(databaseId: string) {
  return withRetry(() => notion.databases.retrieve({ database_id: databaseId }));
}

/**
 * Get the title property name for a database
 */
export async function getTitlePropertyName(databaseId: string): Promise<string> {
  const db = await retrieveDatabase(databaseId);

  // Find the title property
  for (const [propName, prop] of Object.entries(db.properties as Record<string, any>)) {
    if (prop.type === 'title') {
      logger.info('Found title property', { databaseId, propertyName: propName });
      return propName;
    }
  }

  throw new Error(`No title property found in database ${databaseId}`);
}

/**
 * Create a comment on a page
 */
export async function createComment(pageId: string, text: string) {
  return withRetry(() =>
    notion.comments.create({
      parent: { page_id: pageId },
      rich_text: [
        {
          type: 'text',
          text: { content: text },
        },
      ],
    })
  );
}
