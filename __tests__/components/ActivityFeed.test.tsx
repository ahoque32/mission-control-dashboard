import React from 'react';
import { render, screen } from '@testing-library/react';
import ActivityFeed from '../../components/ActivityFeed';
import { useActivityPaginated, useAgents } from '../../lib/convex';
import { Activity, Agent } from '../../types';

// Mock the convex hooks
jest.mock('../../lib/convex');

const mockUseActivityPaginated = useActivityPaginated as jest.MockedFunction<typeof useActivityPaginated>;
const mockUseAgents = useAgents as jest.MockedFunction<typeof useAgents>;

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
      data: [],
      loading: false,
      error: null,
      errorType: null,
    });
  });

  describe('loading state', () => {
    it('shows loading spinner when loading', () => {
      mockUseActivityPaginated.mockReturnValue({
        activities: [],
        data: [],
        loading: true,
        error: null,
        errorType: null,
        hasMore: false,
        loadMore: jest.fn(),
        loadingMore: false,
      });
      
      render(<ActivityFeed />);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Loading activity...')).toBeInTheDocument();
    });

    it('has correct aria-label on loading state', () => {
      mockUseActivityPaginated.mockReturnValue({
        activities: [],
        data: [],
        loading: true,
        error: null,
        errorType: null,
        hasMore: false,
        loadMore: jest.fn(),
        loadingMore: false,
      });
      
      render(<ActivityFeed />);
      
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading activity');
    });
  });

  describe('error state', () => {
    it('shows error message when there is an error', () => {
      mockUseActivityPaginated.mockReturnValue({
        activities: [],
        data: [],
        loading: false,
        error: new Error('Failed to fetch activities'),
        errorType: null,
        hasMore: false,
        loadMore: jest.fn(),
        loadingMore: false,
      });
      
      render(<ActivityFeed />);
      
      expect(screen.getByText('Failed to load activity')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch activities')).toBeInTheDocument();
    });

    it('shows warning emoji for error state', () => {
      mockUseActivityPaginated.mockReturnValue({
        activities: [],
        data: [],
        loading: false,
        error: new Error('Network error'),
        errorType: null,
        hasMore: false,
        loadMore: jest.fn(),
        loadingMore: false,
      });
      
      render(<ActivityFeed />);
      
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('shows empty state when no activities', () => {
      mockUseActivityPaginated.mockReturnValue({
        activities: [],
        data: [],
        loading: false,
        error: null,
        errorType: null,
        hasMore: false,
        loadMore: jest.fn(),
        loadingMore: false,
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
      
      mockUseActivityPaginated.mockReturnValue({
        activities: [activity],
        data: [activity],
        loading: false,
        error: null,
        errorType: null,
        hasMore: false,
        loadMore: jest.fn(),
        loadingMore: false,
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
      
      mockUseActivityPaginated.mockReturnValue({
        activities,
        data: activities,
        loading: false,
        error: null,
        errorType: null,
        hasMore: false,
        loadMore: jest.fn(),
        loadingMore: false,
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
        data: [agent],
        loading: false,
        error: null,
        errorType: null,
      });
      
      mockUseActivityPaginated.mockReturnValue({
        activities: [activity],
        data: [activity],
        loading: false,
        error: null,
        errorType: null,
        hasMore: false,
        loadMore: jest.fn(),
        loadingMore: false,
      });
      
      render(<ActivityFeed />);
      
      expect(screen.getByText('DataBot')).toBeInTheDocument();
      expect(screen.getByText('📊')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has role="feed" on the container', () => {
      const activity = createMockActivity();
      mockUseActivityPaginated.mockReturnValue({
        activities: [activity],
        data: [activity],
        loading: false,
        error: null,
        errorType: null,
        hasMore: false,
        loadMore: jest.fn(),
        loadingMore: false,
      });
      
      render(<ActivityFeed />);
      
      expect(screen.getByRole('feed')).toBeInTheDocument();
    });

    it('has aria-label on the feed', () => {
      const activity = createMockActivity();
      mockUseActivityPaginated.mockReturnValue({
        activities: [activity],
        data: [activity],
        loading: false,
        error: null,
        errorType: null,
        hasMore: false,
        loadMore: jest.fn(),
        loadingMore: false,
      });
      
      render(<ActivityFeed />);
      
      expect(screen.getByRole('feed')).toHaveAttribute('aria-label', 'Activity feed');
    });

    it('has role="article" on each activity item', () => {
      const activities = [
        createMockActivity({ id: '1' }),
        createMockActivity({ id: '2' }),
      ];
      mockUseActivityPaginated.mockReturnValue({
        activities,
        data: activities,
        loading: false,
        error: null,
        errorType: null,
        hasMore: false,
        loadMore: jest.fn(),
        loadingMore: false,
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
        data: [agent],
        loading: false,
        error: null,
        errorType: null,
      });
      
      mockUseActivityPaginated.mockReturnValue({
        activities: [activity],
        data: [activity],
        loading: false,
        error: null,
        errorType: null,
        hasMore: false,
        loadMore: jest.fn(),
        loadingMore: false,
      });
      
      render(<ActivityFeed />);
      
      const article = screen.getByRole('article');
      expect(article).toHaveAttribute('aria-label', 'Activity by TestBot: Did something important');
    });
  });
});
