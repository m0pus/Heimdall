import { createSignal, Show, For, createEffect, onMount, createMemo, onCleanup } from 'solid-js';
import { createApplicationsQuery } from '@/queries/applications';
import { createTagsQuery } from '@/queries/tags';
import type { Item, Application, Tag } from '@/types';
import Button from './Button';
import { extractDominantColor, getComplementaryBackground } from '@/lib/colorExtractor';
import { formatRelativeTime } from '@/lib/utils';

interface ItemFormProps {
  item?: Item | null;
  onSubmit: (data: Partial<Item>) => void;
  onCancel: () => void;
  isLoading?: boolean;
  // Optional callbacks for live preview
  onTitleChange?: (value: string) => void;
  onUrlChange?: (value: string) => void;
  onColourChange?: (value: string) => void;
  onIconChange?: (value: string) => void;
  onPinnedChange?: (value: boolean) => void;
}

export default function ItemForm(props: ItemFormProps) {
  // Form state
  const [title, setTitle] = createSignal(props.item?.title || '');
  const [url, setUrl] = createSignal(props.item?.url || '');
  const [colour, setColour] = createSignal(props.item?.colour || '#3b82f6');
  const [icon, setIcon] = createSignal(props.item?.icon || '');
  const [appdescription, setAppdescription] = createSignal(props.item?.appdescription || '');
  const [selectedAppId, setSelectedAppId] = createSignal(props.item?.appid || '');
  const [selectedTags, setSelectedTags] = createSignal<number[]>(
    props.item?.tags?.map(t => t.id) || []
  );
  const [pinned, setPinned] = createSignal(props.item?.pinned || false);

  // Call preview callbacks when values change
  createEffect(() => {
    props.onTitleChange?.(title());
  });

  createEffect(() => {
    props.onUrlChange?.(url());
  });

  createEffect(() => {
    props.onColourChange?.(colour());
  });

  createEffect(() => {
    props.onIconChange?.(icon());
  });

  createEffect(() => {
    props.onPinnedChange?.(pinned());
  });

  // Enhanced app config state (from items.description JSON)
  const [enhancedEnabled, setEnhancedEnabled] = createSignal(props.item?.config?.enabled ?? true);
  const [enhancedApiKey, setEnhancedApiKey] = createSignal(props.item?.config?.apikey || '');
  const [enhancedOverrideUrl, setEnhancedOverrideUrl] = createSignal(props.item?.config?.override_url || '');

  const enhancedStatus = createMemo(() => props.item?.enhanced_status || null);
  const enhancedStatusLabel = createMemo(() => {
    if (!props.item?.enhanced) return null;
    switch ((enhancedStatus() || '').toLowerCase()) {
      case 'active':
        return 'Online';
      case 'inactive':
        return 'Offline';
      case 'error':
        return 'Error';
      default:
        return props.item?.enhanced_last_polled_at ? 'Unknown' : 'Not yet polled';
    }
  });
  const enhancedLastUpdated = createMemo(() => {
    if (!props.item?.enhanced_last_polled_at) return null;
    return formatRelativeTime(props.item.enhanced_last_polled_at);
  });
  const enhancedLastUpdatedExact = createMemo(() => {
    if (!props.item?.enhanced_last_polled_at) return null;
    return new Date(props.item.enhanced_last_polled_at).toLocaleString();
  });
  const enhancedNextPoll = createMemo(() => {
    if (!props.item?.enhanced_next_poll_at) return null;
    return new Date(props.item.enhanced_next_poll_at).toLocaleString();
  });

  // API test state
  const [apiTestStatus, setApiTestStatus] = createSignal<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [apiTestMessage, setApiTestMessage] = createSignal('');
  let testTimeout: number | undefined;

  // Search/filter state
  const [appSearchQuery, setAppSearchQuery] = createSignal('');
  const [showAppDropdown, setShowAppDropdown] = createSignal(false);
  const [visibleAppsCount, setVisibleAppsCount] = createSignal(20); // Show 20 initially
  const [highlightedIndex, setHighlightedIndex] = createSignal(-1);
  let appDropdownRef: HTMLDivElement | undefined;
  let appInputRef: HTMLInputElement | undefined;

  // Queries
  const applicationsQuery = createApplicationsQuery();
  const tagsQuery = createTagsQuery();

  // Click outside to close dropdown
  createEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showAppDropdown() && appDropdownRef && !appDropdownRef.contains(event.target as Node)) {
        setShowAppDropdown(false);
      }
    };

    if (showAppDropdown()) {
      document.addEventListener('mousedown', handleClickOutside);
      onCleanup(() => document.removeEventListener('mousedown', handleClickOutside));
    }
  });

  // All filtered applications (no limit)
  const allFilteredApps = createMemo(() => {
    const apps = applicationsQuery.data || [];
    const query = appSearchQuery().toLowerCase();

    if (!query) return apps;

    return apps.filter(app =>
      app.name.toLowerCase().includes(query) ||
      app.appid.toLowerCase().includes(query)
    );
  });

  // Visible applications with limit for performance
  const filteredApps = createMemo(() => {
    return allFilteredApps().slice(0, visibleAppsCount());
  });

  // Check if there are more apps to load
  const hasMoreApps = createMemo(() => {
    return visibleAppsCount() < allFilteredApps().length;
  });

  // Load more apps
  const loadMoreApps = () => {
    setVisibleAppsCount(prev => prev + 20);
  };

  // Reset visible count and highlighted index when search changes
  createEffect(() => {
    appSearchQuery(); // Track search query
    setVisibleAppsCount(20); // Reset to 20 when search changes
    setHighlightedIndex(-1); // Reset highlighted index
  });

  // Selected app details
  const selectedApp = createMemo(() => {
    if (!selectedAppId()) return null;
    return applicationsQuery.data?.find(app => app.appid === selectedAppId());
  });

  // Update form when item prop changes
  createEffect(() => {
    if (props.item) {
      setTitle(props.item.title);
      setUrl(props.item.url);
      setColour(props.item.colour || '#3b82f6');
      setIcon(props.item.icon || '');
      setAppdescription(props.item.appdescription || '');
      setSelectedAppId(props.item.appid || '');
      setSelectedTags(props.item.tags?.map(t => t.id) || []);
      setPinned(props.item.pinned);

      // Load enhanced config
      if (props.item.config) {
        setEnhancedEnabled(props.item.config.enabled ?? true);
        setEnhancedApiKey(props.item.config.apikey || '');
        setEnhancedOverrideUrl(props.item.config.override_url || '');
      } else {
        // Reset enhanced config if no config exists
        setEnhancedEnabled(true);
        setEnhancedApiKey('');
        setEnhancedOverrideUrl('');
      }
    }
  });

  const handleSubmit = (e: Event) => {
    e.preventDefault();

    const data: Partial<Item> = {
      title: title(),
      url: url(),
      colour: colour(),
      icon: icon(),
      appdescription: appdescription(),
      appid: selectedAppId() || null,
      pinned: pinned(),
      type: 0, // 0 = item
      tags: selectedTags(), // Include selected tags
    };

    // Add enhanced config if an enhanced app is selected
    if (selectedApp()?.enhanced) {
      data.config = {
        enabled: enhancedEnabled(),
        apikey: enhancedApiKey(),
        override_url: enhancedOverrideUrl(),
      };
    }

    props.onSubmit(data);
  };

  const toggleTag = (tagId: number) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const selectApp = async (app: Application) => {
    setSelectedAppId(app.appid);
    if (!title()) setTitle(app.name);

    // Set icon from application
    if (app.icon) {
      setIcon(app.icon);
    }

    // Set appdescription from application if not already set
    if (!appdescription() && app.description) {
      setAppdescription(app.description);
    }

    // Extract dominant color from app icon and set as background
    if (!colour() && app.icon) {
      try {
        const dominantColor = await extractDominantColor(app.icon);
        const bgColor = getComplementaryBackground(dominantColor);
        setColour(bgColor);
      } catch (error) {
        console.warn('Failed to extract color from icon, using default:', error);
        // Fallback to tile_background setting
        setColour(app.tile_background === 'dark' ? '#161b1f' : '#fafbfc');
      }
    }

    // Close dropdown and clear search
    setShowAppDropdown(false);
    setAppSearchQuery('');
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!showAppDropdown()) return;

    const apps = filteredApps();

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => {
          const next = prev < apps.length - 1 ? prev + 1 : prev;
          // Auto-load more if we're near the end
          if (next >= visibleAppsCount() - 5 && hasMoreApps()) {
            loadMoreApps();
          }
          return next;
        });
        break;

      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;

      case 'Enter':
        e.preventDefault();
        const highlighted = highlightedIndex();
        if (highlighted >= 0 && highlighted < apps.length) {
          selectApp(apps[highlighted]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setShowAppDropdown(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const testApiConfig = async () => {
    const app = selectedApp();
    if (!app || !app.enhanced || !enhancedEnabled()) return;

    // Build config object similar to what backend expects
    const testData = {
      type: app.appid,
      url: enhancedOverrideUrl() || url(),
      apikey: enhancedApiKey(),
      enabled: enhancedEnabled(),
      override_url: enhancedOverrideUrl(),
    };

    // Skip if URL is empty
    if (!testData.url) {
      setApiTestStatus('idle');
      return;
    }

    setApiTestStatus('testing');
    setApiTestMessage('Testing API connection...');

    try {
      const response = await fetch('/api/testConfig', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({ data: testData }),
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        setApiTestStatus('success');
        setApiTestMessage(result.message || 'API connection successful');
      } else {
        setApiTestStatus('error');
        setApiTestMessage(result.message || 'API connection failed');
      }
    } catch (error) {
      setApiTestStatus('error');
      setApiTestMessage('Failed to test API connection');
    }
  };

  // Debounced API test when API key, override URL, or main URL changes
  createEffect(() => {
    const key = enhancedApiKey();
    const overrideUrl = enhancedOverrideUrl();
    const mainUrl = url();
    const enabled = enhancedEnabled();
    const app = selectedApp();

    // Clear existing timeout
    if (testTimeout) {
      clearTimeout(testTimeout);
    }

    // Only test if enhanced app is selected and enabled
    if (app?.enhanced && enabled) {
      // Reset status immediately
      setApiTestStatus('idle');

      // Debounce for 1 second
      testTimeout = setTimeout(() => {
        testApiConfig();
      }, 1000) as unknown as number;
    } else {
      setApiTestStatus('idle');
      setApiTestMessage('');
    }
  });

  return (
    <form onSubmit={handleSubmit} class="space-y-6">
      {/* Title */}
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Title <span class="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title()}
          onInput={(e) => setTitle(e.currentTarget.value)}
          required
          placeholder="My App"
          class="input w-full"
        />
      </div>

      {/* URL */}
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          URL <span class="text-red-500">*</span>
        </label>
        <input
          type="url"
          value={url()}
          onInput={(e) => setUrl(e.currentTarget.value)}
          required
          placeholder="https://example.com"
          class="input w-full"
        />
      </div>

      {/* Application Type Selection */}
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Application Type (Optional)
        </label>
        <div class="relative" ref={appDropdownRef}>
          <input
            ref={appInputRef}
            type="text"
            value={appSearchQuery()}
            onInput={(e) => setAppSearchQuery(e.currentTarget.value)}
            onFocus={() => setShowAppDropdown(true)}
            onKeyDown={handleKeyDown}
            placeholder={selectedApp() ? selectedApp()!.name : "Search for an app..."}
            class="input w-full"
            classList={{
              'pl-10': !!selectedApp() // Add left padding when app is selected
            }}
          />

          {/* Selected app icon overlay */}
          <Show when={selectedApp()}>
            <div class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <img src={selectedApp()!.icon} alt="" class="h-5 w-5 object-contain" />
            </div>
          </Show>

          {/* Dropdown */}
          <Show when={showAppDropdown() && filteredApps().length > 0}>
            <div
              class="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-auto pb-10"
              onScroll={(e) => {
                const target = e.currentTarget;
                const scrolledToBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
                if (scrolledToBottom && hasMoreApps()) {
                  loadMoreApps();
                }
              }}
            >
              <For each={filteredApps()}>
                {(app, index) => {
                  let buttonRef: HTMLButtonElement | undefined;

                  // Scroll into view when highlighted
                  createEffect(() => {
                    if (highlightedIndex() === index() && buttonRef) {
                      buttonRef.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                    }
                  });

                  return (
                    <button
                      ref={buttonRef}
                      type="button"
                      onClick={() => selectApp(app)}
                      class="w-full flex items-center gap-3 px-4 py-2 text-left transition-colors"
                      classList={{
                        'bg-blue-50 border-l-2 border-blue-500': highlightedIndex() === index(),
                        'hover:bg-gray-50': highlightedIndex() !== index(),
                      }}
                    >
                      <Show when={app.icon}>
                        <img src={app.icon} alt="" class="h-6 w-6 object-contain" />
                      </Show>
                      <div class="flex-1 min-w-0">
                        <div class="font-medium text-sm truncate">{app.name}</div>
                        <div class="text-xs text-gray-500 truncate">{app.description}</div>
                      </div>
                      <Show when={app.enhanced}>
                        <span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          Enhanced
                        </span>
                      </Show>
                    </button>
                  );
                }}
              </For>

              {/* Load More Button */}
              <Show when={hasMoreApps()}>
                <button
                  type="button"
                  onClick={loadMoreApps}
                  class="w-full px-4 py-3 text-sm text-center text-gray-600 hover:bg-gray-50 border-t border-gray-200 transition-colors"
                >
                  Load more apps ({allFilteredApps().length - visibleAppsCount()} remaining)
                </button>
              </Show>

              {/* Results count - fixed at bottom with backdrop */}
              <div class="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-2 text-xs text-gray-500 text-center shadow-[0_-2px_8px_rgba(0,0,0,0.08)]">
                Showing {filteredApps().length} of {allFilteredApps().length} apps
              </div>
            </div>
          </Show>
        </div>

        <p class="mt-1 text-xs text-gray-500">
          Select a supported application to use its icon and settings. Enhanced apps can display live stats.
        </p>
      </div>

      {/* Enhanced App Configuration */}
      <Show when={selectedApp()?.enhanced}>
        <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
          <div class="flex items-center gap-2 mb-2">
            <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
            </svg>
            <h3 class="text-sm font-semibold text-blue-900">Enhanced App Configuration</h3>
          </div>

          <Show when={props.item?.enhanced}>
            <div class="rounded-lg border border-blue-100 bg-white/80 p-3 space-y-2 text-sm">
              <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">Last pull</p>
                  <p
                    class="text-sm text-gray-900"
                    title={enhancedLastUpdatedExact() || undefined}
                  >
                    {enhancedLastUpdated() || 'Not yet polled'}
                  </p>
                </div>
                <div
                  class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
                  classList={{
                    'border-green-200 bg-green-50 text-green-700': (enhancedStatus() || '').toLowerCase() === 'active',
                    'border-yellow-200 bg-yellow-50 text-yellow-700': (enhancedStatus() || '').toLowerCase() === 'inactive',
                    'border-red-200 bg-red-50 text-red-700': (enhancedStatus() || '').toLowerCase() === 'error',
                    'border-gray-200 bg-gray-50 text-gray-600': !enhancedStatus(),
                  }}
                >
                  <span
                    class="h-2 w-2 rounded-full"
                    classList={{
                      'bg-green-500': (enhancedStatus() || '').toLowerCase() === 'active',
                      'bg-yellow-400': (enhancedStatus() || '').toLowerCase() === 'inactive',
                      'bg-red-500': (enhancedStatus() || '').toLowerCase() === 'error',
                      'bg-gray-400': !enhancedStatus(),
                    }}
                  />
                  {enhancedStatusLabel()}
                </div>
              </div>

              <div class="text-xs text-gray-600 space-y-1">
                <Show when={props.item?.enhanced_response_time_ms !== undefined && props.item?.enhanced_response_time_ms !== null}>
                  <p>Response time: {props.item?.enhanced_response_time_ms} ms</p>
                </Show>
                <Show when={enhancedNextPoll()}>
                  <p>Next poll scheduled for {enhancedNextPoll()}</p>
                </Show>
                <Show when={!enhancedLastUpdated() && props.item?.enhanced_is_fresh === false}>
                  <p>Awaiting first successful poll.</p>
                </Show>
              </div>

              <Show when={props.item?.enhanced_error}>
                <p class="text-xs text-red-700 bg-red-50 border border-red-100 rounded-md px-2 py-1">
                  {props.item?.enhanced_error}
                </p>
              </Show>
            </div>
          </Show>

          {/* Enable/Disable Enhanced Features */}
          <div class="flex items-center gap-2">
            <input
              type="checkbox"
              id="enhanced-enabled"
              checked={enhancedEnabled()}
              onChange={(e) => setEnhancedEnabled(e.currentTarget.checked)}
              class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label for="enhanced-enabled" class="text-sm font-medium text-gray-700 cursor-pointer">
              Enable live stats for this app
            </label>
          </div>

          <Show when={enhancedEnabled()}>
            {/* API Key */}
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                API Key
              </label>
              <input
                type="password"
                value={enhancedApiKey()}
                onInput={(e) => setEnhancedApiKey(e.currentTarget.value)}
                placeholder="Enter API key..."
                class="input w-full font-mono text-sm"
                autocomplete="off"
              />
              <p class="mt-1 text-xs text-gray-500">
                API key for authenticating with {selectedApp()!.name}
              </p>
            </div>

            {/* Override URL */}
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                API Override URL (Optional)
              </label>
              <input
                type="url"
                value={enhancedOverrideUrl()}
                onInput={(e) => setEnhancedOverrideUrl(e.currentTarget.value)}
                placeholder="https://api.example.com"
                class="input w-full"
              />
              <p class="mt-1 text-xs text-gray-500">
                Use a different URL for API calls (leave empty to use the main URL above)
              </p>
            </div>

            {/* API Test Status */}
            <Show when={apiTestStatus() !== 'idle'}>
              <div class="flex items-start gap-2 p-3 rounded-lg" classList={{
                'bg-blue-50 border border-blue-200': apiTestStatus() === 'testing',
                'bg-green-50 border border-green-200': apiTestStatus() === 'success',
                'bg-red-50 border border-red-200': apiTestStatus() === 'error',
              }}>
                {/* Icon */}
                <Show when={apiTestStatus() === 'testing'}>
                  <svg class="w-5 h-5 text-blue-600 animate-spin flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </Show>
                <Show when={apiTestStatus() === 'success'}>
                  <svg class="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                </Show>
                <Show when={apiTestStatus() === 'error'}>
                  <svg class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                </Show>

                {/* Message */}
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium" classList={{
                    'text-blue-800': apiTestStatus() === 'testing',
                    'text-green-800': apiTestStatus() === 'success',
                    'text-red-800': apiTestStatus() === 'error',
                  }}>
                    {apiTestMessage()}
                  </p>
                </div>
              </div>
            </Show>
          </Show>
        </div>
      </Show>

      {/* Icon URL */}
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Icon URL (Optional)
        </label>
        <div class="flex gap-2">
          <input
            type="url"
            value={icon()}
            onInput={(e) => setIcon(e.currentTarget.value)}
            placeholder="https://example.com/icon.png"
            class="input flex-1"
          />
          <Show when={icon()}>
            <div class="flex-shrink-0 w-10 h-10 rounded border border-gray-200 flex items-center justify-center bg-gray-50">
              <img src={icon()} alt="Icon preview" class="h-8 w-8 object-contain" />
            </div>
          </Show>
        </div>
        <p class="mt-1 text-xs text-gray-500">
          Leave empty to use the enhanced app icon
        </p>
      </div>

      {/* Color */}
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Background Color
        </label>
        <div class="relative">
          <input
            type="color"
            value={colour()}
            onInput={(e) => setColour(e.currentTarget.value)}
            class="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded cursor-pointer border-0"
            style="-webkit-appearance: none; appearance: none;"
          />
          <input
            type="text"
            value={colour()}
            onInput={(e) => setColour(e.currentTarget.value)}
            placeholder="#3b82f6"
            class="input w-full pl-14 font-mono"
          />
        </div>
      </div>

      {/* Tags */}
      <Show when={(tagsQuery.data?.length || 0) > 0}>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <div class="flex flex-wrap gap-2">
            <For each={tagsQuery.data}>
              {(tag) => (
                <button
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  classList={{
                    'bg-primary-600 text-white': selectedTags().includes(tag.id),
                    'bg-gray-100 text-gray-700 hover:bg-gray-200': !selectedTags().includes(tag.id),
                  }}
                >
                  {tag.title}
                </button>
              )}
            </For>
          </div>
        </div>
      </Show>

      {/* Description */}
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Description (Optional)
        </label>
        <textarea
          value={appdescription()}
          onInput={(e) => setAppdescription(e.currentTarget.value)}
          placeholder="A brief description of this application..."
          rows={3}
          class="input w-full resize-y"
        />
        <p class="mt-1 text-xs text-gray-500">
          This will appear in a tooltip when hovering over the tile
        </p>
      </div>

      {/* Pinned */}
      <div class="flex items-center gap-2">
        <input
          type="checkbox"
          id="pinned"
          checked={pinned()}
          onChange={(e) => setPinned(e.currentTarget.checked)}
          class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <label for="pinned" class="text-sm font-medium text-gray-700 cursor-pointer">
          Pin to top
        </label>
      </div>

      {/* Actions */}
      <div class="flex gap-3 pt-4 border-t border-gray-200">
        <Button
          type="submit"
          variant="primary"
          isLoading={props.isLoading}
          class="flex-1"
        >
          {props.item ? 'Update Item' : 'Add Item'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={props.onCancel}
          disabled={props.isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
