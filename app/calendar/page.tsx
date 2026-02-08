'use client';

import CalendarView from '../../components/CalendarView';

export default function CalendarPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#ededed] mb-2">📅 Scheduled Tasks</h1>
        <p className="text-[#888]">Weekly calendar of all automated cron jobs and scheduled operations</p>
      </div>

      <CalendarView />
    </div>
  );
}
