/**
 * Resend email service for sending transactional emails
 */

import { Resend } from 'resend';
import { config } from '../../config.js';
import { logger } from '../utils/logger.js';
import { withRetry } from '../utils/retry.js';

const resend = new Resend(config.resend.apiKey);

/**
 * Send welcome email to new Notion Marketplace customer
 */
export async function sendWelcomeEmail(
  email: string,
  name: string,
  templateName: string
): Promise<{ id: string }> {
  logger.info('Sending welcome email', { email, templateName });

  // Validate from email is configured
  if (!config.resend.fromEmail) {
    throw new Error('RESEND_FROM_EMAIL environment variable is not set');
  }

  const emailContent = generateWelcomeEmail(name, templateName);

  return withRetry(async () => {
    const { data, error } = await resend.emails.send({
      from: config.resend.fromEmail,
      to: [email],
      ...(config.resend.replyTo && { reply_to: config.resend.replyTo }),
      subject: `Your ${templateName} template is ready`,
      html: emailContent,
    });

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }

    logger.info('Welcome email sent', { email, emailId: data?.id });
    return { id: data!.id };
  });
}

/**
 * Check if a name looks like a real person's name vs a username
 */
function looksLikeRealName(name: string): boolean {
  // Contains numbers = likely a username (e.g., "Gamer123", "User456")
  if (/\d/.test(name)) {
    return false;
  }

  // Single word that's all lowercase = likely username
  // (Real names are capitalized after extraction)
  const firstWord = name.split(' ')[0];
  if (firstWord && firstWord === firstWord.toLowerCase()) {
    return false;
  }

  // Common username patterns
  const usernamePatterns = /^(user|player|gamer|test|demo|admin)/i;
  if (usernamePatterns.test(name)) {
    return false;
  }

  return true;
}

/**
 * Generate HTML content for welcome email
 */
function generateWelcomeEmail(name: string, templateName: string): string {
  const firstName = name.split(' ')[0] || name;
  const usePersonalizedGreeting = looksLikeRealName(firstName);

  // Choose greeting based on whether name looks real
  const greeting = usePersonalizedGreeting
    ? `Thanks for your purchase, ${firstName}! 🎉`
    : `Thanks for your purchase! 🎉`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${templateName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <tr>
      <td style="padding: 40px 40px 20px;">
        <h1 style="margin: 0 0 20px; font-size: 28px; font-weight: 600; color: #000000;">
          ${greeting}
        </h1>
        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
          We're excited to see you got <strong>${templateName}</strong> from the Notion Marketplace.
        </p>
        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
          Your template should already be available in your Notion workspace and ready to use.
        </p>
        <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #333333;">
          If you have any questions or need help getting started, feel free to reach out!
        </p>
        <p style="margin: 0; font-size: 14px; color: #666666;">
          Best regards,<br>
          Nick Janes
          Founder & Developer | iGeekuPlay
          W: <a href="https://igeekuplay.com">igeekuplay.com</a>
          </p><br>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 40px; background-color: #f9f9f9; border-top: 1px solid #eeeeee;">
        <p style="margin: 0; font-size: 12px; color: #999999; line-height: 1.5;">
          This email was sent because you purchased a template from the Notion Marketplace.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
