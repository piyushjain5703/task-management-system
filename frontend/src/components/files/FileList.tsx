import { useState, useEffect, useCallback } from 'react';
import { fileService } from '../../services/file.service';
import { useAuth } from '../../hooks/useAuth';
import FileUpload from './FileUpload';
import ConfirmDialog from '../common/ConfirmDialog';
import type { FileAttachment } from '../../types';

interface FileListProps {
  taskId: string;
  taskCreatorId: string;
  initialFiles?: FileAttachment[];
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼';
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📽';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('rar')) return '📦';
  if (mimeType.startsWith('text/')) return '📃';
  return '📎';
}

export default function FileList({ taskId, taskCreatorId, initialFiles }: FileListProps) {
  const { user: currentUser } = useAuth();
  const [files, setFiles] = useState<FileAttachment[]>(initialFiles || []);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialFiles) {
      setFiles(initialFiles);
    }
  }, [initialFiles]);

  const handleUploadComplete = useCallback((uploaded: FileAttachment[]) => {
    setFiles((prev) => [...prev, ...uploaded]);
  }, []);

  const handleDownload = async (file: FileAttachment) => {
    setDownloadingId(file.id);
    try {
      const blob = await fileService.download(taskId, file.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.original_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      setError('Failed to download file.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await fileService.delete(taskId, deletingId);
      setFiles((prev) => prev.filter((f) => f.id !== deletingId));
    } catch {
      setError('Failed to delete file.');
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const canDeleteFile = (file: FileAttachment) => {
    if (!currentUser) return false;
    return file.uploaded_by === currentUser.id || taskCreatorId === currentUser.id;
  };

  return (
    <div className="files-section">
      <h3>Files ({files.length})</h3>

      <FileUpload taskId={taskId} onUploadComplete={handleUploadComplete} />

      {error && <div className="alert alert-error file-error">{error}</div>}

      {files.length > 0 && (
        <div className="file-list">
          {files.map((file) => (
            <div key={file.id} className="file-item">
              <span className="file-icon">{getFileIcon(file.mime_type)}</span>
              <div className="file-info">
                <button
                  className="file-name-btn"
                  onClick={() => handleDownload(file)}
                  disabled={downloadingId === file.id}
                  title={`Download ${file.original_name}`}
                >
                  {downloadingId === file.id ? 'Downloading...' : file.original_name}
                </button>
                <span className="file-meta">
                  {formatSize(file.size)}
                  {file.uploader && <> &middot; {file.uploader.name}</>}
                </span>
              </div>
              {canDeleteFile(file) && (
                <button
                  className="file-delete-btn"
                  onClick={() => setDeletingId(file.id)}
                  title="Delete file"
                >
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete File"
        message="Are you sure you want to delete this file? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
