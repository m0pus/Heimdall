import apiClient from './client';
import type { ApiResponse, User, UserFormData } from '@/types';

const buildFormData = (data: UserFormData, method?: 'PUT'): FormData => {
  const formData = new FormData();
  formData.append('username', data.username);
  formData.append('email', data.email);
  formData.append('public_front', data.public_front ? '1' : '0');
  formData.append('autologin_allow', data.autologin_allow ? '1' : '0');

  if (data.password) {
    formData.append('password', data.password);
  }

  if (data.password_confirmation) {
    formData.append('password_confirmation', data.password_confirmation);
  }

  if (data.clear_password) {
    formData.append('clear_password', '1');
  }

  if (data.avatar instanceof File) {
    formData.append('file', data.avatar);
  }

  if (method) {
    formData.append('_method', method);
  }

  return formData;
};

export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const response = await apiClient.get<ApiResponse<User[]>>('/api/users');
    return response.data.data;
  },

  create: async (data: UserFormData): Promise<User> => {
    const formData = buildFormData(data);
    const response = await apiClient.post<ApiResponse<User>>('/api/users', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  update: async (id: number, data: UserFormData): Promise<User> => {
    const formData = buildFormData(data, 'PUT');
    const response = await apiClient.post<ApiResponse<User>>(`/api/users/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/users/${id}`);
  },
};
