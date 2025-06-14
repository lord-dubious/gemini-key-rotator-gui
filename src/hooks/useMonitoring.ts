import { useState, useEffect, useCallback, useRef } from 'react';
import { HealthStatus, Statistics, DashboardState } from '@/types';
import { apiService } from '@/services/api';
import { storage } from '@/utils';

interface UseMonitoringOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  onError?: (error: string) => void;
}

export function useMonitoring(options: UseMonitoringOptions = {}) {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds default
    onError,
  } = options;

  const [state, setState] = useState<DashboardState>(() => ({
    isLoading: false,
    error: null,
    lastUpdated: 0,
    health: null,
    stats: null,
  }));

  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const mountedRef = useRef(true);

  // Load cached data on mount
  useEffect(() => {
    const cachedHealth = storage.get<HealthStatus | null>('cached-health', null);
    const cachedStats = storage.get<Statistics | null>('cached-stats', null);
    const lastUpdated = storage.get<number>('last-updated', 0);

    if (cachedHealth || cachedStats) {
      setState(prev => ({
        ...prev,
        health: cachedHealth,
        stats: cachedStats,
        lastUpdated,
      }));
    }

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchData = useCallback(async (showLoading = true) => {
    if (!apiService.isConfigured()) {
      const errorMessage = 'API endpoint not configured';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
      onError?.(errorMessage);
      return;
    }

    if (showLoading) {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
    }

    try {
      const [healthResponse, statsResponse] = await Promise.allSettled([
        apiService.getHealth(),
        apiService.getStatistics(),
      ]);

      if (!mountedRef.current) return;

      const health = healthResponse.status === 'fulfilled' ? healthResponse.value : null;
      const stats = statsResponse.status === 'fulfilled' ? statsResponse.value : null;
      const now = Date.now();

      // Cache the data
      if (health) storage.set('cached-health', health);
      if (stats) storage.set('cached-stats', stats);
      storage.set('last-updated', now);

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
        health,
        stats,
        lastUpdated: now,
      }));

      // Check for alerts
      if (health && stats) {
        checkAlerts(health, stats);
      }

    } catch (error) {
      if (!mountedRef.current) return;

      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      onError?.(errorMessage);
    }
  }, [onError]);

  const checkAlerts = useCallback((health: HealthStatus, stats: Statistics) => {
    // Check for unhealthy status
    if (health.status === 'unhealthy' || health.activeKeys === 0) {
      onError?.('All API keys are exhausted or unavailable');
    }

    // Check for high error rates
    const recentErrors = stats.recentLogs.filter(log => log.status >= 400).length;
    const errorRate = stats.recentLogs.length > 0 ? recentErrors / stats.recentLogs.length : 0;
    
    if (errorRate > 0.5 && stats.recentLogs.length > 10) {
      onError?.(`High error rate detected: ${(errorRate * 100).toFixed(1)}%`);
    }

    // Check for slow response times
    const avgResponseTime = stats.recentLogs.length > 0
      ? stats.recentLogs.reduce((sum, log) => sum + log.responseTime, 0) / stats.recentLogs.length
      : 0;
    
    if (avgResponseTime > 5000) { // 5 seconds
      onError?.(`Slow response times detected: ${avgResponseTime.toFixed(0)}ms average`);
    }
  }, [onError]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const startInterval = () => {
      intervalRef.current = setInterval(() => {
        fetchData(false); // Don't show loading for auto-refresh
      }, refreshInterval);
    };

    // Initial fetch
    fetchData();
    
    // Start interval
    startInterval();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, fetchData]);

  const refresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  const startAutoRefresh = useCallback(() => {
    if (intervalRef.current) return;
    
    intervalRef.current = setInterval(() => {
      fetchData(false);
    }, refreshInterval);
  }, [fetchData, refreshInterval]);

  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, []);

  return {
    ...state,
    refresh,
    startAutoRefresh,
    stopAutoRefresh,
    isAutoRefreshing: Boolean(intervalRef.current),
  };
}
