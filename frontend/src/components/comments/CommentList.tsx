import { useState, useEffect, useCallback } from 'react';
import Markdown from 'react-markdown';
import { commentService } from '../../services/comment.service';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import CommentForm from './CommentForm';
import ConfirmDialog from '../common/ConfirmDialog';
import type { Comment } from '../../types';

interface CommentListProps {
  taskId: string;
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CommentList({ taskId }: CommentListProps) {
  const { user: currentUser } = useAuth();
  const { addToast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await commentService.list(taskId);
      setComments(data);
    } catch {
      addToast('Failed to load comments.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [taskId, addToast]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleCreate = async (content: string) => {
    const newComment = await commentService.create(taskId, content);
    setComments((prev) => [...prev, newComment]);
    addToast('Comment added', 'success');
  };

  const handleUpdate = async (commentId: string, content: string) => {
    const updated = await commentService.update(taskId, commentId, content);
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? updated : c))
    );
    setEditingId(null);
    addToast('Comment updated', 'success');
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await commentService.delete(taskId, deletingId);
      setComments((prev) => prev.filter((c) => c.id !== deletingId));
      addToast('Comment deleted', 'success');
    } catch {
      addToast('Failed to delete comment.', 'error');
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  return (
    <div className="comments-section">
      <h3>Comments ({comments.length})</h3>

      <CommentForm onSubmit={handleCreate} />

      {isLoading ? (
        <div className="comments-loading">
          <div className="spinner" />
          <span>Loading comments...</span>
        </div>
      ) : comments.length === 0 ? (
        <div className="comments-empty">
          <p>No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="comments-list">
          {comments.map((comment) => {
            const isOwner = currentUser?.id === comment.user_id;
            const isEditing = editingId === comment.id;

            return (
              <div key={comment.id} className="comment-item">
                <div className="comment-avatar">
                  {comment.user?.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="comment-body">
                  <div className="comment-header">
                    <span className="comment-author">
                      {comment.user?.name || 'Unknown User'}
                    </span>
                    <span className="comment-time" title={new Date(comment.created_at).toLocaleString()}>
                      {timeAgo(comment.created_at)}
                      {comment.updated_at !== comment.created_at && ' (edited)'}
                    </span>
                  </div>

                  {isEditing ? (
                    <CommentForm
                      initialContent={comment.content}
                      onSubmit={(content) => handleUpdate(comment.id, content)}
                      submitLabel="Save"
                      onCancel={() => setEditingId(null)}
                      autoFocus
                    />
                  ) : (
                    <>
                      <div className="comment-content">
                        <Markdown>{comment.content}</Markdown>
                      </div>
                      {isOwner && (
                        <div className="comment-actions">
                          <button
                            className="comment-action-btn"
                            onClick={() => setEditingId(comment.id)}
                          >
                            Edit
                          </button>
                          <button
                            className="comment-action-btn comment-action-danger"
                            onClick={() => setDeletingId(comment.id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
