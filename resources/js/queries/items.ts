import { createQuery, createMutation, useQueryClient } from '@tanstack/solid-query';
import { itemsApi } from '@/api';
import type { Item, ItemFormData } from '@/types';
import type { Accessor } from 'solid-js';

export function createItemsQuery(tagId?: Accessor<number | 'all'>) {
  return createQuery(() => ({
    queryKey: ['items', tagId?.()],
    queryFn: () => itemsApi.getAll(tagId?.()),
  }));
}

export function createItemQuery(id: Accessor<number | undefined>) {
  return createQuery(() => ({
    queryKey: ['items', id()],
    queryFn: () => itemsApi.getOne(id()!),
    enabled: !!id(),
  }));
}

export function createCreateItemMutation() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: (data: ItemFormData) => itemsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  }));
}

export function createUpdateItemMutation() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: ({ id, data }: { id: number; data: Partial<ItemFormData> }) =>
      itemsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['items', variables.id] });
    },
  }));
}

export function createDeleteItemMutation() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: (id: number) => itemsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  }));
}

export function createRestoreItemMutation() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: (id: number) => itemsApi.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['trashedItems'] });
    },
  }));
}

export function createTogglePinMutation() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: ({ id, pinned, tagId }: { id: number; pinned: boolean; tagId?: number }) =>
      itemsApi.togglePin(id, pinned, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  }));
}

export function createUpdateOrderMutation() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: async (order: number[]) => {
      console.log('[Update Order Mutation] Sending order to server:', order);
      const result = await itemsApi.updateOrder(order);
      console.log('[Update Order Mutation] Server returned:', result);
      return result;
    },
    onMutate: async (order: number[]) => {
      console.log('[Update Order Mutation] onMutate - Optimistic update with order:', order);

      // Cancel outgoing refetches for all item queries
      await queryClient.cancelQueries({ queryKey: ['items'] });

      // Snapshot all previous values that match ['items', ...]
      const previousData: any[] = [];
      queryClient.getQueriesData({ queryKey: ['items'] }).forEach(([queryKey, data]) => {
        previousData.push({ queryKey, data });
      });
      console.log('[Update Order Mutation] Previous queries:', previousData.map(p => p.queryKey));

      // Create a map of order index -> item
      const orderMap = new Map<number, number>();
      order.forEach((itemId, index) => {
        orderMap.set(itemId, index);
      });

      // Optimistically update ALL queries that start with ['items']
      queryClient.getQueriesData<Item[]>({ queryKey: ['items'] }).forEach(([queryKey, oldData]) => {
        if (!oldData) return;

        console.log('[Update Order Mutation] Updating query:', queryKey);
        console.log('[Update Order Mutation] Old data:', oldData.map((i: Item) => ({ id: i.id, order: i.order })));

        // IMPORTANT: Reorder the array to match the new order
        // Don't just update the order property - actually reorder the items!
        const reorderedItems: Item[] = [];

        // Build new array in the order specified
        order.forEach((itemId, index) => {
          const item = oldData.find((i: Item) => i.id === itemId);
          if (item) {
            reorderedItems.push({
              ...item,
              order: index,
            });
          }
        });

        console.log('[Update Order Mutation] Optimistically reordered items for', queryKey, ':',
          reorderedItems.map((i: Item) => ({ id: i.id, title: i.title, order: i.order })));
        console.log('[Update Order Mutation] Array order:', reorderedItems.map(i => i.id));

        queryClient.setQueryData(queryKey, reorderedItems);
      });

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      console.error('[Update Order Mutation] Error - Rolling back', _err);
      if (context?.previousData) {
        context.previousData.forEach(({ queryKey, data }: any) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (response) => {
      console.log('[Update Order Mutation] Success - Server response:', response);
      // Don't invalidate - the optimistic update is the source of truth
      // The server has been updated, and our optimistic update matches it
      // No need to refetch
    },
  }));
}

export function createRefreshStatsMutation() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: (id: number) => {
      console.log('[RefreshStatsMutation] Starting refresh for item ID:', id);
      return itemsApi.refreshStats(id);
    },
    onSuccess: (data, id) => {
      console.log('[RefreshStatsMutation] Refresh successful for item ID:', id, 'Response:', data);
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['items', id] });
    },
    onError: (error, id) => {
      console.error('[RefreshStatsMutation] Refresh failed for item ID:', id, 'Error:', error);
    },
  }));
}

export function createTrashedItemsQuery() {
  return createQuery(() => ({
    queryKey: ['trashedItems'],
    queryFn: () => itemsApi.getTrashed(),
  }));
}
