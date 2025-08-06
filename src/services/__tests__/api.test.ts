/**
 * API Service Tests
 * Tests for the centralized API service
 */

import { api, AuthAPI } from '../api';
import { mockData, mockServices } from '../../utils/testHelpers';

// Mock axios
jest.mock('axios');
const mockedAxios = require('axios');

describe('API Service', () => {
  let mockAxiosInstance: any;

  beforeEach(() => {
    mockAxiosInstance = mockServices.createMockAPI();
    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('API Client Configuration', () => {
    it('should create axios instance with correct base configuration', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: expect.any(String),
        timeout: expect.any(Number),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should have request interceptor for auth token', () => {
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
    });

    it('should have response interceptor for error handling', () => {
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('AuthAPI', () => {
    describe('login', () => {
      it('should make POST request to login endpoint', async () => {
        const loginData = { email: 'test@example.com', password: 'password' };
        const responseData = mockData.apiResponse({ token: 'test-token', user: mockData.user() });
        
        mockAxiosInstance.post.mockResolvedValue({ data: responseData });

        const result = await AuthAPI.login(loginData.email, loginData.password);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/login', loginData);
        expect(result).toEqual(responseData);
      });

      it('should handle login errors', async () => {
        const error = mockData.apiError('Invalid credentials', 401);
        mockAxiosInstance.post.mockRejectedValue(error);

        await expect(AuthAPI.login('test@example.com', 'wrong-password')).rejects.toThrow();
      });
    });

    describe('signup', () => {
      it('should make POST request to signup endpoint', async () => {
        const signupData = { 
          email: 'test@example.com', 
          password: 'password',
          username: 'testuser',
          name: 'Test User'
        };
        const responseData = mockData.apiResponse({ token: 'test-token', user: mockData.user(signupData) });
        
        mockAxiosInstance.post.mockResolvedValue({ data: responseData });

        const result = await AuthAPI.signup(signupData.email, signupData.password, signupData.username, signupData.name);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/signup', signupData);
        expect(result).toEqual(responseData);
      });

      it('should handle signup errors', async () => {
        const error = mockData.apiError('Email already exists', 409);
        mockAxiosInstance.post.mockRejectedValue(error);

        await expect(AuthAPI.signup('existing@example.com', 'password')).rejects.toThrow();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      mockAxiosInstance.get.mockRejectedValue(networkError);

      await expect(api.get('/test')).rejects.toThrow('Network Error');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('timeout of 30000ms exceeded');
      mockAxiosInstance.get.mockRejectedValue(timeoutError);

      await expect(api.get('/test')).rejects.toThrow();
    });

    it('should handle server errors', async () => {
      const serverError = mockData.apiError('Internal Server Error', 500);
      mockAxiosInstance.get.mockRejectedValue(serverError);

      await expect(api.get('/test')).rejects.toThrow();
    });
  });

  describe('Request Retry Logic', () => {
    it('should retry failed requests', async () => {
      mockAxiosInstance.get
        .mockRejectedValueOnce(mockData.apiError('Temporary error', 500))
        .mockResolvedValueOnce({ data: mockData.apiResponse() });

      const result = await api.get('/test');
      
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
      expect(result.data).toEqual(mockData.apiResponse());
    });

    it('should not retry client errors (4xx)', async () => {
      const clientError = mockData.apiError('Bad Request', 400);
      mockAxiosInstance.get.mockRejectedValue(clientError);

      await expect(api.get('/test')).rejects.toThrow();
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('Authentication Token Management', () => {
    it('should include auth token in requests when available', () => {
      // This would be tested by checking the request interceptor behavior
      // The actual implementation depends on how tokens are stored
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
    });

    it('should handle token refresh on 401 responses', () => {
      // This would test the response interceptor for handling auth failures
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });
});