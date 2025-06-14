import { HealthStatus, Statistics, ApiResponse } from '@/types';
import { retry } from '@/utils';
import { localMockService } from './localMockService';

class ApiService {
  private baseUrl: string = '';
  private accessToken: string = '';
  private abortController: AbortController | null = null;
  private useLocalMode: boolean = true; // Default to local mode

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
        this.useLocalMode = !this.baseUrl; // Use local mode if no endpoint configured
      }
    } catch (error) {
      console.warn('Failed to load API configuration:', error);
    }
  }

  public updateConfig(endpoint: string, accessToken?: string): void {
    this.baseUrl = endpoint.replace(/\/$/, ''); // Remove trailing slash
    this.accessToken = accessToken || '';
    this.useLocalMode = !this.baseUrl; // Switch to remote mode if endpoint provided
    
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
    if (this.useLocalMode) {
      return await localMockService.getHealth();
    }

    const response = await retry(() => this.makeRequest<HealthStatus>('/health'));
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch health status');
    }

    return response.data;
  }

  // Statistics endpoint
  public async getStatistics(): Promise<Statistics> {
    if (this.useLocalMode) {
      return await localMockService.getStatistics();
    }

    const response = await retry(() => this.makeRequest<Statistics>('/stats'));
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch statistics');
    }

    return response.data;
  }

  // Test API connection
  public async testConnection(): Promise<boolean> {
    try {
      if (this.useLocalMode) {
        return await localMockService.testConnection();
      }
      
      await this.getHealth();
      return true;
    } catch {
      return false;
    }
  }

  // Test a Gemini API request through the rotator
  public async testGeminiRequest(prompt: string = 'Hello, world!'): Promise<any> {
    if (this.useLocalMode) {
      return await localMockService.testGeminiRequest(prompt);
    }

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
  public getConfig(): { endpoint: string; accessToken: string; isLocalMode: boolean } {
    return {
      endpoint: this.baseUrl,
      accessToken: this.accessToken,
      isLocalMode: this.useLocalMode,
    };
  }

  // Check if API is configured
  public isConfigured(): boolean {
    return this.useLocalMode || Boolean(this.baseUrl);
  }

  // Local mode specific methods
  public getLocalApiKeys() {
    if (!this.useLocalMode) return [];
    return localMockService.getApiKeys();
  }

  public addLocalApiKey(name: string, key: string) {
    if (!this.useLocalMode) throw new Error('Not in local mode');
    return localMockService.addApiKey(name, key);
  }

  public removeLocalApiKey(id: string) {
    if (!this.useLocalMode) throw new Error('Not in local mode');
    return localMockService.removeApiKey(id);
  }

  public toggleLocalApiKey(id: string) {
    if (!this.useLocalMode) throw new Error('Not in local mode');
    return localMockService.toggleApiKey(id);
  }

  public clearLocalLogs() {
    if (!this.useLocalMode) throw new Error('Not in local mode');
    localMockService.clearLogs();
  }

  public resetLocalStats() {
    if (!this.useLocalMode) throw new Error('Not in local mode');
    localMockService.resetStats();
  }

  // Switch between local and remote mode
  public setLocalMode(enabled: boolean): void {
    this.useLocalMode = enabled;
    if (enabled) {
      this.baseUrl = '';
      this.accessToken = '';
    }
  }

  public isLocalMode(): boolean {
    return this.useLocalMode;
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export class for testing
export { ApiService };
