# Mission Control Dashboard

A real-time Next.js dashboard for monitoring and managing AI agent coordination, tasks, and activities.

## Overview

The Mission Control Dashboard provides a visual interface for:

- **Agent Monitoring**: Real-time status grid with heartbeat indicators
- **Task Management**: Drag-and-drop Kanban board with task detail views
- **Activity Feed**: Live stream of all system events
- **Document Library**: Shared deliverables and research notes

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Mission Control Dashboard                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      Next.js App                          │   │
│  │                                                           │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐     │   │
│  │  │  Home   │  │  Tasks  │  │ Agents  │  │  Docs   │     │   │
│  │  │  Page   │  │ Kanban  │  │  List   │  │ Library │     │   │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘     │   │
│  │       │            │            │            │           │   │
│  │       └────────────┴────────────┴────────────┘           │   │
│  │                         │                                 │   │
│  │              ┌──────────▼──────────┐                     │   │
│  │              │   Firebase Hooks    │                     │   │
│  │              │   (Real-time)       │                     │   │
│  │              └──────────┬──────────┘                     │   │
│  └──────────────────────────┼────────────────────────────────┘   │
│                             │                                    │
│                    ┌────────▼────────┐                          │
│                    │    Firebase     │                          │
│                    │   Firestore     │                          │
│                    └─────────────────┘                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Component Structure

```
app/
├── page.tsx              # Dashboard home (stats, activity, recent tasks)
├── layout.tsx            # Root layout with sidebar navigation
├── error.tsx             # Global error boundary
├── loading.tsx           # Global loading state
├── not-found.tsx         # 404 page
├── tasks/
│   ├── page.tsx          # Kanban board view
│   └── [id]/
│       ├── page.tsx      # Task detail with comments
│       ├── loading.tsx   # Task loading skeleton
│       └── not-found.tsx # Task not found
├── agents/
│   └── page.tsx          # Agent list view
├── activity/
│   └── page.tsx          # Full activity feed
└── documents/
    └── page.tsx          # Document library

components/
├── AgentCard.tsx         # Individual agent status card
├── AgentGrid.tsx         # Grid of agent cards
├── ActivityFeed.tsx      # Activity list with filtering
├── KanbanBoard.tsx       # Drag-and-drop task board
├── KanbanColumn.tsx      # Single Kanban column
├── TaskCard.tsx          # Task card display
├── DraggableTaskCard.tsx # Draggable task wrapper
├── TaskDetail.tsx        # Full task view
├── TaskComments.tsx      # Task comment thread
├── CommentInput.tsx      # Comment composer
├── NewTaskForm.tsx       # Task creation form
├── Sidebar.tsx           # Navigation sidebar
├── MobileNav.tsx         # Mobile navigation
└── ErrorBoundary.tsx     # Error boundary wrapper

lib/
├── firebase-config.ts    # Firebase initialization
└── firebase.ts           # Real-time hooks and utilities

types/
└── index.ts              # TypeScript type definitions
```

## Setup

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun
- Firebase project (shared with CLI)

### Installation

```bash
cd dashboard

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Environment

The dashboard uses the same Firebase configuration as the CLI. No additional environment variables are required.

## Features

### Dashboard Home (`/`)

The home page provides an overview of the entire system:

- **Agent Status Grid**: Live status of all registered agents
- **Task Statistics**: Total, in-progress, blocked, completion rate
- **Recent Activity**: Latest 20 system events
- **Recent Tasks**: Quick access to latest tasks

### Kanban Board (`/tasks`)

A drag-and-drop task board with six columns:

| Column | Color | Description |
|--------|-------|-------------|
| Inbox | Gray | New, unassigned tasks |
| Assigned | Blue | Tasks assigned to agents |
| In Progress | Gold | Actively being worked |
| Review | Purple | Ready for review |
| Done | Green | Completed tasks |
| Blocked | Red | Tasks with blockers |

**Features:**
- Drag tasks between columns to update status
- Click tasks to view details
- Real-time updates from Firebase

### Task Detail (`/tasks/[id]`)

Full task view with:

- Title, description, priority, status
- Assigned agents with avatars
- Tags and due date
- **Comment thread** with @mention support
- Edit and delete actions

### Agent List (`/agents`)

Grid view of all registered agents showing:

- Name, emoji, role
- Current status (active, idle, blocked)
- Last heartbeat timestamp
- Current task assignment

### Activity Feed (`/activity`)

Comprehensive activity log with:

- All system events (task created, status changed, etc.)
- Agent attribution
- Timestamp formatting
- Type-based filtering

### Document Library (`/documents`)

Shared documents and deliverables:

- Research notes
- Protocols
- Deliverables
- General notes

## Real-time Hooks

The dashboard uses custom React hooks for real-time Firebase subscriptions:

```typescript
import { useAgents, useTasks, useActivity, useTask, useTaskMessages } from '@/lib/firebase';

