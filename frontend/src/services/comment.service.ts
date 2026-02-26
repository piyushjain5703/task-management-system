import api from './api';
import type { Comment, ApiResponse } from '../types';

export const commentService = {
  async list(taskId: string): Promise<Comment[]> {
    const response = await api.get<ApiResponse<Comment[]>>(`/tasks/${taskId}/comments/`);
    return response.data.data;
  },

  async create(taskId: string, content: string): Promise<Comment> {
    const response = await api.post<ApiResponse<Comment>>(`/tasks/${taskId}/comments/`, { content });
    return response.data.data;
  },

  async update(taskId: string, commentId: string, content: string): Promise<Comment> {
    const response = await api.put<ApiResponse<Comment>>(`/tasks/${taskId}/comments/${commentId}`, { content });
    return response.data.data;
  },

  async delete(taskId: string, commentId: string): Promise<void> {
    await api.delete(`/tasks/${taskId}/comments/${commentId}`);
  },
};
