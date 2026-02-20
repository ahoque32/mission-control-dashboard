import OfficeView from '../../../components/OfficeView';
import Icon from '../../../components/ui/Icon';

export default function OfficePage() {
  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Icon name="building" size={28} className="text-emerald-400" />
          Office View
        </h1>
        <p className="text-foreground-secondary mt-1">
          Isometric office with agent avatars. Click an agent to see their status.
        </p>
      </div>
      
      <div className="flex-1 min-h-0">
        <OfficeView />
      </div>
    </div>
  );
}
