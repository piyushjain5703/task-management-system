import { useState, useEffect, useCallback } from 'react';
import { taskService } from '../services/task.service';
import type { TaskQuery } from '../services/task.service';
import type { Task, User, PaginationMeta } from '../types';
import TaskCard from '../components/tasks/TaskCard';
import TaskFilters from '../components/tasks/TaskFilters';
import TaskForm from '../components/tasks/TaskForm';
import type { TaskFormData } from '../components/tasks/TaskForm';
import Pagination from '../components/tasks/Pagination';
import Modal from '../components/common/Modal';

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filters, setFilters] = useState<TaskQuery>({
    page: 1,
    limit: 12,
    sort_by: 'created_at',
    order: 'desc',
  });

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await taskService.list(filters);
      setTasks(response.data);
      setMeta(response.meta);
    } catch {
      setError('Failed to load tasks. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await taskService.getUsers();
      setUsers(response);
    } catch {
      // Non-critical, silently fail
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleFilterChange = (newFilters: TaskQuery) => {
    setFilters({ ...newFilters, limit: filters.limit });
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleCreateTask = async (data: TaskFormData) => {
    setIsSubmitting(true);
    try {
      await taskService.create({
        title: data.title,
        description: data.description || undefined,
        status: data.status,
        priority: data.priority,
        due_date: data.due_date ? new Date(data.due_date).toISOString() : undefined,
        tags: data.tags.length > 0 ? data.tags : undefined,
        assigned_to: data.assigned_to || undefined,
      } as Partial<Task>);
      setShowCreateModal(false);
      fetchTasks();
    } catch {
      setError('Failed to create task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page task-list-page">
      <div className="page-header">
        <div>
          <h1>Tasks</h1>
          <p className="page-subtitle">Manage and track your tasks</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + New Task
        </button>
      </div>

      <TaskFilters filters={filters} onFilterChange={handleFilterChange} />

      {error && <div className="alert alert-error">{error}</div>}

      {isLoading ? (
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No tasks found</h3>
          <p>
            {filters.search || filters.status || filters.priority
              ? 'Try adjusting your filters or search query.'
              : 'Get started by creating your first task.'}
          </p>
          {!filters.search && !filters.status && !filters.priority && (
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              Create Task
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="task-grid">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
          {meta && <Pagination meta={meta} onPageChange={handlePageChange} />}
        </>
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Task"
        size="lg"
      >
        <TaskForm
          users={users}
          onSubmit={handleCreateTask}
          onCancel={() => setShowCreateModal(false)}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  );
}
