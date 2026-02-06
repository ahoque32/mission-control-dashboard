'use client';

import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import { useAgents } from '../lib/firebase';
import ReactMarkdown from 'react-markdown';

interface CommentInputProps {
  onSubmit: (content: string, mentions: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function CommentInput({ 
  onSubmit, 
  placeholder = 'Write a comment... (Markdown supported, @mention agents)', 
  disabled = false 
}: CommentInputProps) {
  const { agents } = useAgents();
  const [content, setContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      // Check if there's a space after @ (which would close the mention)
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
      // Cmd/Ctrl+Enter to submit
      e.preventDefault();
      handleSubmit();
    }
  };

  // Insert selected mention into content
  const insertMention = (agent: typeof agents[0]) => {
    const beforeMention = content.slice(0, mentionPosition);
    const afterCursor = content.slice(textareaRef.current?.selectionStart || 0);
    const newContent = `${beforeMention}@${agent.name} ${afterCursor}`;
    
    setContent(newContent);
    setShowMentions(false);
    setMentionQuery('');
    
    // Focus back on textarea
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
  const handleSubmit = () => {
    if (!content.trim() || disabled) return;
    
    const mentions = extractMentions(content);
    onSubmit(content.trim(), mentions);
    setContent('');
    setShowPreview(false);
  };

  // Handle content change
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  return (
    <div className="relative">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2 text-xs text-[#666]">
          <span>💬 Markdown supported</span>
          <span>•</span>
          <span>@ to mention</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              showPreview
                ? 'bg-[#d4a574] text-[#0a0a0a]'
                : 'text-[#666] hover:text-[#ededed]'
            }`}
          >
            {showPreview ? '✏️ Edit' : '👁️ Preview'}
          </button>
        </div>
      </div>

      {/* Input or Preview */}
      {showPreview ? (
        <div className="min-h-[120px] max-h-[300px] overflow-y-auto px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
          {content.trim() ? (
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-[#666] italic">Nothing to preview...</p>
          )}
        </div>
      ) : (
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full min-h-[120px] max-h-[300px] px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-[#ededed] placeholder-[#666] focus:outline-none focus:border-[#d4a574] resize-y transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />

          {/* @mention autocomplete dropdown */}
          {showMentions && filteredAgents.length > 0 && (
            <div className="absolute bottom-full left-0 mb-2 w-64 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl max-h-48 overflow-y-auto z-10">
              {filteredAgents.map((agent, index) => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => insertMention(agent)}
                  className={`w-full text-left px-3 py-2 flex items-center gap-2 transition-colors ${
                    index === selectedMentionIndex
                      ? 'bg-[#d4a574] text-[#0a0a0a]'
                      : 'hover:bg-[#2a2a2a] text-[#ededed]'
                  }`}
                >
                  <span className="text-lg">{agent.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{agent.name}</div>
                    <div className={`text-xs truncate ${
                      index === selectedMentionIndex ? 'text-[#0a0a0a]/70' : 'text-[#666]'
                    }`}>
                      {agent.role}
                    </div>
                  </div>
                  <div className={`text-xs px-1.5 py-0.5 rounded ${
                    index === selectedMentionIndex
                      ? 'bg-[#0a0a0a]/20 text-[#0a0a0a]'
                      : 'bg-[#2a2a2a] text-[#888]'
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
          {/* File attachment placeholder */}
          <button
            type="button"
            disabled={true}
            className="p-2 text-[#666] hover:text-[#ededed] hover:bg-[#2a2a2a] rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="File attachments (coming soon)"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#666]">
            {content.length > 0 && `${content.length} chars`}
          </span>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!content.trim() || disabled}
            className="px-4 py-2 bg-[#d4a574] text-[#0a0a0a] font-medium rounded-lg hover:bg-[#c9996a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Send
          </button>
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="mt-2 text-xs text-[#555] px-1">
        <kbd className="px-1 py-0.5 bg-[#2a2a2a] rounded">⌘/Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-[#2a2a2a] rounded">Enter</kbd> to send
      </div>
    </div>
  );
}
