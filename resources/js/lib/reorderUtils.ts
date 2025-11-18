import type { Item } from '@/types';

/**
 * Reorder utility functions for drag and drop
 * These functions are pure and testable
 */

export interface ReorderResult {
  items: Item[];
  fromIndex: number;
  toIndex: number;
  success: boolean;
}

/**
 * Reorder items by moving an item from one position to another
 * @param items The array of items to reorder
 * @param fromId The ID of the item being moved
 * @param toId The ID of the item we're moving next to
 * @returns Reordered items with updated order property
 */
export function reorderItems(items: Item[], fromId: number, toId: number): ReorderResult {
  // Find indices
  const fromIndex = items.findIndex((item) => item.id === fromId);
  const toIndex = items.findIndex((item) => item.id === toId);

  // Validation
  if (fromIndex === -1 || toIndex === -1) {
    console.warn('[Reorder] Invalid indices:', { fromIndex, toIndex, fromId, toId });
    return {
      items,
      fromIndex,
      toIndex,
      success: false,
    };
  }

  // No change needed
  if (fromIndex === toIndex) {
    console.log('[Reorder] No change needed:', { fromIndex, toIndex });
    return {
      items,
      fromIndex,
      toIndex,
      success: false,
    };
  }

  // Create new array with reordered items
  const result = [...items];
  const [movedItem] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, movedItem);

  // Update order property for all items
  const reorderedItems = result.map((item, index) => ({
    ...item,
    order: index,
  }));

  console.log('[Reorder] Success:', {
    fromIndex,
    toIndex,
    movedItemId: fromId,
    movedItemTitle: movedItem.title,
    newOrder: reorderedItems.map((i) => ({ id: i.id, title: i.title, order: i.order })),
  });

  return {
    items: reorderedItems,
    fromIndex,
    toIndex,
    success: true,
  };
}

/**
 * Reorder items by array indices (used when solid-dnd provides indices)
 * @param items The array of items to reorder
 * @param fromIndex Index of the item being moved
 * @param toIndex Index where the item should be placed
 * @returns Reordered items with updated order property
 */
export function reorderItemsByIndex(items: Item[], fromIndex: number, toIndex: number): ReorderResult {
  // Validation
  if (fromIndex < 0 || fromIndex >= items.length || toIndex < 0 || toIndex >= items.length) {
    console.warn('[Reorder By Index] Invalid indices:', { fromIndex, toIndex, itemsLength: items.length });
    return {
      items,
      fromIndex,
      toIndex,
      success: false,
    };
  }

  // No change needed
  if (fromIndex === toIndex) {
    console.log('[Reorder By Index] No change needed:', { fromIndex, toIndex });
    return {
      items,
      fromIndex,
      toIndex,
      success: false,
    };
  }

  // Create new array with reordered items
  const result = [...items];
  const [movedItem] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, movedItem);

  // Update order property for all items
  const reorderedItems = result.map((item, index) => ({
    ...item,
    order: index,
  }));

  console.log('[Reorder By Index] Success:', {
    fromIndex,
    toIndex,
    movedItemId: movedItem.id,
    movedItemTitle: movedItem.title,
    newOrder: reorderedItems.map((i) => ({ id: i.id, title: i.title, order: i.order })),
  });

  return {
    items: reorderedItems,
    fromIndex,
    toIndex,
    success: true,
  };
}

/**
 * Test the reorder functions
 * Call this from the browser console to verify logic
 */
export function testReorderLogic() {
  console.group('Testing Reorder Logic');

  // Create test items
  const testItems: Item[] = [
    { id: 1, title: 'Item 1', order: 0, url: '', colour: '', icon: '', appdescription: '', pinned: false, type: 0 },
    { id: 2, title: 'Item 2', order: 1, url: '', colour: '', icon: '', appdescription: '', pinned: false, type: 0 },
    { id: 3, title: 'Item 3', order: 2, url: '', colour: '', icon: '', appdescription: '', pinned: false, type: 0 },
    { id: 4, title: 'Item 4', order: 3, url: '', colour: '', icon: '', appdescription: '', pinned: false, type: 0 },
    { id: 5, title: 'Item 5', order: 4, url: '', colour: '', icon: '', appdescription: '', pinned: false, type: 0 },
  ];

  console.log('Initial items:', testItems.map((i) => ({ id: i.id, title: i.title, order: i.order })));

  // Test 1: Move item from start to end
  console.group('Test 1: Move Item 1 to position of Item 5 (start to end)');
  const test1 = reorderItems(testItems, 1, 5);
  console.log('Expected: [2, 3, 4, 5, 1]');
  console.log('Actual:', test1.items.map((i) => i.id));
  console.log('Success:', JSON.stringify(test1.items.map((i) => i.id)) === JSON.stringify([2, 3, 4, 5, 1]));
  console.groupEnd();

  // Test 2: Move item from end to start
  console.group('Test 2: Move Item 5 to position of Item 1 (end to start)');
  const test2 = reorderItems(testItems, 5, 1);
  console.log('Expected: [5, 1, 2, 3, 4]');
  console.log('Actual:', test2.items.map((i) => i.id));
  console.log('Success:', JSON.stringify(test2.items.map((i) => i.id)) === JSON.stringify([5, 1, 2, 3, 4]));
  console.groupEnd();

  // Test 3: Move item forward one position
  console.group('Test 3: Move Item 2 to position of Item 3 (forward one)');
  const test3 = reorderItems(testItems, 2, 3);
  console.log('Expected: [1, 3, 2, 4, 5]');
  console.log('Actual:', test3.items.map((i) => i.id));
  console.log('Success:', JSON.stringify(test3.items.map((i) => i.id)) === JSON.stringify([1, 3, 2, 4, 5]));
  console.groupEnd();

  // Test 4: Move item backward one position
  console.group('Test 4: Move Item 3 to position of Item 2 (backward one)');
  const test4 = reorderItems(testItems, 3, 2);
  console.log('Expected: [1, 3, 2, 4, 5]');
  console.log('Actual:', test4.items.map((i) => i.id));
  console.log('Success:', JSON.stringify(test4.items.map((i) => i.id)) === JSON.stringify([1, 3, 2, 4, 5]));
  console.groupEnd();

  // Test 5: Move item to middle
  console.group('Test 5: Move Item 1 to position of Item 3 (to middle)');
  const test5 = reorderItems(testItems, 1, 3);
  console.log('Expected: [2, 3, 1, 4, 5]');
  console.log('Actual:', test5.items.map((i) => i.id));
  console.log('Success:', JSON.stringify(test5.items.map((i) => i.id)) === JSON.stringify([2, 3, 1, 4, 5]));
  console.groupEnd();

  console.groupEnd();
}

// Expose test function to window for console access
if (typeof window !== 'undefined') {
  (window as any).testReorderLogic = testReorderLogic;
}
