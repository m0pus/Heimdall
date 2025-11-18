import { Show, createSignal, createEffect } from 'solid-js';
import { Portal } from 'solid-js/web';
import ItemForm from './ItemForm';
import { getContrastColor, getIconUrl } from '@/lib/utils';
import type { Item } from '@/types';

interface ItemModalProps {
  isOpen: boolean;
  item?: Item | null;
  onSubmit: (data: Partial<Item>) => void;
  onClose: () => void;
  isLoading?: boolean;
}

/**
 * ItemModal - Full-screen modal for adding/editing items with live preview
 * Mobile-first design with responsive layout
 */
export default function ItemModal(props: ItemModalProps) {
  // Track form values for live preview
  const [previewTitle, setPreviewTitle] = createSignal(props.item?.title || 'My App');
  const [previewUrl, setPreviewUrl] = createSignal(props.item?.url || 'https://example.com');
  const [previewColour, setPreviewColour] = createSignal(props.item?.colour || '#3b82f6');
  const [previewIcon, setPreviewIcon] = createSignal(props.item?.icon || '');
  const [previewPinned, setPreviewPinned] = createSignal(props.item?.pinned || false);

  // Update preview when item changes
  createEffect(() => {
    if (props.item) {
      setPreviewTitle(props.item.title);
      setPreviewUrl(props.item.url);
      setPreviewColour(props.item.colour || '#3b82f6');
      setPreviewIcon(props.item.icon || '');
      setPreviewPinned(props.item.pinned);
    } else {
      // Reset for new item
      setPreviewTitle('My App');
      setPreviewUrl('https://example.com');
      setPreviewColour('#3b82f6');
      setPreviewIcon('');
      setPreviewPinned(false);
    }
  });

  const backgroundColor = () => previewColour();
  const textColor = () => getContrastColor(backgroundColor());
  const iconUrl = () => getIconUrl(previewIcon());

  // Wrapper for form submit to pass through
  const handleSubmit = (data: Partial<Item>) => {
    props.onSubmit(data);
  };

  // Custom form that updates preview in real-time
  const FormWithPreview = () => {
    return (
      <ItemForm
        item={props.item}
        onSubmit={handleSubmit}
        onCancel={props.onClose}
        isLoading={props.isLoading}
        // Pass preview setters to update live preview
        onTitleChange={setPreviewTitle}
        onUrlChange={setPreviewUrl}
        onColourChange={setPreviewColour}
        onIconChange={setPreviewIcon}
        onPinnedChange={setPreviewPinned}
      />
    );
  };

  return (
    <Portal>
      <Show when={props.isOpen}>
        {/* Backdrop */}
        <div
          class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
          onClick={props.onClose}
        />

        {/* Modal Container */}
        <div class="fixed inset-0 z-50 overflow-y-auto">
          <div class="min-h-full flex items-center justify-center p-0 sm:p-4">
            {/* Modal Content */}
            <div
              class="relative bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:rounded-2xl shadow-2xl flex flex-col sm:max-w-6xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div class="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50 sm:rounded-t-2xl">
                <h2 class="text-xl sm:text-2xl font-bold text-gray-900">
                  {props.item ? 'Edit Application' : 'Add New Application'}
                </h2>
                <button
                  onClick={props.onClose}
                  class="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <svg class="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Body - Responsive Layout */}
              <div class="flex-1 overflow-y-auto">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-6 lg:p-6">
                  {/* Left Column - Form */}
                  <div class="p-4 sm:p-6 lg:p-0 order-2 lg:order-1">
                    <FormWithPreview />
                  </div>

                  {/* Right Column - Live Preview */}
                  <div class="p-4 sm:p-6 lg:p-0 border-b lg:border-b-0 lg:border-l border-gray-200 order-1 lg:order-2 bg-gradient-to-br from-gray-50 to-gray-100">
                    <div class="sticky top-0">
                      <h3 class="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Live Preview
                      </h3>

                      {/* Preview Container */}
                      <div class="bg-white rounded-xl p-6 shadow-lg">
                        <p class="text-xs text-gray-500 mb-4 text-center">
                          This is how your tile will appear on the dashboard
                        </p>

                        {/* Tile Preview */}
                        <div class="flex justify-center">
                          <div class="tile-container relative" style="width: 280px; height: 280px;">
                            <div
                              class="tile"
                              style={{
                                'background-color': backgroundColor(),
                                color: textColor(),
                                'pointer-events': 'none',
                              }}
                            >
                              {/* Decorative Circle */}
                              <div class="tile-circle" />

                              {/* Content */}
                              <div class="tile-content">
                                {/* Icon */}
                                <Show when={iconUrl()} fallback={
                                  <div class="tile-icon-placeholder">
                                    <svg class="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                                      <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                                    </svg>
                                  </div>
                                }>
                                  <div class="tile-icon">
                                    <img
                                      src={iconUrl()}
                                      alt={previewTitle()}
                                      class="w-full h-full object-contain"
                                      onError={(e) => {
                                        // Fallback to placeholder on error
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  </div>
                                </Show>

                                {/* Title */}
                                <div class="tile-text-content">
                                  <h3 class="tile-title">
                                    {previewTitle() || 'My App'}
                                  </h3>
                                </div>
                              </div>

                              {/* Link Icon */}
                              <div class="tile-link-icon">
                                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </div>
                            </div>

                            {/* Pin indicator */}
                            <Show when={previewPinned()}>
                              <div
                                class="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-md"
                                title="Pinned"
                              >
                                <svg
                                  class="w-4 h-4 text-gray-700"
                                  fill="currentColor"
                                  viewBox="0 0 384 512"
                                >
                                  <path d="M32 32C32 14.3 46.3 0 64 0H320c17.7 0 32 14.3 32 32s-14.3 32-32 32H290.5l11.4 148.2c36.7 19.9 65.7 53.2 79.5 94.7l1 3c3.3 9.8 1.6 20.5-4.4 28.8s-15.7 13.3-26 13.3H32c-10.3 0-19.9-4.9-26-13.3s-7.7-19.1-4.4-28.8l1-3c13.8-41.5 42.8-74.8 79.5-94.7L93.5 64H64C46.3 64 32 49.7 32 32zM160 384h64v96c0 17.7-14.3 32-32 32s-32-14.3-32-32V384z"/>
                                </svg>
                              </div>
                            </Show>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Show>
    </Portal>
  );
}
