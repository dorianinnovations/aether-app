/**
 * System & Health API Endpoints
 * Server health checks, system monitoring, and audit functionality
 */

import { api } from '../core/client';

export const SystemAPI = {
  async checkHealth(): Promise<any> {
    const response = await api.get('/health');
    return response.data;
  },

  async checkLLM(): Promise<any> {
    const response = await api.get('/llm');
    return response.data;
  },

  async getAudit(): Promise<any> {
    const response = await api.get('/audit');
    return response.data;
  },

  async getStatus(): Promise<any> {
    const response = await api.get('/status');
    return response.data;
  },
};

// Legacy export for compatibility
export const HealthAPI = SystemAPI;