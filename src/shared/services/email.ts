/**
 * Generic email service using SMTP.
 */

import nodemailer from 'nodemailer';
import { config } from '../../config';
import { withRetry } from '../utils/retry';
import { logger } from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: config.email.smtp.host,
  port: config.email.smtp.port,
  secure: false,
  auth: {
    user: config.email.smtp.user,
    pass: config.email.smtp.pass,
  },
});

/**
 * Send an email
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
) {
  logger.info('Sending email', { to, subject });

  await withRetry(() =>
    transporter.sendMail({
      from: `"${config.email.fromName}" <${config.email.from}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    })
  );

  logger.info('Email sent successfully', { to });
}

/**
 * Send an email with attachments
 */
export async function sendEmailWithAttachments(
  to: string,
  subject: string,
  html: string,
  attachments: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
  }>,
  text?: string
) {
  logger.info('Sending email with attachments', { to, subject, attachmentCount: attachments.length });

  await withRetry(() =>
    transporter.sendMail({
      from: `"${config.email.fromName}" <${config.email.from}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
      attachments,
    })
  );

  logger.info('Email with attachments sent successfully', { to });
}

/**
 * Send a templated email
 */
export async function sendTemplatedEmail(
  to: string,
  subject: string,
  templateData: {
    greeting?: string;
    body: string;
    cta?: { text: string; url: string };
    footer?: string;
  }
) {
  const { greeting, body, cta, footer } = templateData;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .greeting {
            font-size: 18px;
            margin-bottom: 20px;
          }
          .body {
            margin-bottom: 30px;
          }
          .cta {
            margin: 30px 0;
          }
          .cta a {
            display: inline-block;
            padding: 12px 24px;
            background-color: #0066cc;
            color: white;
            text-decoration: none;
            border-radius: 5px;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 14px;
            color: #666;
          }
        </style>
      </head>
      <body>
        ${greeting ? `<div class="greeting">${greeting}</div>` : ''}
        <div class="body">${body}</div>
        ${cta ? `<div class="cta"><a href="${cta.url}">${cta.text}</a></div>` : ''}
        ${footer ? `<div class="footer">${footer}</div>` : ''}
      </body>
    </html>
  `;

  return sendEmail(to, subject, html);
}

/**
 * Verify SMTP connection
 */
export async function verifyConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    logger.info('SMTP connection verified');
    return true;
  } catch (error) {
    logger.error('SMTP connection failed', error);
    return false;
  }
}
