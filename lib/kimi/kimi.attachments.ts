/**
 * Kimi Portal — Attachment Processing
 *
 * Client-side file classification, validation, and processing.
 * Server-side message assembly for multimodal content.
 */

import {
  IMAGE_EXTENSIONS,
  DOC_EXTENSIONS,
  CODE_EXTENSIONS,
  MAX_IMAGE_SIZE,
  MAX_DOC_SIZE,
  MAX_CODE_SIZE,
  MAX_ATTACHMENTS,
  ALLOWED_MIME_PREFIXES,
  MAX_BASE64_SIZE,
} from './kimi.config';
import { formatBytes } from './kimi.service';
import type { AttachmentType, ProcessedAttachment, ContentPart } from './kimi.types';

// ── Classification ──────────────────────────────────────────────────────────

/**
 * Classify a file by its extension.
 */
export function classifyFile(filename: string): AttachmentType | null {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
  if (IMAGE_EXTENSIONS.includes(ext)) return 'image';
  if (DOC_EXTENSIONS.includes(ext)) return 'document';
  if (CODE_EXTENSIONS.includes(ext)) return 'code';
  return null;
}

// ── Validation ──────────────────────────────────────────────────────────────

/**
 * Validate a file against size and type constraints.
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  const type = classifyFile(file.name);
  if (!type) return { valid: false, error: `Unsupported file type: ${file.name}` };

  const maxSize =
    type === 'image' ? MAX_IMAGE_SIZE :
    type === 'document' ? MAX_DOC_SIZE :
    MAX_CODE_SIZE;

  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / 1024 / 1024);
    return { valid: false, error: `${file.name} exceeds ${maxMB} MB limit` };
  }
  return { valid: true };
}

/**
 * Server-side validation of processed attachments.
 */
export function validateAttachments(
  attachments: ProcessedAttachment[],
): { valid: boolean; error?: string } {
  if (attachments.length > MAX_ATTACHMENTS) {
    return { valid: false, error: `Max ${MAX_ATTACHMENTS} attachments per message` };
  }

  for (const att of attachments) {
    if (!att.type || !att.filename || !att.mimeType) {
      return { valid: false, error: 'Invalid attachment: missing required fields' };
    }
    if (att.base64 && att.base64.length > MAX_BASE64_SIZE) {
      return { valid: false, error: `Attachment ${att.filename} too large` };
    }
    if (!ALLOWED_MIME_PREFIXES.some((p) => att.mimeType.startsWith(p))) {
      return { valid: false, error: `Unsupported MIME type: ${att.mimeType}` };
    }
  }
  return { valid: true };
}

// ── Client-Side Processing ──────────────────────────────────────────────────

/**
 * Read and process a file into a ProcessedAttachment.
 * Images → base64 data URI.
 * Documents/code → UTF-8 text.
 */
export async function processFile(file: File): Promise<ProcessedAttachment> {
  const type = classifyFile(file.name)!;

  if (type === 'image') {
    const base64 = await fileToBase64(file);
    return {
      type,
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      base64,
    };
  }

  // Document or code — read as text
  const textContent = await file.text();

  return {
    type,
    filename: file.name,
    mimeType: file.type || 'text/plain',
    sizeBytes: file.size,
    textContent,
  };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Server-Side Message Assembly ────────────────────────────────────────────

/**
 * Build a user message with optional attachments as multimodal content.
 */
export function buildUserMessageContent(
  text: string,
  attachments?: ProcessedAttachment[],
): string | ContentPart[] {
  if (!attachments?.length) {
    return text;
  }

  const parts: ContentPart[] = [];

  // Add text part first
  if (text.trim()) {
    parts.push({ type: 'text', text });
  }

  for (const att of attachments) {
    if (att.type === 'image' && att.base64) {
      // Images → vision content part
      parts.push({
        type: 'image_url',
        image_url: { url: att.base64, detail: 'auto' },
      });
    } else if (att.textContent) {
      // Documents/code → text content with filename header
      const lang = att.type === 'code' ? att.filename.split('.').pop() : '';
      const fence = att.type === 'code' ? `\`\`\`${lang}` : '';
      const fenceClose = att.type === 'code' ? '```' : '';
      parts.push({
        type: 'text',
        text: `\n\n--- Attached file: ${att.filename} (${formatBytes(att.sizeBytes)}) ---\n${fence}\n${att.textContent}\n${fenceClose}`,
      });
    }
  }

  return parts;
}
