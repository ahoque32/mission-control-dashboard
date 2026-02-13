'use client';

import ReactMarkdown from 'react-markdown';
import type { ProcessedAttachment } from '../../lib/kimi/kimi.types';

interface KimiMessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  attachments?: ProcessedAttachment[];
}

export default function KimiMessageBubble({
  role,
  content,
  attachments,
}: KimiMessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-emerald-600 text-white rounded-br-sm'
            : 'bg-white/5 border border-white/10 rounded-bl-sm'
        }`}
      >
        {/* Attachment previews (inline in sent messages) */}
        {attachments && attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {attachments.map((att, i) => (
              <AttachmentInline key={i} attachment={att} isUser={isUser} />
            ))}
          </div>
        )}

        {/* Message content */}
        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {content}
          </p>
        ) : (
          <div className="text-sm leading-relaxed prose prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-headings:mt-3 prose-headings:mb-1">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

function AttachmentInline({
  attachment,
  isUser,
}: {
  attachment: ProcessedAttachment;
  isUser: boolean;
}) {
  if (attachment.type === 'image' && attachment.base64) {
    return (
      <img
        src={attachment.base64}
        alt={attachment.filename}
        className="max-w-[300px] max-h-[200px] rounded-lg object-cover"
      />
    );
  }

  const icon = attachment.type === 'code' ? '💻' : '📄';
  const sizeStr = attachment.sizeBytes < 1024
    ? `${attachment.sizeBytes} B`
    : attachment.sizeBytes < 1024 * 1024
      ? `${(attachment.sizeBytes / 1024).toFixed(1)} KB`
      : `${(attachment.sizeBytes / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
        isUser
          ? 'bg-emerald-700/50 text-emerald-100'
          : 'bg-white/5 border border-white/10 text-foreground-secondary'
      }`}
    >
      <span>{icon}</span>
      <span className="truncate max-w-[120px]">{attachment.filename}</span>
      <span className="opacity-60">{sizeStr}</span>
    </div>
  );
}
