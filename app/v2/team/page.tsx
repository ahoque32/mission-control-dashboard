import TeamView from '../../../components/TeamView';
import Icon from '../../../components/ui/Icon';

export default function TeamPage() {
  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Icon name="people-fill" size={28} className="text-emerald-400" />
          Team View
        </h1>
        <p className="text-foreground-secondary mt-1">
          Agent roster and hierarchy. Ahawk → Anton → Dante/Vincent.
        </p>
      </div>
      
      <div className="flex-1 min-h-0 overflow-y-auto">
        <TeamView />
      </div>
    </div>
  );
}
