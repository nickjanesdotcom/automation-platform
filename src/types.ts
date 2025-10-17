/**
 * Global type definitions used across the platform.
 */

export interface WebhookResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

export interface LogContext {
  automationId?: string;
  [key: string]: any;
}

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';
