import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
    style?: 'primary' | 'secondary' | 'danger';
  }>;
  progress?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  updateNotification: (id: string, updates: Partial<Notification>) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // 🔔 Bildirim sesi çalma fonksiyonu
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // 1.5 saniyelik bildirim sesi
      const duration = 1.5;
      const sampleRate = audioContext.sampleRate;
      const buffer = audioContext.createBuffer(2, duration * sampleRate, sampleRate);
      
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        
        for (let i = 0; i < channelData.length; i++) {
          const time = i / sampleRate;
          
          // Bildirim sesi: Kısa, tatlı, dikkat çekici
          // İlk ton (0-0.3 saniye)
          const note1Freq = 880; // A5
          const note1 = Math.sin(2 * Math.PI * note1Freq * time) * 0.4;
          
          // İkinci ton (0.3-0.6 saniye)
          const note2Freq = 1047; // C6
          const note2 = Math.sin(2 * Math.PI * note2Freq * time) * 0.4;
          
          // Üçüncü ton (0.6-1.5 saniye)
          const note3Freq = 1319; // E6
          const note3 = Math.sin(2 * Math.PI * note3Freq * time) * 0.3;
          
          // Hangi notu çalacağımızı belirle
          let currentNote = 0;
          if (time < 0.3) {
            currentNote = note1;
          } else if (time < 0.6) {
            currentNote = note2;
          } else {
            currentNote = note3;
          }
          
          // Envelope: Her nota için ayrı
          let envelope = 0;
          if (time < 0.3) {
            const noteTime = time;
            envelope = Math.sin(Math.PI * noteTime / 0.3); // Bell curve
          } else if (time < 0.6) {
            const noteTime = time - 0.3;
            envelope = Math.sin(Math.PI * noteTime / 0.3);
          } else {
            const noteTime = time - 0.6;
            envelope = Math.sin(Math.PI * noteTime / 0.9) * Math.exp(-noteTime * 2); // Decay
          }
          
          channelData[i] = currentNote * envelope * 0.15; // %15 ses seviyesi (daha yumuşak)
        }
      }
      
      // Bildirim sesini çal
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start();
      
      setTimeout(() => {
        audioContext.close();
      }, duration * 1000 + 200);
      
    } catch (error) {
      console.log('Notification sound error:', error);
    }
  };

  const addNotification = (notification: Omit<Notification, 'id'>): string => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? (notification.persistent ? undefined : 5000)
    };

    setNotifications(prev => [...prev, newNotification]);

    // 🔔 Bildirim sesi çal (sadece error, warning, success için)
    if (['error', 'warning', 'success'].includes(notification.type)) {
      playNotificationSound();
    }

    // Auto-remove after duration
    if (newNotification.duration && !newNotification.persistent) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const updateNotification = (id: string, updates: Partial<Notification>) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, ...updates } : n
    ));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      updateNotification,
      clearAll
    }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}

