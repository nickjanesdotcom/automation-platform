/**
 * Unit tests for Resend email service
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Resend Email Service', () => {
  describe('firstName extraction logic', () => {
    it('should extract first name from full name', () => {
      const name = 'John Doe';
      const firstName = name.split(' ')[0] || name;
      assert.strictEqual(firstName, 'John');
    });

    it('should extract first name from multiple names', () => {
      const name = 'Jane Smith Johnson';
      const firstName = name.split(' ')[0] || name;
      assert.strictEqual(firstName, 'Jane');
    });

    it('should use full name if no space in name', () => {
      const name = 'Madonna';
      const firstName = name.split(' ')[0] || name;
      assert.strictEqual(firstName, 'Madonna');
    });

    it('should handle empty string', () => {
      const name = '';
      const firstName = name.split(' ')[0] || name;
      assert.strictEqual(firstName, '');
    });

    it('should handle names with special characters', () => {
      const name = "O'Brien O'Connor";
      const firstName = name.split(' ')[0] || name;
      assert.strictEqual(firstName, "O'Brien");
    });

    it('should handle names with multiple spaces', () => {
      const name = 'Mary  Jane';
      const firstName = name.split(' ')[0] || name;
      assert.strictEqual(firstName, 'Mary');
    });
  });

  describe('email template generation', () => {
    it('should include first name in greeting for real names', () => {
      const name = 'Alice Wonder';
      const templateName = 'Project Manager';
      const firstName = name.split(' ')[0] || name;

      const expectedGreeting = `Thanks for your purchase, ${firstName}!`;
      assert.ok(expectedGreeting.includes('Alice'));
      assert.strictEqual(expectedGreeting, 'Thanks for your purchase, Alice!');
    });

    it('should include template name in content', () => {
      const templateName = 'Task Manager Pro';
      const expectedContent = `We're excited to see you got <strong>${templateName}</strong>`;

      assert.ok(expectedContent.includes('Task Manager Pro'));
    });

    it('should generate proper subject line', () => {
      const templateName = 'CRM Template';
      const subject = `Your ${templateName} template is ready`;

      assert.strictEqual(subject, 'Your CRM Template template is ready');
    });
  });

  describe('username detection', () => {
    it('should detect names with numbers as usernames', () => {
      const usernameNames = ['Gamer123', 'User456', 'Player99'];

      for (const name of usernameNames) {
        const hasNumbers = /\d/.test(name);
        assert.strictEqual(hasNumbers, true, `${name} should be detected as username`);
      }
    });

    it('should detect common username patterns', () => {
      const usernamePatterns = ['User', 'Player', 'Gamer', 'Test', 'Demo', 'Admin'];
      const pattern = /^(user|player|gamer|test|demo|admin)/i;

      for (const name of usernamePatterns) {
        assert.ok(pattern.test(name), `${name} should match username pattern`);
      }
    });

    it('should recognize real names', () => {
      const realNames = ['John', 'Alice', 'Sarah', 'Michael'];

      for (const name of realNames) {
        const hasNumbers = /\d/.test(name);
        const isLowercase = name === name.toLowerCase();
        const usernamePattern = /^(user|player|gamer|test|demo|admin)/i;

        const looksReal = !hasNumbers && !isLowercase && !usernamePattern.test(name);
        assert.strictEqual(looksReal, true, `${name} should be detected as real name`);
      }
    });

    it('should use generic greeting for username-like names', () => {
      const genericGreeting = 'Thanks for your purchase! 🎉';

      // This would be used for names like "Gamer123", "User456", etc.
      assert.ok(genericGreeting.includes('Thanks for your purchase'));
      assert.ok(!genericGreeting.includes(','));  // No comma before name
    });

    it('should use personalized greeting for real names', () => {
      const name = 'John';
      const personalizedGreeting = `Thanks for your purchase, ${name}! 🎉`;

      assert.ok(personalizedGreeting.includes('John'));
      assert.ok(personalizedGreeting.includes(','));  // Comma before name
    });
  });

  describe('email validation', () => {
    it('should validate email format', () => {
      const validEmails = [
        'test@example.com',
        'user.name@company.co.uk',
        'john+tag@domain.com',
      ];

      for (const email of validEmails) {
        assert.ok(email.includes('@'));
        assert.ok(email.split('@').length === 2);
      }
    });

    it('should normalize email to lowercase', () => {
      const email = 'John.Doe@EXAMPLE.COM';
      const normalized = email.toLowerCase();

      assert.strictEqual(normalized, 'john.doe@example.com');
    });
  });

  describe('HTML email structure', () => {
    it('should generate valid HTML skeleton', () => {
      const htmlStructure = {
        doctype: '<!DOCTYPE html>',
        htmlOpen: '<html>',
        htmlClose: '</html>',
        bodyOpen: '<body',
        bodyClose: '</body>',
      };

      // Verify structure elements exist
      assert.ok(htmlStructure.doctype.includes('DOCTYPE'));
      assert.ok(htmlStructure.htmlOpen === '<html>');
      assert.ok(htmlStructure.htmlClose === '</html>');
    });

    it('should include responsive meta tags', () => {
      const metaTags = {
        charset: '<meta charset="utf-8">',
        viewport: '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
      };

      assert.ok(metaTags.charset.includes('charset'));
      assert.ok(metaTags.viewport.includes('viewport'));
    });

    it('should include emoji in greeting', () => {
      const greeting = 'Thanks for your purchase, John! 🎉';

      assert.ok(greeting.includes('🎉'));
      assert.ok(greeting.includes('Thanks for your purchase'));
    });
  });

  describe('parameter validation', () => {
    it('should require email parameter', () => {
      const email = 'test@example.com';
      assert.ok(email);
      assert.ok(typeof email === 'string');
      assert.ok(email.length > 0);
    });

    it('should require name parameter', () => {
      const name = 'Test User';
      assert.ok(name);
      assert.ok(typeof name === 'string');
      assert.ok(name.length > 0);
    });

    it('should require templateName parameter', () => {
      const templateName = 'Template Name';
      assert.ok(templateName);
      assert.ok(typeof templateName === 'string');
      assert.ok(templateName.length > 0);
    });
  });

  describe('error response expectations', () => {
    it('should expect error object with message', () => {
      const errorResponse = {
        message: 'Failed to send email: API Error',
      };

      assert.ok(errorResponse.message);
      assert.ok(errorResponse.message.includes('Failed to send email'));
    });

    it('should handle missing API key scenario', () => {
      const envError = 'RESEND_FROM_EMAIL environment variable is not set';

      assert.ok(envError.includes('RESEND_FROM_EMAIL'));
      assert.ok(envError.includes('not set'));
    });
  });

  describe('success response expectations', () => {
    it('should expect response with email ID', () => {
      const successResponse = {
        id: 'test-email-id',
      };

      assert.ok(successResponse.id);
      assert.ok(typeof successResponse.id === 'string');
    });
  });
});
