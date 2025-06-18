// src/services/api.ts
import { HealthStatus, Statistics, ApiResponse } from '@/types';
import { retry } from '@/utils';

const RELATIVE_API_PATH = "/api"; // Define the relative path

class ApiService {
  private baseUrl: string = '';
  private accessToken: string = '';
  private abortController: AbortController | null = null;

  constructor() {
    this.loadConfig();
  }

  private loadConfig(): void {
    try {
      const storedConfig = localStorage.getItem('rotator-config');
      let loadedEndpoint: string | null = null;

      if (storedConfig) {
        const parsed = JSON.parse(storedConfig);
        if (parsed.endpoint) { // If there's an endpoint in localStorage, it takes precedence
          loadedEndpoint = parsed.endpoint;
        }
        this.accessToken = parsed.accessToken || '';
      }

      if (loadedEndpoint) {
        this.baseUrl = loadedEndpoint.replace(/\/$/, '');
      } else {
        // Default to relative path if no endpoint is in localStorage
        // This assumes the API is served from the same origin under /api
        this.baseUrl = RELATIVE_API_PATH;
      }

      // Ensure baseUrl is either a full URL or a path starting with /
      // If it's a relative path, it must start with a / for fetch to work correctly against origin.
      if (!this.baseUrl.startsWith('/') && !this.baseUrl.startsWith('http')) {
        this.baseUrl = `/${this.baseUrl}`; // Ensure it's a valid path
      }
      console.log(`ApiService initialized. Base URL: ${this.baseUrl}, Access Token Loaded: ${!!this.accessToken}`);

    } catch (error) {
      console.warn('Failed to load API configuration:', error);
      // Fallback to relative path in case of any error during load, if nothing is set yet
      if (!this.baseUrl) {
          this.baseUrl = RELATIVE_API_PATH;
      }
    }
  }

  public updateConfig(endpoint: string, accessToken?: string): void {
    this.baseUrl = endpoint.replace(/\/$/, ''); // Remove trailing slash
    this.accessToken = accessToken || '';
    
    // Save to localStorage
    try {
      localStorage.setItem('rotator-config', JSON.stringify({
        endpoint: this.baseUrl, // Save the potentially full URL
        accessToken: this.accessToken,
      }));
      console.log(`ApiService config updated. Base URL: ${this.baseUrl}`);
    } catch (error) {
      console.warn('Failed to save API configuration:', error);
    }
  }

  // getHeaders and makeRequest remain the same for now.
  // fetch handles relative URLs correctly by resolving them against document.origin.
  // So, if baseUrl is "/api", fetch("/api/health") works.
  // If baseUrl is "http://example.com/api", fetch("http://example.com/api/health") works.

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.accessToken) {
      headers['X-Access-Token'] = this.accessToken;
    }

    return headers;
  }

  private async makeRequest<T>(
    endpointPath: string, // Renamed for clarity, this is the path part like '/health'
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Ensure endpointPath starts with a slash if baseUrl is a path itself
    // or if baseUrl is a full URL, endpointPath should be a path.
    let finalEndpointPath = endpointPath;
    if (!finalEndpointPath.startsWith('/')) {
        finalEndpointPath = `/${finalEndpointPath}`;
    }

    let fullUrl: string;
    if (this.baseUrl.startsWith('http')) { // Full URL
        fullUrl = `${this.baseUrl}${finalEndpointPath}`;
    } else { // Path relative to origin (e.g. /api)
        fullUrl = `${this.baseUrl}${finalEndpointPath}`;
        // fetch will resolve this relative to window.origin
        // e.g. if window.origin = "http://localhost:3000" and fullUrl = "/api/health",
        // fetch will request "http://localhost:3000/api/health"
    }

    // This check is important before making a request
    if (!this.baseUrl && !this.isConfigured()) { // isConfigured might need adjustment
        // Or, if isConfigured() is smart enough to know relative path is also "configured"
      throw new Error('API endpoint not configured and no default relative path available.');
    }


    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();

    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText} from ${fullUrl}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data,
        timestamp: Date.now(),
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : `Unknown error fetching ${fullUrl}`,
        timestamp: Date.now(),
      };
    } finally {
      this.abortController = null;
    }
  }

  public async getHealth(): Promise<HealthStatus> {
    const response = await retry(() => this.makeRequest<HealthStatus>('/health'));
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch health status');
    }
    return response.data;
  }

  public async getStatistics(): Promise<Statistics> {
    const response = await retry(() => this.makeRequest<Statistics>('/stats'));
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch statistics');
    }
    return response.data;
  }

  public async testConnection(): Promise<boolean> {
    try {
      // Test connection now uses getConfig().endpoint which might be relative or absolute
      // If it's relative, testConnection will test against the current origin + /api/health.
      // If absolute, it tests that. This is fine.
      await this.getHealth();
      return true;
    } catch {
      return false;
    }
  }

  public async testGeminiRequest(prompt: string = 'Hello, world!'): Promise<any> {
    // This path is specific to the Gemini API, not a relative path on our own server.
    // So, if baseUrl is /api, this request will be /api/v1beta2/models/...
    // which the backend (deno-edge/mod.ts) will proxy to Google.
    const response = await this.makeRequest('/v1beta2/models/gemini-2.5-pro-exp-03-25:generateText', {
      method: 'POST',
      body: JSON.stringify({
        prompt: { text: prompt },
        temperature: 0.7,
        maxOutputTokens: 100,
      }),
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to test Gemini request');
    }
    return response.data;
  }

  public cancelRequests(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  public getConfig(): { endpoint: string; accessToken: string } {
    // This now returns whatever baseUrl is (relative /api or absolute from localStorage)
    return {
      endpoint: this.baseUrl,
      accessToken: this.accessToken,
    };
  }

  public isConfigured(): boolean {
    // If baseUrl is set (either to a relative path like /api or a full URL),
    // it's considered configured for making requests.
    return Boolean(this.baseUrl);
  }
}

export const apiService = new ApiService();
export { ApiService };
