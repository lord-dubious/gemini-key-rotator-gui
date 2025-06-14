import { HealthStatus, Statistics, KeyState, LogEntry, ApiKey } from '@/types';
import { generateId } from '@/utils';

// Local storage keys
const STORAGE_KEYS = {
  API_KEYS: 'local-api-keys',
  LOGS: 'local-request-logs',
  STATS: 'local-stats',
  CONFIG: 'local-config'
};

// Mock API key rotation state
class LocalMockService {
  private apiKeys: ApiKey[] = [];
  private requestLogs: LogEntry[] = [];
  private isRunning = false;
  private simulationInterval?: NodeJS.Timeout;

  constructor() {
    this.loadFromStorage();
    this.startSimulation();
  }

  private loadFromStorage() {
    try {
      const savedKeys = localStorage.getItem(STORAGE_KEYS.API_KEYS);
      const savedLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
      
      if (savedKeys) {
        this.apiKeys = JSON.parse(savedKeys);
      } else {
        // Create some demo keys
        this.apiKeys = [
          {
            id: generateId(),
            name: 'Demo Key 1',
            key: 'AIzaSyDemo1234567890abcdef',
            isActive: true,
            createdAt: Date.now() - 86400000, // 1 day ago
            requestCount: 45,
            errorCount: 2,
            lastUsed: Date.now() - 300000, // 5 minutes ago
          },
          {
            id: generateId(),
            name: 'Demo Key 2', 
            key: 'AIzaSyDemo0987654321fedcba',
            isActive: true,
            createdAt: Date.now() - 172800000, // 2 days ago
            requestCount: 32,
            errorCount: 0,
            lastUsed: Date.now() - 600000, // 10 minutes ago
          },
          {
            id: generateId(),
            name: 'Demo Key 3',
            key: 'AIzaSyDemo5555666677778888',
            isActive: false,
            createdAt: Date.now() - 259200000, // 3 days ago
            requestCount: 78,
            errorCount: 15,
            lastUsed: Date.now() - 3600000, // 1 hour ago
            exhaustedUntil: Date.now() + 1800000, // Exhausted for 30 more minutes
          }
        ];
        this.saveToStorage();
      }

      if (savedLogs) {
        this.requestLogs = JSON.parse(savedLogs);
      }
    } catch (error) {
      console.warn('Failed to load from storage:', error);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.API_KEYS, JSON.stringify(this.apiKeys));
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(this.requestLogs.slice(-1000))); // Keep last 1000
    } catch (error) {
      console.warn('Failed to save to storage:', error);
    }
  }

  private startSimulation() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // Simulate API requests every 5-15 seconds
    this.simulationInterval = setInterval(() => {
      this.simulateRequest();
    }, Math.random() * 10000 + 5000);
  }

  private simulateRequest() {
    const activeKeys = this.apiKeys.filter(key => key.isActive && (!key.exhaustedUntil || key.exhaustedUntil < Date.now()));
    
    if (activeKeys.length === 0) return;

    // Pick a random active key
    const keyIndex = Math.floor(Math.random() * activeKeys.length);
    const selectedKey = activeKeys[keyIndex];
    const globalIndex = this.apiKeys.findIndex(k => k.id === selectedKey.id);

    // Simulate different response scenarios
    const scenarios = [
      { status: 200, weight: 70 }, // 70% success
      { status: 429, weight: 15 }, // 15% rate limit
      { status: 500, weight: 10 }, // 10% server error
      { status: 400, weight: 5 },  // 5% client error
    ];

    const random = Math.random() * 100;
    let cumulative = 0;
    let status = 200;

    for (const scenario of scenarios) {
      cumulative += scenario.weight;
      if (random <= cumulative) {
        status = scenario.status;
        break;
      }
    }

    // Simulate response time (50ms to 2000ms)
    const responseTime = Math.floor(Math.random() * 1950) + 50;

    // Create log entry
    const logEntry: LogEntry = {
      timestamp: Date.now(),
      keyIndex: globalIndex,
      status,
      endpoint: this.getRandomEndpoint(),
      responseTime,
    };

    this.requestLogs.push(logEntry);

    // Update key stats
    selectedKey.requestCount++;
    selectedKey.lastUsed = Date.now();

    if (status >= 400) {
      selectedKey.errorCount++;
      
      // If rate limited, mark key as exhausted for 10-30 minutes
      if (status === 429) {
        selectedKey.isActive = false;
        selectedKey.exhaustedUntil = Date.now() + (Math.random() * 1200000 + 600000); // 10-30 minutes
      }
    }

    // Occasionally recover exhausted keys
    this.apiKeys.forEach(key => {
      if (key.exhaustedUntil && key.exhaustedUntil < Date.now()) {
        key.isActive = true;
        key.exhaustedUntil = undefined;
      }
    });

    this.saveToStorage();
  }

  private getRandomEndpoint(): string {
    const endpoints = [
      '/v1beta2/models/gemini-2.5-pro:generateText',
      '/v1beta2/models/gemini-2.5-pro:generateContent',
      '/v1beta2/models/gemini-2.5-pro:streamGenerateContent',
      '/v1beta2/models/gemini-2.5-pro:countTokens',
    ];
    return endpoints[Math.floor(Math.random() * endpoints.length)];
  }

  // Public API methods
  async getHealth(): Promise<HealthStatus> {
    const now = Date.now();
    const activeKeys = this.apiKeys.filter(key => key.isActive && (!key.exhaustedUntil || key.exhaustedUntil < now));
    const exhaustedKeys = this.apiKeys.filter(key => !key.isActive || (key.exhaustedUntil && key.exhaustedUntil > now));

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (activeKeys.length === 0) {
      status = 'unhealthy';
    } else if (exhaustedKeys.length > activeKeys.length) {
      status = 'degraded';
    }

    return {
      status,
      timestamp: now,
      totalKeys: this.apiKeys.length,
      activeKeys: activeKeys.length,
      exhaustedKeys: exhaustedKeys.length,
    };
  }

  async getStatistics(): Promise<Statistics> {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    const recentLogs = this.requestLogs.filter(log => log.timestamp > oneHourAgo);

    const keyStates: KeyState[] = this.apiKeys.map((key, index) => ({
      index,
      isActive: key.isActive && (!key.exhaustedUntil || key.exhaustedUntil < now),
      requestCount: key.requestCount,
      errors: key.errorCount,
      lastUsed: key.lastUsed || 0,
      exhaustedUntil: key.exhaustedUntil || null,
    }));

    return {
      timestamp: now,
      totalRequests: this.requestLogs.length,
      recentRequests: recentLogs.length,
      keyStates,
      recentLogs: this.requestLogs.slice(-50), // Last 50 requests
    };
  }

  async testConnection(): Promise<boolean> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    return true;
  }

  async testGeminiRequest(prompt: string = 'Hello, world!'): Promise<any> {
    // Simulate Gemini API response
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    // Simulate request through rotator
    this.simulateRequest();
    
    return {
      candidates: [
        {
          content: {
            parts: [
              {
                text: `Mock response to: "${prompt}". This is a simulated Gemini API response for testing purposes.`
              }
            ]
          }
        }
      ]
    };
  }

  // Key management methods
  addApiKey(name: string, key: string): ApiKey {
    const newKey: ApiKey = {
      id: generateId(),
      name,
      key,
      isActive: true,
      createdAt: Date.now(),
      requestCount: 0,
      errorCount: 0,
    };

    this.apiKeys.push(newKey);
    this.saveToStorage();
    return newKey;
  }

  removeApiKey(id: string): boolean {
    const index = this.apiKeys.findIndex(key => key.id === id);
    if (index === -1) return false;

    this.apiKeys.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  toggleApiKey(id: string): boolean {
    const key = this.apiKeys.find(k => k.id === id);
    if (!key) return false;

    key.isActive = !key.isActive;
    if (key.isActive) {
      key.exhaustedUntil = undefined;
    }
    
    this.saveToStorage();
    return true;
  }

  getApiKeys(): ApiKey[] {
    return [...this.apiKeys];
  }

  clearLogs(): void {
    this.requestLogs = [];
    this.saveToStorage();
  }

  resetStats(): void {
    this.apiKeys.forEach(key => {
      key.requestCount = 0;
      key.errorCount = 0;
      key.lastUsed = undefined;
    });
    this.requestLogs = [];
    this.saveToStorage();
  }

  destroy(): void {
    this.isRunning = false;
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }
  }
}

// Export singleton instance
export const localMockService = new LocalMockService();

// Export class for testing
export { LocalMockService };
