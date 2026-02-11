'use client';

import { useState, useMemo } from 'react';
import { useDocuments, useTasks, useAgents } from '../../lib/convex';
import { Document, DocumentType, Task, Agent } from '../../types';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';

// Document type configuration
const DOCUMENT_TYPES: { 
  id: DocumentType; 
  label: string; 
  icon: string;
  color: string;
  bgColor: string;
}[] = [
  { 
    id: 'deliverable', 
    label: 'Deliverables', 
    icon: '📦',
    color: '#10b981',
    bgColor: 'bg-emerald-500/20'
  },
  { 
    id: 'research', 
    label: 'Research', 
    icon: '🔬',
    color: '#3b82f6',
    bgColor: 'bg-blue-500/20'
  },
  { 
    id: 'protocol', 
    label: 'Protocols', 
    icon: '📋',
    color: '#10b981',
    bgColor: 'bg-emerald-500/20'
  },
  { 
    id: 'note', 
    label: 'Notes', 
    icon: '📝',
    color: '#888',
    bgColor: 'bg-gray-500/20'
  },
];

// Helper to format relative time
function formatRelativeTime(timestamp: any): string {
  const now = Date.now();
  const then = typeof timestamp === 'number' ? timestamp : (timestamp?.toMillis ? timestamp.toMillis() : 0);
  const diffMs = now - then;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes === 1) return '1 min ago';
  if (diffMinutes < 60) return `${diffMinutes} mins ago`;
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

// Document Card Component
interface DocumentCardProps {
  document: Document;
  onClick: () => void;
  linkedTask?: Task;
  createdByAgent?: Agent;
}

