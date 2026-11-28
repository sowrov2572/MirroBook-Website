import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import dotenv from 'dotenv';
import { processPackageOrder } from './api/_handlers/package-order';
import { processAuthSession } from './api/_handlers/auth/session';
import { processPaymentSmsWebhook } from './api/_handlers/payment-sms/receive';
import { processGetPaymentSmsLogs } from './api/_handlers/payment-sms/logs';
import { processSubmitAndVerifyOrder } from './api/_handlers/orders/submit-and-verify';
import { processAdminApproveOrder } from './api/_handlers/orders/admin-approve';
import { processFreeSoftwareAccess } from './api/_handlers/software/free-access';
import { processVerifyFreeAccess } from './api/_handlers/software/verify-free-access';
import { processSoftwareAccess } from './api/_handlers/software/access';
import {
  processGetCourseLessons,
  processGetCourseLessonThumbnail,
} from './api/_handlers/courses/lessons';
import { processMirrorBotChat } from './api/_handlers/mirrorbot/chat';
import { processSuggestBotNames } from './api/_handlers/mirrorbot/suggest-names';
import { processMetaStatus } from './api/_handlers/mirrorbot/meta-status';
import { processMetaOAuthUrl } from './api/_handlers/mirrorbot/meta-oauth-url';
import { processMetaCallback } from './api/_handlers/mirrorbot/meta-callback';
import { processMetaConnect } from './api/_handlers/mirrorbot/meta-connect';
import {
  processMetaWebhookGet,
  processMetaWebhookPost,
} from './api/_handlers/mirrorbot/meta-webhook';
import { processMetaDataDeletion } from './api/_handlers/mirrorbot/meta-data-deletion';

dotenv.config({ path: '.env.local' });
dotenv.config();

