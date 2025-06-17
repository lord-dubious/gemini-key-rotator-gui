import { HealthStatus, Statistics, ApiResponse } from '@/types';
import { retry } from '@/utils';

class ApiService {
  private baseUrl: string = '';
  private accessToken: string = '';
  private abortController: AbortController | null = null;

  constructor() {
    // Load configuration from localStorage
    this.loadConfig();
  }

  private loadConfig(): void {
    try {
      const config = localStorage.getItem('rotator-config');
      if (config) {
        const parsed = JSON.parse(config);
        this.baseUrl = parsed.endpoint || '';
        this.accessToken = parsed.accessToken || '';
      }
    } catch (error) {
      console.warn('Failed to load API configuration:', error);
    }
  }

  public updateConfig(endpoint: string, accessToken?: string): void {
    this.baseUrl = endpoint.replace(/\/$/, ''); // Remove trailing slash
    this.accessToken = accessToken || '';
    
    // Save to localStorage
    try {
      localStorage.setItem('rotator-config', JSON.stringify({
        endpoint: this.baseUrl,
        accessToken: this.accessToken,
      }));
    } catch (error) {
      console.warn('Failed to save API configuration:', error);
    }
  }

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
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    if (!this.baseUrl) {
      throw new Error('API endpoint not configured');
    }

    // Cancel previous request if still pending
    if (this.abortController) {
      this.abortController.abort();
    }

    this.abortController = new AbortController();

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data,
        timestamp: Date.now(),
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error; // Re-throw abort errors
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };
    } finally {
      this.abortController = null;
    }
  }

  // Health check endpoint
  public async getHealth(): Promise<HealthStatus> {
    const response = await retry(() => this.makeRequest<HealthStatus>('/health'));
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch health status');
    }

    return response.data;
  }

  // Statistics endpoint
  public async getStatistics(): Promise<Statistics> {
    const response = await retry(() => this.makeRequest<Statistics>('/stats'));
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch statistics');
    }

    return response.data;
  }

  // Test API connection
  public async testConnection(): Promise<boolean> {
    try {
      await this.getHealth();
      return true;
    } catch {
      return false;
    }
  }

  // Test a Gemini API request through the rotator
  public async testGeminiRequest(prompt: string = 'Hello, world!'): Promise<any> {
    if (!this.baseUrl) {
      throw new Error('API endpoint not configured');
    }

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

  // Cancel ongoing requests
  public cancelRequests(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  // Get current configuration
  public getConfig(): { endpoint: string; accessToken: string } {
    return {
      endpoint: this.baseUrl,
      accessToken: this.accessToken,
    };
  }

  // Check if API is configured
  public isConfigured(): boolean {
    return Boolean(this.baseUrl);
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export class for testing
export { ApiService };
