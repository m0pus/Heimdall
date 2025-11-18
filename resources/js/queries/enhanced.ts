import { createQuery } from '@tanstack/solid-query';
import { enhancedApi } from '@/api';

export function createEnhancedSamplesQuery() {
  return createQuery(() => ({
    queryKey: ['enhancedSamples'],
    queryFn: () => enhancedApi.getSamples(),
    staleTime: 1000 * 60 * 60, // 1 hour
  }));
}
