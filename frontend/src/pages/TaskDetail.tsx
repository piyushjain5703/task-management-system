import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { taskService } from '../services/task.service';
import type { Task, User } from '../types';
import { TaskStatus, TaskPriority } from '../types';
import { useAuth } from '../hooks/useAuth';
import TaskForm from '../components/tasks/TaskForm';
import type { TaskFormData } from '../components/tasks/TaskForm';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { formatDate, isOverdue } from '../components/tasks/TaskCard';
import CommentList from '../components/comments/CommentList';

const statusLabels: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: 'To Do',
  [TaskStatus.IN_PROGRESS]: 'In Progress',
  [TaskStatus.DONE]: 'Done',
};

const priorityLabels: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: 'Low',
  [TaskPriority.MEDIUM]: 'Medium',
  [TaskPriority.HIGH]: 'High',
};

const statusClassMap: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: 'badge-todo',
  [TaskStatus.IN_PROGRESS]: 'badge-in-progress',
  [TaskStatus.DONE]: 'badge-done',
};

const priorityClassMap: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: 'badge-low',
  [TaskPriority.MEDIUM]: 'badge-medium',
  [TaskPriority.HIGH]: 'badge-high',
};

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTask = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError('');
    try {
      const data = await taskService.get(id);
      setTask(data);
    } catch {
      setError('Failed to load task. It may have been deleted.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await taskService.getUsers();
      setUsers(data);
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    fetchTask();
    fetchUsers();
  }, [fetchTask, fetchUsers]);

  const canEdit = task && currentUser && (
    task.created_by === currentUser.id || task.assigned_to === currentUser.id
  );

  const canDelete = task && currentUser && task.created_by === currentUser.id;

  const handleUpdate = async (data: TaskFormData) => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      const updated = await taskService.update(id, {
        title: data.title,
        description: data.description || undefined,
        status: data.status,
        priority: data.priority,
        due_date: data.due_date ? new Date(data.due_date).toISOString() : undefined,
        tags: data.tags.length > 0 ? data.tags : undefined,
        assigned_to: data.assigned_to || undefined,
      } as Partial<Task>);
      setTask(updated);
      setShowEditModal(false);
    } catch {
      setError('Failed to update task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      await taskService.delete(id);
      navigate('/tasks');
    } catch {
      setError('Failed to delete task.');
    } finally {
      setIsSubmitting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleQuickStatusChange = async (newStatus: TaskStatus) => {
    if (!id || !task) return;
    try {
      const updated = await taskService.update(id, { status: newStatus } as Partial<Task>);
      setTask(updated);
    } catch {
      setError('Failed to update status.');
    }
  };

  if (isLoading) {
    return (
      <div className="page">
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading task...</p>
        </div>
      </div>
    );
  }

  if (error && !task) {
    return (
      <div className="page">
        <div className="empty-state">
          <h3>Task not found</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/tasks')}>
            Back to Tasks
          </button>
        </div>
      </div>
    );
  }

  if (!task) return null;

  const overdue = isOverdue(task.due_date, task.status);

  return (
    <div className="page task-detail-page">
      <div className="task-detail-header">
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/tasks')}>
          &larr; Back to Tasks
        </button>
        <div className="task-detail-actions">
          {canEdit && (
            <button className="btn btn-secondary" onClick={() => setShowEditModal(true)}>
              Edit
            </button>
          )}
          {canDelete && (
            <button className="btn btn-danger" onClick={() => setShowDeleteDialog(true)}>
              Delete
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="task-detail-content">
        <div className="task-detail-main">
          <div className="task-detail-title-row">
            <h1>{task.title}</h1>
          </div>

          <div className="task-detail-badges">
            <span className={`badge ${statusClassMap[task.status]}`}>
              {statusLabels[task.status]}
            </span>
            <span className={`badge ${priorityClassMap[task.priority]}`}>
              {priorityLabels[task.priority]} Priority
            </span>
            {overdue && <span className="badge badge-overdue">Overdue</span>}
          </div>

          {task.status !== TaskStatus.DONE && canEdit && (
            <div className="quick-status">
              <span>Move to:</span>
              {task.status !== TaskStatus.TODO && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleQuickStatusChange(TaskStatus.TODO)}
                >
                  To Do
                </button>
              )}
              {task.status !== TaskStatus.IN_PROGRESS && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleQuickStatusChange(TaskStatus.IN_PROGRESS)}
                >
                  In Progress
                </button>
              )}
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleQuickStatusChange(TaskStatus.DONE)}
              >
                Mark Done
              </button>
            </div>
          )}

          {task.description && (
            <div className="task-detail-section">
              <h3>Description</h3>
              <p className="task-description-text">{task.description}</p>
            </div>
          )}

          {task.tags && task.tags.length > 0 && (
            <div className="task-detail-section">
              <h3>Tags</h3>
              <div className="task-detail-tags">
                {task.tags.map((tag) => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            </div>
          )}

          <div className="task-detail-section">
            <CommentList taskId={task.id} />
          </div>
        </div>

        <div className="task-detail-sidebar">
          <div className="detail-card">
            <h3>Details</h3>
            <div className="detail-rows">
              <div className="detail-row">
                <span className="detail-label">Created by</span>
                <span className="detail-value">
                  {task.creator ? task.creator.name : 'Unknown'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Assigned to</span>
                <span className="detail-value">
                  {task.assignee ? task.assignee.name : 'Unassigned'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Due date</span>
                <span className={`detail-value ${overdue ? 'overdue' : ''}`}>
                  {task.due_date ? formatDate(task.due_date) : 'No due date'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Created</span>
                <span className="detail-value">{formatDate(task.created_at)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Updated</span>
                <span className="detail-value">{formatDate(task.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Task"
        size="lg"
      >
        <TaskForm
          task={task}
          users={users}
          onSubmit={handleUpdate}
          onCancel={() => setShowEditModal(false)}
          isLoading={isSubmitting}
        />
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
        isLoading={isSubmitting}
      />
    </div>
  );
}
