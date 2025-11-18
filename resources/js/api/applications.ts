import apiClient from './client';
import type { Application, ApiResponse } from '@/types';

export const applicationsApi = {
  // Get all applications
  getAll: async (): Promise<Application[]> => {
    const response = await apiClient.get<ApiResponse<Application[]>>('/api/applications');
    return response.data.data;
  },

  // Get single application
  getOne: async (appid: string): Promise<Application> => {
    const response = await apiClient.get<ApiResponse<Application>>(`/api/applications/${appid}`);
    return response.data.data;
  },

  // Search applications
  search: async (query: string): Promise<Application[]> => {
    const response = await apiClient.get<ApiResponse<Application[]>>('/api/applications/search', {
      params: { q: query },
    });
    return response.data.data;
  },

  // Download/update enhanced apps from repository
  download: async (): Promise<{ message: string }> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>('/api/applications/download');
    return response.data.data || { message: response.data.message || 'Apps downloaded successfully' };
  },
};
