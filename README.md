# 🔑 Gemini API Key Rotator GUI

A comprehensive web application for managing and monitoring your Gemini API key rotation system. This GUI provides an intuitive interface to control the Deno Edge Function that rotates through multiple API keys to avoid rate limits.

![Dashboard Preview](https://via.placeholder.com/800x400/3b82f6/ffffff?text=Gemini+Key+Rotator+Dashboard)

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
- **Key Management** - Add, remove, and monitor API keys

### 🔧 Technical Features
- **TypeScript** - Full type safety and better development experience
- **React 18** - Modern React with hooks and concurrent features
- **Tailwind CSS** - Utility-first styling with dark mode
- **Responsive Design** - Works perfectly on desktop and mobile
- **PWA Ready** - Progressive Web App capabilities
- **Deployment Ready** - Configured for Vercel, Netlify, and GitHub Pages

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- A deployed Deno Edge Function (see [Deno Setup](#deno-edge-function-setup))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/lord-dubious/gemini-key-rotator-gui.git
   cd gemini-key-rotator-gui
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### First Time Setup

1. **Configure API Endpoint**
   - Click the Settings button in the header
   - Enter your Deno Edge Function URL
   - Add your access token (if configured)
   - Test the connection

2. **Start Monitoring**
   - Return to the Dashboard
   - View real-time metrics and key status
   - Monitor API usage and performance

## 🏗️ Deno Edge Function Setup

The GUI connects to a Deno Edge Function that handles the actual API key rotation. Follow these steps to deploy it:

### 1. Deploy to Deno Deploy

1. **Create a new project** on [Deno Deploy](https://dash.deno.com/)

2. **Upload the edge function**
   ```bash
   # Use the provided mod.ts file in the deno-edge/ directory
   deployctl deploy --project=your-project-name --prod deno-edge/mod.ts
   ```

3. **Configure environment variables**
   - `API_KEYS`: Comma-separated list of your Gemini API keys
   - `ACCESS_TOKEN`: (Optional) Secret token for API protection
   - `GEMINI_API_BASE_URL`: (Optional) Custom Gemini API endpoint

### 2. Example Environment Variables

```bash
API_KEYS=AIzaSyA...,AIzaSyB...,AIzaSyC...
ACCESS_TOKEN=your-secret-token-here
GEMINI_API_BASE_URL=https://generativelanguage.googleapis.com/v1beta2
```

### 3. Test Your Deployment

```bash
# Test health endpoint
curl https://your-project.deno.dev/health

# Test with access token
curl -H "X-Access-Token: YOUR_ACCESS_TOKEN" https://your-project.deno.dev/health
```

## 📱 Deployment Options

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Configure build settings**:
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. **Deploy** - Automatic deployments on push to main

### Netlify

1. **Connect your repository** to Netlify
2. **Use the provided** `netlify.toml` configuration
3. **Deploy** - Automatic deployments on push to main

### GitHub Pages

1. **Enable GitHub Pages** in repository settings
2. **Use GitHub Actions** - The workflow is already configured
3. **Deploy** - Automatic deployments on push to main

### Manual Deployment

```bash
# Build the project
npm run build

# Deploy the dist/ folder to your hosting provider
```

## 🎨 Customization

### Theme Configuration

The app supports three theme modes:
- **Light** - Clean, bright interface
- **Dark** - Easy on the eyes for extended use
- **System** - Automatically matches your OS preference

### Color Customization

Edit `tailwind.config.js` to customize the color scheme:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Your custom primary colors
      }
    }
  }
}
```

### Component Customization

All components are modular and can be easily customized:
- `src/components/Dashboard/` - Dashboard components
- `src/components/Layout/` - Layout and navigation
- `src/components/Settings/` - Configuration components

## 🔧 Configuration

### API Service Configuration

The app automatically saves your configuration to localStorage:

```typescript
{
  endpoint: "https://your-project.deno.dev",
  accessToken: "your-secret-token",
  refreshInterval: 30000,
  notifications: true
}
```

### Monitoring Configuration

Customize monitoring behavior in `src/hooks/useMonitoring.ts`:

```typescript
const {
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
  onError,
} = options;
```

## 📊 API Endpoints

The Deno Edge Function provides these endpoints:

### Health Check
```
GET /health
```
Returns system health and key status.

### Statistics
```
GET /stats
```
Returns detailed usage statistics and recent logs.

### Gemini API Proxy
```
POST /v1beta2/models/gemini-2.5-pro-exp-03-25:generateText
```
Proxies requests to Gemini API with automatic key rotation.

## 🛡️ Security Features

### Client-Side Security
- **CSP Headers** - Content Security Policy protection
- **XSS Protection** - Cross-site scripting prevention
- **Frame Options** - Clickjacking protection
- **HTTPS Only** - Secure connections required

### API Security
- **Access Token** - Optional API protection
- **CORS Configuration** - Controlled cross-origin access
- **Rate Limiting** - Built-in request throttling
- **Key Rotation** - Automatic failover on exhaustion

## 🔍 Monitoring & Alerts

### Real-time Monitoring
- **Key Status** - Active, exhausted, error states
- **Request Metrics** - Success rates, response times
- **Usage Patterns** - Request frequency and distribution
- **Error Tracking** - Failed requests and causes

### Alert System
- **Key Exhaustion** - When all keys are rate-limited
- **High Error Rates** - When error rate exceeds threshold
- **Slow Responses** - When response times are high
- **Connection Issues** - When API is unreachable

## 🧪 Development

### Project Structure
```
src/
├── components/          # React components
│   ├── Dashboard/      # Dashboard components
│   ├── Layout/         # Layout components
│   └── Settings/       # Settings components
├── hooks/              # Custom React hooks
├── services/           # API services
├── types/              # TypeScript types
└── utils/              # Utility functions
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

### Adding New Features

1. **Create components** in appropriate directories
2. **Add types** in `src/types/index.ts`
3. **Update navigation** in `src/components/Layout/Sidebar.tsx`
4. **Add routes** in `src/App.tsx`

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini** - For the powerful AI API
- **Deno Deploy** - For the edge computing platform
- **React Team** - For the amazing framework
- **Tailwind CSS** - For the utility-first CSS framework

## 📞 Support

- **Issues** - [GitHub Issues](https://github.com/lord-dubious/gemini-key-rotator-gui/issues)
- **Discussions** - [GitHub Discussions](https://github.com/lord-dubious/gemini-key-rotator-gui/discussions)
- **Documentation** - [Wiki](https://github.com/lord-dubious/gemini-key-rotator-gui/wiki)

---

**Made with ❤️ for the developer community**
