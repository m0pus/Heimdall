import { createQuery, createMutation, useQueryClient } from '@tanstack/solid-query';
import { tagsApi } from '@/api';
import type { Tag, TagFormData } from '@/types';
import type { Accessor } from 'solid-js';

export function createTagsQuery() {
  return createQuery(() => ({
    queryKey: ['tags'],
    queryFn: () => tagsApi.getAll(),
  }));
}

export function createTagQuery(id: Accessor<number | undefined>) {
  return createQuery(() => ({
    queryKey: ['tags', id()],
    queryFn: () => tagsApi.getOne(id()!),
    enabled: !!id(),
  }));
}

export function createCreateTagMutation() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: (data: TagFormData) => tagsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  }));
}

export function createUpdateTagMutation() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: ({ id, data }: { id: number; data: Partial<TagFormData> }) =>
      tagsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['tags', variables.id] });
    },
  }));
}

export function createDeleteTagMutation() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: (id: number) => tagsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  }));
}

export function createRestoreTagMutation() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: (id: number) => tagsApi.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['trashedTags'] });
    },
  }));
}

export function createTrashedTagsQuery() {
  return createQuery(() => ({
    queryKey: ['trashedTags'],
    queryFn: () => tagsApi.getTrashed(),
  }));
}
