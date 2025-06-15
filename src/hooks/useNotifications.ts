import { useState, useCallback, useRef, useEffect } from 'react';
import { NotificationState, NotificationType } from '@/types';
import { generateId } from '@/utils';

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationState[]>([]);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addNotification = useCallback((
    type: NotificationType,
    title: string,
    message: string,
    duration?: number
  ) => {
    const notification: NotificationState = {
      id: generateId(),
      type,
      title,
      message,
      timestamp: Date.now(),
      duration: duration ?? (type === 'error' ? 0 : 5000), // Errors persist until dismissed
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-remove notification after duration
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        removeNotification(notification.id);
      }, notification.duration);
      timeouts.current.push(timer);
    }

    return notification.id;
  }, [removeNotification]);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Cleanup timers on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      timeouts.current.forEach(clearTimeout);
      timeouts.current = [];
    };
  }, []);

  // Convenience methods
  const success = useCallback((title: string, message: string, duration?: number) => {
    return addNotification('success', title, message, duration);
  }, [addNotification]);

  const error = useCallback((title: string, message: string, duration?: number) => {
    return addNotification('error', title, message, duration);
  }, [addNotification]);

  const warning = useCallback((title: string, message: string, duration?: number) => {
    return addNotification('warning', title, message, duration);
  }, [addNotification]);

  const info = useCallback((title: string, message: string, duration?: number) => {
    return addNotification('info', title, message, duration);
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info,
  };
}
