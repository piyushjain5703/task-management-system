import { useState, useRef, useCallback } from 'react';
import { fileService } from '../../services/file.service';
import type { FileAttachment } from '../../types';

interface FileUploadProps {
  taskId: string;
  onUploadComplete: (files: FileAttachment[]) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileUpload({ taskId, onUploadComplete }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const validateFiles = (files: File[]): string | null => {
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return `"${file.name}" exceeds the 5MB limit (${formatSize(file.size)})`;
      }
    }
    return null;
  };

  const handleUpload = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    const validationError = validateFiles(files);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setIsUploading(true);
    setProgress(10);

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 15, 90));
      }, 200);

      const uploaded = await fileService.upload(taskId, files);

      clearInterval(progressInterval);
      setProgress(100);
      onUploadComplete(uploaded);

      setTimeout(() => {
        setProgress(0);
        setIsUploading(false);
      }, 500);
    } catch {
      setError('Failed to upload files. Please try again.');
      setIsUploading(false);
      setProgress(0);
    }
  }, [taskId, onUploadComplete]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleUpload(droppedFiles);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files ? Array.from(e.target.files) : [];
    handleUpload(selected);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="file-upload-wrapper">
      <div
        className={`file-dropzone ${isDragging ? 'file-dropzone-active' : ''} ${isUploading ? 'file-dropzone-uploading' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !isUploading && inputRef.current?.click()}
      >
        {isUploading ? (
          <div className="file-upload-progress">
            <div className="file-progress-bar">
              <div
                className="file-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="file-upload-status">Uploading...</span>
          </div>
        ) : (
          <div className="file-dropzone-content">
            <span className="file-dropzone-icon">+</span>
            <span className="file-dropzone-text">
              {isDragging ? 'Drop files here' : 'Drop files here or click to browse'}
            </span>
            <span className="file-dropzone-hint">Max 5MB per file</span>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={handleInputChange}
          className="file-input-hidden"
          disabled={isUploading}
        />
      </div>

      {error && <div className="file-upload-error">{error}</div>}
    </div>
  );
}
