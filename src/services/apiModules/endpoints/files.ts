/**
 * File Processing API Endpoints
 * File uploads, processing, and URL preview generation
 */

import { api } from '../core/client';

export const FileAPI = {
  // Generate URL preview image
  async generatePreviewImage(url: string): Promise<any> {
    try {
      const response = await api.post('/api/preview-image', { url });
      return response.data;
    } catch (error) {
      console.error('Failed to generate preview image:', error);
      throw error;
    }
  },
};