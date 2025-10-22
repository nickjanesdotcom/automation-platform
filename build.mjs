import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  await build({
    entryPoints: [join(__dirname, 'api/index.ts')],
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'esm',
    outfile: join(__dirname, 'api/index.mjs'),
    // Keep heavy dependencies external to reduce bundle size
    external: [
      '@notionhq/client',
      '@slack/web-api',
      'nodemailer',
      'googleapis',
      '@axiomhq/js',
      '@sentry/node',
      'p-retry',
      'cheerio',
      '@vercel/node'
    ],
    minify: false, // Keep readable for debugging
    sourcemap: true, // Enable source maps for debugging
    logLevel: 'info',
  });

  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}
