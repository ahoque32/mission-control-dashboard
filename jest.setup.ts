import '@testing-library/jest-dom';

// Mock firebase/firestore Timestamp
jest.mock('firebase/firestore', () => ({
  Timestamp: {
    now: () => ({
      toMillis: () => Date.now(),
      toDate: () => new Date(),
    }),
    fromDate: (date: Date) => ({
      toMillis: () => date.getTime(),
      toDate: () => date,
    }),
  },
}));

// Mock the firebase hooks used in components
jest.mock('./lib/firebase', () => ({
  useActivity: jest.fn(() => ({
    activities: [],
    loading: false,
    error: null,
  })),
  useAgents: jest.fn(() => ({
    agents: [],
    loading: false,
    error: null,
  })),
  useTasks: jest.fn(() => ({
    tasks: [],
    loading: false,
    error: null,
  })),
}));
