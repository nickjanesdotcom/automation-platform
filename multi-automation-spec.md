# Multi-Automation Platform - Complete Specification

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Setup Instructions](#setup-instructions)
6. [Configuration](#configuration)
7. [Core Platform](#core-platform)
8. [Shared Services](#shared-services)
9. [Lead Management Automation](#lead-management-automation)
10. [Adding New Automations](#adding-new-automations)
11. [Deployment](#deployment)
12. [Monitoring & Debugging](#monitoring--debugging)
13. [Usage Examples](#usage-examples)
14. [Troubleshooting](#troubleshooting)

---

## Overview

### Purpose
Multi-automation platform that manages various business workflows. Built as an extensible system where each automation is self-contained and can be easily added, removed, or modified without affecting others.

### Initial Automation: Lead Management
Processes booking requests from email → creates Notion records → sends Slack notifications with interactive buttons → handles lead acceptance → sends Cal.com booking links → tracks booking confirmations.

### Key Features
- ✅ **Multi-automation architecture** - Easy to add new workflows
- ✅ **Shared services** - Reusable integrations (Notion, Slack, Email)
- ✅ **Isolated automations** - Each automation is independent
- ✅ **Dynamic routing** - Automations register themselves
- ✅ **Comprehensive logging** (Axiom) and error tracking (Sentry)
- ✅ **Automatic retries** with exponential backoff
- ✅ **Claude Code optimized** - Simple, clear structure

---

## Architecture

### Design Principles
1. **Modular**: Each automation is self-contained
2. **Reusable**: Shared services used by all automations
3. **Extensible**: Add new automations without touching existing ones
4. **Observable**: Centralized logging and monitoring
5. **Claude Code Friendly**: Well-commented, easy to modify

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    External Services                     │
│  Gmail • Slack • Notion • Cal.com • Stripe • etc.       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    Main Application                      │
│              Dynamic Route Registration                  │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Automation 1 │ │ Automation 2 │ │ Automation 3 │
│     Lead     │ │   Invoice    │ │  Onboarding  │
│ Management   │ │  Automation  │ │              │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       └────────────────┼────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│                   Shared Services Layer                  │
│  Notion • Slack • Email • Drive • Stripe • etc.         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│               Observability & Error Handling             │
│  Axiom (Logs) • Sentry (Errors) • Slack (Alerts)       │
└─────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Core Framework
- **Hono** v4.x - Fast, lightweight web framework
- **TypeScript** 5.x - Type safety and better DX
- **Node.js** 18+ / Bun - Runtime

### Deployment Platform
- **Vercel** (Recommended) - Easy deployment, generous free tier
- **Cloudflare Workers** - Alternative for high-scale (100k+ requests/day)

### External Services
- **Notion API** - Database and CRM
- **Slack API** - Notifications and interactivity
- **Gmail Push API** - Incoming email webhooks
- **Cal.com API** - Booking management
- **SMTP** (Gmail/SendGrid) - Outgoing emails
- **Stripe API** - Payments (for invoice automation)
- **Google Drive API** - File management

### Observability
- **Axiom** - Structured logging (Free: 500GB/mo)
- **Sentry** - Error tracking (Free: 5k errors/mo)
- **p-retry** - Automatic retry logic

---

## Project Structure

```
automation-platform/
├── src/
│   ├── app.ts                          # Main app with dynamic routing
│   ├── config.ts                       # Global configuration
│   ├── types.ts                        # Global type definitions
│   │
│   ├── core/                           # Platform infrastructure
│   │   ├── automation-registry.ts      # Register all automations
│   │   ├── router.ts                   # Dynamic routing logic
│   │   └── types.ts                    # Core platform types
│   │
│   ├── shared/                         # Shared across all automations
│   │   ├── services/                   # Reusable service clients
│   │   │   ├── notion.ts               # Generic Notion client
│   │   │   ├── slack.ts                # Generic Slack client
│   │   │   ├── email.ts                # Generic email service
│   │   │   ├── drive.ts                # Google Drive client
│   │   │   └── stripe.ts               # Stripe client
│   │   │
│   │   ├── utils/                      # Reusable utilities
│   │   │   ├── logger.ts               # Axiom logging
│   │   │   ├── retry.ts                # Retry logic
│   │   │   ├── monitor.ts              # Error monitoring
│   │   │   ├── parser.ts               # Generic parsers
│   │   │   └── format.ts               # Formatting helpers
│   │   │
│   │   └── middleware/                 # Shared middleware
│   │       ├── auth.ts                 # Webhook authentication
│   │       ├── rate-limit.ts           # Rate limiting
│   │       └── validate.ts             # Request validation
│   │
│   └── automations/                    # Each automation is self-contained
│       │
│       ├── lead-management/            # Lead automation
│       │   ├── index.ts                # Automation entry point
│       │   ├── config.ts               # Automation-specific config
│       │   ├── types.ts                # Automation-specific types
│       │   ├── webhooks/               # Webhook handlers
│       │   │   ├── gmail.ts
│       │   │   ├── calcom.ts
│       │   │   └── slack.ts
│       │   └── workflows/              # Business logic
│       │       ├── process-lead.ts
│       │       ├── accept-lead.ts
│       │       └── handle-booking.ts
│       │
│       ├── invoice-automation/         # Invoice automation (example)
│       │   ├── index.ts
│       │   ├── config.ts
│       │   ├── webhooks/
│       │   │   ├── stripe.ts
│       │   │   └── quickbooks.ts
│       │   └── workflows/
│       │       ├── create-invoice.ts
│       │       └── send-reminder.ts
│       │
│       └── README.md                   # How to add new automations
│
├── test/                               # Tests
│   ├── fixtures/                       # Test payloads
│   └── integration.test.ts
│
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── vercel.json
└── README.md
```

---

## Setup Instructions

### Prerequisites

1. **Node.js 18+** or **Bun**
2. **Accounts**: Notion, Slack, Gmail, Cal.com, Axiom, Sentry, Vercel

### Initial Setup

```bash
# 1. Create project
mkdir automation-platform
cd automation-platform
npm init -y

# 2. Install dependencies
npm install hono @notionhq/client @slack/web-api nodemailer googleapis
npm install axiom-js @sentry/node p-retry cheerio

# 3. Install dev dependencies
npm install -D typescript @types/node @types/nodemailer tsx
npm install -D @cloudflare/workers-types @types/cheerio

# 4. Create structure
mkdir -p src/{core,shared/{services,utils,middleware},automations/lead-management/{webhooks,workflows}}
mkdir -p test/fixtures

# 5. Initialize TypeScript
npx tsc --init
```

### TypeScript Configuration

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Package.json Scripts

```json
{
  "name": "automation-platform",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "deploy": "vercel --prod"
  }
}
```

---

## Configuration

### Environment Variables

Create `.env.example`:

```bash
# ============================================
# GLOBAL PLATFORM
# ============================================
NODE_ENV=development
PORT=8787

# Observability
AXIOM_TOKEN=xaat-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AXIOM_DATASET=automation-platform
SENTRY_DSN=https://xxx@sentry.io/xxx

# ============================================
# SHARED SERVICES
# ============================================
# Notion (shared API key, each automation has own DB)
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Slack (shared bot token and signing secret)
SLACK_BOT_TOKEN=xoxb-xxxxxxxxxxxx-xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx
SLACK_SIGNING_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Email (shared SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=your-name@yourdomain.com
FROM_NAME=Your Name

# ============================================
# LEAD MANAGEMENT AUTOMATION
# ============================================
LEAD_ENABLED=true
LEAD_NOTION_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LEAD_SLACK_CHANNEL_ID=C01XXXXXXXXXX
LEAD_CALCOM_LINK=https://cal.com/your-username/discovery-call
LEAD_CALCOM_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LEAD_MINIMUM_BUDGET=1000
LEAD_AUTO_ACCEPT=false

# Gmail (for lead management)
GOOGLE_CLIENT_ID=xxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxx
GOOGLE_REFRESH_TOKEN=1//xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ============================================
# INVOICE AUTOMATION (Example)
# ============================================
INVOICE_ENABLED=true
INVOICE_NOTION_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
INVOICE_SLACK_CHANNEL_ID=C02XXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
QUICKBOOKS_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ============================================
# CLIENT ONBOARDING AUTOMATION (Example)
# ============================================
ONBOARDING_ENABLED=true
ONBOARDING_NOTION_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ONBOARDING_DRIVE_FOLDER_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Global Config

Create `src/config.ts`:

```typescript
/**
 * Global platform configuration.
 * Shared settings across all automations.
 */

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8787'),
  
  // Shared service credentials
  notion: {
    apiKey: process.env.NOTION_API_KEY!,
  },
  
  slack: {
    botToken: process.env.SLACK_BOT_TOKEN!,
    signingSecret: process.env.SLACK_SIGNING_SECRET || '',
  },
  
  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
    from: process.env.FROM_EMAIL || '',
    fromName: process.env.FROM_NAME || 'Automation Platform',
  },
  
  observability: {
    axiom: {
      token: process.env.AXIOM_TOKEN || '',
      dataset: process.env.AXIOM_DATASET || 'automation-platform',
    },
    sentry: {
      dsn: process.env.SENTRY_DSN || '',
    },
  },
} as const;

// Validate required variables
if (!config.notion.apiKey) {
  throw new Error('NOTION_API_KEY is required');
}

if (!config.slack.botToken) {
  throw new Error('SLACK_BOT_TOKEN is required');
}
```

---

## Core Platform

### Automation Registry

Create `src/core/automation-registry.ts`:

```typescript
/**
 * Central registry for all automations.
 * Each automation registers itself here.
 */

import { Hono } from 'hono';

export interface Automation {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  baseRoute: string;
  setup: (app: Hono) => void;
}

// Import automations
import { leadManagementAutomation } from '../automations/lead-management';
// Import other automations as you add them
// import { invoiceAutomation } from '../automations/invoice-automation';

/**
 * Register all automations here.
 * To add a new automation:
 * 1. Create folder in src/automations/
 * 2. Import it here
 * 3. Add to this array
 */
export const automations: Automation[] = [
  leadManagementAutomation,
  // invoiceAutomation,
];

/**
 * Get only enabled automations
 */
export function getEnabledAutomations(): Automation[] {
  return automations.filter(a => a.enabled);
}

/**
 * Get automation by ID
 */
export function getAutomation(id: string): Automation | undefined {
  return automations.find(a => a.id === id);
}
```

### Core Types

Create `src/core/types.ts`:

```typescript
/**
 * Core platform types used across all automations.
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
```

### Main Application

Create `src/app.ts`:

```typescript
/**
 * Main application with dynamic automation routing.
 * Automatically registers all enabled automations.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger as honoLogger } from 'hono/logger';
import { config } from './config';
import { getEnabledAutomations } from './core/automation-registry';
import { logger } from './shared/utils/logger';
import * as Sentry from '@sentry/node';

// Initialize monitoring
if (config.observability.sentry.dsn) {
  Sentry.init({
    dsn: config.observability.sentry.dsn,
    environment: config.env,
    tracesSampleRate: config.env === 'production' ? 0.1 : 1.0,
  });
}

const app = new Hono();

// Global middleware
app.use('*', cors());
app.use('*', honoLogger());

// Platform health check
app.get('/', (c) => {
  const enabledAutomations = getEnabledAutomations();
  
  return c.json({
    status: 'ok',
    service: 'automation-platform',
    version: '1.0.0',
    environment: config.env,
    automations: enabledAutomations.map(a => ({
      id: a.id,
      name: a.name,
      route: a.baseRoute,
    })),
    timestamp: new Date().toISOString(),
  });
});

// List all automations
app.get('/automations', (c) => {
  const enabledAutomations = getEnabledAutomations();
  
  return c.json({
    automations: enabledAutomations.map(a => ({
      id: a.id,
      name: a.name,
      description: a.description,
      baseRoute: a.baseRoute,
    })),
  });
});

// Dynamically register all enabled automations
logger.info('Registering automations...');
const enabledAutomations = getEnabledAutomations();

for (const automation of enabledAutomations) {
  logger.info(`Registering: ${automation.name}`, {
    automationId: automation.id,
    route: automation.baseRoute,
  });
  
  automation.setup(app);
}

logger.info(`${enabledAutomations.length} automations registered`);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Global error handler
app.onError((err, c) => {
  logger.error('Unhandled error', err);
  Sentry.captureException(err);
  
  return c.json({
    error: 'Internal server error',
    message: config.env === 'development' ? err.message : undefined,
  }, 500);
});

// Start server (development)
if (config.env === 'development') {
  console.log(`🚀 Server starting on http://localhost:${config.port}`);
  console.log(`📋 Enabled automations: ${enabledAutomations.map(a => a.name).join(', ')}`);
}

export default app;
```

---

## Shared Services

These services are used by all automations. Each provides a clean, reusable interface.

### Notion Service

Create `src/shared/services/notion.ts`:

```typescript
/**
 * Generic Notion service used by all automations.
 * Provides reusable CRUD operations.
 */

import { Client } from '@notionhq/client';
import { config } from '../../config';
import { withRetry } from '../utils/retry';
import { logger } from '../utils/logger';

const notion = new Client({ auth: config.notion.apiKey });

/**
 * Create a page in any database
 */
export async function createPage(
  databaseId: string,
  properties: Record<string, any>
) {
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
export async function updatePage(
  pageId: string,
  properties: Record<string, any>
) {
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
export async function queryDatabase(
  databaseId: string,
  filter?: any
) {
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
  return withRetry(() =>
    notion.pages.retrieve({ page_id: pageId })
  );
}
```

### Slack Service

Create `src/shared/services/slack.ts`:

```typescript
/**
 * Generic Slack service used by all automations.
 */

import { WebClient } from '@slack/web-api';
import { config } from '../../config';
import { withRetry } from '../utils/retry';
import { logger } from '../utils/logger';

const slack = new WebClient(config.slack.botToken);

/**
 * Send a message to a channel
 */
export async function sendMessage(
  channel: string,
  text: string,
  blocks?: any[]
) {
  logger.info('Sending Slack message', { channel });
  
  const result = await withRetry(() =>
    slack.chat.postMessage({
      channel,
      text,
      blocks,
    })
  );
  
  return {
    ts: result.ts!,
    channel: result.channel!,
  };
}

/**
 * Send a threaded reply
 */
export async function sendThreadReply(
  channel: string,
  threadTs: string,
  text: string,
  blocks?: any[]
) {
  logger.info('Sending Slack thread reply', { channel, threadTs });
  
  return withRetry(() =>
    slack.chat.postMessage({
      channel,
      thread_ts: threadTs,
      text,
      blocks,
    })
  );
}

/**
 * Send alert to alerts channel
 */
export async function sendAlert(
  title: string,
  message: string,
  severity: 'info' | 'warning' | 'error' = 'error'
) {
  const emoji = severity === 'error' ? '🚨' : severity === 'warning' ? '⚠️' : 'ℹ️';
  
  // Use a dedicated alerts channel if configured
  const alertsChannel = process.env.SLACK_ALERTS_CHANNEL_ID || config.slack.botToken;
  
  return sendMessage(
    alertsChannel,
    `${emoji} ${title}`,
    [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${emoji} ${title}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message,
        },
      },
    ]
  );
}
```

### Email Service

Create `src/shared/services/email.ts`:

```typescript
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
```

### Shared Utilities

Create `src/shared/utils/logger.ts`, `retry.ts`, `monitor.ts`, `parser.ts`, `format.ts` - these are the same as in the original spec, just moved to the shared folder.

---

## Lead Management Automation

### Automation Entry Point

Create `src/automations/lead-management/index.ts`:

```typescript
/**
 * Lead Management Automation
 * 
 * Handles: Email leads → Notion → Slack → Cal.com bookings
 */

import type { Hono } from 'hono';
import type { Automation } from '../../core/automation-registry';
import { config } from './config';
import { handleGmailWebhook } from './webhooks/gmail';
import { handleCalcomWebhook } from './webhooks/calcom';
import { handleSlackInteraction } from './webhooks/slack';

/**
 * Setup function - registers all routes for this automation
 */
function setup(app: Hono) {
  const base = '/automations/lead-management';
  
  // Webhook routes
  app.post(`${base}/webhooks/gmail`, handleGmailWebhook);
  app.post(`${base}/webhooks/calcom`, handleCalcomWebhook);
  app.post(`${base}/webhooks/slack`, handleSlackInteraction);
  
  // Health check
  app.get(`${base}/health`, (c) => {
    return c.json({
      automation: 'lead-management',
      status: 'ok',
      config: {
        notionDatabase: config.notionDatabase,
        slackChannel: config.slackChannel,
        minimumBudget: config.features.minimumBudget,
      },
    });
  });
}

/**
 * Export automation definition
 */
export const leadManagementAutomation: Automation = {
  id: 'lead-management',
  name: 'Lead Management',
  description: 'Automated lead processing from email to booking',
  enabled: process.env.LEAD_ENABLED !== 'false',
  baseRoute: '/automations/lead-management',
  setup,
};
```

### Automation Config

Create `src/automations/lead-management/config.ts`:

```typescript
/**
 * Configuration specific to Lead Management automation.
 */

export const config = {
  notionDatabase: process.env.LEAD_NOTION_DATABASE_ID!,
  slackChannel: process.env.LEAD_SLACK_CHANNEL_ID!,
  calcomLink: process.env.LEAD_CALCOM_LINK!,
  calcomWebhookSecret: process.env.LEAD_CALCOM_WEBHOOK_SECRET || '',
  
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN || '',
  },
  
  features: {
    minimumBudget: parseInt(process.env.LEAD_MINIMUM_BUDGET || '0'),
    autoAccept: process.env.LEAD_AUTO_ACCEPT === 'true',
  },
};

// Validate required config
if (!config.notionDatabase) {
  throw new Error('LEAD_NOTION_DATABASE_ID is required');
}

if (!config.slackChannel) {
  throw new Error('LEAD_SLACK_CHANNEL_ID is required');
}
```

### Webhook Handlers

The webhook handlers (`gmail.ts`, `calcom.ts`, `slack.ts`) are the same as in the original spec, but they:
1. Use shared services from `src/shared/services/`
2. Use automation-specific config from `./config`
3. Include automation context in logs

Example `src/automations/lead-management/webhooks/gmail.ts`:

```typescript
import type { Context } from 'hono';
import { parseBookingEmail } from '../workflows/process-lead';
import { createPage } from '../../../shared/services/notion';
import { sendMessage } from '../../../shared/services/slack';
import { logger } from '../../../shared/utils/logger';
import { config } from '../config';

export async function handleGmailWebhook(c: Context) {
  logger.info('Gmail webhook received', { automationId: 'lead-management' });
  
  // Implementation here using shared services...
  
  return c.json({ success: true });
}
```

---

## Adding New Automations

### Quick Start Guide

Create `src/automations/README.md`:

```markdown
# Adding a New Automation

## 1. Create Automation Folder

```bash
mkdir -p src/automations/my-automation/{webhooks,workflows}
```

## 2. Create Entry Point

`src/automations/my-automation/index.ts`:

```typescript
import type { Hono } from 'hono';
import type { Automation } from '../../core/automation-registry';

function setup(app: Hono) {
  const base = '/automations/my-automation';
  
  app.post(`${base}/webhooks/trigger`, async (c) => {
    // Your webhook logic
    return c.json({ success: true });
  });
  
  app.get(`${base}/health`, (c) => {
    return c.json({ automation: 'my-automation', status: 'ok' });
  });
}

export const myAutomation: Automation = {
  id: 'my-automation',
  name: 'My Automation',
  description: 'What it does',
  enabled: process.env.MY_AUTOMATION_ENABLED !== 'false',
  baseRoute: '/automations/my-automation',
  setup,
};
```

## 3. Create Config

`src/automations/my-automation/config.ts`:

```typescript
export const config = {
  notionDatabase: process.env.MY_AUTOMATION_NOTION_DB!,
  // Add automation-specific config
};
```

## 4. Register in Registry

`src/core/automation-registry.ts`:

```typescript
import { myAutomation } from '../automations/my-automation';

export const automations: Automation[] = [
  leadManagementAutomation,
  myAutomation, // <-- Add here
];
```

## 5. Add Environment Variables

`.env`:
```bash
MY_AUTOMATION_ENABLED=true
MY_AUTOMATION_NOTION_DB=xxx
```

## 6. Deploy

```bash
npm run deploy
```

Your automation is now live at:
`https://your-app.vercel.app/automations/my-automation`
```

---

## Deployment

### Vercel Deployment

Create `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": null,
  "outputDirectory": "dist"
}
```

Deploy:

```bash
# Install Vercel CLI
npm install -g vercel

# Login and deploy
vercel login
vercel --prod

# Add environment variables in dashboard
```

---

## Monitoring & Debugging

### Axiom Queries

```
# Logs by automation
['automationId'] == 'lead-management' | where _time > ago(24h)

# All errors
['level'] == 'error' | where _time > ago(24h)

# Average duration by automation
['duration'] | summarize avg(duration) by automationId
```

### Testing

```bash
# Run dev server
npm run dev

# Test lead management
curl http://localhost:8787/automations/lead-management/health

# Test webhook
curl -X POST http://localhost:8787/automations/lead-management/webhooks/gmail \
  -H "Content-Type: application/json" \
  -d @test/fixtures/gmail-payload.json
```

---

## Example Routes

With this structure, your platform exposes:

```
GET  /                                                   # Platform health
GET  /automations                                        # List all automations

# Lead Management
POST /automations/lead-management/webhooks/gmail
POST /automations/lead-management/webhooks/calcom
POST /automations/lead-management/webhooks/slack
GET  /automations/lead-management/health

# Invoice Automation (when added)
POST /automations/invoicing/webhooks/stripe
GET  /automations/invoicing/health

# Client Onboarding (when added)
POST /automations/onboarding/webhooks/typeform
GET  /automations/onboarding/health
```

---

## Next Steps

1. **Setup Platform** (30 mins)
   - Create project structure
   - Install dependencies
   - Configure environment

2. **Implement Lead Management** (2 hours)
   - Create webhook handlers
   - Implement workflows
   - Test locally

3. **Deploy** (15 mins)
   - Deploy to Vercel
   - Configure webhooks
   - Test in production

4. **Add More Automations** (as needed)
   - Follow the guide in `src/automations/README.md`
   - Reuse shared services
   - Deploy updates

---

## Conclusion

This multi-automation platform provides:

✅ **Modular Architecture** - Easy to add/remove automations
✅ **Shared Services** - Reusable across all automations
✅ **Claude Code Friendly** - Clear structure, easy to modify
✅ **Production Ready** - Logging, monitoring, error handling
✅ **Scalable** - Start with one, grow to many

**Start with lead management, then add more automations as needed!**