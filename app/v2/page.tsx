import Link from 'next/link';
import Icon from '../../components/ui/Icon';

const V2_FEATURES = [
  {
    title: 'Tasks Board',
    description: 'Kanban board with drag-and-drop for task management',
    icon: 'kanban',
    href: '/v2/tasks',
    color: '#3b82f6',
  },
  {
    title: 'Calendar',
    description: 'Visual calendar showing scheduled tasks and cron jobs',
    icon: 'calendar3',
    href: '/v2/calendar',
    color: '#8b5cf6',
  },
  {
    title: 'Memory Browser',
    description: 'Searchable UI for agent memory files with markdown rendering',
    icon: 'journal-text',
    href: '/v2/memory',
    color: '#f59e0b',
  },
  {
    title: 'Team View',
    description: 'Agent roster cards with hierarchy and real-time status',
    icon: 'people-fill',
    href: '/v2/team',
    color: '#10b981',
  },
  {
    title: 'Content Pipeline',
    description: 'Kanban for content stages from idea to published',
    icon: 'collection-play',
    href: '/v2/content',
    color: '#ec4899',
  },
  {
    title: 'Office View',
    description: 'Animated isometric office with agent avatars',
    icon: 'building',
    href: '/v2/office',
    color: '#06b6d4',
  },
];

export default function V2Dashboard() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
            V2
          </span>
          <h1 className="text-3xl font-bold text-foreground">Mission Control Dashboard V2</h1>
        </div>
        <p className="text-foreground-secondary">
          Upgraded agent control center with 6 new components for better task and team management.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {V2_FEATURES.map(feature => (
          <Link
            key={feature.href}
            href={feature.href}
            className="glass-card p-6 rounded-xl hover:border-emerald-500/30 transition-all group"
          >
            <div className="flex items-start gap-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${feature.color}20` }}
              >
                <Icon name={feature.icon} size={24} style={{ color: feature.color }} />
              </div>
              
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground group-hover:text-emerald-400 transition-colors">
                  {feature.title}
                </h2>
                <p className="text-sm text-foreground-secondary mt-1">
                  {feature.description}
                </p>
                
                <div className="flex items-center gap-1 mt-3 text-sm text-emerald-400">
                  <span>Open</span>
                  <Icon name="arrow-right" size={14} />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12 glass-card p-6 rounded-xl">
        <h2 className="text-lg font-semibold text-foreground mb-4">What's New in V2</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Icon name="check-circle" size={16} className="text-emerald-400" />
              <span className="text-foreground-secondary">Drag-and-drop Kanban boards</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="check-circle" size={16} className="text-emerald-400" />
              <span className="text-foreground-secondary">Day/week/month calendar views</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="check-circle" size={16} className="text-emerald-400" />
              <span className="text-foreground-secondary">Global memory search with markdown</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Icon name="check-circle" size={16} className="text-emerald-400" />
              <span className="text-foreground-secondary">Agent hierarchy visualization</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="check-circle" size={16} className="text-emerald-400" />
              <span className="text-foreground-secondary">Content pipeline with rich text</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="check-circle" size={16} className="text-emerald-400" />
              <span className="text-foreground-secondary">Animated isometric office view</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