// All agents (real-time)
const { agents, loading, error } = useAgents();

// All tasks (real-time)
const { tasks, loading, error } = useTasks();

// Single task by ID
const { task, loading, error } = useTask(taskId);

// Messages for a task
const { messages, loading, error } = useTaskMessages(taskId);

// Activity feed
const { activities, loading, error } = useActivity();
```

### Error Handling

Hooks provide categorized errors:

```typescript
const { data, error, errorType } = useAgents();

// errorType: 'permission' | 'network' | 'not-found' | 'other'
if (errorType === 'network') {
  // Show "Will retry when connection restored"
}
```

### Query Limits

To prevent unbounded data fetching, all hooks have default limits:

| Collection | Default Limit |
|------------|---------------|
| agents | 100 |
| tasks | 200 |
| activities | 100 |
| messages | 500 |
| documents | 100 |

## Type Definitions

All Firebase documents are fully typed:

```typescript
interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'active' | 'blocked';
  emoji: string;
  level: 'intern' | 'specialist' | 'lead';
  sessionKey: string;
  currentTaskId: string | null;
  lastHeartbeat: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'inbox' | 'assigned' | 'in_progress' | 'review' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeIds: string[];
  createdBy: string;
  dueDate: Timestamp | null;
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface Message {
  id: string;
  taskId: string;
  fromAgentId: string;
  content: string;
  mentions: string[];
  attachments: string[];
  createdAt: Timestamp;
}

interface Activity {
  id: string;
  type: ActivityType;
  agentId: string;
  taskId: string | null;
  message: string;
  metadata: Record<string, any>;
  createdAt: Timestamp;
}
```

## Accessibility

The dashboard includes comprehensive accessibility features:

- ARIA labels on all interactive elements
- `role="navigation"` on nav elements
- `aria-expanded` and `aria-controls` on mobile menu
- `role="status"` on loading states
- `role="feed"` and `role="article"` on activity feed
- `role="dialog"` on mobile nav overlay
- Screen reader text for loading states
- `aria-hidden` on decorative elements

## Styling

The dashboard uses a dark theme with consistent colors:

| Element | Color |
|---------|-------|
| Background | `#0a0a0a` |
| Card Background | `#1a1a1a` |
| Border | `#2a2a2a` |
| Text Primary | `#ededed` |
| Text Secondary | `#888` |
| Accent (Gold) | `#d4a574` |
| Hover | `#c9996a` |

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

Test coverage includes:

- **TaskCard**: 16 tests (rendering, priority, interactions)
- **AgentCard**: 15 tests (status, heartbeat, display)
- **ActivityFeed**: 20 tests (loading, error, accessibility)

Total: 51 tests

## Building for Production

```bash
# Build
npm run build

# Start production server
npm start
```

## Deployment

The dashboard is configured for Vercel deployment:

1. Connect your GitHub repository to Vercel
2. Vercel auto-detects Next.js and configures build
3. Each push to `main` triggers deployment

Preview URL: [mission-control-dashboard.vercel.app](https://mission-control-dashboard.vercel.app)

## CLI Integration

The Dashboard works alongside the [Mission Control CLI](../) for a complete workflow:

```bash
# Create task via CLI
node mc.js tasks create --title "Research competitors" --priority high

# Task appears instantly on Dashboard Kanban board
# Agents can drag tasks to update status
# Comments sync in real-time between CLI and Dashboard
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Run tests (`npm test`)
4. Run linting (`npm run lint`)
5. Commit and push
6. Open a Pull Request

## License

MIT
