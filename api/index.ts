// api/index.ts
// Serverless function entry point for Vercel/Netlify (Node.js runtime)

import type { IncomingMessage, ServerResponse } from 'http';
import { AppConfig, EnvironmentProvider } from '@core-backend/config';
import { KeyManager } from '@core-backend/key-manager';
import { isAuthorized } from '@core-backend/auth';
import { handleRoutedRequest } from '@core-backend/request-handler'; // .ts extension might be handled by bundler/tsconfig

// Node.js Readable stream to ArrayBuffer helper
async function streamToArrayBuffer(stream: NodeJS.ReadableStream): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).buffer));
  });
}

const nodeEnvProvider: EnvironmentProvider = {
  get: (key: string): string | undefined => process.env[key],
};

let appConfig: AppConfig;
let keyManager: KeyManager;

// Initialization Block - runs once per cold start
try {
  appConfig = AppConfig.fromEnvironment(nodeEnvProvider);
  keyManager = new KeyManager(appConfig.apiKeys);
  console.log(`[Node API Handler Init] Initialized with ${keyManager.getTotalKeys()} API key(s). Base URL: ${appConfig.geminiApiBaseUrl}`);
  if (appConfig.accessToken) {
    console.log("[Node API Handler Init] Access token protection is ENABLED.");
  } else {
    console.log("[Node API Handler Init] Access token protection is DISABLED.");
  }
} catch (error) {
  console.error("[Node API Handler Init] FATAL: Failed to initialize configuration:", error);
  // This error will cause the function to fail on subsequent invocations until fixed.
  // It's good practice to ensure dependent services are available or config is valid on init.
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!appConfig || !keyManager) {
    // This happens if the global initialization failed.
    console.error("[Node API Handler] Critical error: AppConfig or KeyManager not initialized.");
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: "Server configuration error." }));
    return;
  }

  console.log(`[Node API Handler] Received request: ${req.method} ${req.url}`);

  try {
    // 1. Convert Node.js headers to Web Headers for isAuthorized
    const webHeaders = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        value.forEach(v => webHeaders.append(key, v));
      } else {
        webHeaders.set(key, value);
      }
    }

    // 2. Authorization (applies to all requests to this function endpoint)
    // Vercel/Netlify typically route /api/* to this function.
    // The original Deno version applied auth to /api/* paths.
    // So, this function, being the /api endpoint, should enforce auth.
    if (!isAuthorized(webHeaders, appConfig.accessToken)) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ message: "Unauthorized" }));
      return;
    }

    // 3. Construct Web Request object
    // Base URL: use a dummy base as handleRoutedRequest primarily uses pathname and search.
    // req.url should be the path and query string.
    const requestUrl = new URL(req.url || '/', 'http://localhost');

    let body: ArrayBuffer | undefined = undefined;
    // Check for content-length to avoid trying to read empty bodies
    const contentLengthHeader = req.headers['content-length'];
    const contentLength = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;

    if (req.method !== 'GET' && req.method !== 'HEAD' && contentLength > 0) {
        body = await streamToArrayBuffer(req);
    }

    const webRequest = new Request(requestUrl.toString(), {
      method: req.method,
      headers: webHeaders,
      body: body,
    });

    // 4. Call Core Logic
    // handleRoutedRequest expects paths like /health, /v1beta2/...
    // If Vercel/Netlify routes /api/health to this function, req.url will be /health.
    // So, no additional prefix stripping is needed here if platform routing is set up
    // such that req.url is already the "internal" path.
    const webResponse = await handleRoutedRequest(webRequest, appConfig, keyManager);

    // 5. Adapt Web Response to Node.js ServerResponse
    res.statusCode = webResponse.status;
    webResponse.headers.forEach((value, key) => {
      // Vercel automatically handles 'transfer-encoding: chunked' if body is streamed.
      // Avoid setting it directly if it causes issues.
      // Also, some headers like 'connection' can cause issues with Node's http module if set manually.
      const lowerKey = key.toLowerCase();
      if (lowerKey !== 'transfer-encoding' && lowerKey !== 'connection') {
         res.setHeader(key, value);
      }
    });

    if (webResponse.body) {
      // Read the entire body from the web response stream and send it
      const responseBodyBuffer = await webResponse.arrayBuffer();
      res.end(Buffer.from(responseBodyBuffer));
    } else {
      res.end();
    }

  } catch (error) {
    console.error("[Node API Handler] Error processing request:", error);
    // Ensure a response is sent even if an unexpected error occurs
    if (!res.writableEnded) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: "Internal Server Error" }));
    }
  }
}
