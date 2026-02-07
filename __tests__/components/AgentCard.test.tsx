import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import AgentCard from '../../components/AgentCard';
import { Agent } from '../../types';
import { Timestamp } from 'firebase/firestore';

// Mock firebase/firestore
jest.mock('firebase/firestore', () => ({
  ...jest.requireActual('firebase/firestore'),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  onSnapshot: jest.fn(),
  Timestamp: {
    fromDate: jest.fn((date: Date) => ({
      toMillis: () => date.getTime(),
      toDate: () => date,
    })),
  },
}));

// Mock lib/firebase
jest.mock('../../lib/firebase', () => ({
  db: {},
}));

const mockOnSnapshot = require('firebase/firestore').onSnapshot;

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
  status: 'idle',
  currentTaskId: null,
  sessionKey: 'agent:testbot:main',
  emoji: '🤖',
  level: 'specialist',
  lastHeartbeat: mockTimestamp(1), // 1 minute ago (online)
  createdAt: mockTimestamp(1000),
  updatedAt: mockTimestamp(0),
  ...overrides,
});

describe('AgentCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock: successful subscription with no activities
    mockOnSnapshot.mockImplementation((query: any, onSuccess: any) => {
      onSuccess({ empty: true, docs: [] });
      return jest.fn(); // unsubscribe function
    });
  });

  describe('rendering', () => {
    it('renders the agent name', () => {
      const agent = createMockAgent({ name: 'DataProcessor' });
      render(<AgentCard agent={agent} />);
      
      expect(screen.getByText('DataProcessor')).toBeInTheDocument();
    });

    it('renders the agent role', () => {
      const agent = createMockAgent({ role: 'Data Analysis Specialist' });
      render(<AgentCard agent={agent} />);
      
      expect(screen.getByText('Data Analysis Specialist')).toBeInTheDocument();
    });

    it('renders the agent emoji', () => {
      const agent = createMockAgent({ emoji: '🦊' });
      render(<AgentCard agent={agent} />);
      
      expect(screen.getByText('🦊')).toBeInTheDocument();
    });

    it('renders the current task when provided', () => {
      const agent = createMockAgent();
      render(<AgentCard agent={agent} currentTask="Working on data migration" />);
      
      expect(screen.getByText('Current Task')).toBeInTheDocument();
      expect(screen.getByText('Working on data migration')).toBeInTheDocument();
    });

    it('does not render current task section when not provided', () => {
      const agent = createMockAgent();
      render(<AgentCard agent={agent} />);
      
      expect(screen.queryByText('Current Task')).not.toBeInTheDocument();
    });

    it('renders null currentTask as no task', () => {
      const agent = createMockAgent();
      render(<AgentCard agent={agent} currentTask={null} />);
      
      expect(screen.queryByText('Current Task')).not.toBeInTheDocument();
    });
  });

  describe('status display', () => {
    it('shows active status when agent is active and online', () => {
      const agent = createMockAgent({ 
        status: 'active',
        lastHeartbeat: mockTimestamp(1) // 1 minute ago
      });
      render(<AgentCard agent={agent} />);
      
      expect(screen.getByText('active')).toBeInTheDocument();
    });

    it('shows idle status when agent is idle and online', () => {
      const agent = createMockAgent({ 
        status: 'idle',
        lastHeartbeat: mockTimestamp(2) // 2 minutes ago
      });
      render(<AgentCard agent={agent} />);
      
      expect(screen.getByText('idle')).toBeInTheDocument();
    });

    it('shows blocked status when agent is blocked and online', () => {
      const agent = createMockAgent({ 
        status: 'blocked',
        lastHeartbeat: mockTimestamp(1) // 1 minute ago
      });
      render(<AgentCard agent={agent} />);
      
      expect(screen.getByText('blocked')).toBeInTheDocument();
    });

    it('shows offline status when last heartbeat is more than 5 minutes ago', () => {
      const agent = createMockAgent({ 
        status: 'active', // Even if status is active
        lastHeartbeat: mockTimestamp(10) // 10 minutes ago
      });
      render(<AgentCard agent={agent} />);
      
      expect(screen.getByText('offline')).toBeInTheDocument();
    });
  });

  describe('last heartbeat display', () => {
    it('shows "just now" for very recent heartbeat', () => {
      const agent = createMockAgent({ 
        lastHeartbeat: mockTimestamp(0) // just now
      });
      render(<AgentCard agent={agent} />);
      
      expect(screen.getByText('just now')).toBeInTheDocument();
    });

    it('shows "1 min ago" for 1 minute old heartbeat', () => {
      const agent = createMockAgent({ 
        lastHeartbeat: mockTimestamp(1)
      });
      render(<AgentCard agent={agent} />);
      
      expect(screen.getByText('1 min ago')).toBeInTheDocument();
    });

    it('shows minutes ago for heartbeat within an hour', () => {
      const agent = createMockAgent({ 
        lastHeartbeat: mockTimestamp(30) // 30 minutes ago
      });
      render(<AgentCard agent={agent} />);
      
      expect(screen.getByText('30 mins ago')).toBeInTheDocument();
    });

    it('shows hours ago for heartbeat within a day', () => {
      const agent = createMockAgent({ 
        lastHeartbeat: mockTimestamp(120) // 2 hours ago
      });
      render(<AgentCard agent={agent} />);
      
      expect(screen.getByText('2 hours ago')).toBeInTheDocument();
    });

    it('shows "1 hour ago" for exactly 1 hour old heartbeat', () => {
      const agent = createMockAgent({ 
        lastHeartbeat: mockTimestamp(60) // 1 hour ago
      });
      render(<AgentCard agent={agent} />);
      
      expect(screen.getByText('1 hour ago')).toBeInTheDocument();
    });

    it('shows "Last heartbeat:" label', () => {
      const agent = createMockAgent();
      render(<AgentCard agent={agent} />);
      
      expect(screen.getByText('Last heartbeat:')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('has hover effect class on card', () => {
      const agent = createMockAgent();
      const { container } = render(<AgentCard agent={agent} />);
      
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('card-hover');
    });

    it('displays correct background for dark theme', () => {
      const agent = createMockAgent();
      const { container } = render(<AgentCard agent={agent} />);
      
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('bg-[#1a1a1a]');
    });
  });

  describe('activity subscription', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('subscribes to recent activities on mount', () => {
      const agent = createMockAgent({ id: 'test-agent-1' });
      
      // Mock successful subscription
      mockOnSnapshot.mockImplementation((query: any, onSuccess: any) => {
        onSuccess({ empty: true, docs: [] });
        return jest.fn(); // unsubscribe function
      });
      
      render(<AgentCard agent={agent} />);
      
      expect(mockOnSnapshot).toHaveBeenCalled();
    });

    it('handles subscription success with no activities', async () => {
      const agent = createMockAgent();
      
      mockOnSnapshot.mockImplementation((query: any, onSuccess: any) => {
        onSuccess({ empty: true, docs: [] });
        return jest.fn();
      });
      
      render(<AgentCard agent={agent} />);
      
      // Component should render without errors
      expect(screen.getByText(agent.name)).toBeInTheDocument();
    });

    it('handles subscription success with recent activity', async () => {
      const agent = createMockAgent();
      
      mockOnSnapshot.mockImplementation((query: any, onSuccess: any) => {
        onSuccess({
          empty: false,
          docs: [{
            id: 'activity-1',
            data: () => ({
              type: 'agent_task_started',
              message: 'Working on task',
              metadata: { taskName: 'Test Task' },
              createdAt: mockTimestamp(1),
            }),
          }],
        });
        return jest.fn();
      });
      
      render(<AgentCard agent={agent} />);
      
      // Component should render without errors
      expect(screen.getByText(agent.name)).toBeInTheDocument();
    });

    it('handles subscription error gracefully', async () => {
      const agent = createMockAgent();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockOnSnapshot.mockImplementation((query: any, onSuccess: any, onError: any) => {
        onError(new Error('Permission denied'));
        return jest.fn();
      });
      
      render(<AgentCard agent={agent} />);
      
      // Component should still render despite error
      expect(screen.getByText(agent.name)).toBeInTheDocument();
      
      // Error should be logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error subscribing to activities'),
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
    });

    it('unsubscribes on unmount', () => {
      const agent = createMockAgent();
      const unsubscribeMock = jest.fn();
      
      mockOnSnapshot.mockImplementation(() => unsubscribeMock);
      
      const { unmount } = render(<AgentCard agent={agent} />);
      
      expect(unsubscribeMock).not.toHaveBeenCalled();
      
      unmount();
      
      expect(unsubscribeMock).toHaveBeenCalled();
    });

    it('resets state when agent changes', async () => {
      const agent1 = createMockAgent({ id: 'agent-1', name: 'Agent One' });
      const agent2 = createMockAgent({ id: 'agent-2', name: 'Agent Two' });
      
      let callCount = 0;
      mockOnSnapshot.mockImplementation((query: any, onSuccess: any) => {
        callCount++;
        onSuccess({ empty: true, docs: [] });
        return jest.fn();
      });
      
      const { rerender } = render(<AgentCard agent={agent1} />);
      
      expect(callCount).toBe(1);
      
      rerender(<AgentCard agent={agent2} />);
      
      // Should create new subscription when agent changes
      expect(callCount).toBe(2);
    });

    it('handles network errors without crashing', () => {
      const agent = createMockAgent();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockOnSnapshot.mockImplementation((query: any, onSuccess: any, onError: any) => {
        onError({ code: 'unavailable', message: 'Network error' });
        return jest.fn();
      });
      
      render(<AgentCard agent={agent} />);
      
      expect(screen.getByText(agent.name)).toBeInTheDocument();
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });
});
