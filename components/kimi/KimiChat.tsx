'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import Icon from '../ui/Icon';
import KimiMessageBubble from './KimiMessageBubble';
import KimiStarterChips from './KimiStarterChips';
import KimiExecutionLogs from './KimiExecutionLogs';
import KimiEscalationModal from './KimiEscalationModal';
import KimiAttachmentPreview from './KimiAttachmentPreview';
import KimiAttachmentDropZone from './KimiAttachmentDropZone';
import {
  classifyFile,
  validateFile,
  processFile,
} from '../../lib/kimi/kimi.attachments';
import { MAX_ATTACHMENTS } from '../../lib/kimi/kimi.config';
import type { KimiUIMessage, AttachmentState } from './kimi.types';
import type {
  KimiMode,
  KimiSSEEvent,
  EscalationTrigger,
  EscalationSeverity,
  ProcessedAttachment,
} from '../../lib/kimi/kimi.types';

interface KimiChatProps {
  mode: KimiMode;
  sessionId?: string | null;
  conversationId: string;
  onMetaUpdate: (meta: Extract<KimiSSEEvent, { type: 'meta' }>) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function KimiChat({ mode, sessionId, conversationId, onMetaUpdate }: KimiChatProps) {
  const [messages, setMessages] = useState<KimiUIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<{ timestamp: number; message: string }[]>([]);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  
  // Escalation state
  const [isEscalationModalOpen, setIsEscalationModalOpen] = useState(false);
  const [escalationTrigger, setEscalationTrigger] = useState<EscalationTrigger | null>(null);
  const [escalationSeverity, setEscalationSeverity] = useState<EscalationSeverity | null>(null);

  // Attachment state
  const [attachments, setAttachments] = useState<AttachmentState[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);

  // Convex persistence
  const savedMessages = useQuery(api.kimiChatMessages.getConversation, { sessionId: conversationId });
  const saveMessage = useMutation(api.kimiChatMessages.saveMessage);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ─── Effects ──────────────────────────────────────────────────────────────

  // Reset loaded flag when conversationId changes
  useEffect(() => {
    setHasLoadedHistory(false);
  }, [conversationId]);

  // Load persisted messages when available
  useEffect(() => {
    if (savedMessages && !hasLoadedHistory) {
      if (savedMessages.length > 0) {
        const restored: KimiUIMessage[] = savedMessages.map((msg) => ({
          id: `restored-${msg._id}`,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          // Attachment metadata only (no base64/content)
          attachments: msg.attachments?.map(a => ({
            type: a.type as 'image' | 'document' | 'code',
            filename: a.filename,
            mimeType: '',
            sizeBytes: a.sizeBytes,
          })),
        }));
        setMessages(restored);
      } else {
        setMessages([]);
      }
      setHasLoadedHistory(true);
    }
  }, [savedMessages, hasLoadedHistory]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [input]);

  // ─── Message Handling ─────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      const readyAttachments = attachments.filter((a) => a.status === 'ready' && a.processed);

      if ((!trimmed && readyAttachments.length === 0) || isLoading) return;

      setError(null);
      setInput('');
      setAttachments([]);

      const userMsg: KimiUIMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmed,
        attachments: readyAttachments.map(a => a.processed!),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      // Save user message to Convex (metadata only for attachments)
      saveMessage({
        sessionId: conversationId,
        role: 'user',
        content: trimmed,
        attachments: readyAttachments.length > 0
          ? readyAttachments.map(a => ({
              filename: a.processed!.filename,
              type: a.processed!.type,
              sizeBytes: a.processed!.sizeBytes,
            }))
          : undefined,
      }).catch(() => { /* non-critical — chat still works without persistence */ });

      const assistantMsgId = `assistant-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, role: 'assistant', content: '' },
      ]);

      let fullAssistantContent = '';

      try {
        const res = await fetch('/api/kimi/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            mode,
            sessionId: sessionId || undefined,
            attachments: readyAttachments.map(a => a.processed!),
            conversationHistory: messages.map(m => ({
              role: m.role,
              content: m.content,
              timestamp: Date.now()
            })),
          }),
        });

        if (!res.ok || !res.body) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Request failed (${res.status})`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.trim().startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;
              
              try {
                const event = JSON.parse(data) as KimiSSEEvent;
                switch (event.type) {
                  case 'meta':
                    onMetaUpdate(event);
                    break;
                  case 'token':
                    fullAssistantContent += event.content;
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMsgId
                          ? { ...msg, content: msg.content + event.content }
                          : msg
                      )
                    );
                    break;
                  case 'log':
                    setLogs((prev) => [...prev, { timestamp: event.timestamp, message: event.message }]);
                    break;
                  case 'escalation':
                    setEscalationTrigger(event.trigger);
                    setEscalationSeverity(event.severity);
                    break;
                  case 'error':
                    setError(event.message);
                    break;
                }
              } catch (e) { /* ignore malformed json */ }
            }
          }
        }

        // Save complete assistant message to Convex after streaming finishes
        if (fullAssistantContent.trim()) {
          saveMessage({
            sessionId: conversationId,
            role: 'assistant',
            content: fullAssistantContent,
          }).catch(() => { /* non-critical */ });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get a response');
      } finally {
        setIsLoading(false);
      }
    },
    [attachments, isLoading, mode, sessionId, conversationId, messages, onMetaUpdate, saveMessage]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };
  
  // ─── Attachment Handling ──────────────────────────────────────────────────

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newAttachments = Array.from(files).slice(0, MAX_ATTACHMENTS - attachments.length);

    for (const file of newAttachments) {
      const validation = validateFile(file);
      const id = crypto.randomUUID();
      const type = classifyFile(file.name);

      if (!validation.valid || !type) {
        setAttachments(prev => [...prev, {
          id, file, type: type || 'document', status: 'error',
          preview: null, sizeBytes: file.size, error: validation.error || 'Invalid type'
        }]);
        continue;
      }

      setAttachments(prev => [...prev, {
        id, file, type, status: 'processing', preview: null,
        sizeBytes: file.size, error: null
      }]);

      processFile(file).then(processed => {
        const preview = (processed.type === 'image' && processed.base64) ? processed.base64 : null;
        setAttachments(prev => prev.map(a => a.id === id ? {
          ...a, status: 'ready', preview, processed
        } : a));
      }).catch(err => {
        setAttachments(prev => prev.map(a => a.id === id ? {
          ...a, status: 'error', error: err.message
        } : a));
      });
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    handleFileSelect(e.clipboardData?.files);
  };

  const handleDragEvents = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    handleDragEvents(e);
    setIsDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  return (
    <>
      <div
        className="glass-card flex flex-col relative"
        style={{ height: 'calc(100vh - 220px)', minHeight: '400px' }}
        onDragEnter={handleDragEvents}
        onDragOver={handleDragEvents}
        onDragLeave={handleDragEvents}
        onDrop={handleDrop}
      >
        <KimiAttachmentDropZone isActive={isDragActive} />
        
        {/* Messages area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && !isLoading && (
            <KimiStarterChips onSelect={sendMessage} />
          )}

          {messages.map((msg) => (
            <KimiMessageBubble key={msg.id} role={msg.role} content={msg.content} attachments={msg.attachments} />
          ))}

          {isLoading && messages[messages.length - 1]?.role === 'assistant' && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-foreground-muted rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-2 h-2 bg-foreground-muted rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2 h-2 bg-foreground-muted rounded-full animate-bounce" />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Attachment preview strip */}
        <KimiAttachmentPreview
          attachments={attachments}
          onRemove={(id) => setAttachments(prev => prev.filter(a => a.id !== id))}
        />

        {/* Input area */}
        <div className="border-t border-white/10 px-4 py-3">
          <form onSubmit={handleSubmit} className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="Type a message or drop files..."
              disabled={isLoading}
              rows={1}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm
                         text-foreground placeholder:text-foreground-muted focus:outline-none
                         focus:ring-2 focus:ring-emerald-500/50 resize-none disabled:opacity-50"
            />
            <label className="cursor-pointer p-3 rounded-xl hover:bg-white/5 transition-colors
              text-foreground-secondary hover:text-foreground shrink-0">
              <Icon name="paperclip" size={18} />
              <input
                type="file"
                multiple
                accept=".png,.jpg,.jpeg,.gif,.webp,.svg,.pdf,.txt,.md,.csv,.json,.ts,.tsx,.js,.jsx,.py,.sh,.yaml,.toml"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
                disabled={isLoading}
              />
            </label>
            <button
              type="submit"
              disabled={isLoading || (!input.trim() && attachments.length === 0)}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600
                         rounded-xl px-4 py-3 text-sm font-medium text-white transition-colors shrink-0"
            >
              <Icon name="arrow-up" size={18} />
            </button>
          </form>
        </div>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={() => setIsEscalationModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-orange-500/15 text-orange-400
                     border border-orange-500/20 rounded-xl hover:bg-orange-500/25 transition-all"
        >
          <Icon name="rocket-takeoff" size={16} />
          Escalate to JHawk
        </button>
        <KimiExecutionLogs logs={logs} />
      </div>

      <KimiEscalationModal
        isOpen={isEscalationModalOpen}
        onClose={() => setIsEscalationModalOpen(false)}
        trigger={escalationTrigger}
        severity={escalationSeverity}
        autoSummary={messages.findLast(m => m.role === 'user')?.content || ''}
        conversationId={`conv-${Date.now()}`}
        conversationHistory={messages.map(m => ({
          role: m.role,
          content: m.content,
          timestamp: Date.now()
        }))}
      />
    </>
  );
}
