import { useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import { NotificationState } from '@/types';
import { cn, formatRelativeTime } from '@/utils';

interface NotificationToastProps {
  notification: NotificationState;
  onClose: (id: string) => void;
}

export function NotificationToast({ notification, onClose }: NotificationToastProps) {
  const { id, type, title, message, timestamp, duration } = notification;

  useEffect(() => {
    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-success-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-error-500" />;
      default:
        return <Info className="h-5 w-5 text-primary-500" />;
    }
  };

  const getStyles = () => {
    const baseStyles = "border-l-4 bg-white dark:bg-gray-800 shadow-lg";
    
    switch (type) {
      case 'success':
        return `${baseStyles} border-success-500`;
      case 'warning':
        return `${baseStyles} border-warning-500`;
      case 'error':
        return `${baseStyles} border-error-500`;
      default:
        return `${baseStyles} border-primary-500`;
    }
  };

  return (
    <div className={cn(
      "max-w-sm w-full rounded-lg pointer-events-auto overflow-hidden",
      "animate-slide-up",
      getStyles()
    )}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {title}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {message}
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              {formatRelativeTime(timestamp)}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={() => onClose(id)}
              className={cn(
                "rounded-md inline-flex text-gray-400 hover:text-gray-500 dark:hover:text-gray-300",
                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              )}
            >
              <span className="sr-only">Close</span>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface NotificationContainerProps {
  notifications: NotificationState[];
  onClose: (id: string) => void;
  onClearAll: () => void;
}

export function NotificationContainer({ 
  notifications, 
  onClose, 
  onClearAll 
}: NotificationContainerProps) {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end z-50">
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
        {/* Clear all button */}
        {notifications.length > 1 && (
          <button
            onClick={onClearAll}
            className={cn(
              "pointer-events-auto px-3 py-1 text-xs font-medium rounded-md",
              "bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800",
              "hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
            )}
          >
            Clear All ({notifications.length})
          </button>
        )}
        
        {/* Notifications */}
        {notifications.map((notification) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onClose={onClose}
          />
        ))}
      </div>
    </div>
  );
}
