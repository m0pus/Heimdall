import apiClient from './client';
import type { Tag, TagFormData, ApiResponse } from '@/types';

export const tagsApi = {
  // Get all tags
  getAll: async (): Promise<Tag[]> => {
    const response = await apiClient.get<ApiResponse<Tag[]>>('/api/tags');
    return response.data.data;
  },

  // Get single tag
  getOne: async (id: number): Promise<Tag> => {
    const response = await apiClient.get<ApiResponse<Tag>>(`/api/tags/${id}`);
    return response.data.data;
  },

  // Create tag
  create: async (data: TagFormData): Promise<Tag> => {
    const response = await apiClient.post<ApiResponse<Tag>>('/api/tags', data);
    return response.data.data;
  },

  // Update tag
  update: async (id: number, data: Partial<TagFormData>): Promise<Tag> => {
    const response = await apiClient.put<ApiResponse<Tag>>(`/api/tags/${id}`, data);
    return response.data.data;
  },

  // Delete tag
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/tags/${id}`);
  },

  // Restore tag from trash
  restore: async (id: number): Promise<Tag> => {
    const response = await apiClient.post<ApiResponse<Tag>>(`/tags/${id}/restore`);
    return response.data.data;
  },

  // Get trashed tags
  getTrashed: async (): Promise<Tag[]> => {
    const response = await apiClient.get<ApiResponse<Tag[]>>('/tags/trash');
    return response.data.data;
  },

  // Add item to tag
  addItem: async (tagId: number, itemId: number): Promise<void> => {
    await apiClient.post(`/tag/add/${tagId}/${itemId}`);
  },

  // Remove item from tag
  removeItem: async (tagId: number, itemId: number): Promise<void> => {
    await apiClient.delete(`/tag/remove/${tagId}/${itemId}`);
  },
};
