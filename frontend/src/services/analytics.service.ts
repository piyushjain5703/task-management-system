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

export interface AnalyticsQuery {
  assigned_to?: string;
}

export const analyticsService = {
  async getOverview(query?: AnalyticsQuery): Promise<OverviewData> {
    const response = await api.get<ApiResponse<OverviewData>>('/analytics/overview', {
      params: query,
    });
    return response.data.data;
  },

  async getPerformance(query?: AnalyticsQuery): Promise<PerformanceData[]> {
    const response = await api.get<ApiResponse<PerformanceData[]>>('/analytics/performance', {
      params: query,
    });
    return response.data.data;
  },

  async getTrends(days?: number, query?: AnalyticsQuery): Promise<TrendData[]> {
    const response = await api.get<ApiResponse<TrendData[]>>('/analytics/trends', {
      params: { ...(days ? { days } : {}), ...query },
    });
    return response.data.data;
  },

  async exportCsv(query?: AnalyticsQuery): Promise<Blob> {
    const response = await api.get('/analytics/export', {
      responseType: 'blob',
      params: query,
    });
    return response.data;
  },
};
