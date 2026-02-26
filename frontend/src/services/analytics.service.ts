import api from './api';
import type { ApiResponse } from '../types';

export interface OverviewData {
  total: number;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  overdue: number;
}

export interface PerformanceData {
  user_id: string;
  user_name: string;
  completed_tasks: number;
  avg_completion_time: number;
}

export interface TrendData {
  date: string;
  created: number;
  completed: number;
}

export const analyticsService = {
  async getOverview(): Promise<OverviewData> {
    const response = await api.get<ApiResponse<OverviewData>>('/analytics/overview');
    return response.data.data;
  },

  async getPerformance(): Promise<PerformanceData[]> {
    const response = await api.get<ApiResponse<PerformanceData[]>>('/analytics/performance');
    return response.data.data;
  },

  async getTrends(): Promise<TrendData[]> {
    const response = await api.get<ApiResponse<TrendData[]>>('/analytics/trends');
    return response.data.data;
  },

  async exportCsv(): Promise<Blob> {
    const response = await api.get('/analytics/export', { responseType: 'blob' });
    return response.data;
  },
};
