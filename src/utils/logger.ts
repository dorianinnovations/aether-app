/**
 * Logger utility
 * Centralized logging with environment-based filtering
 */

const isDev = __DEV__;

export const logger = {
  debug: (message: string, ...args: any[]) => {
    if (isDev) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },
  
  info: (message: string, ...args: any[]) => {
    if (isDev) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },
  
  warn: (message: string, ...args: any[]) => {
    if (isDev) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, ...args);
  },
  
  api: (message: string, ...args: any[]) => {
    if (isDev) {
      console.log(`[API] ${message}`, ...args);
    }
  }
};

// Legacy export for backward compatibility
export const log = logger;
export default logger;