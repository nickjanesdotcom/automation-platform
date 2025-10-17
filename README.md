# Multi-Automation Platform

A modular, extensible automation platform built with TypeScript and Hono. Easily manage multiple business workflows with shared services and isolated automations.

## Features

- **Multi-automation architecture** - Easy to add new workflows
- **Shared services** - Reusable integrations (Notion, Slack, Email)
- **Isolated automations** - Each automation is independent
- **Dynamic routing** - Automations register themselves
- **Comprehensive logging** (Axiom) and error tracking (Sentry)
- **Automatic retries** with exponential backoff
- **Claude Code optimized** - Simple, clear structure

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

### 3. Run Development Server

```bash
npm run dev
```

The server will start at `http://localhost:8787`

## Project Structure

```
automation-platform/
├── src/
│   ├── app.ts                    # Main application
│   ├── config.ts                 # Global configuration
│   ├── types.ts                  # Global types
│   │
│   ├── core/                     # Platform infrastructure
│   │   ├── automation-registry.ts
│   │   └── types.ts
│   │
│   ├── shared/                   # Shared services & utilities
│   │   ├── services/             # Notion, Slack, Email, etc.
│   │   ├── utils/                # Logger, retry, parser, etc.
│   │   └── middleware/           # Auth, rate-limit, validate
│   │
│   └── automations/              # Individual automations
│       └── lead-management/      # Lead management automation
│           ├── index.ts
│           ├── config.ts
│           ├── types.ts
│           ├── webhooks/
│           └── workflows/
```

## Available Automations

### Lead Management

Processes booking requests from email → creates Notion records → sends Slack notifications with interactive buttons → handles lead acceptance → sends Cal.com booking links → tracks booking confirmations.

**Routes:**
- `POST /automations/lead-management/webhooks/gmail`
- `POST /automations/lead-management/webhooks/calcom`
- `POST /automations/lead-management/webhooks/slack`
- `GET /automations/lead-management/health`

## Adding New Automations

See [src/automations/README.md](src/automations/README.md) for detailed instructions on adding new automations.

## Deployment

### Vercel

```bash
npm install -g vercel
vercel login
vercel --prod
```

Add environment variables in the Vercel dashboard.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run deploy` - Deploy to Vercel

## Environment Variables

See `.env.example` for all required environment variables.

### Global Platform
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port
- `AXIOM_TOKEN` - Axiom logging token
- `SENTRY_DSN` - Sentry error tracking DSN

### Shared Services
- `NOTION_API_KEY` - Notion integration API key
- `SLACK_BOT_TOKEN` - Slack bot token
- `SMTP_*` - SMTP email configuration

### Lead Management
- `LEAD_ENABLED` - Enable/disable lead management
- `LEAD_NOTION_DATABASE_ID` - Notion database ID
- `LEAD_SLACK_CHANNEL_ID` - Slack channel ID
- `LEAD_CALCOM_LINK` - Cal.com booking link

## Tech Stack

- **Hono** - Fast, lightweight web framework
- **TypeScript** - Type safety
- **Notion API** - Database and CRM
- **Slack API** - Notifications and interactivity
- **Gmail API** - Incoming email webhooks
- **Cal.com API** - Booking management
- **Axiom** - Structured logging
- **Sentry** - Error tracking

## License

MIT
