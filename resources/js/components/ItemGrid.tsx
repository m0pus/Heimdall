import { For, Show, createMemo, createSignal, createEffect } from 'solid-js';
import {
  DragDropProvider,
  DragDropSensors,
  DragOverlay,
  SortableProvider,
  createSortable,
  closestCenter,
  type DragEventHandler,
  type Id,
} from '@thisbeyond/solid-dnd';
import ItemTile from './ItemTile';
import Button from './Button';
import type { Item } from '@/types';
import { reorderItems } from '@/lib/reorderUtils';

interface ItemGridProps {
  items: Item[];
  editMode: boolean;
  onReorder: (items: Item[]) => void;
  onEdit?: (item: Item) => void;
  onDelete?: (item: Item) => void;
  onRefresh?: (item: Item) => void;
  onTogglePin?: (item: Item) => void;
  onAddNew?: () => void;
}

function SortableItemTile(props: {
  item: Item;
  editMode: boolean;
  onEdit?: (item: Item) => void;
  onDelete?: (item: Item) => void;
  onRefresh?: (item: Item) => void;
  onTogglePin?: (item: Item) => void;
}) {
  const sortable = createSortable(props.item.id);
  const isBeingDragged = createMemo(() => sortable.isActiveDraggable);

  return (
    <div
      use:sortable
      class="sortable-item"
      classList={{
        'opacity-30': isBeingDragged(),
        'cursor-grab': props.editMode,
        'cursor-grabbing': isBeingDragged(),
      }}
    >
      <ItemTile
        item={props.item}
        editMode={props.editMode}
        onEdit={props.onEdit}
        onDelete={props.onDelete}
        onRefresh={props.onRefresh}
        onTogglePin={props.onTogglePin}
      />
    </div>
  );
}

