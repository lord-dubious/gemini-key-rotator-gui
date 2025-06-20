# 🔑 Gemini API Key Rotator GUI

A comprehensive web application for managing and monitoring your Gemini API key rotation system. This application can be deployed in various modes, offering flexibility for different environments.

![Dashboard Preview](https://via.placeholder.com/800x400/3b82f6/ffffff?text=Gemini+Key+Rotator+Dashboard) <!-- Placeholder - consider updating with a real screenshot -->

## ✨ Features

### 🎯 Core Functionality
- **Smart Key Rotation** - Automatic rotation through multiple API keys
- **Real-time Monitoring** - Live dashboard with key status and usage metrics
- **Rate Limit Mitigation** - Intelligent handling of 429 errors and quota exhaustion
- **Dark Mode Support** - Beautiful dark/light theme with system preference detection
- **Low Fingerprint** - Minimal tracking and optimized for privacy
- **High Performance** - Fast loading and responsive design

### 📊 Dashboard Features
- **Overview Cards** - Key metrics at a glance
- **Status Indicators** - Real-time health monitoring
- **Usage Analytics** - Request patterns and response times
- **Error Tracking** - Monitor and alert on issues
- **Key Management** - (If applicable, based on backend features) Add, remove, and monitor API keys

### 🔧 Technical Features
- **TypeScript** - Full type safety
- **React 18** - Modern React features
- **Tailwind CSS** - Utility-first styling
- **Multi-Mode Deployment** - Supports Deno Deploy, Vercel, Netlify, and local full-stack operation.

## 🚀 Modes of Operation & Deployment

This application is designed to be flexible and can be run or deployed in several ways:

1.  **Local Full Mode:** Run the entire application (frontend and Deno-powered backend) on your local machine. Ideal for development, testing, or personal use.
2.  **Deno Deploy (Unified):** Deploy as a self-contained application where the Deno backend serves both the API (under `/api/`) and the frontend GUI.
3.  **Node.js Serverless (Vercel/Netlify):** Deploy the frontend as a static site and the API backend as Node.js serverless functions, suitable for platforms like Vercel and Netlify.

**For detailed instructions on each deployment mode, please see our [Comprehensive Deployment Guide](DEPLOYMENT.MD).**

## 🏁 Getting Started (Local Development)

This section guides you through running the **Local Full Mode**.

### Prerequisites
-   Node.js (v18+ recommended, for `npm` and frontend build tools)
-   Deno CLI (v1.30+ recommended, for the local Deno server)
-   Git

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/lord-dubious/gemini-key-rotator-gui.git # Or your fork
    cd gemini-key-rotator-gui
    ```

2.  **Install frontend dependencies:**
    ```bash
    npm install
    ```

3.  **Configure local environment variables:**
    *   Copy the example `.env` file:
        ```bash
        cp .env.example .env
        ```
    *   Edit the new `.env` file and add your `API_KEYS`. You can also set `GEMINI_API_BASE_URL` and `ACCESS_TOKEN` if needed.
        ```env
        # .env
        API_KEYS=your_api_key_1,your_api_key_2
        # ACCESS_TOKEN=optional_secret_token
        ```

### Running the Local Full Application

1.  **Start the local server and frontend:**
    ```bash
    npm run dev:local
    ```
    This command will:
    *   Build the frontend application.
    *   Start the local Deno server which serves both the frontend and the backend API.

2.  **Open your browser:**
    *   Navigate to `http://localhost:8000` (or the port specified in `local-server.ts`).

### Frontend-Only Development (Optional)

If you only want to work on the frontend UI components without running the local Deno backend (e.g., if you are pointing to a remote Deno Deploy or Serverless backend via the GUI settings):
```bash
npm run dev
```
Then, open `http://localhost:5173` (or as indicated by Vite). You will need to configure the API endpoint in the GUI's settings page to point to your desired backend.

## ⚙️ Configuration in the GUI

The GUI settings (accessible via the gear icon) allow you to:
-   **View and Test API Endpoint:** For unified deployments (Local, Deno Deploy, Vercel/Netlify as configured), the API endpoint typically defaults to `/api` (relative to the GUI's origin) and should work automatically. You can use the settings page to test this connection.
-   **Override API Endpoint:** You can manually set a different API endpoint URL if needed (e.g., to point the locally running GUI to a cloud-deployed backend). This setting is saved in `localStorage`.
-   **Set Access Token:** If your backend is protected by an `ACCESS_TOKEN`, you can enter it here for the GUI to use in its API requests. This is also saved in `localStorage`.

## 📊 API Endpoints

When the application is running (locally or deployed), the backend API is accessible under the `/api/` path relative to the GUI's URL. Key endpoints include:

-   **Health Check:** `GET /api/health`
    -   Returns system health, key status (total, active, exhausted).
-   **Statistics:** `GET /api/stats`
    -   Returns detailed usage statistics and recent logs (if logging is implemented in the backend).
-   **Gemini API Proxy:** `POST /api/v1beta2/models/gemini-2.5-pro-exp-03-25:generateText` (and other Gemini API paths)
    -   Proxies requests to the configured Google Gemini API, automatically handling key rotation. The path after `/api/` should match the standard Google Gemini API path structure.

## 🛡️ Security Features

### Client-Side Security
- **CSP Headers** - Content Security Policy protection (configured in `netlify.toml`, similar for Vercel)
- **XSS Protection** - Cross-site scripting prevention headers
- **Frame Options** - Clickjacking protection headers
- **HTTPS Only** - Enforced by cloud deployment platforms

### API Security
- **Access Token** - Optional API protection via `ACCESS_TOKEN` environment variable.
- **CORS Configuration** - Handled by the backend to allow same-origin requests by default.
- **Rate Limiting Logic** - The core backend includes logic to switch keys upon receiving rate limit errors (429) from the Gemini API.

## 🧪 Development

### Project Structure
```
api/                    # Node.js serverless function entry point (for Vercel/Netlify)
deno-edge/              # Deno Deploy entry point
dist/                   # Frontend build output (generated)
public/                 # Static assets for Vite
src/
├── components/         # React components
├── core-backend/       # Shared backend logic (TypeScript, platform-agnostic)
├── hooks/              # Custom React hooks
├── services/           # Frontend API service
├── types/              # TypeScript types
└── utils/              # Utility functions
local-server.ts         # Deno script for local full-stack server
```

### Available Scripts

Refer to `package.json` for all scripts. Key scripts include:
- `npm run dev`: Starts Vite dev server for frontend-only development.
- `npm run build`: Builds frontend and Node.js API.
- `npm run build:api`: Compiles Node.js API using `tsconfig.node.json`.
- `npm run dev:local`: Builds frontend and starts the local Deno full-stack server.
- `npm run lint`: Runs ESLint.
- `npm run type-check`: Runs TypeScript checks for the frontend.
- `npm run clean`: Removes build artifacts.

## 🤝 Contributing

1.  **Fork the repository**
2.  **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3.  **Commit your changes** (`git commit -m 'Add amazing feature'`)
4.  **Push to the branch** (`git push origin feature/amazing-feature`)
5.  **Open a Pull Request**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini
- Deno Team & Community
- React Team & Community
- Tailwind CSS Team
- Vite Team

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/lord-dubious/gemini-key-rotator-gui/issues)
- **Discussions:** [GitHub Discussions](https://github.com/lord-dubious/gemini-key-rotator-gui/discussions)

---

**Made with ❤️ for the developer community**
