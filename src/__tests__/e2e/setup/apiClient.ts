/**
 * Test-specific API Client
 * Enhanced API client for E2E testing with detailed logging and assertions
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { TEST_CONFIG, testState, assertCondition, recordTestResult } from './testSetup';
import type { 
  AuthResponse, 
  APIResponse, 
  UserData,
  ConversationResponse,
  HealthResponse,
  FriendsResponse,
  SocialResponse
} from '../types/test-types';

class TestAPIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: TEST_CONFIG.API_BASE_URL,
      timeout: TEST_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for logging and auth
    this.client.interceptors.request.use((config) => {
      // Add auth token if available
      if (testState.authToken) {
        config.headers.Authorization = `Bearer ${testState.authToken}`;
      }

      console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      if (config.data) {
        console.log(`📤 Request Data:`, JSON.stringify(config.data, null, 2));
      }

      return config;
    });

    // Response interceptor for logging and error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        if (response.data) {
          console.log(`📥 Response Data:`, JSON.stringify(response.data, null, 2));
        }
        return response;
      },
      (error) => {
        console.error(`❌ API Error: ${error.response?.status} ${error.config?.url}`);
        if (error.response?.data) {
          console.error(`📥 Error Data:`, JSON.stringify(error.response.data, null, 2));
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Make authenticated request and assert response structure
   */
  async authenticatedRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    expectedStatus: number = 200,
    assertions?: (response: T) => void
  ): Promise<T> {
    const startTime = Date.now();
    let response: AxiosResponse<T>;

    try {
      // Ensure we have auth token
      assertCondition(
        !!testState.authToken,
        'Auth token required for authenticated request',
        testState.authToken
      );

      // Make request
      switch (method) {
        case 'GET':
          response = await this.client.get(endpoint);
          break;
        case 'POST':
          response = await this.client.post(endpoint, data);
          break;
        case 'PUT':
          response = await this.client.put(endpoint, data);
          break;
        case 'DELETE':
          response = await this.client.delete(endpoint, { data });
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }

      // Assert status code (allow 201 for creation endpoints)
      assertCondition(
        response.status === expectedStatus || (expectedStatus === 200 && response.status === 201),
        `Expected status ${expectedStatus}`,
        response.status,
        expectedStatus
      );

      // Run custom assertions
      if (assertions) {
        assertions(response.data);
      }

      // Record success
      recordTestResult({
        testName: `${method} ${endpoint}`,
        status: 'passed',
        duration: Date.now() - startTime,
        endpoint,
      });

      return response.data;

    } catch (error) {
      // Record failure
      recordTestResult({
        testName: `${method} ${endpoint}`,
        status: 'failed',
        duration: Date.now() - startTime,
        endpoint,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Public endpoint request (no auth required)
   */
  async publicRequest<T>(
    method: 'GET' | 'POST',
    endpoint: string,
    data?: any,
    expectedStatus: number = 200,
    assertions?: (response: T) => void
  ): Promise<T> {
    const startTime = Date.now();

    try {
      let response: AxiosResponse<T>;

      if (method === 'GET') {
        response = await this.client.get(endpoint);
      } else {
        response = await this.client.post(endpoint, data);
      }

      // Assert status code (allow 201 for creation endpoints)
      assertCondition(
        response.status === expectedStatus || (expectedStatus === 200 && response.status === 201),
        `Expected status ${expectedStatus}`,
        response.status,
        expectedStatus
      );

      // Run custom assertions
      if (assertions) {
        assertions(response.data);
      }

      // Record success
      recordTestResult({
        testName: `${method} ${endpoint}`,
        status: 'passed',
        duration: Date.now() - startTime,
        endpoint,
      });

      return response.data;

    } catch (error) {
      // Record failure
      recordTestResult({
        testName: `${method} ${endpoint}`,
        status: 'failed',
        duration: Date.now() - startTime,
        endpoint,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Test SSE connection
   */
  async testSSEConnection(endpoint: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      let isConnected = false;
      let messageReceived = false;

      console.log(`🔄 Testing SSE connection to ${endpoint}`);

      // Create XHR for React Native compatibility
      const xhr = new XMLHttpRequest();
      xhr.open('GET', `${TEST_CONFIG.API_BASE_URL}${endpoint}`, true);
      xhr.setRequestHeader('Accept', 'text/event-stream');
      
      if (testState.authToken) {
        xhr.setRequestHeader('Authorization', `Bearer ${testState.authToken}`);
      }

      let lastProcessedLength = 0;
      let buffer = '';

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 3 || xhr.readyState === 4) {
          if (xhr.status === 200 && !isConnected) {
            isConnected = true;
            console.log('✅ SSE connection established');
          }

          // Process new data
          const newData = xhr.responseText.slice(lastProcessedLength);
          lastProcessedLength = xhr.responseText.length;

          if (newData) {
            buffer += newData;
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmedLine = line.trim();
              if (trimmedLine.startsWith('data: ')) {
                const data = trimmedLine.slice(6).trim();
                console.log('📨 SSE message received:', data);
                messageReceived = true;
                
                // Close after first message for test
                xhr.abort();
                
                recordTestResult({
                  testName: `SSE ${endpoint}`,
                  status: 'passed',
                  duration: Date.now() - startTime,
                  endpoint,
                });
                
                resolve();
                return;
              }
            }
          }

          if (xhr.readyState === 4) {
            if (!messageReceived && xhr.status === 200) {
              // Connection closed without message - might be normal
              recordTestResult({
                testName: `SSE ${endpoint}`,
                status: 'passed',
                duration: Date.now() - startTime,
                endpoint,
              });
              resolve();
            }
          }
        }
      };

      xhr.onerror = () => {
        recordTestResult({
          testName: `SSE ${endpoint}`,
          status: 'failed',
          duration: Date.now() - startTime,
          endpoint,
          error: 'SSE connection failed',
        });
        reject(new Error('SSE connection failed'));
      };

      xhr.ontimeout = () => {
        recordTestResult({
          testName: `SSE ${endpoint}`,
          status: 'failed',
          duration: Date.now() - startTime,
          endpoint,
          error: 'SSE connection timeout',
        });
        reject(new Error('SSE connection timeout'));
      };

      // Set timeout for test
      xhr.timeout = 10000;
      xhr.send();

      // Fallback timeout
      setTimeout(() => {
        if (!isConnected) {
          xhr.abort();
          recordTestResult({
            testName: `SSE ${endpoint}`,
            status: 'failed',
            duration: Date.now() - startTime,
            endpoint,
            error: 'SSE connection timeout (fallback)',
          });
          reject(new Error('SSE connection timeout'));
        }
      }, 15000);
    });
  }

  /**
   * Test file upload
   */
  async testFileUpload(
    endpoint: string,
    fileData: {
      uri: string;
      type: string;
      name: string;
    },
    additionalData?: any
  ): Promise<any> {
    const startTime = Date.now();

    try {
      const formData = new FormData();
      
      // Add file
      formData.append('file', {
        uri: fileData.uri,
        type: fileData.type,
        name: fileData.name,
      } as any);

      // Add additional data
      if (additionalData) {
        Object.keys(additionalData).forEach(key => {
          formData.append(key, additionalData[key]);
        });
      }

      const response = await this.client.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      recordTestResult({
        testName: `Upload ${endpoint}`,
        status: 'passed',
        duration: Date.now() - startTime,
        endpoint,
      });

      return response.data;

    } catch (error) {
      recordTestResult({
        testName: `Upload ${endpoint}`,
        status: 'failed',
        duration: Date.now() - startTime,
        endpoint,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Test streaming chat endpoint
   */
  async testStreamingChat(endpoint: string, message: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const chunks: string[] = [];

      console.log(`💬 Testing streaming chat: ${message}`);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${TEST_CONFIG.API_BASE_URL}${endpoint}`, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      
      if (testState.authToken) {
        xhr.setRequestHeader('Authorization', `Bearer ${testState.authToken}`);
      }

      let lastProcessedLength = 0;
      let buffer = '';

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 3 || xhr.readyState === 4) {
          if (xhr.status === 200) {
            const newData = xhr.responseText.slice(lastProcessedLength);
            lastProcessedLength = xhr.responseText.length;

            if (newData) {
              buffer += newData;
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith('data: ')) {
                  const data = trimmedLine.slice(6).trim();
                  
                  if (data === '[DONE]') {
                    console.log(`✅ Streaming complete. Received ${chunks.length} chunks`);
                    
                    recordTestResult({
                      testName: `Streaming ${endpoint}`,
                      status: 'passed',
                      duration: Date.now() - startTime,
                      endpoint,
                    });
                    
                    resolve(chunks);
                    return;
                  }

                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.content) {
                      chunks.push(parsed.content);
                      console.log(`📝 Chunk ${chunks.length}: ${parsed.content}`);
                    }
                  } catch (e) {
                    console.warn('⚠️  Failed to parse streaming chunk:', data);
                  }
                }
              }
            }

            if (xhr.readyState === 4 && chunks.length === 0) {
              reject(new Error('No streaming chunks received'));
            }
          } else if (xhr.readyState === 4) {
            recordTestResult({
              testName: `Streaming ${endpoint}`,
              status: 'failed',
              duration: Date.now() - startTime,
              endpoint,
              error: `HTTP ${xhr.status}`,
            });
            reject(new Error(`Streaming request failed: HTTP ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        recordTestResult({
          testName: `Streaming ${endpoint}`,
          status: 'failed',
          duration: Date.now() - startTime,
          endpoint,
          error: 'Network error',
        });
        reject(new Error('Streaming request network error'));
      };

      xhr.timeout = 30000; // 30 second timeout for streaming
      xhr.send(JSON.stringify({ message, stream: true }));
    });
  }
}

export const testApiClient = new TestAPIClient();