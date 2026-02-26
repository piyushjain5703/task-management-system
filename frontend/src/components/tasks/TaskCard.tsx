import { Link } from 'react-router-dom';
import type { Task } from '../../types';
import { TaskStatus, TaskPriority } from '../../types';

interface TaskCardProps {
  task: Task;
}

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  [TaskStatus.TODO]: { label: 'To Do', className: 'badge-todo' },
  [TaskStatus.IN_PROGRESS]: { label: 'In Progress', className: 'badge-in-progress' },
  [TaskStatus.DONE]: { label: 'Done', className: 'badge-done' },
};

const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  [TaskPriority.LOW]: { label: 'Low', className: 'badge-low' },
  [TaskPriority.MEDIUM]: { label: 'Medium', className: 'badge-medium' },
  [TaskPriority.HIGH]: { label: 'High', className: 'badge-high' },
};

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function isOverdue(dateStr: string | null, status: TaskStatus): boolean {
  if (!dateStr || status === TaskStatus.DONE) return false;
  return new Date(dateStr) < new Date();
}

export default function TaskCard({ task }: TaskCardProps) {
  const status = statusConfig[task.status];
  const priority = priorityConfig[task.priority];
  const overdue = isOverdue(task.due_date, task.status);

  return (
    <Link to={`/tasks/${task.id}`} className="task-card">
      <div className="task-card-header">
        <span className={`badge ${status.className}`}>{status.label}</span>
        <span className={`badge ${priority.className}`}>{priority.label}</span>
      </div>

      <h3 className="task-card-title">{task.title}</h3>

      {task.description && (
        <p className="task-card-description">
          {task.description.length > 120 ? task.description.slice(0, 120) + '...' : task.description}
        </p>
      )}

      <div className="task-card-meta">
        {task.due_date && (
          <span className={`task-card-date ${overdue ? 'overdue' : ''}`}>
            {overdue ? '⚠ ' : ''}{formatDate(task.due_date)}
          </span>
        )}
        {task.tags && task.tags.length > 0 && (
          <div className="task-card-tags">
            {task.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
            {task.tags.length > 3 && <span className="tag tag-more">+{task.tags.length - 3}</span>}
          </div>
        )}
      </div>

      <div className="task-card-footer">
        {task.assignee ? (
          <div className="task-card-assignee">
            <div className="mini-avatar">{task.assignee.name.charAt(0).toUpperCase()}</div>
            <span>{task.assignee.name}</span>
          </div>
        ) : (
          <span className="task-card-unassigned">Unassigned</span>
        )}
        <span className="task-card-created">{formatDate(task.created_at)}</span>
      </div>
    </Link>
  );
}
