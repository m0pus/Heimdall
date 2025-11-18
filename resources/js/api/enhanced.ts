import apiClient from './client';
import type { ApiResponse } from '@/types';

export interface EnhancedSample {
  appid: string;
  name: string;
  description?: string | null;
  icon: string | null;
  colour: string;
  tile_background?: string | null;
  stats: Record<string, string | number>;
}

export const enhancedApi = {
  getSamples: async (): Promise<EnhancedSample[]> => {
    const response = await apiClient.get<ApiResponse<EnhancedSample[]>>('/api/enhanced-apps/samples');
    return response.data.data;
  },
};
