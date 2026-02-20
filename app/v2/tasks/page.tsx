import TasksBoard from '../../../components/TasksBoard';
import Icon from '../../../components/ui/Icon';

export default function TasksBoardPage() {
  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Icon name="kanban" size={28} className="text-emerald-400" />
          Tasks Board
        </h1>
        <p className="text-foreground-secondary mt-1">
          Drag and drop tasks between columns. Click + to create new tasks.
        </p>
      </div>
      
      <div className="flex-1 min-h-0">
        <TasksBoard />
      </div>
    </div>
  );
}
