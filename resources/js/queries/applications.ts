import { createQuery, createMutation, useQueryClient } from '@tanstack/solid-query';
import { applicationsApi } from '@/api';
import type { Accessor } from 'solid-js';

export function createApplicationsQuery() {
  return createQuery(() => ({
    queryKey: ['applications'],
    queryFn: () => applicationsApi.getAll(),
  }));
}

export function createApplicationQuery(appid: Accessor<string | undefined>) {
  return createQuery(() => ({
    queryKey: ['applications', appid()],
    queryFn: () => applicationsApi.getOne(appid()!),
    enabled: !!appid(),
  }));
}

export function createApplicationSearchQuery(query: Accessor<string>) {
  return createQuery(() => ({
    queryKey: ['applications', 'search', query()],
    queryFn: () => applicationsApi.search(query()),
    enabled: query().length > 2,
  }));
}

export function createDownloadApplicationsMutation() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: () => applicationsApi.download(),
    onSuccess: () => {
      // Invalidate applications query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  }));
}
