import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskComments from '../../components/TaskComments';
import { Agent, Message } from '../../types';
import { Timestamp } from 'firebase/firestore';

// Mock firebase/firestore
jest.mock('firebase/firestore', () => ({
  ...jest.requireActual('firebase/firestore'),
  collection: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  onSnapshot: jest.fn(),
  addDoc: jest.fn(),
  serverTimestamp: jest.fn(() => ({ _seconds: Date.now() / 1000 })),
}));

// Mock lib/firebase-config
jest.mock('../../lib/firebase-config', () => ({
  db: {},
}));

// Mock react-markdown
jest.mock('react-markdown', () => {
  return ({ children }: { children: string }) => <div>{children}</div>;
});

// Mock scrollIntoView (not available in jsdom)
Element.prototype.scrollIntoView = jest.fn();

const mockOnSnapshot = require('firebase/firestore').onSnapshot;
const mockAddDoc = require('firebase/firestore').addDoc;

// Helper to create a mock Timestamp
const mockTimestamp = (minutesAgo: number = 0) => {
  const date = new Date(Date.now() - minutesAgo * 60000);
  return {
    toMillis: () => date.getTime(),
    toDate: () => date,
  } as unknown as Timestamp;
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

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock: successful subscription with no messages
    mockOnSnapshot.mockImplementation((query: any, onSuccess: any) => {
      onSuccess({ docs: [] });
      return jest.fn(); // unsubscribe function
    });
  });

  describe('loading state', () => {
    it('shows loading spinner initially', () => {
      mockOnSnapshot.mockImplementation(() => jest.fn());
      
      render(<TaskComments taskId="task-1" agents={mockAgents} />);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Loading comments...')).toBeInTheDocument();
    });

    it('has correct aria-label on loading state', () => {
      mockOnSnapshot.mockImplementation(() => jest.fn());
      
      render(<TaskComments taskId="task-1" agents={mockAgents} />);
      
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading comments');
    });
  });

  describe('error state', () => {
    it('shows error message when subscription fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockOnSnapshot.mockImplementation((query: any, onSuccess: any, onError: any) => {
        onError(new Error('Permission denied'));
        return jest.fn();
      });
      
      render(<TaskComments taskId="task-1" agents={mockAgents} />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to Load Comments')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Permission denied')).toBeInTheDocument();
      
      consoleErrorSpy.mockRestore();
    });

    it('shows retry button on error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockOnSnapshot.mockImplementation((query: any, onSuccess: any, onError: any) => {
        onError(new Error('Network error'));
        return jest.fn();
      });
      
      render(<TaskComments taskId="task-1" agents={mockAgents} />);
      
      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
      
      consoleErrorSpy.mockRestore();
    });

    it('retries loading when retry button is clicked', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      let callCount = 0;
      
      mockOnSnapshot.mockImplementation((query: any, onSuccess: any, onError: any) => {
        callCount++;
        if (callCount === 1) {
          onError(new Error('Network error'));
        } else {
          onSuccess({ docs: [] });
        }
        return jest.fn();
      });
      
      render(<TaskComments taskId="task-1" agents={mockAgents} />);
      
      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Retry'));
      
      await waitFor(() => {
        expect(screen.queryByText('Failed to Load Comments')).not.toBeInTheDocument();
      });
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('empty state', () => {
    it('shows empty state when no messages', async () => {
      mockOnSnapshot.mockImplementation((query: any, onSuccess: any) => {
        onSuccess({ docs: [] });
        return jest.fn();
      });
      
      render(<TaskComments taskId="task-1" agents={mockAgents} />);
      
      await waitFor(() => {
        expect(screen.getByText('No comments yet')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Be the first to start the conversation')).toBeInTheDocument();
    });
  });

  describe('message rendering', () => {
    it('renders messages when loaded', async () => {
      const messages = [
        createMockMessage({ id: 'msg-1', content: 'First message' }),
        createMockMessage({ id: 'msg-2', content: 'Second message' }),
      ];
      
      mockOnSnapshot.mockImplementation((query: any, onSuccess: any) => {
        onSuccess({
          docs: messages.map(msg => ({
            id: msg.id,
            data: () => msg,
          })),
        });
        return jest.fn();
      });
      
      render(<TaskComments taskId="task-1" agents={mockAgents} />);
      
      await waitFor(() => {
        expect(screen.getByText('First message')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Second message')).toBeInTheDocument();
    });

    it('renders agent emoji and name for messages', async () => {
      const message = createMockMessage({ 
        fromAgentId: 'agent-1',
        content: 'Test message'
      });
      
      mockOnSnapshot.mockImplementation((query: any, onSuccess: any) => {
        onSuccess({
          docs: [{
            id: message.id,
            data: () => message,
          }],
        });
        return jest.fn();
      });
      
      render(<TaskComments taskId="task-1" agents={mockAgents} />);
      
      await waitFor(() => {
        expect(screen.getByText('👩')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    it('renders unknown agent when agent not found', async () => {
      const message = createMockMessage({ 
        fromAgentId: 'unknown-agent',
        content: 'Test message'
      });
      
      mockOnSnapshot.mockImplementation((query: any, onSuccess: any) => {
        onSuccess({
          docs: [{
            id: message.id,
            data: () => message,
          }],
        });
        return jest.fn();
      });
      
      render(<TaskComments taskId="task-1" agents={mockAgents} />);
      
      await waitFor(() => {
        expect(screen.getByText('Unknown')).toBeInTheDocument();
      });
    });
  });

  describe('comment input', () => {
    beforeEach(() => {
      mockOnSnapshot.mockImplementation((query: any, onSuccess: any) => {
        onSuccess({ docs: [] });
        return jest.fn();
      });
    });

    it('renders comment input textarea', async () => {
      render(<TaskComments taskId="task-1" agents={mockAgents} />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Write a comment/)).toBeInTheDocument();
      });
    });

    it('updates content when typing', async () => {
      render(<TaskComments taskId="task-1" agents={mockAgents} />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Write a comment/)).toBeInTheDocument();
      });
      
      const textarea = screen.getByPlaceholderText(/Write a comment/);
      
      fireEvent.change(textarea, { target: { value: 'New comment' } });
      
      expect(textarea).toHaveValue('New comment');
    });

    it('shows send button', async () => {
      render(<TaskComments taskId="task-1" agents={mockAgents} />);
      
      await waitFor(() => {
        expect(screen.getByText('Send')).toBeInTheDocument();
      });
    });

    it('disables send button when content is empty', async () => {
      render(<TaskComments taskId="task-1" agents={mockAgents} />);
      
      await waitFor(() => {
        const sendButton = screen.getByText('Send');
        expect(sendButton).toBeDisabled();
      });
    });

    it('enables send button when content is not empty', async () => {
      render(<TaskComments taskId="task-1" agents={mockAgents} />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Write a comment/)).toBeInTheDocument();
      });
      
      const textarea = screen.getByPlaceholderText(/Write a comment/);
      fireEvent.change(textarea, { target: { value: 'New comment' } });
      
      const sendButton = screen.getByText('Send');
      expect(sendButton).not.toBeDisabled();
    });
  });

  describe('sending messages', () => {
    beforeEach(() => {
      mockOnSnapshot.mockImplementation((query: any, onSuccess: any) => {
        onSuccess({ docs: [] });
        return jest.fn();
      });
      mockAddDoc.mockResolvedValue({ id: 'new-msg-id' });
    });

    it('sends message when send button is clicked', async () => {
      render(<TaskComments taskId="task-1" agents={mockAgents} currentAgentId="user" />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Write a comment/)).toBeInTheDocument();
      });
      
      const textarea = screen.getByPlaceholderText(/Write a comment/);
      fireEvent.change(textarea, { target: { value: 'Test message' } });
      
      const sendButton = screen.getByText('Send');
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(mockAddDoc).toHaveBeenCalled();
      });
      
      // Verify the call was made with correct data
      const callArgs = mockAddDoc.mock.calls[0];
      expect(callArgs[1]).toMatchObject({
        content: 'Test message',
        fromAgentId: 'user',
        taskId: 'task-1',
        mentions: [],
        attachments: [],
      });
    });

    it('clears textarea after sending', async () => {
      render(<TaskComments taskId="task-1" agents={mockAgents} />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Write a comment/)).toBeInTheDocument();
      });
      
      const textarea = screen.getByPlaceholderText(/Write a comment/) as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'Test message' } });
      
      const sendButton = screen.getByText('Send');
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(textarea.value).toBe('');
      });
    });

    it('shows sending state while submitting', async () => {
      mockAddDoc.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<TaskComments taskId="task-1" agents={mockAgents} />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Write a comment/)).toBeInTheDocument();
      });
      
      const textarea = screen.getByPlaceholderText(/Write a comment/);
      fireEvent.change(textarea, { target: { value: 'Test message' } });
      
      const sendButton = screen.getByText('Send');
      fireEvent.click(sendButton);
      
      expect(screen.getByText('Sending...')).toBeInTheDocument();
    });

    it('handles send error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockAddDoc.mockRejectedValue(new Error('Network error'));
      
      render(<TaskComments taskId="task-1" agents={mockAgents} />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Write a comment/)).toBeInTheDocument();
      });
      
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

  describe('race condition prevention', () => {
    it('prevents stale updates when taskId changes', async () => {
      let onSuccessCallback: any;
      
      mockOnSnapshot.mockImplementation((query: any, onSuccess: any) => {
        onSuccessCallback = onSuccess;
        return jest.fn();
      });
      
      const { rerender } = render(<TaskComments taskId="task-1" agents={mockAgents} />);
      
      // Change taskId
      rerender(<TaskComments taskId="task-2" agents={mockAgents} />);
      
      // Simulate delayed callback from first subscription
      onSuccessCallback({
        docs: [
          {
            id: 'msg-1',
            data: () => createMockMessage({ content: 'Old task message' }),
          },
        ],
      });
      
      // Should not display the stale message
      await waitFor(() => {
        expect(screen.queryByText('Old task message')).not.toBeInTheDocument();
      });
    });

    it('unsubscribes from previous subscription when taskId changes', () => {
      const unsubscribe1 = jest.fn();
      const unsubscribe2 = jest.fn();
      let callCount = 0;
      
      mockOnSnapshot.mockImplementation((query: any, onSuccess: any) => {
        callCount++;
        onSuccess({ docs: [] });
        return callCount === 1 ? unsubscribe1 : unsubscribe2;
      });
      
      const { rerender } = render(<TaskComments taskId="task-1" agents={mockAgents} />);
      
      expect(unsubscribe1).not.toHaveBeenCalled();
      
      rerender(<TaskComments taskId="task-2" agents={mockAgents} />);
      
      expect(unsubscribe1).toHaveBeenCalled();
      expect(unsubscribe2).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('unsubscribes on unmount', async () => {
      const unsubscribeMock = jest.fn();
      
      mockOnSnapshot.mockImplementation((query: any, onSuccess: any) => {
        onSuccess({ docs: [] });
        return unsubscribeMock;
      });
      
      const { unmount } = render(<TaskComments taskId="task-1" agents={mockAgents} />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Write a comment/)).toBeInTheDocument();
      });
      
      expect(unsubscribeMock).not.toHaveBeenCalled();
      
      unmount();
      
      expect(unsubscribeMock).toHaveBeenCalled();
    });

    it('handles null taskId without subscribing', () => {
      mockOnSnapshot.mockImplementation(() => jest.fn());
      
      render(<TaskComments taskId={null as any} agents={mockAgents} />);
      
      expect(mockOnSnapshot).not.toHaveBeenCalled();
    });
  });
});
