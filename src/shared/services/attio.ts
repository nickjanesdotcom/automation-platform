/**
 * Attio CRM service for syncing companies and contacts
 */

import { config } from '../../config.js';
import { logger } from '../utils/logger.js';
import { withRetry } from '../utils/retry.js';

const ATTIO_API_BASE = 'https://api.attio.com/v2';

interface AttioRecord {
  id: { record_id: string };
  values: Record<string, any>;
}

interface AttioResponse {
  data: AttioRecord;
}

/**
 * Make authenticated request to Attio API
 */
async function attioRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const url = `${ATTIO_API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${config.attio.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Attio API error (${response.status}): ${error}`);
  }

  return response.json();
}

/**
 * Assert (upsert) a company record in Attio
 */
export async function assertCompany(
  name: string,
  domain?: string
): Promise<string> {
  logger.info('Asserting company in Attio', { name, domain });

  const data = {
    data: {
      values: {
        name: [{ value: name }],
        ...(domain && {
          domains: [{ domain }],
        }),
      },
    },
  };

  // Use domain as matching attribute if available, otherwise use name
  const matchingAttribute = domain ? 'domains' : 'name';

  return withRetry(async () => {
    const response: AttioResponse = await attioRequest(
      `/objects/companies/records?matching_attribute=${matchingAttribute}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );

    const recordId = response.data.id.record_id;
    logger.info('Company asserted in Attio', { name, recordId });
    return recordId;
  });
}

/**
 * Assert (upsert) a person record in Attio
 */
export async function assertPerson(
  name: string,
  email: string,
  companyId?: string
): Promise<string> {
  logger.info('Asserting person in Attio', { name, email });

  // Parse first and last name
  const nameParts = name.split(' ');
  const firstName = nameParts[0] || name;
  const lastName = nameParts.slice(1).join(' ') || '';

  const data = {
    data: {
      values: {
        email_addresses: [{ email_address: email }],
        name: [
          {
            first_name: firstName,
            last_name: lastName,
            full_name: name,
          },
        ],
        ...(companyId && {
          primary_location: [{ target_record_id: companyId }],
        }),
      },
    },
  };

  return withRetry(async () => {
    const response: AttioResponse = await attioRequest(
      '/objects/people/records?matching_attribute=email_addresses',
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );

    const recordId = response.data.id.record_id;
    logger.info('Person asserted in Attio', { name, email, recordId });
    return recordId;
  });
}

/**
 * Add a record to a list with custom attributes
 */
export async function addToListWithAttributes(
  listId: string,
  recordId: string,
  attributes: {
    templatePurchased: string;
    datePurchased: Date;
  }
): Promise<void> {
  logger.info('Adding record to Attio list', { listId, recordId, attributes });

  const data = {
    data: {
      parent_record_id: recordId,
      attribute_values: {
        template_purchased: {
          option: attributes.templatePurchased,
        },
        date_purchased: {
          timestamp: attributes.datePurchased.toISOString(),
        },
      },
    },
  };

  return withRetry(async () => {
    await attioRequest(`/lists/${listId}/entries`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    logger.info('Record added to Attio list', { listId, recordId });
  });
}
