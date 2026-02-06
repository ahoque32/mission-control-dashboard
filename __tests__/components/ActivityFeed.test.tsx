import React from 'react';
import { render, screen } from '@testing-library/react';
import ActivityFeed from '../../components/ActivityFeed';
import { useActivity, useAgents } from '../../lib/firebase';
import { Activity, Agent } from '../../types';
import { Timestamp } from 'firebase/firestore';

// Mock the firebase hooks
jest.mock('../../lib/firebase');

const mockUseActivity = useActivity as jest.MockedFunction<typeof useActivity>;
const mockUseAgents = useAgents as jest.MockedFunction<typeof useAgents>;

// Helper to create a mock Timestamp
const mockTimestamp = (minutesAgo: number = 0) => {
  const date = new Date(Date.now() - minutesAgo * 60000);
  return {
    toMillis: () => date.getTime(),
    toDate: () => date,
  } as unknown as Timestamp;
};

// Helper to create a mock activity
const createMockActivity = (overrides: Partial<Activity> = {}): Activity => ({
  id: 'activity-1',
  type: 'task_created',
  agentId: 'agent-1',
  taskId: 'task-1',
  message: 'Created a new task',
  metadata: {},
  createdAt: mockTimestamp(5),
  ...overrides,
});

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

describe('ActivityFeed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementations
    mockUseAgents.mockReturnValue({
      agents: [],
      loading: false,
      error: null,
    });
  });

  describe('loading state', () => {
    it('shows loading spinner when loading', () => {
      mockUseActivity.mockReturnValue({
        activities: [],
        loading: true,
        error: null,
      });
      
      render(<ActivityFeed />);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Loading activity...')).toBeInTheDocument();
    });

    it('has correct aria-label on loading state', () => {
      mockUseActivity.mockReturnValue({
        activities: [],
        loading: true,
        error: null,
      });
      
      render(<ActivityFeed />);
      
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading activity');
    });
  });

  describe('error state', () => {
    it('shows error message when there is an error', () => {
      mockUseActivity.mockReturnValue({
        activities: [],
        loading: false,
        error: new Error('Failed to fetch activities'),
      });
      
      render(<ActivityFeed />);
      
      expect(screen.getByText('Failed to load activity')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch activities')).toBeInTheDocument();
    });

    it('shows warning emoji for error state', () => {
      mockUseActivity.mockReturnValue({
        activities: [],
        loading: false,
        error: new Error('Network error'),
      });
      
      render(<ActivityFeed />);
      
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('shows empty state when no activities', () => {
      mockUseActivity.mockReturnValue({
        activities: [],
        loading: false,
        error: null,
      });
      
      render(<ActivityFeed />);
      
      expect(screen.getByText('📭')).toBeInTheDocument();
      expect(screen.getByText('No activity yet')).toBeInTheDocument();
      expect(screen.getByText('Activity will appear here as agents work')).toBeInTheDocument();
    });
  });

  describe('activity rendering', () => {
    it('renders activity messages', () => {
      const activity = createMockActivity({ message: 'Completed the data export task' });
      
      mockUseActivity.mockReturnValue({
        activities: [activity],
        loading: false,
        error: null,
      });
      
      render(<ActivityFeed />);
      
      expect(screen.getByText('Completed the data export task')).toBeInTheDocument();
    });

    it('renders multiple activities', () => {
      const activities = [
        createMockActivity({ id: '1', message: 'First activity' }),
        createMockActivity({ id: '2', message: 'Second activity' }),
        createMockActivity({ id: '3', message: 'Third activity' }),
      ];
      
      mockUseActivity.mockReturnValue({
        activities,
        loading: false,
        error: null,
      });
      
      render(<ActivityFeed />);
      
      expect(screen.getByText('First activity')).toBeInTheDocument();
      expect(screen.getByText('Second activity')).toBeInTheDocument();
      expect(screen.getByText('Third activity')).toBeInTheDocument();
    });

    it('displays agent name when agent is found', () => {
      const agent = createMockAgent({ id: 'agent-1', name: 'DataBot', emoji: '📊' });
      const activity = createMockActivity({ agentId: 'agent-1' });
      
      mockUseAgents.mockReturnValue({
        agents: [agent],
        loading: false,
        error: null,
      });
      
      mockUseActivity.mockReturnValue({
        activities: [activity],
        loading: false,
        error: null,
      });
      
      render(<ActivityFeed />);
      
      expect(screen.getByText('DataBot')).toBeInTheDocument();
      expect(screen.getByText('📊')).toBeInTheDocument();
    });

    it('displays "Unknown Agent" when agent is not found', () => {
      mockUseAgents.mockReturnValue({
        agents: [],
        loading: false,
        error: null,
      });
      
      mockUseActivity.mockReturnValue({
        activities: [createMockActivity({ agentId: 'unknown-agent' })],
        loading: false,
        error: null,
      });
      
      render(<ActivityFeed />);
      
      expect(screen.getByText('Unknown Agent')).toBeInTheDocument();
    });

    it('displays default emoji when agent is not found', () => {
      mockUseAgents.mockReturnValue({
        agents: [],
        loading: false,
        error: null,
      });
      
      mockUseActivity.mockReturnValue({
        activities: [createMockActivity()],
        loading: false,
        error: null,
      });
      
      render(<ActivityFeed />);
      
      expect(screen.getByText('🤖')).toBeInTheDocument();
    });
  });

  describe('activity type badges', () => {
    it('displays activity type badge with formatted text', () => {
      const activity = createMockActivity({ type: 'task_created' });
      
      mockUseActivity.mockReturnValue({
        activities: [activity],
        loading: false,
        error: null,
      });
      
      render(<ActivityFeed />);
      
      expect(screen.getByText('task created')).toBeInTheDocument();
    });

    it('formats activity type with underscores replaced by spaces', () => {
      const activity = createMockActivity({ type: 'agent_status_changed' });
      
      mockUseActivity.mockReturnValue({
        activities: [activity],
        loading: false,
        error: null,
      });
      
      render(<ActivityFeed />);
      
      expect(screen.getByText('agent status changed')).toBeInTheDocument();
    });
  });

  describe('relative time display', () => {
    it('shows "just now" for very recent activity', () => {
      const activity = createMockActivity({ createdAt: mockTimestamp(0) });
      
      mockUseActivity.mockReturnValue({
        activities: [activity],
        loading: false,
        error: null,
      });
      
      render(<ActivityFeed />);
      
      expect(screen.getByText('just now')).toBeInTheDocument();
    });

    it('shows minutes ago for recent activity', () => {
      const activity = createMockActivity({ createdAt: mockTimestamp(15) });
      
      mockUseActivity.mockReturnValue({
        activities: [activity],
        loading: false,
        error: null,
      });
      
      render(<ActivityFeed />);
      
      expect(screen.getByText('15 mins ago')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has role="feed" on the container', () => {
      mockUseActivity.mockReturnValue({
        activities: [createMockActivity()],
        loading: false,
        error: null,
      });
      
      render(<ActivityFeed />);
      
      expect(screen.getByRole('feed')).toBeInTheDocument();
    });

    it('has aria-label on the feed', () => {
      mockUseActivity.mockReturnValue({
        activities: [createMockActivity()],
        loading: false,
        error: null,
      });
      
      render(<ActivityFeed />);
      
      expect(screen.getByRole('feed')).toHaveAttribute('aria-label', 'Activity feed');
    });

    it('has role="article" on each activity item', () => {
      mockUseActivity.mockReturnValue({
        activities: [
          createMockActivity({ id: '1' }),
          createMockActivity({ id: '2' }),
        ],
        loading: false,
        error: null,
      });
      
      render(<ActivityFeed />);
      
      const articles = screen.getAllByRole('article');
      expect(articles).toHaveLength(2);
    });

    it('has descriptive aria-label on activity items', () => {
      const agent = createMockAgent({ id: 'agent-1', name: 'TestBot' });
      const activity = createMockActivity({ 
        agentId: 'agent-1',
        message: 'Did something important' 
      });
      
      mockUseAgents.mockReturnValue({
        agents: [agent],
        loading: false,
        error: null,
      });
      
      mockUseActivity.mockReturnValue({
        activities: [activity],
        loading: false,
        error: null,
      });
      
      render(<ActivityFeed />);
      
      const article = screen.getByRole('article');
      expect(article).toHaveAttribute('aria-label', 'Activity by TestBot: Did something important');
    });
  });
});
