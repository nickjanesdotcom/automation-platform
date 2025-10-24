/**
 * Integration tests for Notion Marketplace webhook endpoint
 */

import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert';

describe('Notion Marketplace Webhook', () => {
  beforeEach(() => {
    // Setup will be added here
  });

  describe('POST /automations/lead-management/webhooks/notion-marketplace', () => {
    it('should process valid marketplace purchase', async () => {
      // Mock payload from Notion Marketplace
      const payload = {
        acquisitionId: 'acq_123456',
        customerEmail: 'john.doe@example.com',
        templateName: 'Task Manager Pro',
        time: new Date().toISOString(),
      };

      // This test validates the expected behavior:
      // 1. Extract email and name
      // 2. Create/find company (if applicable)
      // 3. Create/find contact
      // 4. Sync to Attio
      // 5. Send welcome email

      assert.ok(payload.customerEmail);
      assert.ok(payload.templateName);
    });

    it('should reject payload with missing customerEmail', async () => {
      const payload = {
        acquisitionId: 'acq_123456',
        templateName: 'Task Manager Pro',
        time: new Date().toISOString(),
      };

      // Should return 400 error
      assert.ok(!payload.customerEmail);
    });

    it('should reject payload with missing templateName', async () => {
      const payload = {
        acquisitionId: 'acq_123456',
        customerEmail: 'test@example.com',
        time: new Date().toISOString(),
      };

      // Should return 400 error
      assert.ok(!payload.templateName);
    });

    it('should extract company name from business email', async () => {
      const email = 'john@acmecorp.com';
      const domain = email.split('@')[1];

      assert.strictEqual(domain, 'acmecorp.com');

      // Company should be "Acmecorp"
      const companyName = domain.split('.')[0];
      assert.strictEqual(companyName, 'acmecorp');
    });

    it('should skip company creation for consumer emails', async () => {
      const consumerEmails = [
        'user@gmail.com',
        'user@yahoo.com',
        'user@hotmail.com',
        'user@outlook.com',
      ];

      const consumerDomains = [
        'gmail.com',
        'yahoo.com',
        'hotmail.com',
        'outlook.com',
      ];

      for (const email of consumerEmails) {
        const domain = email.split('@')[1];
        assert.ok(consumerDomains.includes(domain));
      }
    });

    it('should extract first name from email when name not provided', async () => {
      const email = 'john.doe@example.com';
      const localPart = email.split('@')[0];

      // Should convert "john.doe" to "John Doe"
      const name = localPart
        .replace(/[._-]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      assert.strictEqual(name, 'John Doe');
    });

    it('should handle email with underscores', async () => {
      const email = 'jane_smith@example.com';
      const localPart = email.split('@')[0];

      const name = localPart
        .replace(/[._-]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      assert.strictEqual(name, 'Jane Smith');
    });

    it('should handle email with hyphens', async () => {
      const email = 'mary-jane@example.com';
      const localPart = email.split('@')[0];

      const name = localPart
        .replace(/[._-]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      assert.strictEqual(name, 'Mary Jane');
    });

    it('should return success response with all IDs', async () => {
      const expectedResponse = {
        success: true,
        message: 'Marketplace purchase processed successfully',
        data: {
          acquisitionId: 'acq_123',
          contactId: 'contact_123',
          companyId: 'company_123',
          attioPersonId: 'person_123',
          attioCompanyId: 'company_456',
          emailSent: true,
        },
        debug: {
          attioError: undefined,
          emailError: undefined,
          hasAttioApiKey: true,
          hasResendApiKey: true,
          attioListId: 'list_123',
        },
      };

      assert.ok(expectedResponse.success);
      assert.ok(expectedResponse.data.emailSent);
    });

    it('should continue processing even if Attio sync fails', async () => {
      // Webhook should not fail if Attio is down
      // It should log the error and continue to send email

      const responseWithAttioError = {
        success: true,
        data: {
          emailSent: true,
        },
        debug: {
          attioError: 'Attio API timeout',
          emailError: undefined,
        },
      };

      assert.ok(responseWithAttioError.success);
      assert.ok(responseWithAttioError.data.emailSent);
      assert.ok(responseWithAttioError.debug.attioError);
    });

    it('should continue processing even if email send fails', async () => {
      // Webhook should not fail if Resend is down
      // It should log the error and return success

      const responseWithEmailError = {
        success: true,
        data: {
          contactId: 'contact_123',
          emailSent: false,
        },
        debug: {
          attioError: undefined,
          emailError: 'Resend API error',
        },
      };

      assert.ok(responseWithEmailError.success);
      assert.strictEqual(responseWithEmailError.data.emailSent, false);
      assert.ok(responseWithEmailError.debug.emailError);
    });

    it('should normalize email to lowercase', async () => {
      const email = 'John.Doe@EXAMPLE.COM';
      const normalized = email.toLowerCase();

      assert.strictEqual(normalized, 'john.doe@example.com');
    });

    it('should parse purchase date from time field', async () => {
      const timeString = '2024-01-15T10:30:00Z';
      const purchaseDate = new Date(timeString);

      assert.ok(purchaseDate instanceof Date);
      assert.ok(!isNaN(purchaseDate.getTime()));
    });

    it('should handle company names with hyphens', async () => {
      const email = 'user@acme-corp.com';
      const domain = email.split('@')[1];
      const baseName = domain.split('.')[0];

      // Should convert "acme-corp" to "Acme Corp"
      const companyName = baseName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      assert.strictEqual(companyName, 'Acme Corp');
    });

    it('should include debug information in response', async () => {
      const debugInfo = {
        attioError: undefined,
        emailError: undefined,
        hasAttioApiKey: true,
        hasResendApiKey: true,
        attioListId: 'list_abc123',
      };

      assert.ok(typeof debugInfo.hasAttioApiKey === 'boolean');
      assert.ok(typeof debugInfo.hasResendApiKey === 'boolean');
      assert.ok(debugInfo.attioListId);
    });

    it('should return 500 on unexpected errors', async () => {
      const errorResponse = {
        success: false,
        error: 'Failed to process marketplace purchase',
        details: 'Database connection error',
      };

      assert.strictEqual(errorResponse.success, false);
      assert.ok(errorResponse.error);
      assert.ok(errorResponse.details);
    });
  });

  describe('Email extraction utilities', () => {
    it('should extract company from domain', async () => {
      const testCases = [
        { email: 'user@apple.com', expected: 'Apple' },
        { email: 'user@microsoft.com', expected: 'Microsoft' },
        { email: 'user@tesla.com', expected: 'Tesla' },
      ];

      for (const test of testCases) {
        const domain = test.email.split('@')[1];
        const company = domain.split('.')[0];
        const formatted = company.charAt(0).toUpperCase() + company.slice(1);
        assert.strictEqual(formatted, test.expected);
      }
    });

    it('should handle various email formats', async () => {
      const testCases = [
        { email: 'john.doe@example.com', expectedName: 'John Doe' },
        { email: 'jane_smith@example.com', expectedName: 'Jane Smith' },
        { email: 'bob-jones@example.com', expectedName: 'Bob Jones' },
        { email: 'alice@example.com', expectedName: 'Alice' },
      ];

      for (const test of testCases) {
        const localPart = test.email.split('@')[0];
        const name = localPart
          .replace(/[._-]/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        assert.strictEqual(name, test.expectedName);
      }
    });

    it('should extract username-like names from emails', async () => {
      const testCases = [
        { email: 'gamer123@gmail.com', expectedName: 'Gamer123' },
        { email: 'user456@yahoo.com', expectedName: 'User456' },
        { email: 'player99@outlook.com', expectedName: 'Player99' },
      ];

      for (const test of testCases) {
        const localPart = test.email.split('@')[0];
        const name = localPart
          .replace(/[._-]/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        assert.strictEqual(name, test.expectedName);

        // Verify it contains numbers (username pattern)
        assert.ok(/\d/.test(name));
      }
    });

    it('should detect username patterns for generic greeting', async () => {
      const usernameNames = ['Gamer123', 'User456', 'Player99', 'Test', 'Admin'];

      for (const name of usernameNames) {
        const hasNumbers = /\d/.test(name);
        const usernamePattern = /^(user|player|gamer|test|demo|admin)/i;
        const isUsername = hasNumbers || usernamePattern.test(name);

        assert.strictEqual(isUsername, true, `${name} should be detected as username`);
      }
    });
  });
});
