// deno-edge/mod.ts
// Deno specific server entry point

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.203.0/http/file_server.ts";
import { AppConfig, EnvironmentProvider } from "../src/core-backend/config.ts";
import { KeyManager } from "../src/core-backend/key-manager.ts";
import { isAuthorized } from "../src/core-backend/auth.ts";
import { handleRoutedRequest } from "../src/core-backend/request-handler.ts";

// Wrapper for Deno's environment variable access
const denoEnvProvider: EnvironmentProvider = {
  get: (key: string) => Deno.env.get(key),
};

let appConfig: AppConfig;
let keyManager: KeyManager;

try {
  appConfig = AppConfig.fromEnvironment(denoEnvProvider);
  keyManager = new KeyManager(appConfig.apiKeys);
  console.log(`Key rotator initialized with ${keyManager.getTotalKeys()} API key(s). Base URL: ${appConfig.geminiApiBaseUrl}`);
  if (appConfig.accessToken) {
    console.log("Access token protection is ENABLED.");
  } else {
    console.log("Access token protection is DISABLED.");
  }
} catch (error) {
  console.error("FATAL: Failed to initialize application configuration:", error);
  // If config fails, the server can't run meaningfully.
  // Deno Deploy will likely show logs or fail the deployment.
  throw error; // Re-throw to ensure it's logged and potentially stops the server
}

const API_PREFIX = "/api";
// Path to the static frontend files. Assuming 'dist' is at the project root,
// and 'deno-edge' is a subdirectory of the project root.
const STATIC_FILES_ROOT = "../dist";

serve(async (req: Request) => {
  try {
    const url = new URL(req.url);

    if (url.pathname.startsWith(API_PREFIX)) {
      // API request
      if (!isAuthorized(req.headers, appConfig.accessToken)) {
        return new Response("Unauthorized", { status: 401 });
      }
      const newPathname = url.pathname.substring(API_PREFIX.length);
      const internalUrl = new URL(newPathname + url.search, "http://localhost"); // Dummy base
      const internalRequest = new Request(internalUrl.toString(), {
        method: req.method,
        headers: req.headers,
        body: req.body,
        // @ts-ignore // Pass through redirect if Deno supports it on Request constructor
        redirect: req.redirect,
      });

      const response = await handleRoutedRequest(internalRequest, appConfig, keyManager);

      // CORS headers are currently set within handleRoutedRequest.
      // If we wanted to control them here, we would do:
      // const finalHeaders = new Headers(response.headers);
      // finalHeaders.set("Access-Control-Allow-Origin", "*");
      // return new Response(response.body, { status: response.status, statusText: response.statusText, headers: finalHeaders });

      return response;

    } else {
      // Static file request
      try {
        const response = await serveDir(req, {
          fsRoot: STATIC_FILES_ROOT,
          urlRoot: "", // Serve from the root of the domain
          showIndex: true, // Serve index.html for directory requests
          quiet: true, // Don't log file serving operations from serveDir
        });
        // Add cache control headers for static assets if desired
        // response.headers.set("Cache-Control", "public, max-age=3600"); // Example: 1 hour
        return response;
      } catch (e) {
        if (e instanceof Deno.errors.NotFound) {
          // If serveDir throws NotFound, or we want to ensure a 404 page from our static assets is served:
          // Try to serve a custom 404.html if it exists in static assets, otherwise return generic 404
          // For simplicity, just return a generic 404 if the primary serveDir fails.
          // A more robust solution would involve checking e.status if serveDir sets it.
          // Also, Deno.stat could be used to check for STATIC_FILES_ROOT/404.html and serve it.
          return new Response("Not Found", { status: 404 });
        }
        console.error("Error serving static file:", e);
        return new Response("Internal Server Error attempting to serve static file", { status: 500 });
      }
    }
  } catch (err) {
    // Catch-all for unexpected errors during request processing
    console.error("Error in Deno request handling:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
});

console.log(`Deno edge function server started. API on ${API_PREFIX}, Static files from ${STATIC_FILES_ROOT}`);
