# 🚀 Deployment Guide

This guide covers deploying the Gemini API Key Rotator application, which includes a web GUI and the API proxy backend, in various unified modes.

## Modes of Operation

This application can be deployed in several ways:

1.  **Deno Deploy (Unified):** The Deno backend serves both the API (under `/api`) and the frontend GUI. This is a self-contained deployment.
2.  **Node.js Serverless (Vercel/Netlify):** The frontend GUI is served as a static site, and the API backend runs as Node.js serverless functions (handling requests to `/api`).
3.  **Local Full Mode:** Run the entire application (frontend and Deno backend) on your local machine for development or personal use.

## 📋 Common Prerequisites

-   Multiple Google Gemini API keys.
-   A GitHub account (for repository hosting if deploying to cloud platforms).
-   Account(s) on your chosen deployment platform(s) (Deno Deploy, Vercel, Netlify).
-   Node.js (for building the frontend, e.g., v18+).
-   Deno CLI (for Local Full Mode and Deno Deploy, e.g., v1.30+).

---

## Mode 1: Deno Deploy (Unified Frontend + Backend)

In this mode, the Deno script (`deno-edge/mod.ts`) serves both the API requests (prefixed with `/api`) and the static frontend assets.

### Setup Steps

1.  **Fork this Repository:** Start by forking this repository to your own GitHub account.
2.  **Create Deno Deploy Project:**
    *   Sign up or log in at [Deno Deploy](https://dash.deno.com/).
    *   Create a new project.
    *   Choose "Deploy from GitHub" and select your forked repository.
3.  **Deployment Settings:**
    *   **Entry Point:** `deno-edge/mod.ts`
    *   **Production Branch:** Typically `main` or `master`.
4.  **Build Configuration (Crucial):**
    *   Since the frontend build artifacts (`dist/` directory) are not committed to Git (due to `.gitignore`), you **must** configure a build step on Deno Deploy.
    *   In your Deno Deploy project settings, find the "Build Settings" or similar section.
    *   **Set the Build Command to:** `npm run build`
    *   Ensure Deno Deploy has Node.js available in its build environment to execute this command. This will build the frontend into the `dist/` directory, which `deno-edge/mod.ts` will then serve.
5.  **Environment Variables:**
    *   In your Deno Deploy project settings (usually under "Settings" > "Environment Variables"), add the following:
        *   `API_KEYS`: (Required) Your Gemini API keys. Can be a comma-separated list (e.g., `key1,key2`) or a JSON array string (e.g., `["key1","key2"]`).
        *   `GEMINI_API_BASE_URL`: (Optional) Defaults to `https://generativelanguage.googleapis.com/v1beta2` if not set.
        *   `ACCESS_TOKEN`: (Optional) A secret token. If set, requests to `/api/*` must include an `X-Access-Token` header with this value.
6.  **Deploy:** Trigger a deployment (usually automatic after connecting the repo and configuring settings).

### Testing

*   **Access GUI:** Navigate to your Deno Deploy project URL (e.g., `https://your-project-name.deno.dev`). You should see the web GUI.
*   **API Health:** Check `https://your-project-name.deno.dev/api/health`.
*   **Functionality:** The GUI should be fully functional, making requests to its own origin under `/api`. No further API endpoint configuration in the GUI settings is needed.

---

## Mode 2: Node.js Serverless (Vercel / Netlify)

In this mode, the frontend is deployed as a static site, and the API logic runs in Node.js serverless functions, typically handling requests to `/api/*`. The configuration files `vercel.json` and `netlify.toml` in the repository are set up for this.

### Common Setup

1.  **Fork this Repository.**
2.  **Environment Variables:** On your chosen platform (Vercel or Netlify), set up the same environment variables as described for Deno Deploy: `API_KEYS`, `GEMINI_API_BASE_URL` (optional), and `ACCESS_TOKEN` (optional).

### A. Vercel Deployment

1.  **Connect to Vercel:**
    *   Sign up or log in at [Vercel](https://vercel.com/).
    *   Import your forked GitHub repository.
2.  **Project Configuration:**
    *   Vercel should automatically detect it as a Vite project.
    *   The `vercel.json` file in the repository provides configurations:
        *   It uses `@vercel/static-build` for the frontend, running the `npm run build` script from `package.json` and expecting output in `dist/`.
        *   It uses `@vercel/node` for any TypeScript files in the `api/` directory, treating them as serverless functions. Our `api/index.ts` will handle requests to `/api/*`.
3.  **Deploy:** Trigger a deployment.

### B. Netlify Deployment

1.  **Connect to Netlify:**
    *   Sign up or log in at [Netlify](https://netlify.com/).
    *   Import your forked GitHub repository.
2.  **Build Settings:**
    *   Netlify will use the `netlify.toml` file from the repository:
        *   `command = "npm run build"`
        *   `publish = "dist"`
        *   `functions = "api"` (Netlify will find and build `api/index.ts`)
    *   Ensure `NODE_VERSION` is set to 18 or higher in Netlify's environment (already in `netlify.toml`).
3.  **Deploy:** Trigger a deployment.

### Testing (Vercel/Netlify)

*   **Access GUI:** Navigate to your Vercel or Netlify project URL.
*   **API Health:** Check `https://your-project-url/api/health` (or the path Vercel/Netlify assign to your `api/index.ts` function, usually `/api/` or `/api/index`).
*   **Functionality:** The GUI should be fully functional. No API endpoint configuration in the GUI settings is needed as it defaults to `/api`.

---

## Mode 3: Local Development (Full Application)

Run the entire application (Deno-based backend + frontend) on your local machine.

### Prerequisites

*   Node.js (v18+ for `npm run build`).
*   Deno CLI (v1.30+ for `deno run`).

### Setup Steps

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/your-username/gemini-key-rotator-gui.git # Replace with your fork's URL
    cd gemini-key-rotator-gui
    ```
2.  **Install Frontend Dependencies:**
    ```bash
    npm install
    ```
3.  **Configure Environment Variables:**
    *   Copy the `.env.example` file to a new file named `.env` in the project root:
        ```bash
        cp .env.example .env
        ```
    *   Edit the `.env` file and provide your actual `API_KEYS`. You can also set `GEMINI_API_BASE_URL` and `ACCESS_TOKEN` if needed.
        ```
        # .env
        API_KEYS=your_api_key_1,your_api_key_2
        # ACCESS_TOKEN=your_secret_token
        ```
    *   The `local-server.ts` will automatically load variables from this `.env` file.

### Running Locally

1.  **Execute the `dev:local` script:**
    ```bash
    npm run dev:local
    ```
    This script will:
    *   Run `npm run build` to build the frontend into `dist/` and compile the Node.js API (the Node.js API build isn't used by `local-server.ts` but the command builds frontend assets).
    *   Start the Deno local server (`local-server.ts`).
2.  **Access the Application:**
    *   Open your browser and go to `http://localhost:8000`.
    *   The API will be available at `http://localhost:8000/api/*`.

---

## Environment Variables Reference

The application uses the following environment variables across different modes:

-   **`API_KEYS`** (Required)
    -   Description: Your Google Gemini API keys.
    -   Format:
        -   Comma-separated string: `key1,key2,key3`
        -   JSON array string: `["key1","key2","key3"]` (useful if keys contain special characters)
-   **`GEMINI_API_BASE_URL`** (Optional)
    -   Description: The base URL for the Gemini API.
    -   Default: `https://generativelanguage.googleapis.com/v1beta2`
-   **`ACCESS_TOKEN`** (Optional)
    -   Description: A secret token to protect your API endpoints. If set, requests to `/api/*` must include an `X-Access-Token` header with this value.
    -   Default: None (no token protection).

---

## Security Considerations

*   **Access Token:** Always use a strong, unique `ACCESS_TOKEN` for cloud deployments to prevent unauthorized use of your API proxy and Gemini keys.
*   **CORS:** The Deno server and Node.js serverless function are configured to allow requests from any origin (`Access-Control-Allow-Origin: *`). For production, you might consider restricting this to the specific domain where your GUI is hosted if they are ever served from different origins (though the unified modes aim to keep them same-origin).
*   **API Key Security:** Environment variables on deployment platforms are the standard way to store secrets like API keys. Avoid committing them directly to your repository.

---
## Troubleshooting Tips

*   **"Failed to initialize application configuration" (Local or Deno Deploy):** Ensure `API_KEYS` environment variable is correctly set (or present in `.env` for local).
*   **401 Unauthorized (API requests):** If `ACCESS_TOKEN` is set, ensure your client (or GUI's `apiService`) is sending the correct `X-Access-Token` header. If using the GUI, set it in the Settings page. For unified deployments, the GUI's `apiService` will pick up the token from `localStorage` if you set it via the GUI's settings page (though for unified deployments, direct API calls are usually protected by the same origin or a token known to the system). The `ACCESS_TOKEN` env var protects the *backend API endpoint itself*.
*   **404 Not Found for Frontend (Deno Deploy):** Double-check that the **Build Command** (`npm run build`) is correctly configured and successfully ran in your Deno Deploy project settings. This ensures the `dist/` directory is created.
*   **404 Not Found for API routes (`/api/*`):**
    *   **Deno Deploy/Local:** Ensure `deno-edge/mod.ts` or `local-server.ts` is running and doesn't have startup errors. Check the API prefix logic.
    *   **Vercel/Netlify:** Verify your `api/index.ts` function is correctly deployed and that routing rules in `vercel.json` or Netlify settings are active. Check function logs on the platform.
*   **CORS Errors:** If you decide to host the GUI and API on different domains, you'll need to adjust the `Access-Control-Allow-Origin` header in the respective server logic (`deno-edge/mod.ts`, `api/index.ts`, or `core-backend/request-handler.ts`). The current unified setups should not generally cause CORS issues as the API and GUI are same-origin or proxied.
