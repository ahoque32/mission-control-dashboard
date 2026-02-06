import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TaskCard from '../../components/TaskCard';
import { Task } from '../../types';
import { Timestamp } from 'firebase/firestore';

// Helper to create a mock Timestamp
const mockTimestamp = (date: Date = new Date()) => ({
  toMillis: () => date.getTime(),
  toDate: () => date,
} as unknown as Timestamp);

// Helper to create a mock task
const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  title: 'Test Task',
  description: 'This is a test task description',
  status: 'inbox',
  priority: 'medium',
  assigneeIds: [],
  createdBy: 'agent-1',
  dueDate: null,
  tags: [],
  createdAt: mockTimestamp(),
  updatedAt: mockTimestamp(),
  ...overrides,
});

describe('TaskCard', () => {
  describe('rendering', () => {
    it('renders the task title', () => {
      const task = createMockTask({ title: 'My Important Task' });
      render(<TaskCard task={task} />);
      
      expect(screen.getByText('My Important Task')).toBeInTheDocument();
    });

    it('renders the task description when provided', () => {
      const task = createMockTask({ description: 'Detailed task description' });
      render(<TaskCard task={task} />);
      
      expect(screen.getByText('Detailed task description')).toBeInTheDocument();
    });

    it('does not render description when not provided', () => {
      const task = createMockTask({ description: '' });
      render(<TaskCard task={task} />);
      
      expect(screen.queryByText('Detailed task description')).not.toBeInTheDocument();
    });

    it('renders "Unassigned" when no assignee emojis are provided', () => {
      const task = createMockTask();
      render(<TaskCard task={task} assigneeEmojis={[]} />);
      
      expect(screen.getByText('Unassigned')).toBeInTheDocument();
    });

    it('renders assignee emojis when provided', () => {
      const task = createMockTask();
      render(<TaskCard task={task} assigneeEmojis={['🤖', '🦊']} />);
      
      expect(screen.getByText('🤖')).toBeInTheDocument();
      expect(screen.getByText('🦊')).toBeInTheDocument();
      expect(screen.queryByText('Unassigned')).not.toBeInTheDocument();
    });

    it('shows +N indicator when more than 3 assignees', () => {
      const task = createMockTask();
      render(<TaskCard task={task} assigneeEmojis={['🤖', '🦊', '🐻', '🦁', '🐯']} />);
      
      expect(screen.getByText('+2')).toBeInTheDocument();
    });
  });

  describe('priority badges', () => {
    it('renders low priority badge', () => {
      const task = createMockTask({ priority: 'low' });
      render(<TaskCard task={task} />);
      
      expect(screen.getByText('Low')).toBeInTheDocument();
    });

    it('renders medium priority badge', () => {
      const task = createMockTask({ priority: 'medium' });
      render(<TaskCard task={task} />);
      
      expect(screen.getByText('Med')).toBeInTheDocument();
    });

    it('renders high priority badge', () => {
      const task = createMockTask({ priority: 'high' });
      render(<TaskCard task={task} />);
      
      expect(screen.getByText('High')).toBeInTheDocument();
    });

    it('renders urgent priority badge', () => {
      const task = createMockTask({ priority: 'urgent' });
      render(<TaskCard task={task} />);
      
      expect(screen.getByText('Urgent')).toBeInTheDocument();
    });
  });

  describe('tags', () => {
    it('renders tags when provided', () => {
      const task = createMockTask({ tags: ['frontend', 'bug'] });
      render(<TaskCard task={task} />);
      
      expect(screen.getByText('frontend')).toBeInTheDocument();
      expect(screen.getByText('bug')).toBeInTheDocument();
    });

    it('shows +N for more than 2 tags', () => {
      const task = createMockTask({ tags: ['frontend', 'bug', 'urgent', 'help'] });
      render(<TaskCard task={task} />);
      
      expect(screen.getByText('frontend')).toBeInTheDocument();
      expect(screen.getByText('bug')).toBeInTheDocument();
      expect(screen.getByText('+2')).toBeInTheDocument();
    });

    it('does not render tags section when no tags', () => {
      const task = createMockTask({ tags: [] });
      const { container } = render(<TaskCard task={task} />);
      
      // The tags section has a specific border-t class
      const tagsSection = container.querySelector('.border-t.border-\\[\\#2a2a2a\\]');
      expect(tagsSection).not.toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onClick when card is clicked', () => {
      const onClick = jest.fn();
      const task = createMockTask();
      render(<TaskCard task={task} onClick={onClick} />);
      
      const card = screen.getByText('Test Task').closest('div');
      fireEvent.click(card!);
      
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('does not throw when clicked without onClick handler', () => {
      const task = createMockTask();
      render(<TaskCard task={task} />);
      
      const card = screen.getByText('Test Task').closest('div');
      expect(() => fireEvent.click(card!)).not.toThrow();
    });
  });
});
