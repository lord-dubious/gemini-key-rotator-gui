// local-server.ts
// Deno-based local server for full application (frontend + backend)

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.203.0/http/file_server.ts";
import { load } from "https://deno.land/std@0.203.0/dotenv/mod.ts";
import { AppConfig, EnvironmentProvider } from "./src/core-backend/config.ts"; // Adjusted path
import { KeyManager } from "./src/core-backend/key-manager.ts";   // Adjusted path
import { isAuthorized } from "./src/core-backend/auth.ts";       // Adjusted path
import { handleRoutedRequest } from "./src/core-backend/request-handler.ts"; // Adjusted path

// Load environment variables from .env file if present
await load({ export: true, examplePath: null, defaultsPath: null });
// export: true makes them available via Deno.env.get()
// examplePath: null / defaultsPath: null - prevent loading default/example files by the library itself if we don't use that feature.
// The library will try to load ".env" by default.
console.log("[LocalServer] Attempted to load .env file.");

const API_PREFIX = "/api";
const STATIC_FILES_ROOT = "./dist"; // Assuming 'dist' is at the project root
const PORT = 8000; // Default port for local server

// Wrapper for Deno's environment variable access
const denoEnvProvider: EnvironmentProvider = {
  get: (key: string) => Deno.env.get(key),
};

let appConfig: AppConfig;
let keyManager: KeyManager;

// Optional: Load .env file for local development convenience
// To use this, you'd add: import "https://deno.land/std@0.203.0/dotenv/load.ts";
// at the very top of the file. For now, users must set env vars manually.
// We can add this in Step 3 of this phase.

try {
  appConfig = AppConfig.fromEnvironment(denoEnvProvider);
  keyManager = new KeyManager(appConfig.apiKeys);
  console.log(`[LocalServer] Initialized with ${keyManager.getTotalKeys()} API key(s).`);
  if (appConfig.accessToken) {
    console.log("[LocalServer] Access token protection is ENABLED.");
  } else {
    console.log("[LocalServer] Access token protection is DISABLED.");
  }
} catch (error) {
  console.error("[LocalServer] FATAL: Failed to initialize application configuration:", error.message);
  console.error("[LocalServer] Please ensure API_KEYS environment variable is set.");
  Deno.exit(1); // Exit if config fails
}

console.log(`[LocalServer] Starting server on http://localhost:${PORT}`);
console.log(`[LocalServer] API available under ${API_PREFIX}`);
console.log(`[LocalServer] Serving static files from ${STATIC_FILES_ROOT}`);

serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const pathname = url.pathname;

    if (pathname.startsWith(API_PREFIX)) {
      // API request
      if (!isAuthorized(req.headers, appConfig.accessToken)) {
        return new Response("Unauthorized", { status: 401 });
      }

      const newPathname = pathname.substring(API_PREFIX.length);
      const internalUrl = new URL(newPathname + url.search, "http://localhost"); // Dummy base
      const internalRequest = new Request(internalUrl.toString(), {
        method: req.method,
        headers: req.headers,
        body: req.body,
        // @ts-ignore
        redirect: req.redirect,
      });

      return await handleRoutedRequest(internalRequest, appConfig, keyManager);

    } else {
      // Static file request
      try {
        const response = await serveDir(req, {
          fsRoot: STATIC_FILES_ROOT,
          urlRoot: "",
          showIndex: true,
          quiet: true,
        });
        // Example: Add cache control for local dev to prevent aggressive caching.
        // response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
        return response;
      } catch (e) {
        if (e instanceof Deno.errors.NotFound) {
          return new Response("Not Found", { status: 404 });
        }
        console.error("[LocalServer] Error serving static file:", e);
        return new Response("Internal Server Error attempting to serve static file", { status: 500 });
      }
    }
  } catch (err) {
    console.error("[LocalServer] Error in request handling:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}, { port: PORT });
