import { Show, For, createMemo } from 'solid-js';
import { searchQuery, searchProvider, setSearchQuery, setSearchProvider, selectedTag, setSelectedTag } from '@/store/dashboard';
import { cn } from '@/lib/utils';
import type { Tag } from '@/types';

interface FloatingTopBarProps {
  tags: Tag[];
  searchEnabled: boolean;
}

export default function FloatingTopBar(props: FloatingTopBarProps) {
  const searchProviders = [
    { value: 'tiles', label: 'Search Tiles' },
    { value: 'google', label: 'Google' },
    { value: 'duckduckgo', label: 'DuckDuckGo' },
    { value: 'bing', label: 'Bing' },
  ];

  const hasTags = createMemo(() => props.tags.length > 0);
  const showTopBar = createMemo(() => props.searchEnabled || hasTags());

  const handleSearchSubmit = (e: Event) => {
    e.preventDefault();
    if (searchProvider() === 'tiles') return;

    const searchUrls: Record<string, string> = {
      google: `https://www.google.com/search?q=${encodeURIComponent(searchQuery())}`,
      duckduckgo: `https://duckduckgo.com/?q=${encodeURIComponent(searchQuery())}`,
      bing: `https://www.bing.com/search?q=${encodeURIComponent(searchQuery())}`,
    };

    const url = searchUrls[searchProvider()];
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <Show when={showTopBar()}>
      <div class="fixed top-6 left-1/2 transform -translate-x-1/2 z-30 w-full max-w-4xl px-4">
        <div class="bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-gray-100">
          {/* Search Bar Section */}
          <Show when={props.searchEnabled}>
            <div class="p-4 border-b border-gray-100" id="search-container">
              <form onSubmit={handleSearchSubmit} class="searchform">
                <div class="flex gap-2">
                  <div class="relative flex-1">
                    <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <svg
                        class="h-5 w-5 text-gray-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      name="q"
                      value={searchQuery()}
                      onInput={(e) => setSearchQuery(e.currentTarget.value)}
                      placeholder={`Search ${searchProvider() === 'tiles' ? 'your apps...' : 'the web...'}`}
                      class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white/50"
                    />
                  </div>

                  <div class="relative">
                    <select
                      name="provider"
                      value={searchProvider()}
                      onChange={(e) => setSearchProvider(e.currentTarget.value)}
                      class="appearance-none pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white/50 cursor-pointer"
                    >
                      <For each={searchProviders}>
                        {(provider) => (
                          <option value={provider.value}>
                            {provider.label}
                          </option>
                        )}
                      </For>
                    </select>
                    {/* Custom chevron */}
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </div>

                  <button type="submit" class="btn-primary px-6 whitespace-nowrap">
                    Search
                  </button>
                </div>
              </form>
            </div>
          </Show>

          {/* Tag List Section */}
          <Show when={hasTags()}>
            <div
              class={cn(
                "p-4",
                props.searchEnabled ? "" : "" // No border if search is hidden
              )}
              id="taglist"
            >
              <div class="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedTag('all')}
                  class={cn(
                    'tag px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    selectedTag() === 'all'
                      ? 'bg-primary-600 text-white shadow-md scale-105'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-sm'
                  )}
                  data-tag="all"
                >
                  All
                </button>

                <For each={props.tags}>
                  {(tag) => (
                    <button
                      onClick={() => setSelectedTag(tag.id)}
                      class={cn(
                        'tag px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                        selectedTag() === tag.id
                          ? 'text-white shadow-md scale-105'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-sm'
                      )}
                      data-tag={tag.id}
                      style={
                        selectedTag() === tag.id && tag.colour
                          ? {
                              'background-color': tag.colour,
                              color: '#ffffff',
                            }
                          : selectedTag() === tag.id
                          ? {
                              'background-color': '#4f46e5',
                              color: '#ffffff',
                            }
                          : undefined
                      }
                    >
                      <Show when={tag.icon}>
                        <img
                          src={tag.icon}
                          alt=""
                          class="inline-block h-4 w-4 mr-1.5 -mt-0.5"
                        />
                      </Show>
                      {tag.title}
                    </button>
                  )}
                </For>
              </div>
            </div>
          </Show>
        </div>
      </div>
    </Show>
  );
}
