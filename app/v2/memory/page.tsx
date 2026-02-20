import MemoryBrowser from '../../../components/MemoryBrowser';
import Icon from '../../../components/ui/Icon';

export default function MemoryPage() {
  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Icon name="journal-text" size={28} className="text-emerald-400" />
          Memory Browser
        </h1>
        <p className="text-foreground-secondary mt-1">
          Browse and search agent memory files. Select an entry to view details.
        </p>
      </div>
      
      <div className="flex-1 min-h-0">
        <MemoryBrowser />
      </div>
    </div>
  );
}
