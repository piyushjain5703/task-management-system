import api from './api';
import type { AuthTokens, User, ApiResponse } from '../types';

export const authService = {
  async register(data: { name: string; email: string; password: string }): Promise<AuthTokens> {
    const response = await api.post<ApiResponse<AuthTokens>>('/auth/register', data);
    return response.data.data;
  },

  async login(email: string, password: string): Promise<AuthTokens> {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    const response = await api.post<ApiResponse<AuthTokens>>('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data.data;
  },

  async getMe(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data.data;
  },
};
