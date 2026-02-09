import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TaskComments from '../../components/TaskComments';
import { useTaskMessages, useCreateMessage } from '../../lib/convex';
import { Agent, Message } from '../../types';

// Mock the convex hooks
jest.mock('../../lib/convex');

// Mock react-markdown
jest.mock('react-markdown', () => {
  return ({ children }: { children: string }) => <div>{children}</div>;
});

// Mock scrollIntoView (not available in jsdom)
Element.prototype.scrollIntoView = jest.fn();

const mockUseTaskMessages = useTaskMessages as jest.MockedFunction<typeof useTaskMessages>;
const mockUseCreateMessage = useCreateMessage as jest.MockedFunction<typeof useCreateMessage>;

// Helper to create a timestamp shim (matches tsShim from lib/convex.ts)
const mockTimestamp = (minutesAgo: number = 0) => {
  const ms = Date.now() - minutesAgo * 60000;
  return Object.assign(Object(ms), {
    toMillis: () => ms,
    toDate: () => new Date(ms),
    valueOf: () => ms,
    [Symbol.toPrimitive]: () => ms,
  });
};

// Helper to create a mock agent
const createMockAgent = (overrides: Partial<Agent> = {}): Agent => ({
  id: 'agent-1',
  name: 'TestBot',
  role: 'Test Assistant',
  status: 'active',
  currentTaskId: null,
  sessionKey: 'agent:testbot:main',
  emoji: '🤖',
  level: 'specialist',
  lastHeartbeat: mockTimestamp(1),
  createdAt: mockTimestamp(1000),
  updatedAt: mockTimestamp(0),
  ...overrides,
});

// Helper to create a mock message
const createMockMessage = (overrides: Partial<Message> = {}): Message => ({
  id: 'msg-1',
  taskId: 'task-1',
  fromAgentId: 'agent-1',
  content: 'This is a test message',
  mentions: [],
  attachments: [],
  createdAt: mockTimestamp(5),
  ...overrides,
});

describe('TaskComments', () => {
  const mockAgents = [
    createMockAgent({ id: 'agent-1', name: 'Alice', emoji: '👩', role: 'Developer' }),
    createMockAgent({ id: 'agent-2', name: 'Bob', emoji: '👨', role: 'Designer' }),
  ];

  let mockCreateMessage: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateMessage = jest.fn().mockResolvedValue(undefined);
    mockUseCreateMessage.mockReturnValue(mockCreateMessage);
    // Default: loaded with no messages
    mockUseTaskMessages.mockReturnValue({
      messages: [],
      data: [],
      loading: false,
      error: null,
      errorType: null,
    });
  });

  describe('loading state', () => {
    it('shows loading spinner when loading', () => {
      mockUseTaskMessages.mockReturnValue({
        messages: [],
        data: [],
        loading: true,
        error: null,
        errorType: null,
      });
      
      render(<TaskComments taskId="task-1" agents={mockAgents} />);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has correct aria-label on loading state', () => {
      mockUseTaskMessages.mockReturnValue({
        messages: [],
        data: [],
        loading: true,
        error: null,
        errorType: null,
      });
      
      render(<TaskComments taskId="task-1" agents={mockAgents} />);
      
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading comments');
    });
  });

  describe('error state', () => {
    it('shows error message when loading fails', () => {
      mockUseTaskMessages.mockReturnValue({
        messages: [],
        data: [],
        loading: false,
        error: new Error('Permission denied'),
        errorType: 'permission',
      });
      
      render(<TaskComments taskId="task-1" agents={mockAgents} />);
      
      expect(screen.getByText('Failed to Load Comments')).toBeInTheDocument();
      expect(screen.getByText('Permission denied')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('shows empty state when no messages', () => {
      render(<TaskComments taskId="task-1" agents={mockAgents} />);
      
      expect(screen.getByText('No comments yet')).toBeInTheDocument();
      expect(screen.getByText('Be the first to start the conversation')).toBeInTheDocument();
    });
  });

  describe('message rendering', () => {
    it('renders messages when loaded', () => {
      const messages = [
        createMockMessage({ id: 'msg-1', content: 'First message' }),
        createMockMessage({ id: 'msg-2', content: 'Second message' }),
      ];
      
      mockUseTaskMessages.mockReturnValue({
        messages,
        data: messages,
        loading: false,
        error: null,
        errorType: null,
      });
      
      render(<TaskComments taskId="task-1" agents={mockAgents} />);
      
      expect(screen.getByText('First message')).toBeInTheDocument();
      expect(screen.getByText('Second message')).toBeInTheDocument();
    });

    it('renders agent emoji and name for messages', () => {
      const message = createMockMessage({ 
        fromAgentId: 'agent-1',
        content: 'Test message'
      });
      
      mockUseTaskMessages.mockReturnValue({
        messages: [message],
        data: [message],
        loading: false,
        error: null,
        errorType: null,
      });
      
      render(<TaskComments taskId="task-1" agents={mockAgents} />);
      
      expect(screen.getByText('👩')).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    it('renders unknown agent when agent not found', () => {
      const message = createMockMessage({ 
        fromAgentId: 'unknown-agent',
        content: 'Test message'
      });
      
      mockUseTaskMessages.mockReturnValue({
        messages: [message],
        data: [message],
        loading: false,
        error: null,
        errorType: null,
      });
      
      render(<TaskComments taskId="task-1" agents={mockAgents} />);
      
      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });
  });

  describe('comment input', () => {
    it('renders comment input textarea', () => {
      render(<TaskComments taskId="task-1" agents={mockAgents} />);
      
      expect(screen.getByPlaceholderText(/Write a comment/)).toBeInTheDocument();
    });

    it('updates content when typing', () => {
      render(<TaskComments taskId="task-1" agents={mockAgents} />);
      
      const textarea = screen.getByPlaceholderText(/Write a comment/);
      fireEvent.change(textarea, { target: { value: 'New comment' } });
      
      expect(textarea).toHaveValue('New comment');
    });

    it('shows send button', () => {
      render(<TaskComments taskId="task-1" agents={mockAgents} />);
      
      expect(screen.getByText('Send')).toBeInTheDocument();
    });
  });

  describe('sending messages', () => {
    it('sends message when send button is clicked', async () => {
      render(<TaskComments taskId="task-1" agents={mockAgents} currentAgentId="user" />);
      
      const textarea = screen.getByPlaceholderText(/Write a comment/);
      fireEvent.change(textarea, { target: { value: 'Test message' } });
      
      const sendButton = screen.getByText('Send');
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(mockCreateMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            content: 'Test message',
            fromAgentId: 'user',
            taskId: 'task-1',
            mentions: [],
            attachments: [],
          })
        );
      });
    });

    it('clears textarea after sending', async () => {
      render(<TaskComments taskId="task-1" agents={mockAgents} />);
      
      const textarea = screen.getByPlaceholderText(/Write a comment/) as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'Test message' } });
      
      const sendButton = screen.getByText('Send');
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(textarea.value).toBe('');
      });
    });

    it('handles send error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockCreateMessage.mockRejectedValue(new Error('Network error'));
      
      render(<TaskComments taskId="task-1" agents={mockAgents} />);
      
      const textarea = screen.getByPlaceholderText(/Write a comment/);
      fireEvent.change(textarea, { target: { value: 'Test message' } });
      
      const sendButton = screen.getByText('Send');
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error sending message:',
          expect.any(Error)
        );
      });
      
      consoleErrorSpy.mockRestore();
    });
  });
});
