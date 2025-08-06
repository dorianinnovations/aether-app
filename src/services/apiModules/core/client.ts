/**
 * Core API Client Configuration
 * Axios instance with base configuration for Aether Server
 */

import axios, { AxiosInstance } from 'axios';

// API Configuration - Updated for Aether Server
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://aether-server-j5kh.onrender.com';

// Create axios instance
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;