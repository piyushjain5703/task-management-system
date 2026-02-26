import api from './api';
import type { Task, User, ApiResponse, PaginatedResponse } from '../types';

export interface TaskQuery {
  status?: string;
  priority?: string;
  search?: string;
  sort_by?: string;
  order?: string;
  page?: number;
  limit?: number;
  tags?: string[];
  assigned_to?: string;
}

export const taskService = {
  async list(params: TaskQuery = {}): Promise<PaginatedResponse<Task>> {
    const queryParams: Record<string, string | number | undefined> = {
      ...params,
      tags: params.tags?.join(','),
    };
    const response = await api.get<PaginatedResponse<Task>>('/tasks/', { params: queryParams });
    return response.data;
  },

  async get(id: string): Promise<Task> {
    const response = await api.get<ApiResponse<Task>>(`/tasks/${id}`);
    return response.data.data;
  },

  async create(data: Partial<Task>): Promise<Task> {
    const response = await api.post<ApiResponse<Task>>('/tasks/', data);
    return response.data.data;
  },

  async update(id: string, data: Partial<Task>): Promise<Task> {
    const response = await api.put<ApiResponse<Task>>(`/tasks/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`);
  },

  async bulkCreate(tasks: Partial<Task>[]): Promise<Task[]> {
    const response = await api.post<ApiResponse<Task[]>>('/tasks/bulk', tasks);
    return response.data.data;
  },

  async getUsers(): Promise<User[]> {
    const response = await api.get<ApiResponse<User[]>>('/tasks/users');
    return response.data.data;
  },
};
