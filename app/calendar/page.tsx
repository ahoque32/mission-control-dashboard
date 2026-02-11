'use client';

import CalendarView from '../../components/CalendarView';
import Icon from '../../components/ui/Icon';

export default function CalendarPage() {
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
          <Icon name="calendar3" size={24} className="text-emerald-400" /> Scheduled Tasks
        </h1>
        <p className="text-sm sm:text-base text-foreground-secondary">Weekly calendar of all automated cron jobs and scheduled operations</p>
      </div>

      <CalendarView />
    </div>
  );
}
