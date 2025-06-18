// src/core-backend/request-handler.ts

import { AppConfig } from './config';
import { KeyManager } from './key-manager';

// Standard web Request and Response objects are assumed.
// In Node.js, global fetch and its Request/Response objects are available in v18+.
// Deno uses them natively.

export async function handleRoutedRequest(
  originalRequest: Request,
  config: AppConfig,
  keyManager: KeyManager
): Promise<Response> {
  const { geminiApiBaseUrl } = config;

  // Construct target URL path and query from original request
  // The base (scheme, host, port) of originalRequest.url is ignored.
  const originalUrl = new URL(originalRequest.url);
  const targetPathAndQuery = originalUrl.pathname + originalUrl.search;

  // Prepare headers for forwarding
  const forwardHeaders = new Headers();
  for (const [headerName, headerValue] of originalRequest.headers) {
    const lowerHeaderName = headerName.toLowerCase();
    // Block hop-by-hop headers and sensitive ones that shouldn't be forwarded.
    if (['host', 'cookie', 'authorization', 'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailers', 'transfer-encoding', 'upgrade'].includes(lowerHeaderName)) {
      continue;
    }
    forwardHeaders.set(headerName, headerValue);
  }
  // Ensure content-type is preserved if present on original request
  if (!forwardHeaders.has('content-type') && originalRequest.headers.has('content-type')) {
    forwardHeaders.set('content-type', originalRequest.headers.get('content-type')!);
  }

  // Read the body once so it can be re-sent on every attempt
  const requestBody = originalRequest.body ? await originalRequest.arrayBuffer() : undefined;

  let attemptCount = 0;
  const maxAttempts = keyManager.getTotalKeys(); // Try each key at most once

  while (attemptCount < maxAttempts) {
    attemptCount++;

    const keyInfo = keyManager.getNextAvailableKey();
    if (keyInfo === null) {
      console.error("All API keys are currently exhausted.");
      return new Response("All API keys are exhausted (quota exceeded).", { status: 429 });
    }

    const { apiKey, keyIndex } = keyInfo;
    const targetUrl = new URL(targetPathAndQuery, geminiApiBaseUrl);
    targetUrl.searchParams.set("key", apiKey);

    console.log(`Attempt ${attemptCount}/${maxAttempts}: Forwarding to ${targetUrl.hostname} using key index ${keyIndex}`);

    try {
      const fetchResponse = await fetch(targetUrl.toString(), {
        method: originalRequest.method,
        headers: forwardHeaders,
        body: requestBody, // Pass ArrayBuffer directly
        redirect: 'manual', // Do not follow redirects automatically for the proxy
      });

      // If response indicates a key-specific quota issue (401/403 can also be auth issues not specific to quota),
      // or rate limit (429), mark key and retry if other keys are available.
      if ([401, 403, 429].includes(fetchResponse.status) && attemptCount < maxAttempts) {
        console.warn(`Key index ${keyIndex} returned status ${fetchResponse.status}. Marking as exhausted and trying next key.`);
        keyManager.markKeyAsExhausted(keyIndex);
        // Continue to the next iteration of the while loop to get a new key
        if (fetchResponse.body) await fetchResponse.body.cancel(); // Consume body to free resources before retrying
        continue;
      }

      // For any other status, or if it's the last attempt, return this response.
      // Copy response headers and status
      const responseHeaders = new Headers(fetchResponse.headers);
      // Add CORS headers - this might be better handled at the server entry point (e.g. deno-edge/mod.ts)
      // but including it here for now for completeness of mimicking original logic.
      responseHeaders.set("Access-Control-Allow-Origin", "*");
      responseHeaders.set("Access-Control-Allow-Methods", "*"); // Be more specific if needed
      responseHeaders.set("Access-Control-Allow-Headers", "*"); // Be more specific if needed

      return new Response(fetchResponse.body, {
        status: fetchResponse.status,
        statusText: fetchResponse.statusText,
        headers: responseHeaders,
      });

    } catch (fetchError) {
      // Network errors or other issues with the fetch call itself
      console.error(`Fetch error for key index ${keyIndex}:`, fetchError);
      // Unlike 429s, a network error for one key doesn't necessarily mean other keys will fail.
      // However, if it's a general network issue, retrying might not help.
      // For simplicity here, we'll treat it like an exhausted key and try the next one,
      // unless it's the last attempt.
      keyManager.markKeyAsExhausted(keyIndex);
      if (attemptCount >= maxAttempts) {
        return new Response("Internal server error after multiple fetch attempts.", { status: 502 }); // Bad Gateway
      }
      // continue to next attempt
    }
  }

  // Should be unreachable if maxAttempts > 0, as the loop should return a response.
  // But as a fallback if all keys were exhausted from the start or became exhausted.
  return new Response("Failed to process request after trying all available API keys.", { status: 500 });
}
