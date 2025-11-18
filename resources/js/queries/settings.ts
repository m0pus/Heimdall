import { createQuery, createMutation, useQueryClient } from '@tanstack/solid-query';
import { settingsApi } from '@/api';

export function createSettingsQuery() {
  return createQuery(() => ({
    queryKey: ['settings'],
    queryFn: () => settingsApi.getAll(),
    staleTime: 1000 * 60 * 5, // 5 minutes - settings don't change often
  }));
}

export function createUpdateSettingMutation() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: ({ id, value }: { id: number; value: any }) =>
      settingsApi.update(id, value),
    // Use optimistic updates for instant feedback after debounce
    onMutate: async ({ id, value }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['settings'] });

      // Snapshot previous value
      const previousSettings = queryClient.getQueryData(['settings']);

      // Optimistically update cache
      queryClient.setQueryData(['settings'], (old: any) => {
        if (!old) return old;

        return {
          ...old,
          settings: old.settings.map((setting: any) =>
            setting.id === id ? { ...setting, value } : setting
          ),
        };
      });

      return { previousSettings };
    },
    // Rollback on error
    onError: (_err, _variables, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(['settings'], context.previousSettings);
      }
    },
  }));
}

export function createDeleteImageMutation() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: (id: number) => settingsApi.deleteImage(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['settings'] });
      const previousSettings = queryClient.getQueryData(['settings']);

      // Optimistically clear the image value
      queryClient.setQueryData(['settings'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          settings: old.settings.map((setting: any) =>
            setting.id === id ? { ...setting, value: '' } : setting
          ),
        };
      });

      return { previousSettings };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(['settings'], context.previousSettings);
      }
    },
  }));
}

export function createUploadImageMutation() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      settingsApi.uploadImage(id, file),
    onSuccess: (data) => {
      // For image uploads, we need the server response for the new path
      // So we update with the actual response data
      queryClient.setQueryData(['settings'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          settings: old.settings.map((setting: any) =>
            setting.id === data.id ? data : setting
          ),
        };
      });
    },
  }));
}