function readRequestBody(req: any, maxBytes = 6 * 1024 * 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    let bodyStr = '';
    let receivedBytes = 0;
    let exceeded = false;
    req.on('data', (chunk: Buffer | string) => {
      const byteLen = Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk);
      receivedBytes += byteLen;
      if (receivedBytes > maxBytes) {
        exceeded = true;
        return;
      }
      bodyStr += chunk.toString();
    });
    req.on('end', () => {
      if (exceeded) {
        reject(new Error('PAYLOAD_TOO_LARGE'));
      } else {
        resolve(bodyStr);
      }
    });
    req.on('error', reject);
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
            const originHeader = typeof req.headers['origin'] === 'string' ? req.headers['origin'] : '';
            const hostHeader = typeof req.headers['host'] === 'string' ? req.headers['host'] : 'localhost:3000';
            const requestOrigin = originHeader || `http://${hostHeader}`;
            const result = await processFreeSoftwareAccess({
              authorizationHeader: authHeader,
              body: bodyStr || '{}',
              clientIp,
              requestOrigin,
            });
            sendJson(res, result.status, result.data);
          } catch (err: any) {
            sendJson(res, 500, { success: false, error: err?.message || 'Server error' });
          }
          return;
        }

        if (url === '/api/software/verify-free-access') {
          if (req.method !== 'GET' && req.method !== 'POST') {
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
            const token =
              params.get('token') ||
              params.get('free_access_token') ||
              parsedBody.token ||
              '';
            const shouldRedirect =
              req.method === 'GET' && (params.get('redirect') === '1' || params.get('go') === '1');

            const result = await processVerifyFreeAccess({ token, clientIp });
            res.setHeader('Cache-Control', 'no-store');
            if (shouldRedirect && result.status === 200 && result.redirectUrl) {
              res.statusCode = 302;
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
            const thumbParam = params.get('thumb');
            if (thumbParam !== null) {
              const thumbRes = await processGetCourseLessonThumbnail({
                courseId,
                lessonNumber: Number(thumbParam),
              });
              if (thumbRes.status === 200 && thumbRes.body) {
                res.statusCode = 200;
                res.setHeader('Content-Type', thumbRes.contentType || 'image/jpeg');
                res.setHeader('Cache-Control', 'public, max-age=3600');
                res.end(thumbRes.body);
              } else {
                sendJson(res, thumbRes.status, { success: false, error: thumbRes.error });
              }
              return;
            }

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

        if (url === '/api/mirrorbot/suggest-names') {
          if (req.method !== 'POST') {
            sendJson(res, 405, { success: false, error: 'Method not allowed. Use POST.' });
            return;
          }

          try {
            const bodyStr = await readRequestBody(req, 256 * 1024);
            let body = {};
            try {
              body = JSON.parse(bodyStr || '{}');
            } catch {
              sendJson(res, 400, { success: false, error: 'Invalid JSON request body.' });
              return;
            }
            const result = await processSuggestBotNames(body, clientIp);
            sendJson(res, result.status, result.data);
          } catch (err: any) {
            if (err?.message === 'PAYLOAD_TOO_LARGE') {
              sendJson(res, 413, { success: false, error: 'Request payload is too large.' });
              return;
            }
            sendJson(res, 500, { success: false, error: err?.message || 'Server error' });
          }
          return;
        }

        if (url === '/api/mirrorbot/chat') {
          if (req.method !== 'POST') {
            sendJson(res, 405, { success: false, error: 'Method not allowed. Use POST.' });
            return;
          }

          try {
            const bodyStr = await readRequestBody(req, 6 * 1024 * 1024);
            let body = {};
            try {
              body = JSON.parse(bodyStr || '{}');
            } catch {
              sendJson(res, 400, { success: false, error: 'Invalid JSON request body.' });
              return;
            }
            const result = await processMirrorBotChat(body, clientIp);
            sendJson(res, result.status, result.data);
          } catch (err: any) {
            if (err?.message === 'PAYLOAD_TOO_LARGE') {
              sendJson(res, 413, {
                success: false,
                error: 'Uploaded photo is too large. Please upload a photo under 4 MB.',
              });
              return;
            }
            sendJson(res, 500, { success: false, error: err?.message || 'Server error' });
          }
          return;
        }

        if (url === '/api/mirrorbot/meta-status') {
          if (req.method !== 'GET') {
            sendJson(res, 405, { success: false, error: 'Method not allowed. Use GET.' });
            return;
          }
          const authHeader =
            typeof req.headers['authorization'] === 'string'
              ? req.headers['authorization']
              : undefined;
          const result = await processMetaStatus(authHeader);
          sendJson(res, result.status, result.data);
          return;
        }

        if (url === '/api/mirrorbot/meta-oauth-url') {
          if (req.method !== 'GET') {
            sendJson(res, 405, { success: false, error: 'Method not allowed. Use GET.' });
            return;
          }
          const protoHeader =
            typeof req.headers['x-forwarded-proto'] === 'string'
              ? req.headers['x-forwarded-proto'].split(',')[0].trim()
              : 'http';
          const hostHeader =
            (typeof req.headers['x-forwarded-host'] === 'string'
              ? req.headers['x-forwarded-host'].split(',')[0].trim()
              : '') ||
            (typeof req.headers['host'] === 'string' ? req.headers['host'] : 'localhost:3000');
          const originHeader =
            typeof req.headers['origin'] === 'string' && req.headers['origin']
              ? req.headers['origin']
              : `${protoHeader}://${hostHeader}`;
          const authHeader =
            typeof req.headers['authorization'] === 'string'
              ? req.headers['authorization']
              : undefined;
          const params = new URLSearchParams(queryStr || '');
          const result = await processMetaOAuthUrl({
            channel: params.get('channel'),
            requestOrigin: originHeader,
            authorizationHeader: authHeader,
          });
          res.setHeader('Cache-Control', 'no-store');
          sendJson(res, result.status, result.data);
          return;
        }

        if (url === '/api/mirrorbot/meta-callback' || url === '/api/mirrorbot/meta-callback/') {
          if (req.method !== 'GET') {
            sendJson(res, 405, { success: false, error: 'Method not allowed. Use GET.' });
            return;
          }
          const params = new URLSearchParams(queryStr || '');
          const result = await processMetaCallback(params);
          res.statusCode = result.status;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store');
          res.end(result.html);
          return;
        }

        if (url === '/api/mirrorbot/meta-connect') {
          if (req.method !== 'POST') {
            sendJson(res, 405, { success: false, error: 'Method not allowed. Use POST.' });
            return;
          }
          try {
            const bodyStr = await readRequestBody(req, 256 * 1024);
            let body = {};
            try {
              body = JSON.parse(bodyStr || '{}');
            } catch {
              sendJson(res, 400, { success: false, error: 'Invalid JSON request body.' });
              return;
            }
            const authHeader =
              typeof req.headers['authorization'] === 'string'
                ? req.headers['authorization']
                : undefined;
            const result = await processMetaConnect(body, authHeader);
            sendJson(res, result.status, result.data);
          } catch (err: any) {
            sendJson(res, 500, { success: false, error: err?.message || 'Server error' });
          }
          return;
        }

        if (url === '/api/mirrorbot/meta-webhook' || url === '/api/mirrorbot/meta-webhook/') {
          if (req.method === 'GET') {
            const params = new URLSearchParams(queryStr || '');
            const result = await processMetaWebhookGet(params);
            res.statusCode = result.status;
            res.setHeader('Content-Type', result.contentType);
            res.end(result.body);
            return;
          }
          if (req.method === 'POST') {
            try {
              const rawBody = await readRequestBody(req, 1024 * 1024);
              const sig =
                typeof req.headers['x-hub-signature-256'] === 'string'
                  ? req.headers['x-hub-signature-256']
                  : undefined;
              const result = await processMetaWebhookPost({
                rawBody,
                signatureHeader: sig,
                clientIp,
              });
              sendJson(res, result.status, result.data);
            } catch (err: any) {
              sendJson(res, 500, { success: false, error: err?.message || 'Server error' });
            }
            return;
          }
          sendJson(res, 405, { success: false, error: 'Method not allowed.' });
          return;
        }

        if (
          url === '/api/mirrorbot/meta-data-deletion' ||
          url === '/api/mirrorbot/meta-data-deletion/'
        ) {
          const protoHeader =
            typeof req.headers['x-forwarded-proto'] === 'string'
              ? req.headers['x-forwarded-proto'].split(',')[0].trim()
              : 'http';
          const hostHeader =
            (typeof req.headers['x-forwarded-host'] === 'string'
              ? req.headers['x-forwarded-host'].split(',')[0].trim()
              : '') ||
            (typeof req.headers['host'] === 'string' ? req.headers['host'] : 'localhost:3000');
          const originHeader = `${protoHeader}://${hostHeader}`;
          const bodyStr = req.method === 'POST' ? await readRequestBody(req, 256 * 1024) : '';
          let parsedBody: any = bodyStr;
          const contentType = String(req.headers['content-type'] || '').toLowerCase();
          if (contentType.includes('application/json') && bodyStr.trim()) {
            try {
              parsedBody = JSON.parse(bodyStr);
            } catch {
              parsedBody = {};
            }
          }
          const result = await processMetaDataDeletion({
            method: req.method || 'GET',
            body: parsedBody,
            requestOrigin: originHeader,
          });
          res.setHeader('Cache-Control', 'no-store');
          sendJson(res, result.status, result.data);
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

