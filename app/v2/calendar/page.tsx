import CalendarViewV2 from '../../../components/CalendarViewV2';
import Icon from '../../../components/ui/Icon';

export default function CalendarPage() {
  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Icon name="calendar3" size={28} className="text-emerald-400" />
          Calendar
        </h1>
        <p className="text-foreground-secondary mt-1">
          View scheduled tasks and cron jobs. Color-coded by agent.
        </p>
      </div>
      
      <div className="flex-1 min-h-0">
        <CalendarViewV2 />
      </div>
    </div>
  );
}
