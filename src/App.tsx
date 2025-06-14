import { useState, useEffect } from 'react';
import { Header } from '@/components/Layout/Header';
import { Sidebar } from '@/components/Layout/Sidebar';
import { NotificationContainer } from '@/components/Layout/NotificationToast';
import { Dashboard } from '@/components/Dashboard/Dashboard';
import { Settings } from '@/components/Settings/Settings';
import { useTheme } from '@/hooks/useTheme';
import { useNotifications } from '@/hooks/useNotifications';
import { useMonitoring } from '@/hooks/useMonitoring';
import { apiService } from '@/services/api';

// Placeholder components for other tabs
const PlaceholderComponent = ({ title }: { title: string }) => (
  <div className="p-6">
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        {title}
      </h2>
      <p className="text-gray-600 dark:text-gray-400">
        This feature is coming soon. The {title.toLowerCase()} functionality will be available in a future update.
      </p>
      {title === 'API Keys Management' && apiService.isLocalMode() && (
        <div className="mt-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
          <p className="text-sm text-primary-700 dark:text-primary-300">
            <strong>Local Demo Mode:</strong> In the full version, you would be able to add, remove, and manage your API keys here.
            The current demo shows simulated keys that rotate automatically.
          </p>
        </div>
      )}
    </div>
  </div>
);

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showSettings, setShowSettings] = useState(false);
  useTheme(); // Initialize theme
  const {
    notifications,
    removeNotification,
    clearAll,
    success,
    error,
    info
  } = useNotifications();

  // Check if API is configured on startup (run once on mount)
  useEffect(() => {
    const config = apiService.getConfig();
    if (config.isLocalMode) {
      info(
        'Welcome to Local Demo Mode!',
        'The app is running with simulated data. Switch to Remote API Mode in Settings to connect to your Deno Edge Function.',
        10000
      );
    } else if (!config.endpoint) {
      setShowSettings(true);
      info(
        'Welcome!',
        'Please configure your API endpoint to get started.',
        10000
      );
    }
  }, []); // Run once on mount only

  const {
    health,
    stats,
    isLoading,
    error: monitoringError,
    lastUpdated,
    refresh,
  } = useMonitoring({
    autoRefresh: !showSettings && apiService.isConfigured(),
    refreshInterval: 30000,
    onError: (errorMessage) => {
      error('Monitoring Error', errorMessage);
    },
  });

  const handleSettingsSave = () => {
    setShowSettings(false);
    success('Settings Saved', 'Your configuration has been updated successfully.');
    // Trigger a refresh after settings are saved
    setTimeout(() => {
      refresh();
    }, 1000);
  };

  const handleRefresh = () => {
    refresh();
    info('Refreshing', 'Updating dashboard data...');
  };

  const renderContent = () => {
    if (showSettings) {
      return (
        <Settings
          onSave={handleSettingsSave}
          onNotification={(type, title, message) => {
            switch (type) {
              case 'success':
                success(title, message);
                break;
              case 'error':
                error(title, message);
                break;
              default:
                info(title, message);
            }
          }}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            health={health}
            stats={stats}
            isLoading={isLoading}
            error={monitoringError}
          />
        );
      case 'keys':
        return <PlaceholderComponent title="API Keys Management" />;
      case 'monitoring':
        return <PlaceholderComponent title="Real-time Monitoring" />;
      case 'analytics':
        return <PlaceholderComponent title="Usage Analytics" />;
      case 'logs':
        return <PlaceholderComponent title="Request Logs" />;
      case 'alerts':
        return <PlaceholderComponent title="System Alerts" />;
      case 'security':
        return <PlaceholderComponent title="Security Settings" />;
      case 'settings':
        return (
          <Settings
            onSave={() => {
              success('Settings Saved', 'Your configuration has been updated successfully.');
              refresh();
            }}
            onNotification={(type, title, message) => {
              switch (type) {
                case 'success':
                  success(title, message);
                  break;
                case 'error':
                  error(title, message);
                  break;
                default:
                  info(title, message);
              }
            }}
          />
        );
      default:
        return <PlaceholderComponent title="Page Not Found" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex h-screen">
        {/* Sidebar */}
        {!showSettings && (
          <Sidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header
            onSettingsClick={() => setShowSettings(!showSettings)}
            onRefresh={handleRefresh}
            isRefreshing={isLoading}
            lastUpdated={lastUpdated}
          />

          {/* Content */}
          <main className="flex-1 overflow-y-auto">
            {renderContent()}
          </main>
        </div>
      </div>

      {/* Notifications */}
      <NotificationContainer
        notifications={notifications}
        onClose={removeNotification}
        onClearAll={clearAll}
      />
    </div>
  );
}

export default App;
