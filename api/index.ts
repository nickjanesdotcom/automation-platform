/**
 * Vercel serverless function entry point
 */

import { handle } from '@hono/node-server/vercel';
import app from '../src/app.js';

export default handle(app);
