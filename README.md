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

Grid view of all registered agents with real-time status monitoring and activity indicators.

**AgentCard Features:**

- **Name, emoji, role** - Visual agent identification
- **Status badge** - Color-coded current state (active, idle, blocked, offline)
- **Last heartbeat** - Relative time since last check-in
- **Current task assignment** - Link to active task (if any)
- **🟢 Active Indicator** - Pulsing green LED for agents with recent activity

**Active Indicator Behavior:**

The AgentCard displays a pulsing green indicator when the agent has logged activity within the last 30 seconds:

```tsx
// Determine if agent is actively working
const isActive = () => {
  if (!activities || activities.length === 0) return false;
  
  const recentActivity = activities.find(
    (activity) => activity.agentId === agent.id
  );
  
  if (!recentActivity) return false;
  
  const activityTime = recentActivity.timestamp.toDate();
  const now = new Date();
  const diffSeconds = (now.getTime() - activityTime.getTime()) / 1000;
  
  return diffSeconds < 30; // Active if activity within last 30 seconds
};
```

**Visual Indicator:**

When active, the AgentCard displays a pulsing green dot in the top-right corner:

```tsx
{isActive() && (
  <div className="absolute top-2 right-2 flex items-center gap-1.5">
    <div className="relative flex h-3 w-3">
      {/* Pulsing ring animation */}
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
      {/* Solid dot */}
      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
    </div>
    <span className="text-xs text-green-400 font-medium">Active</span>
  </div>
)}
```

**Status Badge Colors:**

| Status | Color | Description |
|--------|-------|-------------|
| `active` | Green (`#10b981`) | Agent is running and responsive |
| `idle` | Blue (`#3b82f6`) | Agent is online but not working |
| `blocked` | Red (`#ef4444`) | Agent is stuck or waiting |
| `offline` | Gray (`#6b7280`) | Agent hasn't checked in recently |
| `error` | Orange (`#f97316`) | Agent encountered an error |

**Real-time Updates:**

AgentCards subscribe to both the `agents` collection (for status/heartbeat) and the `activity` collection (for recent events):

```typescript
const { agents } = useAgents();          // Agent status subscription
const { activities } = useActivity(50);  // Recent activity subscription

// Combine data to determine active state
// Updates automatically when new activity is logged
```

**Accessibility:**

- `role="status"` for live region updates
- `aria-label` describing agent state
- Color is not the only indicator (text label included)

### Activity Feed (`/activity`)

Real-time activity stream showing all system events with agent attribution and structured metadata.

**Features:**

- **Live updates** via Firestore `onSnapshot()` subscription
- **Event type filtering** (task events, agent events, system events)
- **Agent attribution** with emoji and name resolution
- **Relative timestamps** (e.g., "2 minutes ago", "just now")
- **Color-coded event badges** for visual categorization
- **Metadata expansion** for detailed event information
- **Auto-scroll to bottom** for new events

**Event Types & Color Coding:**

| Event Type | Badge Color | Icon | Description |
|------------|-------------|------|-------------|
| `agent_run_started` | Blue (`#3b82f6`) | ▶️ | Agent begins execution |
| `agent_run_completed` | Green (`#10b981`) | ✅ | Agent finishes successfully |
| `agent_task_started` | Purple (`#8b5cf6`) | 🔧 | Task execution starts |
| `agent_task_completed` | Emerald (`#059669`) | ✔️ | Task completes |
| `agent_task_failed` | Red (`#ef4444`) | ❌ | Task fails with error |
| `task_created` | Cyan (`#06b6d4`) | ➕ | New task created |
| `task_status_changed` | Amber (`#f59e0b`) | 🔄 | Task status updated |
| `notification_sent` | Indigo (`#6366f1`) | 📬 | Notification delivered |

**Component Architecture:**

```typescript
// ActivityFeed.tsx
import { useActivity } from '@/lib/firebase';

export default function ActivityFeed() {
  const { activities, loading, error } = useActivity();
  
  // Real-time subscription to Firestore 'activity' collection
  // Auto-updates when new events are logged
  // Ordered by timestamp descending (newest first)
}
```

**Real-time Subscription:**

The ActivityFeed uses Firestore's `onSnapshot()` for live updates:

```typescript
// lib/firebase.ts
export function useActivity(limit = 100) {
  const [activities, setActivities] = useState<Activity[]>([]);
  
  useEffect(() => {
    const q = query(
      collection(db, 'activity'),
      orderBy('timestamp', 'desc'),
      limit(limit)
    );
    
    // Real-time listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setActivities(data);
    });
    
    return () => unsubscribe(); // Cleanup on unmount
  }, [limit]);
  
  return { activities, loading, error };
}
```

**Badge Styling:**

```tsx
function getEventBadge(eventType: string) {
  const styles = {
    agent_run_started: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    agent_run_completed: 'bg-green-500/10 text-green-400 border-green-500/20',
    agent_task_started: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    agent_task_completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    agent_task_failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  
  return (
    <span className={`px-2 py-1 rounded-md text-xs font-medium border ${styles[eventType]}`}>
      {eventType.replace(/_/g, ' ').toUpperCase()}
    </span>
  );
}
```

**Metadata Display:**

Activities can include structured metadata for additional context:

```typescript
interface Activity {
  id: string;
  type: string;
  agentId: string;
  agentName: string;
  message: string;
  taskId?: string;
  metadata?: {
    filesChanged?: number;
    testsRun?: number;
    coverage?: string;
    duration?: number;
    error?: string;
    [key: string]: any;
  };
  timestamp: Timestamp;
}
```

Metadata is displayed in expandable sections within activity items:

```tsx
{activity.metadata && (
  <pre className="mt-2 p-2 bg-black/40 rounded text-xs overflow-x-auto">
    {JSON.stringify(activity.metadata, null, 2)}
  </pre>
)}
```

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
