import { useState } from 'react';

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  initialContent?: string;
  placeholder?: string;
  submitLabel?: string;
  onCancel?: () => void;
  autoFocus?: boolean;
}

export default function CommentForm({
  onSubmit,
  initialContent = '',
  placeholder = 'Write a comment...',
  submitLabel = 'Comment',
  onCancel,
  autoFocus = false,
}: CommentFormProps) {
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    try {
      await onSubmit(trimmed);
      if (!initialContent) {
        setContent('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      <textarea
        className="comment-textarea"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={3}
        maxLength={5000}
        autoFocus={autoFocus}
        disabled={isSubmitting}
      />
      <div className="comment-form-actions">
        {onCancel && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={!content.trim() || isSubmitting}
        >
          {isSubmitting ? 'Posting...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