export default function ItemGrid(props: ItemGridProps) {
  const [activeItem, setActiveItem] = createSignal<Item | null>(null);
  const [activeId, setActiveId] = createSignal<Id | null>(null);

  // Sort items solely by their saved order to respect manual ordering
  // IMPORTANT: Always create a new sorted array to ensure reactivity
  const sortedItems = createMemo(() => {
    const items = props.items;
    console.log('[ItemGrid] sortedItems memo recomputing with items:', items.map(i => ({ id: i.id, order: i.order })));

    // Create a fresh copy and sort
    const sorted = items.slice().sort((a, b) => {
      if (a.order === b.order) {
        return a.id - b.id;
      }
      return a.order - b.order;
    });

    console.log('[ItemGrid] After sorting:', sorted.map(i => ({ id: i.id, order: i.order })));
    return sorted;
  });

  const ids = createMemo(() => {
    const items = sortedItems();
    const itemIds = items.map((item) => item.id);
    console.log('[ItemGrid] ids memo recomputing:', itemIds);
    return itemIds;
  });

  // Track IDs and items for debugging
  createEffect(() => {
    const currentIds = ids();
    const items = sortedItems();
    console.group('[ItemGrid] State Update');
    console.log('IDs order:', currentIds);
    console.log('Items detail:', items.map(i => ({ id: i.id, title: i.title, order: i.order })));
    console.log('Props items:', props.items.map(i => ({ id: i.id, title: i.title, order: i.order })));
    console.groupEnd();
  });

  const onDragStart: DragEventHandler = ({ draggable }) => {
    console.log('[Drag Start]', {
      draggableId: draggable.id,
      draggableNode: draggable.node,
    });

    setActiveId(draggable.id);
    const item = sortedItems().find((item) => item.id === draggable.id);
    setActiveItem(item || null);

    if (item) {
      console.log('[Drag Start] Found item:', {
        id: item.id,
        title: item.title,
        currentOrder: item.order,
      });
    }
  };

  const onDragMove: DragEventHandler = ({ draggable, droppable }) => {
    if (droppable && draggable.id !== droppable.id) {
      console.log('[Drag Move]', {
        draggableId: draggable.id,
        droppableId: droppable.id,
      });
    }
  };

  const onDragEnd: DragEventHandler = (event) => {
    const { draggable, droppable } = event;

    console.group('[Drag End] Full Event');
    console.log('Full event object:', event);
    console.log('Draggable:', draggable ? { id: draggable.id, transform: draggable.transform, data: draggable.data } : null);
    console.log('Droppable:', droppable ? { id: droppable.id, transform: droppable.transform, data: droppable.data } : null);
    console.groupEnd();

    if (draggable && droppable && draggable.id !== droppable.id) {
      const currentItems = sortedItems();
      const currentIds = ids();

      console.group('[Drag End] Reorder Calculation');
      console.log('Current sortedItems:', currentItems.map((i) => ({
        id: i.id,
        title: i.title,
        order: i.order,
        pinned: i.pinned
      })));
      console.log('Current IDs array:', currentIds);
      console.log('Dragging:', draggable.id, '→ Dropping on:', droppable.id);

      const fromIndex = currentItems.findIndex((item) => item.id === draggable.id);
      const toIndex = currentItems.findIndex((item) => item.id === droppable.id);

      console.log('Calculated indices:', { fromIndex, toIndex });

      // Check if items have different pinned status
      const draggedItem = fromIndex >= 0 ? currentItems[fromIndex] : null;
      const targetItem = toIndex >= 0 ? currentItems[toIndex] : null;

      console.log('Dragged item:', draggedItem ? { id: draggedItem.id, pinned: draggedItem.pinned } : null);
      console.log('Target item:', targetItem ? { id: targetItem.id, pinned: targetItem.pinned } : null);

      // Use the reorder utility
      const result = reorderItems(
        currentItems,
        draggable.id as number,
        droppable.id as number
      );

      if (result.success) {
        console.log('[Drag End] ✅ Calling onReorder with new order');
        console.log('New order will be:', result.items.map(i => ({ id: i.id, title: i.title, order: i.order, pinned: i.pinned })));
        props.onReorder(result.items);
      } else {
        console.warn('[Drag End] ❌ Reorder failed');
      }
      console.groupEnd();
    } else {
      console.log('[Drag End] ⏭️  No reorder needed', {
        noDraggable: !draggable,
        noDroppable: !droppable,
        sameId: draggable && droppable && draggable.id === droppable.id,
      });
    }

    setActiveItem(null);
    setActiveId(null);
  };

  return (
    <Show
      when={props.items.length > 0}
      fallback={
        <div class="flex flex-col items-center justify-center py-12">
          <svg
            class="h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 class="mt-2 text-sm font-semibold text-gray-900">No items</h3>
          <p class="mt-1 text-sm text-gray-500">
            Get started by adding a new application.
          </p>
          <Show when={props.onAddNew}>
            <Button
              variant="primary"
              size="sm"
              class="mt-4"
              onClick={() => props.onAddNew?.()}
            >
              <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Item
            </Button>
          </Show>
        </div>
      }
    >
      <Show
        when={props.editMode}
        fallback={
          <div
            id="sortable"
            class="item-grid"
          >
            <For each={sortedItems()}>
              {(item) => (
                <ItemTile
                  item={item}
                  editMode={false}
                  onEdit={props.onEdit}
                  onDelete={props.onDelete}
                  onRefresh={props.onRefresh}
                  onTogglePin={props.onTogglePin}
                />
              )}
            </For>
          </div>
        }
      >
        <DragDropProvider
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
          collisionDetector={closestCenter}
        >
          <DragDropSensors />
          <div
            id="sortable"
            class="item-grid"
          >
            <SortableProvider ids={ids()}>
              <For each={sortedItems()}>
                {(item) => (
                  <SortableItemTile
                    item={item}
                    editMode={props.editMode}
                    onEdit={props.onEdit}
                    onDelete={props.onDelete}
                    onRefresh={props.onRefresh}
                    onTogglePin={props.onTogglePin}
                  />
                )}
              </For>
            </SortableProvider>
          </div>
          <DragOverlay>
            <Show when={activeItem()}>
              <div class="sortable-item opacity-80 scale-105 shadow-2xl">
                <ItemTile
                  item={activeItem()!}
                  editMode={false}
                />
              </div>
            </Show>
          </DragOverlay>
        </DragDropProvider>
      </Show>
    </Show>
  );
}
