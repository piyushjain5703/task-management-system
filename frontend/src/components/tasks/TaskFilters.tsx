import { TaskStatus, TaskPriority } from '../../types';
import type { TaskQuery } from '../../services/task.service';
import { useAuth } from '../../hooks/useAuth';

interface TaskFiltersProps {
  filters: TaskQuery;
  onFilterChange: (filters: TaskQuery) => void;
}

export default function TaskFilters({ filters, onFilterChange }: TaskFiltersProps) {
  const { user } = useAuth();

  const handleChange = (key: keyof TaskQuery, value: string) => {
    onFilterChange({ ...filters, [key]: value || undefined, page: 1 });
  };

  const clearFilters = () => {
    onFilterChange({
      page: 1,
      limit: filters.limit,
      sort_by: 'created_at',
      order: 'desc',
    });
  };

  const isMyTasks = !!filters.assigned_to && filters.assigned_to === user?.id;

  const toggleMyTasks = () => {
    onFilterChange({
      ...filters,
      assigned_to: isMyTasks ? undefined : user?.id,
      page: 1,
    });
  };

  const hasActiveFilters = filters.status || filters.priority || filters.search || filters.tags || filters.assigned_to;

  return (
    <div className="task-filters">
      <div className="filters-row">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search tasks..."
            value={filters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
          />
        </div>

        <button
          className={`btn btn-sm ${isMyTasks ? 'btn-primary' : 'btn-secondary'}`}
          onClick={toggleMyTasks}
        >
          Assigned to Me
        </button>

        <div className="filter-group">
          <select
            value={filters.status || ''}
            onChange={(e) => handleChange('status', e.target.value)}
          >
            <option value="">All Status</option>
            <option value={TaskStatus.TODO}>To Do</option>
            <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
            <option value={TaskStatus.DONE}>Done</option>
          </select>
        </div>

        <div className="filter-group">
          <select
            value={filters.priority || ''}
            onChange={(e) => handleChange('priority', e.target.value)}
          >
            <option value="">All Priority</option>
            <option value={TaskPriority.LOW}>Low</option>
            <option value={TaskPriority.MEDIUM}>Medium</option>
            <option value={TaskPriority.HIGH}>High</option>
          </select>
        </div>

        <div className="filter-group">
          <select
            value={filters.sort_by || 'created_at'}
            onChange={(e) => handleChange('sort_by', e.target.value)}
          >
            <option value="created_at">Created Date</option>
            <option value="updated_at">Updated Date</option>
            <option value="title">Title</option>
            <option value="priority">Priority</option>
            <option value="due_date">Due Date</option>
            <option value="status">Status</option>
          </select>
        </div>

        <div className="filter-group">
          <select
            value={filters.order || 'desc'}
            onChange={(e) => handleChange('order', e.target.value)}
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}
