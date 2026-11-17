import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import dotenv from 'dotenv';
import { processPackageOrder } from './api/package-order';
import { processAuthSession } from './api/auth/session';
import { processPaymentSmsWebhook } from './api/payment-sms/receive';
import { processGetPaymentSmsLogs } from './api/payment-sms/logs';
import { processSubmitAndVerifyOrder } from './api/orders/submit-and-verify';
import { processAdminApproveOrder } from './api/orders/admin-approve';
import { processFreeSoftwareAccess } from './api/software/free-access';
import { processSoftwareAccess } from './api/software/access';
import { processGetCourseLessons } from './api/courses/lessons';

dotenv.config();

function readRequestBody(req: any): Promise<string> {
  return new Promise((resolve) => {
    let bodyStr = '';
    req.on('data', (chunk: any) => {
      bodyStr += chunk;
    });
    req.on('end', () => resolve(bodyStr));
  });
}

function sendJson(res: any, status: number, data: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function apiDevServerPlugin(): Plugin {
  return {
    name: 'api-dev-server-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.url || '';
        const [url, queryStr] = rawUrl.split('?');

        const clientIp =
          (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
          req.socket?.remoteAddress ||
          '127.0.0.1';

        const authHeader =
          typeof req.headers['authorization'] === 'string'
            ? req.headers['authorization']
            : undefined;

        if (url === '/api/auth/session') {
          if (req.method !== 'POST' && req.method !== 'GET') {
            sendJson(res, 405, { authenticated: false, error: 'Method not allowed.' });
            return;
          }

          const bodyStr = await readRequestBody(req);
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

            const result = await processAuthSession(authHeader, intent);
            sendJson(res, result.status, result.data);
          } catch (err: any) {
            sendJson(res, 500, {
              authenticated: false,
              error: err?.message || 'Session verification error.',
            });
          }
          return;
        }

        if (url === '/api/payment-sms/receive') {
          if (req.method !== 'POST') {
            sendJson(res, 405, { success: false, error: 'Method not allowed. Use POST.' });
            return;
          }

          const bodyStr = await readRequestBody(req);
          try {
            const result = await processPaymentSmsWebhook({
              headers: req.headers || {},
              body: bodyStr || '{}',
              clientIp,
            });
            sendJson(res, result.status, result.data);
          } catch (err: any) {
            sendJson(res, 500, { success: false, error: err?.message || 'Server error' });
          }
          return;
        }

        if (url === '/api/payment-sms/logs') {
          if (req.method !== 'GET') {
            sendJson(res, 405, { success: false, error: 'Method not allowed. Use GET.' });
            return;
          }

          try {
            const result = await processGetPaymentSmsLogs(authHeader);
            sendJson(res, result.status, result.data);
          } catch (err: any) {
            sendJson(res, 500, { success: false, error: err?.message || 'Server error' });
          }
          return;
        }

        if (url === '/api/orders/submit-and-verify') {
          if (req.method !== 'POST') {
            sendJson(res, 405, { success: false, error: 'Method not allowed. Use POST.' });
            return;
          }

          const bodyStr = await readRequestBody(req);
          try {
            const result = await processSubmitAndVerifyOrder({
              authorizationHeader: authHeader,
              body: bodyStr || '{}',
              clientIp,
            });
            sendJson(res, result.status, result.data);
          } catch (err: any) {
            sendJson(res, 500, { success: false, error: err?.message || 'Server error' });
          }
          return;
        }

        if (url === '/api/orders/admin-approve') {
          if (req.method !== 'POST') {
            sendJson(res, 405, { success: false, error: 'Method not allowed. Use POST.' });
            return;
          }

          const bodyStr = await readRequestBody(req);
          try {
            const result = await processAdminApproveOrder({
              authorizationHeader: authHeader,
              body: bodyStr || '{}',
            });
            sendJson(res, result.status, result.data);
          } catch (err: any) {
            sendJson(res, 500, { success: false, error: err?.message || 'Server error' });
          }
          return;
        }

        if (url === '/api/software/free-access') {
          if (req.method !== 'POST') {
            sendJson(res, 405, { success: false, error: 'Method not allowed. Use POST.' });
            return;
          }

          const bodyStr = await readRequestBody(req);
          try {
            const result = await processFreeSoftwareAccess({
              authorizationHeader: authHeader,
              body: bodyStr || '{}',
              clientIp,
            });
            sendJson(res, result.status, result.data);
          } catch (err: any) {
            sendJson(res, 500, { success: false, error: err?.message || 'Server error' });
          }
          return;
        }

        if (url === '/api/software/access') {
          if (req.method !== 'POST' && req.method !== 'GET') {
            sendJson(res, 405, { success: false, error: 'Method not allowed.' });
            return;
          }

          const bodyStr = req.method === 'POST' ? await readRequestBody(req) : '';
          try {
            let parsedBody: Record<string, any> = {};
            if (bodyStr) {
              try {
                parsedBody = JSON.parse(bodyStr);
              } catch {
                sendJson(res, 400, { success: false, error: 'Invalid JSON request body.' });
                return;
              }
            }
            const params = new URLSearchParams(queryStr || '');
            const productId = params.get('productId') || parsedBody.productId || '';
            const mode = params.get('mode') || parsedBody.mode || 'launch';
            const shouldRedirect =
              req.method === 'GET' && (params.get('go') === '1' || params.get('redirect') === '1');

            const result = await processSoftwareAccess({
              method: req.method,
              authorizationHeader: authHeader,
              productId,
              mode,
              clientIp,
            });

            if (shouldRedirect && result.status === 200 && result.redirectUrl) {
              res.statusCode = 302;
              res.setHeader('Cache-Control', 'no-store');
              res.setHeader('Location', result.redirectUrl);
              res.end();
              return;
            }

            sendJson(res, result.status, result.data);
          } catch (err: any) {
            sendJson(res, 500, { success: false, error: err?.message || 'Server error' });
          }
          return;
        }

        if (url === '/api/courses/lessons') {
          if (req.method !== 'GET') {
            sendJson(res, 405, { enrolled: false, success: false, error: 'Method not allowed. Use GET.' });
            return;
          }

          try {
            const params = new URLSearchParams(queryStr || '');
            const courseId = params.get('courseId') || undefined;
            const result = await processGetCourseLessons({
              authorizationHeader: authHeader,
              courseId,
              clientIp,
            });
            sendJson(res, result.status, result.data);
          } catch (err: any) {
            sendJson(res, 500, { enrolled: false, success: false, error: err?.message || 'Server error' });
          }
          return;
        }

        if (url === '/api/package-order' || url === '/api/order' || url === '/api/inquiry') {
          if (req.method !== 'POST') {
            sendJson(res, 405, { success: false, error: 'Method not allowed. Use POST.' });
            return;
          }

          const bodyStr = await readRequestBody(req);
          try {
            let body = {};
            try {
              body = JSON.parse(bodyStr || '{}');
            } catch {
              sendJson(res, 400, { success: false, error: 'Invalid JSON request body.' });
              return;
            }

            const result = await processPackageOrder(body as any, clientIp);
            sendJson(res, result.status, result.data);
          } catch (err: any) {
            sendJson(res, 500, { success: false, error: err?.message || 'Server error' });
          }
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

