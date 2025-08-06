/**
 * Core API Infrastructure
 * Central exports for core functionality
 */

// Initialize authentication interceptors
import './auth';

// Core exports
export { api, API_BASE_URL } from './client';
export * from './types';
export * from './errors';
export { TokenManager } from '../utils/storage';
export { makeRequest, ApiUtils } from '../utils/request';