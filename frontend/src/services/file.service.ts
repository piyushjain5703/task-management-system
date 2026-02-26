import api from './api';
import type { FileAttachment, ApiResponse } from '../types';

export const fileService = {
  async upload(taskId: string, files: File[]): Promise<FileAttachment[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    const response = await api.post<ApiResponse<FileAttachment[]>>(
      `/tasks/${taskId}/files/`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data.data;
  },

  async download(taskId: string, fileId: string): Promise<Blob> {
    const response = await api.get(`/tasks/${taskId}/files/${fileId}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async delete(taskId: string, fileId: string): Promise<void> {
    await api.delete(`/tasks/${taskId}/files/${fileId}`);
  },
};