function DocumentCard({ document, onClick, linkedTask, createdByAgent }: DocumentCardProps) {
  const typeConfig = DOCUMENT_TYPES.find(t => t.id === document.type) || DOCUMENT_TYPES[3];

  return (
    <div
      onClick={onClick}
      className="
        glass-card p-4
        hover:border-emerald-500/30
        cursor-pointer transition-all card-hover
      "
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{typeConfig.icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-foreground mb-1 line-clamp-2">
            {document.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-foreground-muted mb-2">
            <span className={`px-2 py-0.5 rounded ${typeConfig.bgColor}`} style={{ color: typeConfig.color }}>
              {typeConfig.label}
            </span>
            <span>•</span>
            <span>{formatRelativeTime(document.updatedAt)}</span>
          </div>
          
          {/* Linked task indicator */}
          {linkedTask && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-foreground-muted">Linked to:</span>
              <Link
                href={`/tasks?task=${linkedTask.id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-emerald-400 hover:underline truncate max-w-[200px]"
              >
                {linkedTask.title}
              </Link>
            </div>
          )}

          {/* Created by */}
          {createdByAgent && (
            <div className="flex items-center gap-1.5 text-xs mt-1">
              <span className="text-foreground-muted">By:</span>
              <span className="text-foreground-secondary">{createdByAgent.emoji} {createdByAgent.name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Document Detail Modal Component
interface DocumentDetailModalProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
  linkedTask?: Task;
  createdByAgent?: Agent;
}

function DocumentDetailModal({ document, isOpen, onClose, linkedTask, createdByAgent }: DocumentDetailModalProps) {
  if (!isOpen || !document) return null;

  const typeConfig = DOCUMENT_TYPES.find(t => t.id === document.type) || DOCUMENT_TYPES[3];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 modal-backdrop"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
        <div 
          className="
            glass-card
            w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh]
            flex flex-col
            shadow-2xl shadow-emerald-500/10
            modal-content
            rounded-t-2xl sm:rounded-2xl
          "
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-white/10 p-4 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{typeConfig.icon}</span>
                  <span 
                    className={`text-xs font-medium px-2 py-1 rounded-lg uppercase tracking-wide ${typeConfig.bgColor}`}
                    style={{ color: typeConfig.color }}
                  >
                    {typeConfig.label}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  {document.title}
                </h2>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="
                  text-foreground-muted hover:text-foreground
                  text-2xl leading-none
                  w-11 h-11 flex items-center justify-center
                  hover:bg-white/10 rounded-xl
                  transition-colors
                "
                aria-label="Close document"
              >
                ×
              </button>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-foreground-muted">
              {createdByAgent && (
                <div className="flex items-center gap-1.5">
                  <span>Created by:</span>
                  <span className="text-foreground-secondary">{createdByAgent.emoji} {createdByAgent.name}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <span>Created:</span>
                <span className="text-foreground-secondary">{formatRelativeTime(document.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>Updated:</span>
                <span className="text-foreground-secondary">{formatRelativeTime(document.updatedAt)}</span>
              </div>
              {linkedTask && (
                <div className="flex items-center gap-1.5">
                  <span>Linked task:</span>
                  <Link
                    href={`/tasks?task=${linkedTask.id}`}
                    className="text-emerald-400 hover:underline"
                  >
                    {linkedTask.title}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {document.content ? (
              <div 
                className="
                  prose prose-invert prose-sm max-w-none
                  text-foreground
                  bg-white/5 border border-white/10 rounded-xl
                  p-6
                "
              >
                <ReactMarkdown
                  components={{
                    h1: (props) => <h1 className="text-2xl font-bold text-foreground mb-4 pb-2 border-b border-white/10" {...props} />,
                    h2: (props) => <h2 className="text-xl font-bold text-foreground mb-3 mt-6" {...props} />,
                    h3: (props) => <h3 className="text-lg font-bold text-foreground mb-2 mt-4" {...props} />,
                    h4: (props) => <h4 className="text-base font-bold text-foreground mb-2 mt-4" {...props} />,
                    p: (props) => <p className="text-foreground mb-4 leading-relaxed" {...props} />,
                    a: (props) => <a className="text-emerald-400 hover:underline" {...props} />,
                    code: (props) => <code className="bg-white/10 text-emerald-400 px-1.5 py-0.5 rounded text-sm" {...props} />,
                    pre: (props) => <pre className="bg-white/5 p-4 rounded-xl overflow-x-auto mb-4 border border-white/10" {...props} />,
                    ul: (props) => <ul className="list-disc list-inside mb-4 space-y-1" {...props} />,
                    ol: (props) => <ol className="list-decimal list-inside mb-4 space-y-1" {...props} />,
                    li: (props) => <li className="text-foreground" {...props} />,
                    blockquote: (props) => <blockquote className="border-l-4 border-emerald-500 pl-4 italic text-foreground-secondary my-4" {...props} />,
                    hr: (props) => <hr className="border-white/10 my-6" {...props} />,
                    table: (props) => <table className="w-full border-collapse mb-4" {...props} />,
                    thead: (props) => <thead className="bg-white/5" {...props} />,
                    th: (props) => <th className="border border-white/10 px-4 py-2 text-left text-foreground font-semibold" {...props} />,
                    td: (props) => <td className="border border-white/10 px-4 py-2 text-foreground" {...props} />,
                  }}
                >
                  {document.content}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="text-center py-12 text-foreground-muted">
                <div className="text-4xl mb-3">📝</div>
                <p>This document has no content yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Main Page Component
export default function DocumentsPage() {
  const { documents, loading: documentsLoading, error: documentsError } = useDocuments();
  const { tasks, loading: tasksLoading } = useTasks();
  const { agents, loading: agentsLoading } = useAgents();
  
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [selectedType, setSelectedType] = useState<DocumentType | 'all'>('all');

  const loading = documentsLoading || tasksLoading || agentsLoading;

  // Filter documents by type
  const filteredDocuments = useMemo(() => {
    if (selectedType === 'all') return documents;
    return documents.filter(d => d.type === selectedType);
  }, [documents, selectedType]);

  // Group documents by type
  const documentsByType = useMemo(() => {
    const grouped: Record<DocumentType, Document[]> = {
      deliverable: [],
      research: [],
      protocol: [],
      note: []
    };
    
    filteredDocuments.forEach(doc => {
      grouped[doc.type].push(doc);
    });
    
    return grouped;
  }, [filteredDocuments]);

  const getLinkedTask = (taskId: string | null): Task | undefined => {
    if (!taskId) return undefined;
    return tasks.find(t => t.id === taskId);
  };

  const getCreatedByAgent = (agentId: string): Agent | undefined => {
    return agents.find(a => a.id === agentId);
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-foreground-muted">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
              <p>Loading documents...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (documentsError) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="glass-card p-6 text-center border-red-500/30">
            <div className="text-4xl mb-3">⚠️</div>
            <h2 className="text-xl font-semibold text-red-400 mb-2">Error Loading Documents</h2>
            <p className="text-sm text-foreground-muted">{documentsError.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">📄 Documents</h1>
          <p className="text-foreground-secondary">
            {documents.length} {documents.length === 1 ? 'document' : 'documents'} in the system
          </p>
        </div>

        {/* Type Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedType('all')}
              className={`
                px-4 py-2 rounded-xl text-sm font-medium transition-all
                ${selectedType === 'all'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'glass-card text-foreground-secondary hover:border-emerald-500/30'
                }
              `}
            >
              All Types
            </button>
            {DOCUMENT_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`
                  px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2
                  ${selectedType === type.id
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                    : 'glass-card text-foreground-secondary hover:border-emerald-500/30'
                  }
                `}
              >
                <span>{type.icon}</span>
                <span>{type.label}</span>
                <span className="text-xs opacity-70">({documentsByType[type.id].length})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {documents.length === 0 && (
          <div className="glass-card p-12 text-center">
            <div className="text-6xl mb-4">📂</div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">No Documents Yet</h2>
            <p className="text-foreground-secondary">
              Documents will appear here once they&apos;re created in the system.
            </p>
          </div>
        )}

        {/* Filtered Empty State */}
        {documents.length > 0 && filteredDocuments.length === 0 && (
          <div className="glass-card p-12 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold text-foreground mb-2">No Documents Found</h2>
            <p className="text-foreground-secondary mb-4">
              No documents match the selected filter.
            </p>
            <button
              onClick={() => setSelectedType('all')}
              className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-400 transition-colors"
            >
              Show All Documents
            </button>
          </div>
        )}

        {/* Documents Grid - Grouped by Type */}
        {filteredDocuments.length > 0 && (
          <div className="space-y-8">
            {DOCUMENT_TYPES.map(type => {
              const typeDocuments = documentsByType[type.id];
              if (selectedType !== 'all' && selectedType !== type.id) return null;
              if (typeDocuments.length === 0 && selectedType === 'all') return null;
              if (typeDocuments.length === 0) return null;

              return (
                <div key={type.id}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{type.icon}</span>
                    <h2 className="text-xl font-semibold text-foreground">{type.label}</h2>
                    <span className="text-sm text-foreground-muted">({typeDocuments.length})</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {typeDocuments.map(document => (
                      <DocumentCard
                        key={document.id}
                        document={document}
                        onClick={() => setSelectedDocument(document)}
                        linkedTask={getLinkedTask(document.taskId)}
                        createdByAgent={getCreatedByAgent(document.createdBy)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Document Detail Modal */}
      <DocumentDetailModal
        document={selectedDocument}
        isOpen={!!selectedDocument}
        onClose={() => setSelectedDocument(null)}
        linkedTask={selectedDocument ? getLinkedTask(selectedDocument.taskId) : undefined}
        createdByAgent={selectedDocument ? getCreatedByAgent(selectedDocument.createdBy) : undefined}
      />
    </div>
  );
}
