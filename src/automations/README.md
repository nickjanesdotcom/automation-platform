# Adding a New Automation

This guide shows you how to add a new automation to the platform.

## Quick Start

### 1. Create Automation Folder

```bash
mkdir -p src/automations/my-automation/{webhooks,workflows}
```

### 2. Create Entry Point

`src/automations/my-automation/index.ts`:

```typescript
import type { Hono } from 'hono';
import type { Automation } from '../../core/types';

function setup(app: Hono) {
  const base = '/automations/my-automation';

  // Add your webhook routes
  app.post(`${base}/webhooks/trigger`, async (c) => {
    // Your webhook logic
    return c.json({ success: true });
  });

  // Health check
  app.get(`${base}/health`, (c) => {
    return c.json({
      automation: 'my-automation',
      status: 'ok',
    });
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

### 3. Create Config

`src/automations/my-automation/config.ts`:

```typescript
export const config = {
  notionDatabase: process.env.MY_AUTOMATION_NOTION_DB!,
  // Add automation-specific config
};

// Validate required config
if (!config.notionDatabase) {
  throw new Error('MY_AUTOMATION_NOTION_DB is required');
}
```

### 4. Create Types

`src/automations/my-automation/types.ts`:

```typescript
export interface MyData {
  // Your types here
}
```

### 5. Create Workflows

`src/automations/my-automation/workflows/process-data.ts`:

```typescript
import { logger } from '../../../shared/utils/logger';
import { createPage } from '../../../shared/services/notion';
import { sendMessage } from '../../../shared/services/slack';
import { config } from '../config';

export async function processData(data: any) {
  logger.info('Processing data', { data });

  // Use shared services
  await createPage(config.notionDatabase, {
    Name: {
      title: [{ text: { content: data.name } }],
    },
  });

  // Send notification
  await sendMessage(
    config.slackChannel,
    'Data processed!',
    [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Processed: ${data.name}`,
        },
      },
    ]
  );
}
```

### 6. Create Webhooks

`src/automations/my-automation/webhooks/trigger.ts`:

```typescript
import type { Context } from 'hono';
import { logger } from '../../../shared/utils/logger';
import { monitor } from '../../../shared/utils/monitor';
import { processData } from '../workflows/process-data';

export async function handleTriggerWebhook(c: Context) {
  try {
    logger.info('Webhook received', { automationId: 'my-automation' });

    const body = await c.req.json();
    await processData(body);

    return c.json({ success: true });
  } catch (error) {
    logger.error('Error handling webhook', error);
    monitor.captureException(error, { automationId: 'my-automation' });

    return c.json({ success: false, error: 'Internal error' }, 500);
  }
}
```

### 7. Register in Registry

`src/core/automation-registry.ts`:

```typescript
import { myAutomation } from '../automations/my-automation';

export const automations: Automation[] = [
  leadManagementAutomation,
  myAutomation, // <-- Add here
];
```

### 8. Add Environment Variables

`.env`:

```bash
MY_AUTOMATION_ENABLED=true
MY_AUTOMATION_NOTION_DB=xxx
MY_AUTOMATION_SLACK_CHANNEL=xxx
```

### 9. Deploy

```bash
npm run deploy
```

Your automation is now live at:
`https://your-app.vercel.app/automations/my-automation`

## Best Practices

### Use Shared Services

Always use shared services instead of creating your own clients:

```typescript
// ✅ Good
import { createPage } from '../../../shared/services/notion';
await createPage(databaseId, properties);

// ❌ Bad
const notion = new Client({ auth: process.env.NOTION_API_KEY });
await notion.pages.create(...);
```

### Use Shared Utilities

```typescript
import { logger } from '../../../shared/utils/logger';
import { withRetry } from '../../../shared/utils/retry';
import { extractEmail } from '../../../shared/utils/parser';
import { formatCurrency } from '../../../shared/utils/format';
```

### Add Authentication

```typescript
import { verifyWebhookSecret } from '../../../shared/middleware/auth';

app.post(
  `${base}/webhooks/trigger`,
  verifyWebhookSecret(config.webhookSecret),
  handleTriggerWebhook
);
```

### Add Rate Limiting

```typescript
import { rateLimit } from '../../../shared/middleware/rate-limit';

app.post(
  `${base}/webhooks/trigger`,
  rateLimit({ windowMs: 60000, max: 100 }),
  handleTriggerWebhook
);
```

### Error Handling

Always catch errors and log them:

```typescript
try {
  // Your code
} catch (error) {
  logger.error('Error message', error);
  monitor.captureException(error, { automationId: 'my-automation' });
  return c.json({ success: false, error: 'Internal error' }, 500);
}
```

## Testing

Test your automation locally:

```bash
# Start dev server
npm run dev

# Test health check
curl http://localhost:8787/automations/my-automation/health

# Test webhook
curl -X POST http://localhost:8787/automations/my-automation/webhooks/trigger \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## Examples

Look at the lead-management automation for a complete example:

- `src/automations/lead-management/`

It demonstrates:
- Config management
- Type definitions
- Multiple webhooks
- Complex workflows
- Error handling
- Slack interactivity
- Email notifications
