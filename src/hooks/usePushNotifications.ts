import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';

export interface NotificationOptions {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface UsePushNotificationsOptions {
  enabled?: boolean;
  defaultDuration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export interface UsePushNotificationsReturn {
  isSupported: boolean;
  isEnabled: boolean;
  isSubscribed: boolean;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  showNotification: (options: NotificationOptions) => void;
  showPriceAlert: (symbol: string, price: number, change: number) => void;
  showOrderUpdate: (orderId: string, status: string, details?: string) => void;
  showPortfolioUpdate: (totalValue: number, change: number) => void;
  showSwapComplete: (fromToken: string, toToken: string, amount: string) => void;
}

export function usePushNotifications(options: UsePushNotificationsOptions = {}): UsePushNotificationsReturn {
  const {
    enabled = true,
    defaultDuration = 5000,
    position = 'top-right',
  } = options;

  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  const { toast } = useToast();

  // Check if notifications are supported
  useEffect(() => {
    const supported = 'Notification' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      setIsEnabled(Notification.permission === 'granted');
    }
  }, []);

  // Enable notifications
  const enable = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Notifications are not supported in this browser');
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      setIsEnabled(result === 'granted');
      
      if (result === 'granted') {
        toast({
          title: 'Notifications Enabled',
          description: 'You will now receive real-time updates',
          duration: defaultDuration,
        });
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      throw error;
    }
  }, [isSupported, toast, defaultDuration]);

  // Disable notifications
  const disable = useCallback(async () => {
    setIsEnabled(false);
    setIsSubscribed(false);
    
    toast({
      title: 'Notifications Disabled',
      description: 'Real-time updates have been disabled',
      duration: defaultDuration,
    });
  }, [toast, defaultDuration]);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!isEnabled) {
      await enable();
    }

    if (isEnabled) {
      setIsSubscribed(true);
      toast({
        title: 'Subscribed to Updates',
        description: 'You will receive real-time notifications',
        duration: defaultDuration,
      });
    }
  }, [isEnabled, enable, toast, defaultDuration]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    setIsSubscribed(false);
    toast({
      title: 'Unsubscribed from Updates',
      description: 'Real-time notifications have been disabled',
      duration: defaultDuration,
    });
  }, [toast, defaultDuration]);

  // Show a generic notification
  const showNotification = useCallback((options: NotificationOptions) => {
    const {
      title,
      message,
      type = 'info',
      duration = defaultDuration,
      action,
    } = options;

    // Show toast notification
    toast({
      title,
      description: message,
      duration,
      variant: type === 'error' ? 'destructive' : 'default',
    });

    // Show browser notification if enabled and subscribed
    if (isEnabled && isSubscribed && permission === 'granted') {
      const notification = new Notification(title, {
        body: message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'unite-defi-notification',
        requireInteraction: false,
        silent: false,
      });

      if (action) {
        notification.onclick = () => {
          action.onClick();
          notification.close();
        };
      }

      // Auto-close after duration
      setTimeout(() => {
        notification.close();
      }, duration);
    }
  }, [isEnabled, isSubscribed, permission, toast, defaultDuration]);

  // Show price alert notification
  const showPriceAlert = useCallback((symbol: string, price: number, change: number) => {
    const isPositive = change >= 0;
    const type = isPositive ? 'success' : 'warning';
    const changeText = isPositive ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`;

    showNotification({
      title: `${symbol} Price Alert`,
      message: `${symbol} is now $${price.toFixed(2)} (${changeText})`,
      type,
      duration: 8000,
      action: {
        label: 'View Chart',
        onClick: () => {
          // Navigate to price chart
          window.open(`/portfolio?symbol=${symbol}`, '_blank');
        },
      },
    });
  }, [showNotification]);

  // Show order update notification
  const showOrderUpdate = useCallback((orderId: string, status: string, details?: string) => {
    const getStatusInfo = (status: string) => {
      switch (status.toLowerCase()) {
        case 'confirmed':
          return { type: 'success' as const, icon: '✅' };
        case 'failed':
          return { type: 'error' as const, icon: '❌' };
        case 'processing':
          return { type: 'info' as const, icon: '⏳' };
        default:
          return { type: 'info' as const, icon: '📋' };
      }
    };

    const statusInfo = getStatusInfo(status);
    const message = details ? `${status} - ${details}` : status;

    showNotification({
      title: `Order ${orderId.slice(0, 8)}...`,
      message: `${statusInfo.icon} ${message}`,
      type: statusInfo.type,
      duration: 10000,
      action: {
        label: 'View Order',
        onClick: () => {
          // Navigate to order details
          window.open(`/orders/${orderId}`, '_blank');
        },
      },
    });
  }, [showNotification]);

  // Show portfolio update notification
  const showPortfolioUpdate = useCallback((totalValue: number, change: number) => {
    const isPositive = change >= 0;
    const type = isPositive ? 'success' : 'warning';
    const changeText = isPositive ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`;

    showNotification({
      title: 'Portfolio Update',
      message: `Total value: $${totalValue.toLocaleString()} (${changeText})`,
      type,
      duration: 6000,
      action: {
        label: 'View Portfolio',
        onClick: () => {
          // Navigate to portfolio
          window.open('/portfolio', '_blank');
        },
      },
    });
  }, [showNotification]);

  // Show swap completion notification
  const showSwapComplete = useCallback((fromToken: string, toToken: string, amount: string) => {
    showNotification({
      title: 'Swap Completed',
      message: `Successfully swapped ${amount} ${fromToken} to ${toToken}`,
      type: 'success',
      duration: 8000,
      action: {
        label: 'View Transaction',
        onClick: () => {
          // Navigate to transaction history
          window.open('/orders', '_blank');
        },
      },
    });
  }, [showNotification]);

  return {
    isSupported,
    isEnabled,
    isSubscribed,
    enable,
    disable,
    subscribe,
    unsubscribe,
    showNotification,
    showPriceAlert,
    showOrderUpdate,
    showPortfolioUpdate,
    showSwapComplete,
  };
} 