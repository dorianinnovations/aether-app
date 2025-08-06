/**
 * Mock implementations for E2E tests
 * Provides Node.js compatible versions of React Native modules
 */
/* eslint-disable no-console */

// Mock AsyncStorage for Node.js environment
class MockAsyncStorage {
  private storage: Map<string, string> = new Map();

  async getItem(key: string): Promise<string | null> {
    return this.storage.get(key) || null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.storage.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }

  async getAllKeys(): Promise<string[]> {
    return Array.from(this.storage.keys());
  }

  async multiGet(keys: string[]): Promise<Array<[string, string | null]>> {
    return keys.map(key => [key, this.storage.get(key) || null]);
  }

  async multiSet(keyValuePairs: Array<[string, string]>): Promise<void> {
    keyValuePairs.forEach(([key, value]) => {
      this.storage.set(key, value);
    });
  }

  async multiRemove(keys: string[]): Promise<void> {
    keys.forEach(key => {
      this.storage.delete(key);
    });
  }
}

// Mock XMLHttpRequest if not available
if (typeof global.XMLHttpRequest === 'undefined') {
  // Use node-fetch for XMLHttpRequest-like functionality
  global.XMLHttpRequest = class MockXMLHttpRequest {
    private method: string = 'GET';
    private url: string = '';
    private headers: Record<string, string> = {};
    private requestBody: any = null;
    public responseText: string = '';
    public status: number = 0;
    public readyState: number = 0;
    public timeout: number = 0;
    
    public onreadystatechange: (() => void) | null = null;
    public onerror: ((error: any) => void) | null = null;
    public ontimeout: (() => void) | null = null;

    open(method: string, url: string, async: boolean = true): void {
      this.method = method;
      this.url = url;
      this.readyState = 1;
      this.onreadystatechange?.();
    }

    setRequestHeader(name: string, value: string): void {
      this.headers[name] = value;
    }

    send(body?: any): void {
      this.requestBody = body;
      this.readyState = 2;
      this.onreadystatechange?.();

      // Simulate network request
      const fetch = require('node-fetch');
      const controller = new AbortController();
      const timeoutId = this.timeout > 0 ? setTimeout(() => {
        controller.abort();
        this.ontimeout?.();
      }, this.timeout) : null;

      const options: any = {
        method: this.method,
        headers: this.headers,
        signal: controller.signal
      };

      if (body && this.method !== 'GET') {
        options.body = typeof body === 'string' ? body : JSON.stringify(body);
      }

      fetch(this.url, options)
        .then((response: any) => {
          this.status = response.status;
          this.readyState = 3;
          this.onreadystatechange?.();
          
          return response.text();
        })
        .then((text: string) => {
          this.responseText = text;
          this.readyState = 4;
          this.onreadystatechange?.();
          if (timeoutId) clearTimeout(timeoutId);
        })
        .catch((error: any) => {
          if (error.name === 'AbortError') {
            this.ontimeout?.();
          } else {
            this.onerror?.(error);
          }
          if (timeoutId) clearTimeout(timeoutId);
        });
    }

    abort(): void {
      this.readyState = 4;
      this.status = 0;
      this.onreadystatechange?.();
    }
  } as any;
}

// Mock EventSource for Node.js
if (typeof global.EventSource === 'undefined') {
  global.EventSource = class MockEventSource {
    public onmessage: ((event: any) => void) | null = null;
    public onerror: ((error: any) => void) | null = null;
    public onopen: (() => void) | null = null;
    
    constructor(public url: string, options?: any) {
      // Simulate connection
      setTimeout(() => {
        this.onopen?.();
      }, 100);
    }

    close(): void {
      // Mock close
    }
  } as any;
}

// Mock FormData for Node.js if needed
if (typeof global.FormData === 'undefined') {
  global.FormData = class MockFormData {
    private data: Map<string, any> = new Map();

    append(name: string, value: any): void {
      this.data.set(name, value);
    }

    get(name: string): any {
      return this.data.get(name);
    }

    has(name: string): boolean {
      return this.data.has(name);
    }

    delete(name: string): void {
      this.data.delete(name);
    }
  } as any;
}

// Export mock instances
export const mockAsyncStorage = new MockAsyncStorage();

// Setup mocks
export const setupMocks = () => {
  // Mock AsyncStorage
  jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
  
  // Mock React Native modules that might be imported
  jest.mock('react-native', () => ({
    Platform: {
      OS: 'test',
      select: (options: any) => options.default || options.test || options.ios || options.android
    }
  }));

  // Mock Expo modules
  jest.mock('expo-constants', () => ({
    default: {
      expoConfig: {
        extra: {}
      }
    }
  }));

  console.log('✅ E2E test mocks initialized');
};