/**
 * Kimi Portal — Frontend Component Shared Types
 */

export interface KimiUIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: ProcessedUIAttachment[];
}

export interface AttachmentState {
  id: string;
  file: File;
  type: 'image' | 'document' | 'code';
  status: 'processing' | 'ready' | 'error';
  preview: string | null;
  sizeBytes: number;
  error: string | null;
  processed?: ProcessedUIAttachment;
}

export interface ProcessedUIAttachment {
  type: 'image' | 'document' | 'code';
  filename: string;
  mimeType: string;
  sizeBytes: number;
  base64?: string;
  textContent?: string;
}

export interface KimiLogEntry {
  timestamp: number;
  message: string;
}
