import apiClient from './client';
import type { SettingsResponse, Setting, ApiResponse } from '@/types';

export const settingsApi = {
  // Get all settings
  getAll: async (): Promise<SettingsResponse> => {
    const response = await apiClient.get<ApiResponse<SettingsResponse>>('/api/settings');
    return response.data.data;
  },

  // Update a setting value
  update: async (id: number, value: any): Promise<Setting> => {
    const response = await apiClient.put<ApiResponse<Setting>>(`/api/settings/${id}`, { value });
    return response.data.data;
  },

  // Delete uploaded image
  deleteImage: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/settings/${id}/image`);
  },

  // Upload image for a setting
  uploadImage: async (id: number, file: File): Promise<Setting> => {
    const formData = new FormData();
    formData.append('value', file);

    const response = await apiClient.put<ApiResponse<Setting>>(
      `/api/settings/${id}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },
};
