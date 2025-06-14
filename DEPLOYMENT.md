# 🚀 Deployment Guide

This guide covers deploying both the web GUI and the Deno Edge Function for the Gemini API Key Rotator.

## 📋 Prerequisites

- Multiple Google Gemini API keys
- GitHub account (for repository hosting)
- Deno Deploy account (for edge function)
- Hosting account (Vercel, Netlify, or GitHub Pages)

## 🔧 Part 1: Deploy the Deno Edge Function

### Step 1: Create Deno Deploy Project

1. **Sign up** at [Deno Deploy](https://dash.deno.com/)
2. **Create a new project**
3. **Choose "Deploy from GitHub"** or use CLI

### Step 2: Deploy via GitHub (Recommended)

1. **Fork this repository** to your GitHub account
2. **Connect repository** to Deno Deploy
3. **Set deployment settings**:
   - **Entry Point**: `deno-edge/mod.ts`
   - **Auto Deploy**: Enable for main branch

### Step 3: Deploy via CLI (Alternative)

```bash
# Install Deno Deploy CLI
deno install -A -fg https://deno.land/x/deploy/deployctl.ts

# Deploy the edge function
deployctl deploy --project=your-project-name --prod deno-edge/mod.ts
```

### Step 4: Configure Environment Variables

In your Deno Deploy project settings, add:

```bash
# Required: Your Gemini API keys (comma-separated)
API_KEYS=AIzaSyA1234...,AIzaSyB5678...,AIzaSyC9012...

# Optional: Access token for API protection
ACCESS_TOKEN=your-super-secret-token-here

# Optional: Custom Gemini API endpoint
GEMINI_API_BASE_URL=https://generativelanguage.googleapis.com/v1beta2
```

### Step 5: Test Your Edge Function

```bash
# Test health endpoint
curl https://your-project.deno.dev/health

# Expected response:
{
  "status": "healthy",
  "timestamp": <timestamp>,  // dynamic value (milliseconds since epoch)
  "totalKeys": 3,
  "activeKeys": 3,
  "exhaustedKeys": 0
}

# Test with access token (if configured)
curl -H "X-Access-Token: YOUR_ACCESS_TOKEN" https://your-project.deno.dev/health

# Test Gemini proxy
curl -X POST "https://your-project.deno.dev/v1beta2/models/gemini-2.5-pro-exp-03-25:generateText" \
     -H "Content-Type: application/json" \
     -H "X-Access-Token: YOUR_ACCESS_TOKEN" \
     -d '{"prompt": {"text": "Hello, world!"}}'
```

## 🌐 Part 2: Deploy the Web GUI

### Option A: Vercel (Recommended)

1. **Sign up** at [Vercel](https://vercel.com/)
2. **Import your repository**
3. **Configure project**:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Deploy** - Automatic on every push to main

#### Custom Domain (Optional)
```bash
# Add custom domain in Vercel dashboard
# Update vercel.json if needed
```

### Option B: Netlify

1. **Sign up** at [Netlify](https://netlify.com/)
2. **Connect your repository**
3. **Build settings** (auto-detected from `netlify.toml`):
   - Build Command: `npm run build`
   - Publish Directory: `dist`
4. **Deploy** - Automatic on every push to main

#### Environment Variables (Optional)
```bash
# In Netlify dashboard, add any needed env vars
NODE_VERSION=18
```

### Option C: GitHub Pages

1. **Enable GitHub Pages** in repository settings
2. **Source**: GitHub Actions
3. **Workflow** is already configured in `.github/workflows/deploy.yml`
4. **Push to main** - Automatic deployment

#### Custom Domain (Optional)
```bash
# Add CNAME file to public/ directory
echo "your-domain.com" > public/CNAME
```

### Option D: Manual Deployment

```bash
# Build the project
npm run build

# Upload dist/ folder to your hosting provider
# Examples:
# - AWS S3 + CloudFront
# - Google Cloud Storage
# - Azure Static Web Apps
# - Any static hosting service
```

## ⚙️ Part 3: Configure the GUI

### Step 1: Access Your Deployed GUI

Navigate to your deployed URL:
- Vercel: `https://your-project.vercel.app`
- Netlify: `https://your-project.netlify.app`
- GitHub Pages: `https://username.github.io/gemini-key-rotator-gui`

### Step 2: Initial Configuration

1. **Click Settings** (gear icon in header)
2. **Enter API Endpoint**: Your Deno Deploy URL
   ```
   https://your-project.deno.dev
   ```
3. **Enter Access Token** (if you configured one)
4. **Test Connection** - Should show "Connected"
5. **Save Settings**

### Step 3: Verify Dashboard

1. **Return to Dashboard**
2. **Check metrics** - Should show your API keys
3. **Monitor status** - Keys should show as "Active"
4. **Test functionality** - Try the "Test Gemini" button in settings

## 🔒 Security Configuration

### Edge Function Security

```typescript
// In deno-edge/mod.ts, ensure these are configured:

// 1. Access token protection
const ACCESS_TOKEN = Deno.env.get("ACCESS_TOKEN");

// 2. CORS configuration
resHeaders.set("Access-Control-Allow-Origin", "*"); // Restrict as needed

// 3. Rate limiting (built-in via key rotation)
```

### GUI Security

```json
// In vercel.json / netlify.toml, security headers are configured:
{
  "headers": [
    {
      "key": "X-Content-Type-Options",
      "value": "nosniff"
    },
    {
      "key": "X-Frame-Options", 
      "value": "DENY"
    },
    {
      "key": "X-XSS-Protection",
      "value": "1; mode=block"
    }
  ]
}
```

## 📊 Monitoring Setup

### Health Checks

Set up monitoring for your endpoints:

```bash
# Monitor edge function health
curl https://your-project.deno.dev/health

# Monitor GUI availability  
curl https://your-gui.vercel.app
```

### Alerts (Optional)

Configure alerts for:
- Edge function downtime
- All API keys exhausted
- High error rates
- Slow response times

## 🔧 Troubleshooting

### Common Issues

#### 1. "Connection Failed" in GUI
```bash
# Check edge function is deployed and accessible
curl https://your-project.deno.dev/health

# Verify CORS settings allow your GUI domain
# Check access token is correct
```

#### 2. "All API Keys Exhausted"
```bash
# Check your API keys are valid
# Verify quota limits with Google
# Add more API keys to rotation
```

#### 3. Build Failures
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version (requires 18+)
node --version
```

#### 4. CORS Errors
```typescript
// In deno-edge/mod.ts, update CORS settings:
resHeaders.set("Access-Control-Allow-Origin", "https://your-gui-domain.com");
```

### Debug Mode

Enable debug logging:

```typescript
// In deno-edge/mod.ts
console.log("Debug: Request received", req.url);
console.log("Debug: Using key index", keyIndex);
```

## 🔄 Updates and Maintenance

### Updating the Edge Function

1. **Modify** `deno-edge/mod.ts`
2. **Commit and push** to GitHub
3. **Auto-deploy** via Deno Deploy integration

### Updating the GUI

1. **Modify** React components
2. **Test locally** with `npm run dev`
3. **Commit and push** to main branch
4. **Auto-deploy** via your hosting platform

### Adding API Keys

1. **Update environment variables** in Deno Deploy
2. **Redeploy** the edge function
3. **Verify** new keys in GUI dashboard

## 📈 Performance Optimization

### Edge Function
- Uses Deno's global edge network
- Minimal latency with smart routing
- Automatic scaling

### GUI
- Static site generation
- CDN distribution
- Optimized bundle splitting
- Service worker caching (PWA)

### Monitoring
- Real-time updates every 30 seconds
- Efficient API calls with caching
- Responsive design for all devices

## 🆘 Support

If you encounter issues:

1. **Check logs** in Deno Deploy dashboard
2. **Review browser console** for client errors
3. **Test API endpoints** manually with curl
4. **Open an issue** on GitHub with details

---

**Deployment complete! 🎉**

Your Gemini API Key Rotator is now live and ready to handle rate limits intelligently.
