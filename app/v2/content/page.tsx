import ContentPipeline from '../../../components/ContentPipeline';
import Icon from '../../../components/ui/Icon';

export default function ContentPage() {
  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Icon name="collection-play" size={28} className="text-emerald-400" />
          Content Pipeline
        </h1>
        <p className="text-foreground-secondary mt-1">
          Track content from idea to published. Drag items between stages.
        </p>
      </div>
      
      <div className="flex-1 min-h-0">
        <ContentPipeline />
      </div>
    </div>
  );
}
