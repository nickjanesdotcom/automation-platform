/**
 * Core platform types used across all automations.
 */

import type { Hono } from 'hono';

export interface Automation {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  baseRoute: string;
  setup: (app: Hono) => void;
}

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
