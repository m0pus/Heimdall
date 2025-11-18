import { Show, createMemo, createSignal } from 'solid-js';
import { A } from '@solidjs/router';
import {
  editMode,
  toggleEditMode,
  selectedTag,
  searchQuery,
  searchProvider,
} from '@/store/dashboard';
import {
  createItemsQuery,
  createCreateItemMutation,
  createUpdateItemMutation,
  createUpdateOrderMutation,
  createDeleteItemMutation,
  createRefreshStatsMutation,
  createTogglePinMutation,
} from '@/queries/items';
import { createTagsQuery } from '@/queries/tags';
import { createDownloadApplicationsMutation } from '@/queries/applications';
import { createSettingsQuery } from '@/queries/settings';
import ItemGrid from '@/components/ItemGrid';
import FloatingTopBar from '@/components/FloatingTopBar';
import FloatingControls from '@/components/FloatingControls';
import ItemModal from '@/components/ItemModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import AlertDialog from '@/components/AlertDialog';
import type { Item } from '@/types';
import { t } from '@/lib/i18n';

export default function Dashboard() {
  const [editingItem, setEditingItem] = createSignal<Item | null>(null);
  const [itemModalOpen, setItemModalOpen] = createSignal(false);

  // Modal states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = createSignal(false);
  const [itemToDelete, setItemToDelete] = createSignal<Item | null>(null);
  const [downloadConfirmOpen, setDownloadConfirmOpen] = createSignal(false);
  const [alertOpen, setAlertOpen] = createSignal(false);
  const [alertConfig, setAlertConfig] = createSignal<{
    variant: 'success' | 'error' | 'info' | 'warning';
    title?: string;
    message: string;
  }>({ variant: 'info', message: '' });

  const itemsQuery = createItemsQuery();
  const tagsQuery = createTagsQuery();
  const settingsQuery = createSettingsQuery();
  const createItemMutation = createCreateItemMutation();
  const updateItemMutation = createUpdateItemMutation();
  const updateOrderMutation = createUpdateOrderMutation();
  const deleteItemMutation = createDeleteItemMutation();
  const refreshStatsMutation = createRefreshStatsMutation();
  const togglePinMutation = createTogglePinMutation();
  const downloadAppsMutation = createDownloadApplicationsMutation();

  // Reactive translations
  const settingsText = createMemo(() => t('app.dashboard.settings'));
  const editText = createMemo(() => t('app.settings.edit'));
  const cancelText = createMemo(() => t('app.buttons.cancel'));
  const addText = createMemo(() => t('app.buttons.add'));

  // Check if homepage search is enabled
  const isSearchEnabled = createMemo(() => {
    const settings = settingsQuery.data?.settings;
    if (!settings) return false;

    const searchSetting = settings.find(s => s.key === 'homepage_search');
    return searchSetting?.value === '1' || searchSetting?.value === 'true';
  });

  // Calculate top padding based on visible floating elements
  const contentTopPadding = createMemo(() => {
    const hasSearch = isSearchEnabled();
    const hasTags = (tagsQuery.data?.length || 0) > 0;
    const hasTopBar = hasSearch || hasTags;

    if (hasSearch && hasTags) return 'pt-52'; // Both search and tags in top bar
    if (hasTopBar) return 'pt-36'; // Just search or tags
    return 'pt-8'; // No top bar
  });

  // Filter items by selected tag and search query
  const filteredItems = createMemo(() => {
    const items = itemsQuery.data || [];
    let filtered = items;

    // Filter by tag
    if (selectedTag() !== 'all') {
      filtered = filtered.filter((item) =>
        item.tags?.some((tag) => tag.id === selectedTag())
      );
    }

    // Filter by search query (only if tiles search is selected)
    if (searchProvider() === 'tiles' && searchQuery().trim()) {
      const query = searchQuery().toLowerCase();
      filtered = filtered.filter((item) =>
        item.title.toLowerCase().includes(query)
      );
    }

    return filtered;
  });

  const handleReorder = (reorderedItems: Item[]) => {
    console.group('[Dashboard] handleReorder');
    console.log('Reordered items received:', reorderedItems.map(i => ({
      id: i.id,
      title: i.title,
      order: i.order
    })));
    const order = reorderedItems.map((item) => item.id);
    console.log('Order array to send:', order);
    console.groupEnd();
    updateOrderMutation.mutate(order);
  };

  const handleDelete = (item: Item) => {
    setItemToDelete(item);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    const item = itemToDelete();
    if (item) {
      deleteItemMutation.mutate(item.id);
      setItemToDelete(null);
    }
  };

  const handleRefresh = (item: Item) => {
    console.log('[Dashboard] handleRefresh called for item:', {
      id: item.id,
      title: item.title,
      enhanced: item.enhanced,
      class: item.class,
    });
    refreshStatsMutation.mutate(item.id);
  };

  const handleTogglePin = (item: Item) => {
    togglePinMutation.mutate({
      id: item.id,
      pinned: !item.pinned,
      tagId: selectedTag() !== 'all' ? selectedTag() as number : undefined,
    });
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setItemModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setItemModalOpen(true);
  };

  const handleFormSubmit = (data: Partial<Item>) => {
    if (editingItem()) {
      // Update existing item
      updateItemMutation.mutate(
        { id: editingItem()!.id, data },
        {
          onSuccess: () => {
            setItemModalOpen(false);
            setEditingItem(null);
          },
        }
      );
    } else {
      // Create new item
      createItemMutation.mutate(data as any, {
        onSuccess: () => {
          setItemModalOpen(false);
        },
      });
    }
  };

  const handleFormCancel = () => {
    setItemModalOpen(false);
    setEditingItem(null);
  };

  const handleDownloadApps = () => {
    setDownloadConfirmOpen(true);
  };

  const confirmDownloadApps = () => {
    downloadAppsMutation.mutate(undefined, {
      onSuccess: (data) => {
        console.log('[Download Apps] Success:', data);
        setAlertConfig({
          variant: 'success',
          title: 'Success',
          message: data.message || 'Apps downloaded successfully!',
        });
        setAlertOpen(true);
      },
      onError: (error: any) => {
        console.error('[Download Apps] Error:', error);
        setAlertConfig({
          variant: 'error',
          title: 'Error',
          message: 'Failed to download apps: ' + (error.response?.data?.message || error.message),
        });
        setAlertOpen(true);
      },
    });
  };

  return (
    <Show
      when={!itemsQuery.isLoading && !tagsQuery.isLoading && !settingsQuery.isLoading}
      fallback={
        <div class="flex items-center justify-center min-h-screen">
          <div class="text-center">
            <svg
              class="animate-spin h-12 w-12 text-primary-600 mx-auto"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p class="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      }
    >
      <div
        id="app"
        classList={{ header: editMode() }}
        class="min-h-screen w-full"
      >
        {/* Floating Top Bar (Search + Tags) */}
        <FloatingTopBar
          tags={tagsQuery.data || []}
          searchEnabled={isSearchEnabled()}
        />

        {/* Floating Controls (bottom-right) */}
        <FloatingControls
          editMode={editMode()}
          onToggleEdit={toggleEditMode}
          onAdd={handleAddNew}
          onDownloadApps={handleDownloadApps}
          isDownloading={downloadAppsMutation.isPending}
        />

        {/* Main content */}
        <main id="main" class={`w-full px-4 sm:px-6 lg:px-10 xl:px-12 ${contentTopPadding()} pb-24`}>
          <ItemGrid
            items={filteredItems()}
            editMode={editMode()}
            onReorder={handleReorder}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onRefresh={handleRefresh}
            onTogglePin={handleTogglePin}
            onAddNew={handleAddNew}
          />
        </main>

        {/* Item Modal for add/edit */}
        <ItemModal
          isOpen={itemModalOpen()}
          item={editingItem()}
          onSubmit={handleFormSubmit}
          onClose={handleFormCancel}
          isLoading={createItemMutation.isPending || updateItemMutation.isPending}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmDialog
          isOpen={deleteConfirmOpen()}
          onClose={() => setDeleteConfirmOpen(false)}
          onConfirm={confirmDelete}
          title="Delete Item"
          message={`Are you sure you want to delete "${itemToDelete()?.title}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />

        {/* Download Apps Confirmation Modal */}
        <ConfirmDialog
          isOpen={downloadConfirmOpen()}
          onClose={() => setDownloadConfirmOpen(false)}
          onConfirm={confirmDownloadApps}
          title="Download Apps"
          message="This will download or update all enhanced apps from the repository. Continue?"
          confirmText="Download"
          cancelText="Cancel"
          variant="primary"
        />

        {/* Alert Modal */}
        <AlertDialog
          isOpen={alertOpen()}
          onClose={() => setAlertOpen(false)}
          title={alertConfig().title}
          message={alertConfig().message}
          variant={alertConfig().variant}
        />
      </div>
    </Show>
  );
}
