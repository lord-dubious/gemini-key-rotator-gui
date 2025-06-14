// Header component
import { Moon, Sun, Monitor, Settings, RefreshCw, Activity } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/utils';

interface HeaderProps {
  onSettingsClick: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdated: number;
}

export function Header({ onSettingsClick, onRefresh, isRefreshing, lastUpdated }: HeaderProps) {
  const { theme, setTheme } = useTheme();

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return 'Never';
    const now = Date.now();
    const diff = now - lastUpdated;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
            <Activity className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Gemini Key Rotator
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              API Management Dashboard
            </p>
          </div>
        </div>

        {/* Status and Controls */}
        <div className="flex items-center space-x-4">
          {/* Last Updated */}
          <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <span>Updated:</span>
            <span className="font-medium">{formatLastUpdated()}</span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className={cn(
              "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600",
              "text-gray-700 dark:text-gray-300",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            title="Refresh data"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={cycleTheme}
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-lg transition-colors",
              "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600",
              "text-gray-700 dark:text-gray-300"
            )}
            title={`Current theme: ${theme}`}
          >
            {getThemeIcon()}
          </button>

          {/* Settings Button */}
          <button
            onClick={onSettingsClick}
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-lg transition-colors",
              "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600",
              "text-gray-700 dark:text-gray-300"
            )}
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
