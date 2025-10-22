/**
 * Main application with dynamic automation routing.
 * Automatically registers all enabled automations.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger as honoLogger } from 'hono/logger';
import { config } from './config.js';
import { getEnabledAutomations } from './core/automation-registry.js';
import { logger } from './shared/utils/logger.js';
import { monitor } from './shared/utils/monitor.js';

// Initialize monitoring
monitor.initMonitoring();

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
    automations: enabledAutomations.map((a) => ({
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
    automations: enabledAutomations.map((a) => ({
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
  monitor.captureException(err);

  return c.json(
    {
      error: 'Internal server error',
      message: config.env === 'development' ? err.message : undefined,
    },
    500
  );
});

// Log startup info (development)
if (config.env === 'development') {
  const port = config.port;

  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║  🚀  Multi-Automation Platform                             ║
║                                                            ║
║  Server: http://localhost:${port}                        ║
║  Environment: ${config.env}                              ║
║                                                            ║
║  Enabled Automations:                                      ║
${enabledAutomations
  .map((a) => `║    • ${a.name.padEnd(50)}  ║`)
  .join('\n')}
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
}

export default app;
