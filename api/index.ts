/**
 * Vercel serverless function entry point
 */

import app from '../src/app.js';

export default app.fetch.bind(app);
