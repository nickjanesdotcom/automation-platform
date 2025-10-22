/**
 * Vercel serverless function entry point
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../src/app.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const request = new Request(new URL(req.url || '/', `https://${req.headers.host}`), {
    method: req.method,
    headers: req.headers as any,
    body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
  });

  const response = await app.fetch(request);

  res.status(response.status);
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  const text = await response.text();
  res.send(text);
}
