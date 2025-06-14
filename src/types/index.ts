// API Key Management Types
export interface ApiKey {
  id: string;
  name: string;
  key: string;
  isActive: boolean;
  createdAt: number;
  lastUsed?: number;
  requestCount: number;
  errorCount: number;
  exhaustedUntil?: number;
}

export interface KeyState {
  index: number;
  isActive: boolean;
  requestCount: number;
  errors: number;
  lastUsed: number;
  exhaustedUntil: number | null;
}

// Monitoring and Statistics Types
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  totalKeys: number;
  activeKeys: number;
  exhaustedKeys: number;
}

export interface LogEntry {
  timestamp: number;
  keyIndex: number;
  status: number;
  endpoint: string;
  responseTime: number;
}

export interface Statistics {
  timestamp: number;
  totalRequests: number;
  recentRequests: number;
  keyStates: KeyState[];
  recentLogs: LogEntry[];
}

// Configuration Types
export interface RotatorConfig {
  endpoint: string;
  accessToken?: string;
  refreshInterval: number;
  alertThresholds: {
    errorRate: number;
    responseTime: number;
    exhaustedKeys: number;
  };
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  autoRefresh: boolean;
  refreshInterval: number;
  notifications: boolean;
  compactMode: boolean;
}

// UI State Types
export interface DashboardState {
  isLoading: boolean;
  error: string | null;
  lastUpdated: number;
  health: HealthStatus | null;
  stats: Statistics | null;
}

export interface NotificationState {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: number;
  duration?: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

// Chart and Visualization Types
export interface ChartDataPoint {
  timestamp: number;
  value: number;
  label?: string;
}

export interface MetricData {
  current: number;
  previous: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

// Form Types
export interface AddKeyFormData {
  name: string;
  key: string;
}

export interface SettingsFormData {
  endpoint: string;
  accessToken: string;
  refreshInterval: number;
  notifications: boolean;
  theme: 'light' | 'dark' | 'system';
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
}

// Export utility types
export type Theme = 'light' | 'dark' | 'system';
export type NotificationType = 'success' | 'warning' | 'error' | 'info';
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
export type SortDirection = 'asc' | 'desc';
export type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d';
