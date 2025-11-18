import apiClient, { createFormData } from './client';
import type { Item, ItemFormData, ApiResponse } from '@/types';

export const itemsApi = {
  // Get all items
  getAll: async (tagId?: number | 'all'): Promise<Item[]> => {
    const params = tagId && tagId !== 'all' ? { tag: tagId } : {};
    const response = await apiClient.get<ApiResponse<Item[]>>('/api/items', { params });
    return response.data.data;
  },

  // Get single item
  getOne: async (id: number): Promise<Item> => {
    const response = await apiClient.get<ApiResponse<Item>>(`/api/items/${id}`);
    return response.data.data;
  },

  // Create item
  create: async (data: ItemFormData): Promise<Item> => {
    const formData = createFormData(data);
    const response = await apiClient.post<ApiResponse<Item>>('/api/items', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  // Update item
  update: async (id: number, data: Partial<ItemFormData>): Promise<Item> => {
    const formData = createFormData({ ...data, _method: 'PUT' });
    const response = await apiClient.post<ApiResponse<Item>>(`/api/items/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  // Delete item
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/items/${id}`);
  },

  // Restore item from trash
  restore: async (id: number): Promise<Item> => {
    const response = await apiClient.post<ApiResponse<Item>>(`/items/${id}/restore`);
    return response.data.data;
  },

  // Toggle pin status
  togglePin: async (id: number, pinned: boolean, tagId?: number): Promise<Item> => {
    const params = tagId ? `/${tagId}` : '';
    const response = await apiClient.get<ApiResponse<Item>>(
      `/items/pintoggle/${id}/${pinned}${params}`
    );
    return response.data.data;
  },

  // Update order
  updateOrder: async (order: number[]): Promise<void> => {
    await apiClient.post('/order', { order });
  },

  // Test enhanced app config
  testConfig: async (data: Record<string, any>): Promise<string> => {
    const response = await apiClient.post<string>('/test_config', { data });
    return response.data;
  },

  // Refresh enhanced app stats
  refreshStats: async (id: number): Promise<Item> => {
    console.log('[itemsApi.refreshStats] Calling API for item ID:', id);
    const response = await apiClient.get<ApiResponse<Item>>(`/api/items/${id}/refresh`);
    console.log('[itemsApi.refreshStats] API response:', response.data);
    return response.data.data;
  },

  // Get trashed items
  getTrashed: async (): Promise<Item[]> => {
    const response = await apiClient.get<ApiResponse<Item[]>>('/items/trash');
    return response.data.data;
  },

  // Export items
  export: async (): Promise<Blob> => {
    const response = await apiClient.get('/items/export', {
      responseType: 'blob',
    });
    return response.data;
  },

  // Import items
  import: async (file: File): Promise<void> => {
    const formData = new FormData();
    formData.append('file', file);
    await apiClient.post('/items/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
