// Sidebar component
import { 
  BarChart3, 
  Key, 
  Activity, 
  Settings, 
  AlertTriangle,
  TrendingUp,
  Clock,
  Shield
} from 'lucide-react';
import { cn } from '@/utils';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isCollapsed?: boolean;
}

const navigationItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: BarChart3,
    description: 'Overview and metrics',
  },
  {
    id: 'keys',
    label: 'API Keys',
    icon: Key,
    description: 'Manage your keys',
  },
  {
    id: 'monitoring',
    label: 'Monitoring',
    icon: Activity,
    description: 'Real-time status',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: TrendingUp,
    description: 'Usage analytics',
  },
  {
    id: 'logs',
    label: 'Request Logs',
    icon: Clock,
    description: 'Request history',
  },
  {
    id: 'alerts',
    label: 'Alerts',
    icon: AlertTriangle,
    description: 'System alerts',
  },
];

const bottomItems = [
  {
    id: 'security',
    label: 'Security',
    icon: Shield,
    description: 'Security settings',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    description: 'App configuration',
  },
];

export function Sidebar({ activeTab, onTabChange, isCollapsed = false }: SidebarProps) {
  const renderNavItem = (item: typeof navigationItems[0]) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;

    return (
      <button
        key={item.id}
        onClick={() => onTabChange(item.id)}
        className={cn(
          "w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-colors group",
          isActive
            ? "bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200"
        )}
        title={isCollapsed ? item.label : undefined}
      >
        <Icon className={cn(
          "h-5 w-5 flex-shrink-0",
          isActive 
            ? "text-primary-600 dark:text-primary-400" 
            : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
        )} />
        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm">{item.label}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {item.description}
            </div>
          </div>
        )}
      </button>
    );
  };

  return (
    <aside className={cn(
      "bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-200",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <div className="space-y-1">
          {navigationItems.map(renderNavItem)}
        </div>
      </nav>

      {/* Bottom Items */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-1">
        {bottomItems.map(renderNavItem)}
      </div>

      {/* Collapse Toggle */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            v1.0.0
          </div>
        </div>
      )}
    </aside>
  );
}
