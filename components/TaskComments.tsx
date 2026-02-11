'use client';

import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import { useTaskMessages, useCreateMessage } from '../lib/convex';
import { Message, Agent } from '../types';
import ReactMarkdown from 'react-markdown';
import Icon from './ui/Icon';

interface TaskCommentsProps {
  taskId: string;
  agents: Agent[];
  currentAgentId?: string; // The agent posting comments (defaults to 'user')
}

export default function TaskComments({ 
  taskId, 
  agents, 
  currentAgentId = 'user' 
}: TaskCommentsProps) {
  const { messages, loading, error } = useTaskMessages(taskId);
  const createMessage = useCreateMessage();
  
  const [content, setContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filter agents based on mention query
  const filteredAgents = mentionQuery
    ? agents.filter(agent =>
        agent.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
        agent.role.toLowerCase().includes(mentionQuery.toLowerCase())
      )
    : agents;

  // Detect @mention trigger
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = content.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      if (!textAfterAt.includes(' ') && textAfterAt.length < 50) {
        setMentionQuery(textAfterAt);
        setMentionPosition(lastAtIndex);
        setShowMentions(true);
        setSelectedMentionIndex(0);
        return;
      }
    }
    
    setShowMentions(false);
    setMentionQuery('');
  }, [content]);

  // Handle keyboard navigation in mention dropdown
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentions && filteredAgents.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev < filteredAgents.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex(prev => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredAgents[selectedMentionIndex]);
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Insert selected mention into content
  const insertMention = (agent: Agent) => {
    const beforeMention = content.slice(0, mentionPosition);
    const afterCursor = content.slice(textareaRef.current?.selectionStart || 0);
    const newContent = `${beforeMention}@${agent.name} ${afterCursor}`;
    
    setContent(newContent);
    setShowMentions(false);
    setMentionQuery('');
    
    setTimeout(() => {
      textareaRef.current?.focus();
      const newCursorPos = mentionPosition + agent.name.length + 2;
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Extract mentioned agent IDs from content
  const extractMentions = (text: string): string[] => {
    const mentionedNames = text.match(/@(\w+)/g)?.map(m => m.slice(1)) || [];
    const mentionedIds = agents
      .filter(agent => mentionedNames.includes(agent.name))
      .map(agent => agent.id);
    return mentionedIds;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!content.trim() || sending || !taskId) return;
    
    setSending(true);
    const mentions = extractMentions(content);
    
    try {
      await createMessage({
        taskId,
        fromAgentId: currentAgentId,
        content: content.trim(),
        mentions,
        attachments: [],
      });
      
      setContent('');
      setShowPreview(false);
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  // Handle content change
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(typeof timestamp === 'number' ? timestamp : 0);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Render message content with highlighted mentions
  const renderMessageContent = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const name = part.slice(1);
        const agent = agents.find(a => a.name === name);
        if (agent) {
          return (
            <span 
              key={index} 
              className="text-emerald-400 font-medium bg-emerald-500/10 px-1 rounded"
            >
              @{name}
            </span>
          );
        }
      }
      return part;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8" role="status" aria-label="Loading comments">
        <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-emerald-500 border-r-transparent" aria-hidden="true" />
        <span className="sr-only">Loading comments...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
          <div className="mb-3 flex justify-center">
            <Icon name="exclamation-triangle" size={32} className="text-yellow-400" />
          </div>
          <h3 className="text-lg font-semibold text-red-400 mb-2">Failed to Load Comments</h3>
          <p className="text-sm text-foreground-secondary mb-4">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Messages List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-foreground-muted">
            <div className="mb-2 flex justify-center">
              <Icon name="chat" size={32} className="text-foreground-muted" />
            </div>
            <p>No comments yet</p>
            <p className="text-sm mt-1">Be the first to start the conversation</p>
          </div>
        ) : (
          messages.map(message => {
            const author = agents.find(agent => agent.id === message.fromAgentId);
            const isCurrentUser = message.fromAgentId === currentAgentId;
            
            return (
              <div
                key={message.id}
                className={`
                  rounded-lg p-4
                  ${isCurrentUser 
                    ? 'bg-emerald-500/10 border border-emerald-500/30 ml-8' 
                    : 'bg-white/5 border border-white/10 mr-8'
                  }
                `}
              >
                {/* Comment Header */}
                <div className="flex items-center gap-2 mb-2">
                  {author?.emoji ? (
                    <span className="text-lg">{author.emoji}</span>
                  ) : (
                    <Icon name="person-fill" size={18} className="text-foreground-muted" />
                  )}
                  <div className="flex-1">
                    <span className="text-sm font-medium text-foreground">
                      {author?.name || 'Unknown'}
                    </span>
                    {author?.role && (
                      <span className="text-xs text-foreground-muted ml-2">
                        {author.role}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-foreground-muted">
                    {formatTimestamp(message.createdAt)}
                  </span>
                </div>

                {/* Comment Content */}
                <div className="text-sm text-foreground pl-8 prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => (
                        <p className="text-foreground mb-2 last:mb-0">
                          {typeof children === 'string' 
                            ? renderMessageContent(children) 
                            : children
                          }
                        </p>
                      ),
                      code: ({ children }) => (
                        <code className="bg-background text-emerald-400 px-1 rounded text-xs">
                          {children}
                        </code>
                      ),
                      pre: ({ children }) => (
                        <pre className="bg-background p-2 rounded overflow-x-auto text-xs">
                          {children}
                        </pre>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>

                {/* Mentions indicator */}
                {message.mentions && message.mentions.length > 0 && (
                  <div className="mt-2 pl-8 flex flex-wrap gap-1">
                    {message.mentions.map(mentionId => {
                      const mentionedAgent = agents.find(a => a.id === mentionId);
                      return mentionedAgent ? (
                        <span
                          key={mentionId}
                          className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400"
                        >
                          @{mentionedAgent.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}

                {/* Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 pl-8 flex flex-wrap gap-2">
                    {message.attachments.map((attachment, index) => (
                      <span
                        key={index}
                        className="text-xs px-2 py-1 rounded bg-background text-emerald-400 border border-white/10"
                      >
                        📎 {attachment}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Comment Input */}
      <div className="border-t border-white/10 pt-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2 text-xs text-foreground-muted">
            <span className="inline-flex items-center gap-1"><Icon name="chat" size={12} /> Markdown supported</span>
            <span>•</span>
            <span>@ to mention agents</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                showPreview
                  ? 'bg-emerald-500 text-white'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              <span className="inline-flex items-center gap-1">
                {showPreview ? <><Icon name="pencil-square" size={12} /> Edit</> : <><Icon name="eye" size={12} /> Preview</>}
              </span>
            </button>
          </div>
        </div>

        {/* Input or Preview */}
        {showPreview ? (
          <div className="min-h-[100px] max-h-[200px] overflow-y-auto px-4 py-3 bg-white/5 border border-white/10 rounded-lg">
            {content.trim() ? (
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-foreground-muted italic">Nothing to preview...</p>
            )}
          </div>
        ) : (
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Write a comment... Use @ to mention agents"
              disabled={sending}
              className="w-full min-h-[100px] max-h-[200px] px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:border-emerald-500 resize-y transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />

            {/* @mention autocomplete dropdown */}
            {showMentions && filteredAgents.length > 0 && (
              <div className="absolute bottom-full left-0 mb-2 w-64 bg-white/5 border border-white/10 rounded-lg shadow-xl max-h-48 overflow-y-auto z-50">
                {filteredAgents.map((agent, index) => (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => insertMention(agent)}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2 transition-colors ${
                      index === selectedMentionIndex
                        ? 'bg-emerald-500 text-white'
                        : 'hover:bg-white/10 text-foreground'
                    }`}
                  >
                    <span className="text-lg">{agent.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{agent.name}</div>
                      <div className={`text-xs truncate ${
                        index === selectedMentionIndex ? 'text-white/70' : 'text-foreground-muted'
                      }`}>
                        {agent.role}
                      </div>
                    </div>
                    <div className={`text-xs px-1.5 py-0.5 rounded ${
                      index === selectedMentionIndex
                        ? 'bg-background/20 text-white'
                        : 'bg-white/10 text-foreground-secondary'
                    }`}>
                      {agent.status}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bottom toolbar with actions */}
        <div className="flex items-center justify-between mt-2 px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-foreground-muted">
              {content.length > 0 && `${content.length} chars`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!content.trim() || sending}
              className="px-4 py-2 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
            >
              {sending ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent" />
                  Sending...
                </>
              ) : (
                <>
                  <span>📤</span>
                  Send
                </>
              )}
            </button>
          </div>
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="mt-2 text-xs text-foreground-muted px-1">
          <kbd className="px-1 py-0.5 bg-white/10 rounded">⌘/Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-white/10 rounded">Enter</kbd> to send
        </div>
      </div>
    </div>
  );
}
