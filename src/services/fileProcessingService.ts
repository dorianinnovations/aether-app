/**
 * Aether File Processing Service
 * Centralized file processing, validation, and backend integration
 */

import { MessageAttachment } from '../types';

// File processing configuration - Updated to match backend specification
export const FILE_PROCESSING_CONFIG = {
  maxFileSize: 100 * 1024 * 1024, // 100MB per file
  maxTotalSize: 500 * 1024 * 1024, // 500MB total
  maxAttachments: 5,
  maxFileNameLength: 255,
  
  // Image types (GPT-4o Vision)
  supportedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  
  // Document types
  supportedDocumentTypes: [
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  
  // Code file types
  supportedCodeTypes: [
    'application/javascript',
    'text/javascript',
    'application/json',
    'text/html',
    'text/css',
    'text/xml',
    'application/xml',
    'text/x-python',
    'text/x-java-source',
    'text/x-c',
    'text/x-c++',
    'application/sql',
  ],
  
  // Backend endpoints
  processingEndpoints: {
    uploadWithFiles: '/social-chat',
  },
  
  // File extensions mapping
  supportedExtensions: [
    // Images
    '.jpg', '.jpeg', '.png', '.webp', '.gif',
    // Documents
    '.pdf', '.txt', '.md', '.doc', '.docx',
    // Code files
    '.js', '.jsx', '.ts', '.tsx', '.py', '.java',
    '.c', '.cpp', '.h', '.hpp', '.json', '.html',
    '.css', '.xml', '.sql'
  ]
};

export interface FileProcessingResult {
  success: boolean;
  processedFiles: ProcessedFile[];
  errors: FileProcessingError[];
  metadata?: any;
}

export interface ProcessedFile {
  id: string;
  originalName: string;
  processedName: string;
  type: 'image' | 'document';
  mimeType: string;
  size: number;
  uri: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'error';
  metadata?: {
    dimensions?: { width: number; height: number };
    pageCount?: number;
    extractedText?: string;
    thumbnailUri?: string;
  };
}

export interface FileProcessingError {
  filename: string;
  error: string;
  code: string;
}

export class FileProcessingService {
  
  /**
   * Validate file before processing - Updated to match backend requirements
   */
  static validateFile(attachment: MessageAttachment): { isValid: boolean; error?: string } {
    // Check file name length
    if (attachment.name.length > FILE_PROCESSING_CONFIG.maxFileNameLength) {
      return {
        isValid: false,
        error: `File name exceeds ${FILE_PROCESSING_CONFIG.maxFileNameLength} characters`
      };
    }

    // Check file size
    if (attachment.size > FILE_PROCESSING_CONFIG.maxFileSize) {
      return {
        isValid: false,
        error: `File "${attachment.name}" exceeds 100MB limit`
      };
    }

    // Check file extension
    const extension = '.' + attachment.name.split('.').pop()?.toLowerCase();
    if (!FILE_PROCESSING_CONFIG.supportedExtensions.includes(extension)) {
      return {
        isValid: false,
        error: `File type "${extension}" not supported`
      };
    }

    // Additional MIME type validation
    const mimeType = attachment.mimeType || '';
    const isImageType = FILE_PROCESSING_CONFIG.supportedImageTypes.includes(mimeType);
    const isDocumentType = FILE_PROCESSING_CONFIG.supportedDocumentTypes.includes(mimeType);
    const isCodeType = FILE_PROCESSING_CONFIG.supportedCodeTypes.includes(mimeType);

    if (!isImageType && !isDocumentType && !isCodeType) {
      // Allow text files without specific MIME type
      if (!mimeType.startsWith('text/') && !extension.match(/\.(txt|md|js|py|java|c|cpp|h|hpp)$/)) {
        return {
          isValid: false,
          error: `Unsupported file type: ${mimeType || 'Unknown'}`
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Validate multiple attachments - Updated with total size check
   */
  static validateAttachments(attachments: MessageAttachment[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check file count
    if (attachments.length > FILE_PROCESSING_CONFIG.maxAttachments) {
      errors.push(`Maximum ${FILE_PROCESSING_CONFIG.maxAttachments} files allowed`);
    }

    // Check total size
    const totalSize = attachments.reduce((sum, att) => sum + att.size, 0);
    if (totalSize > FILE_PROCESSING_CONFIG.maxTotalSize) {
      errors.push('Total file size exceeds 500MB limit');
    }

    // Validate individual files
    attachments.forEach((attachment) => {
      const validation = this.validateFile(attachment);
      if (!validation.isValid) {
        errors.push(validation.error!);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Convert local file URI to base64 for backend processing
   */
  static async convertToBase64(uri: string): Promise<string> {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      throw new Error(`Failed to convert file to base64: ${error}`);
    }
  }

  /**
   * Prepare attachments for backend processing
   */
  static async prepareAttachmentsForBackend(attachments: MessageAttachment[]): Promise<any[]> {
    const validation = this.validateAttachments(attachments);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    return Promise.all(attachments.map(async (attachment) => {
      let processedUri = attachment.uri;

      // Convert local files to base64
      if (attachment.uri.startsWith('file://')) {
        processedUri = await this.convertToBase64(attachment.uri);
      }

      return {
        id: attachment.id,
        name: attachment.name,
        type: attachment.type,
        mimeType: attachment.mimeType,
        size: attachment.size,
        uri: processedUri,
        uploadStatus: attachment.uploadStatus
      };
    }));
  }

  /**
   * Backend file processing integration - Connected to /chat endpoint
   */
  static async processWithBackendService(
    message: string, 
    attachments: MessageAttachment[]
  ): Promise<FileProcessingResult> {
    try {
      // Validate attachments before processing
      const validation = this.validateAttachments(attachments);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Prepare attachments for backend
      const preparedAttachments = await this.prepareAttachmentsForBackend(attachments);
      
      // Create FormData for multipart/form-data request
      const formData = new FormData();
      
      // Add files to FormData
      preparedAttachments.forEach((attachment) => {
        const fileObject = {
          uri: attachment.uri,
          type: attachment.mimeType,
          name: attachment.name,
        } as any;
        
        formData.append('files', fileObject);
      });
      
      // Add message if provided
      if (message && message.trim()) {
        formData.append('message', message.trim());
      }
      
      
      // Return processing metadata for streaming integration
      return {
        success: true,
        processedFiles: preparedAttachments.map(att => ({
          id: att.id,
          originalName: att.name,
          processedName: att.name,
          type: att.type as 'image' | 'document',
          mimeType: att.mimeType,
          size: att.size,
          uri: att.uri,
          processingStatus: 'completed' as const,
          metadata: {}
        })),
        errors: [],
        metadata: {
          hasFiles: true,
          filesCount: attachments.length,
          filesProcessed: preparedAttachments.map(att => ({
            name: att.name,
            type: att.type,
            size: att.size,
            processed: true
          })),
          backendEndpoint: FILE_PROCESSING_CONFIG.processingEndpoints.uploadWithFiles,
          formData // Pass FormData for streaming integration
        }
      };
    } catch (error: any) {
      return {
        success: false,
        processedFiles: [],
        errors: [{
          filename: 'validation',
          error: error.message,
          code: 'VALIDATION_ERROR'
        }]
      };
    }
  }

  /**
   * Get file type icon for UI display
   */
  static getFileTypeIcon(mimeType?: string): string {
    if (!mimeType) return 'file';
    
    if (mimeType.includes('pdf')) return 'file-pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'file-word';
    if (mimeType.includes('text')) return 'file-alt';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'file-excel';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'file-powerpoint';
    if (mimeType.includes('image')) return 'image';
    
    return 'file';
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  /**
   * Extract metadata from file
   */
  static async extractFileMetadata(attachment: MessageAttachment): Promise<any> {
    const metadata: any = {
      name: attachment.name,
      size: this.formatFileSize(attachment.size),
      type: attachment.type,
      mimeType: attachment.mimeType,
    };

    if (attachment.type === 'image') {
      // TODO: Extract image dimensions
      metadata.isImage = true;
    } else if (attachment.type === 'document') {
      // TODO: Extract document metadata (page count, etc.)
      metadata.isDocument = true;
    }

    return metadata;
  }
}

/**
 * Utility function to get file type from extension
 */
export function getFileTypeFromExtension(filename: string): 'image' | 'document' | 'code' {
  const extension = '.' + filename.split('.').pop()?.toLowerCase();
  
  if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(extension)) {
    return 'image';
  }
  
  if (['.pdf', '.txt', '.md', '.doc', '.docx'].includes(extension)) {
    return 'document';
  }
  
  return 'code'; // JS, PY, JSON, etc.
}

/**
 * Get appropriate file icon emoji for UI display
 */
export function getFileIconEmoji(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  const icons: Record<string, string> = {
    // Images
    'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'webp': '🖼️', 'gif': '🖼️',
    // Documents  
    'pdf': '📄', 'txt': '📝', 'md': '📋', 'doc': '📄', 'docx': '📄',
    // Code
    'js': '📜', 'jsx': '⚛️', 'ts': '📘', 'tsx': '⚛️', 'py': '🐍', 
    'java': '☕', 'c': '🔧', 'cpp': '🔧', 'json': '📊', 'html': '🌐',
    'css': '🎨', 'xml': '📋', 'sql': '🗃️'
  };
  
  return icons[extension || ''] || '📎';
}

export default FileProcessingService;