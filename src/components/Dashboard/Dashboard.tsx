// Dashboard component
import { HealthStatus, Statistics } from '@/types';
import { formatTimestamp, formatRelativeTime, getStatusCodeColor, cn } from '@/utils';
import { CheckCircle, AlertTriangle, XCircle, Clock, Activity, Key, TrendingUp } from 'lucide-react';

interface DashboardProps {
  health: HealthStatus | null;
  stats: Statistics | null;
  isLoading: boolean;
  error: string | null;
}

function StatusIndicator({ status, label }: { status: string; label: string }) {
  const getStatusConfig = () => {
    switch (status) {
      case 'healthy':
        return { icon: CheckCircle, color: 'text-success-600 bg-success-100 dark:text-success-400 dark:bg-success-900/20' };
      case 'degraded':
        return { icon: AlertTriangle, color: 'text-warning-600 bg-warning-100 dark:text-warning-400 dark:bg-warning-900/20' };
      case 'unhealthy':
        return { icon: XCircle, color: 'text-error-600 bg-error-100 dark:text-error-400 dark:bg-error-900/20' };
      default:
        return { icon: Clock, color: 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800' };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={cn("inline-flex items-center space-x-2 rounded-full px-3 py-1.5", config.color)}>
      <Icon className="h-4 w-4" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, color = 'primary' }: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
}) {
  const getColorClasses = () => {
    switch (color) {
      case 'success':
        return 'text-success-600 bg-success-100 dark:text-success-400 dark:bg-success-900/20';
      case 'warning':
        return 'text-warning-600 bg-warning-100 dark:text-warning-400 dark:bg-warning-900/20';
      case 'error':
        return 'text-error-600 bg-error-100 dark:text-error-400 dark:bg-error-900/20';
      default:
        return 'text-primary-600 bg-primary-100 dark:text-primary-400 dark:bg-primary-900/20';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="font-medium text-gray-600 dark:text-gray-400 text-base">
            {title}
          </p>
          <p className="mt-2 font-bold text-gray-900 dark:text-white text-2xl">
            {value}
          </p>
        </div>
        <div className={cn("rounded-lg flex items-center justify-center h-12 w-12 p-2.5", getColorClasses())}>
          <Icon className="h-7 w-7" />
        </div>
      </div>
    </div>
  );
}

export function Dashboard({ health, stats, error }: DashboardProps) {
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-4">
          <h3 className="text-lg font-medium text-error-800 dark:text-error-200 mb-2">
            Connection Error
          </h3>
          <p className="text-error-600 dark:text-error-400">
            {error}
          </p>
          <p className="text-sm text-error-500 dark:text-error-500 mt-2">
            The app is running in local demo mode with simulated data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor your API key rotation and usage
          </p>
        </div>
        
        {health && (
          <StatusIndicator
            status={health.status}
            label={`System ${health.status}`}
          />
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <MetricCard
          title="Total Keys"
          value={health?.totalKeys || 0}
          icon={Key}
          color="primary"
        />
        <MetricCard
          title="Active Keys"
          value={health?.activeKeys || 0}
          icon={Activity}
          color={health?.activeKeys ? 'success' : 'error'}
        />
        <MetricCard
          title="Exhausted Keys"
          value={health?.exhaustedKeys || 0}
          icon={AlertTriangle}
          color={health?.exhaustedKeys ? 'warning' : 'success'}
        />
        <MetricCard
          title="Total Requests"
          value={stats?.totalRequests || 0}
          icon={TrendingUp}
          color="primary"
        />
        <MetricCard
          title="Recent Requests"
          value={stats?.recentRequests || 0}
          icon={Clock}
          color="primary"
        />
        <MetricCard
          title="Avg Response"
          value={stats?.recentLogs.length ? 
            `${Math.round(stats.recentLogs.reduce((sum, log) => sum + log.responseTime, 0) / stats.recentLogs.length)}ms` : 
            '0ms'
          }
          icon={Clock}
          color="success"
        />
      </div>

      {/* Key Status and Activity Grid */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Key States */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              API Key Status
            </h3>
            
            {stats.keyStates.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No API keys configured
              </p>
            ) : (
              <div className="space-y-3">
                {stats.keyStates.map((keyState, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Key #{index + 1}
                      </span>
                      <span className={cn(
                        "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium",
                        keyState.isActive 
                          ? "bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-300"
                          : "bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-300"
                      )}>
                        {keyState.isActive ? 'Active' : 'Exhausted'}
                      </span>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {keyState.requestCount} requests
                      </div>
                      {keyState.errors > 0 && (
                        <div className="text-xs text-error-600 dark:text-error-400">
                          {keyState.errors} errors
                        </div>
                      )}
                      {keyState.lastUsed > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          {formatRelativeTime(keyState.lastUsed)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Activity
            </h3>
            
            {!stats.recentLogs || stats.recentLogs.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No recent activity
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {stats.recentLogs.slice(-10).reverse().map((log, index) => (
                  <div
                    key={`${log.timestamp}-${index}`}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                  >
                    <div className="flex items-center space-x-3">
                      <span className={`text-sm font-mono ${getStatusCodeColor(log.status)}`}>
                        {log.status}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-32">
                        {log.endpoint}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        Key #{log.keyIndex + 1}
                      </span>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        {log.responseTime}ms
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-600">
                        {formatRelativeTime(log.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* System Information */}
      {health && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            System Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {health.totalKeys}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Keys
              </div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-success-600 dark:text-success-400">
                {health.activeKeys}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Active Keys
              </div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-warning-600 dark:text-warning-400">
                {health.exhaustedKeys}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Exhausted Keys
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
            Last updated: {formatTimestamp(health.timestamp)}
          </div>
        </div>
      )}
    </div>
  );
}
