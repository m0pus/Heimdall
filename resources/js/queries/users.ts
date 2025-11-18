import { createQuery, createMutation, useQueryClient } from '@tanstack/solid-query';
import { usersApi } from '@/api';
import type { User, UserFormData } from '@/types';

export function createUsersQuery() {
  return createQuery(() => ({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
  }));
}

export function createCreateUserMutation() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: (data: UserFormData) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  }));
}

export function createUpdateUserMutation() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: ({ id, data }: { id: number; data: UserFormData }) => usersApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', variables.id] });
    },
  }));
}

export function createDeleteUserMutation() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: (id: number) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  }));
}
