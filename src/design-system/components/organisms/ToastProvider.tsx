/**
 * Toast Provider
 * Global toast management system for consistent user feedback
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast, ToastType } from '../atoms/Toast';

interface ToastConfig {
  message: string;
  type: ToastType;
  duration?: number;
  position?: 'top' | 'bottom';
  showCloseButton?: boolean;
}

interface ToastContextType {
  showToast: (config: ToastConfig) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toast, setToast] = useState<ToastConfig & { visible: boolean }>({
    visible: false,
    message: '',
    type: 'info',
    duration: 4000,
    position: 'top',
    showCloseButton: true,
  });

  const showToast = useCallback((config: ToastConfig) => {
    setToast({
      visible: true,
      duration: 4000,
      position: 'top',
      showCloseButton: true,
      ...config,
    });
  }, []);

  const showSuccess = useCallback((message: string, duration = 3000) => {
    showToast({ message, type: 'success', duration });
  }, [showToast]);

  const showError = useCallback((message: string, duration = 5000) => {
    showToast({ message, type: 'error', duration });
  }, [showToast]);

  const showWarning = useCallback((message: string, duration = 4000) => {
    showToast({ message, type: 'warning', duration });
  }, [showToast]);

  const showInfo = useCallback((message: string, duration = 4000) => {
    showToast({ message, type: 'info', duration });
  }, [showToast]);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  const contextValue: ToastContextType = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideToast,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        duration={toast.duration}
        position={toast.position}
        showCloseButton={toast.showCloseButton}
        onDismiss={hideToast}
      />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};