/**
 * File Processing API Endpoints
 * File uploads, processing, and URL preview generation
 */

import { api } from '../core/client';
import { logger } from '../../../utils/logger';

export const FileAPI = {
  // Generate URL preview image
  async generatePreviewImage(url: string): Promise<any> {
    try {
      const response = await api.post('/api/preview-image', { url });
      return response.data;
    } catch (error) {
      logger.error('Failed to generate preview image:', error);
      throw error;
    }
  },
};