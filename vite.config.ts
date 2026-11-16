import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import dotenv from 'dotenv';
import { processPackageOrder } from './api/package-order';
import { processAuthSession } from './api/auth/session';

dotenv.config();

function apiDevServerPlugin(): Plugin {
  return {
    name: 'api-dev-server-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.url || '';
        const [url, queryStr] = rawUrl.split('?');

        if (url === '/api/auth/session') {
          if (req.method !== 'POST' && req.method !== 'GET') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ authenticated: false, error: 'Method not allowed.' }));
            return;
          }

          let bodyStr = '';
          req.on('data', (chunk) => {
            bodyStr += chunk;
          });
          req.on('end', async () => {
            try {
              const params = new URLSearchParams(queryStr || '');
              let intent = params.get('intent') || undefined;
              if (bodyStr) {
                try {
                  const parsed = JSON.parse(bodyStr);
                  if (typeof parsed?.intent === 'string') {
                    intent = parsed.intent;
                  }
                } catch {
                  // ignore optional body parse failure
                }
              }

              const authHeader =
                typeof req.headers['authorization'] === 'string'
                  ? req.headers['authorization']
                  : undefined;

              const result = await processAuthSession(authHeader, intent);
              res.statusCode = result.status;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result.data));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  authenticated: false,
                  error: err?.message || 'Session verification error.',
                })
              );
            }
          });
          return;
        }

        if (url === '/api/package-order' || url === '/api/order' || url === '/api/inquiry') {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: 'Method not allowed. Use POST.' }));
            return;
          }

          let bodyStr = '';
          req.on('data', (chunk) => {
            bodyStr += chunk;
          });
          req.on('end', async () => {
            try {
              let body = {};
              try {
                body = JSON.parse(bodyStr || '{}');
              } catch {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: 'Invalid JSON request body.' }));
                return;
              }

              const clientIp =
                (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
                req.socket?.remoteAddress ||
                '127.0.0.1';

              const result = await processPackageOrder(body as any, clientIp);
              res.statusCode = result.status;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result.data));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err?.message || 'Server error' }));
            }
          });
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiDevServerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