function NotificationContainer() {
  const { notifications } = useNotifications();

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm">
      {notifications.map(notification => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
    </div>
  );
}

function NotificationItem({ notification }: { notification: Notification }) {
  const { removeNotification } = useNotifications();
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      removeNotification(notification.id);
    }, 200);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  };

  const getColors = () => {
    switch (notification.type) {
      case 'success': return 'border-green-500 bg-green-500/10';
      case 'error': return 'border-red-500 bg-red-500/10';
      case 'warning': return 'border-yellow-500 bg-yellow-500/10';
      case 'info': return 'border-blue-500 bg-blue-500/10';
      default: return 'border-gray-500 bg-gray-500/10';
    }
  };

  return (
    <div
      className={`
        transform transition-all duration-200 ease-out
        ${isVisible && !isRemoving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${getColors()}
        border rounded-lg p-4 shadow-lg backdrop-blur-sm
        max-w-sm w-full
      `}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0">{getIcon()}</span>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-semibold text-[var(--color-text)] truncate">
              {notification.title}
            </h4>
            {!notification.persistent && (
              <button
                onClick={handleRemove}
                className="text-[var(--color-textSecondary)] hover:text-[var(--color-text)] transition-colors ml-2"
              >
                ✕
              </button>
            )}
          </div>
          
          {notification.message && (
            <p className="text-xs text-[var(--color-textSecondary)] mb-2 leading-relaxed">
              {notification.message}
            </p>
          )}
          
          {notification.progress !== undefined && (
            <div className="mb-2">
              <div className="flex items-center justify-between text-xs text-[var(--color-textSecondary)] mb-1">
                <span>İlerleme</span>
                <span>{Math.round(notification.progress)}%</span>
              </div>
              <div className="w-full bg-[var(--color-surface)] rounded-full h-1.5">
                <div
                  className="bg-[var(--color-primary)] h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${notification.progress}%` }}
                />
              </div>
            </div>
          )}
          
          {notification.actions && notification.actions.length > 0 && (
            <div className="flex gap-2 mt-2">
              {notification.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => {
                    action.action();
                    if (!notification.persistent) {
                      handleRemove();
                    }
                  }}
                  className={`
                    px-3 py-1 text-xs rounded transition-colors
                    ${action.style === 'primary' ? 'bg-[var(--color-primary)] text-white hover:opacity-80' :
                      action.style === 'danger' ? 'bg-[var(--color-error)] text-white hover:opacity-80' :
                      'bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-hover)] border border-[var(--color-border)]'
                    }
                  `}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Utility functions for common notification types
export const notificationHelpers = {
  success: (title: string, message?: string, duration?: number) => ({
    type: 'success' as const,
    title,
    message,
    duration
  }),
  
  error: (title: string, message?: string, persistent = false) => ({
    type: 'error' as const,
    title,
    message,
    persistent
  }),
  
  warning: (title: string, message?: string, duration?: number) => ({
    type: 'warning' as const,
    title,
    message,
    duration
  }),
  
  info: (title: string, message?: string, duration?: number) => ({
    type: 'info' as const,
    title,
    message,
    duration
  }),
  
  progress: (title: string, message?: string) => ({
    type: 'info' as const,
    title,
    message,
    persistent: true,
    progress: 0
  }),
  
  withActions: (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    actions: Array<{
      label: string;
      action: () => void;
      style?: 'primary' | 'secondary' | 'danger';
    }>
  ) => ({
    type,
    title,
    message,
    actions,
    persistent: true
  })
};

// Progress notification hook
export function useProgressNotification() {
  const { addNotification, updateNotification, removeNotification } = useNotifications();
  
  const startProgress = (title: string, message?: string) => {
    const id = addNotification(notificationHelpers.progress(title, message));
    
    return {
      update: (progress: number, newMessage?: string) => {
        updateNotification(id, {
          progress,
          ...(newMessage && { message: newMessage })
        });
      },
      complete: (successTitle?: string, successMessage?: string) => {
        updateNotification(id, {
          type: 'success',
          title: successTitle || 'Tamamlandı',
          message: successMessage,
          progress: 100,
          persistent: false,
          duration: 3000
        });
        setTimeout(() => removeNotification(id), 3000);
      },
      error: (errorTitle?: string, errorMessage?: string) => {
        updateNotification(id, {
          type: 'error',
          title: errorTitle || 'Hata',
          message: errorMessage,
          persistent: false,
          duration: 5000
        });
        setTimeout(() => removeNotification(id), 5000);
      },
      remove: () => removeNotification(id)
    };
  };
  
  return { startProgress };
}

// Status indicator component
export function StatusIndicator() {
  const { notifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  
  const hasErrors = notifications.some(n => n.type === 'error');
  const hasWarnings = notifications.some(n => n.type === 'warning');
  const inProgress = notifications.some(n => n.progress !== undefined && n.progress < 100);
  
  const getStatusColor = () => {
    if (hasErrors) return 'text-red-500';
    if (hasWarnings) return 'text-yellow-500';
    if (inProgress) return 'text-blue-500';
    return 'text-green-500';
  };
  
  const getStatusIcon = () => {
    if (hasErrors) return '❌';
    if (hasWarnings) return '⚠️';
    if (inProgress) return '🔄';
    return '✅';
  };
  
  if (notifications.length === 0) return null;
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${getStatusColor()} hover:bg-[var(--color-hover)] transition-colors`}
      >
        <span className={inProgress ? 'animate-spin' : ''}>{getStatusIcon()}</span>
        <span>{notifications.length}</span>
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute bottom-full right-0 mb-2 w-80 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
            <div className="p-3 border-b border-[var(--color-border)] flex items-center justify-between">
              <h3 className="text-sm font-semibold">Bildirimler</h3>
              <button
                onClick={() => {
                  useNotifications().clearAll();
                  setIsOpen(false);
                }}
                className="text-xs text-[var(--color-error)] hover:underline"
              >
                Tümünü Temizle
              </button>
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {notifications.map(notif => (
                <div key={notif.id} className="p-3 border-b border-[var(--color-border)] last:border-b-0">
                  <div className="flex items-start gap-2">
                    <span className="text-sm">{getNotificationIcon(notif)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{notif.title}</div>
                      {notif.message && (
                        <div className="text-xs text-[var(--color-textSecondary)] mt-1">
                          {notif.message}
                        </div>
                      )}
                      {notif.progress !== undefined && (
                        <div className="mt-2">
                          <div className="w-full bg-[var(--color-background)] rounded-full h-1">
                            <div
                              className="bg-[var(--color-primary)] h-1 rounded-full transition-all"
                              style={{ width: `${notif.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
  
  function getNotificationIcon(notif: Notification) {
    switch (notif.type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  }
}
