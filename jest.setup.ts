import '@testing-library/jest-dom';

// Mock convex/react hooks used by lib/convex.ts
jest.mock('convex/react', () => ({
  useQuery: jest.fn(() => undefined),
  useMutation: jest.fn(() => jest.fn()),
  ConvexProvider: ({ children }: { children: React.ReactNode }) => children,
  ConvexReactClient: jest.fn(),
}));

// Mock the convex hooks used in components
jest.mock('./lib/convex', () => ({
  useAgents: jest.fn(() => ({
    agents: [],
    data: [],
    loading: false,
    error: null,
    errorType: null,
  })),
  useTasks: jest.fn(() => ({
    tasks: [],
    data: [],
    loading: false,
    error: null,
    errorType: null,
  })),
  useActivity: jest.fn(() => ({
    activities: [],
    data: [],
    loading: false,
    error: null,
    errorType: null,
  })),
  useActivityPaginated: jest.fn(() => ({
    activities: [],
    data: [],
    loading: false,
    error: null,
    errorType: null,
    hasMore: false,
    loadMore: jest.fn(),
    loadingMore: false,
  })),
  useMessages: jest.fn(() => ({
    messages: [],
    data: [],
    loading: false,
    error: null,
    errorType: null,
  })),
  useDocuments: jest.fn(() => ({
    documents: [],
    data: [],
    loading: false,
    error: null,
    errorType: null,
  })),
  useTaskMessages: jest.fn(() => ({
    messages: [],
    data: [],
    loading: false,
    error: null,
    errorType: null,
  })),
  useTask: jest.fn(() => ({
    task: null,
    data: null,
    loading: false,
    error: null,
    errorType: null,
  })),
  useCronJobs: jest.fn(() => ({
    cronJobs: [],
    data: [],
    loading: false,
    error: null,
    errorType: null,
  })),
  useAgentRecentActivity: jest.fn(() => ({
    activities: [],
    loading: false,
    error: null,
  })),
  useUpdateTaskStatus: jest.fn(() => jest.fn()),
  useCreateTask: jest.fn(() => jest.fn()),
  useCreateMessage: jest.fn(() => jest.fn()),
}));
