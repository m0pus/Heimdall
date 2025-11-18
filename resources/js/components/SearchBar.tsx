import { Show, For } from 'solid-js';
import { searchQuery, searchProvider, setSearchQuery, setSearchProvider } from '@/store/dashboard';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  class?: string;
}

export default function SearchBar(props: SearchBarProps) {
  const providers = [
    { value: 'tiles', label: 'Search Tiles' },
    { value: 'google', label: 'Google' },
    { value: 'duckduckgo', label: 'DuckDuckGo' },
    { value: 'bing', label: 'Bing' },
  ];

  const handleSubmit = (e: Event) => {
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
    <div class="fixed top-8 left-1/2 transform -translate-x-1/2 z-30 w-full max-w-2xl px-4" id="search-container">
      <form onSubmit={handleSubmit} class="searchform">
        <div class="flex gap-2 bg-white rounded-lg shadow-lg p-3">
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
              class="input pl-10 w-full border-0 focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <select
            name="provider"
            value={searchProvider()}
            onChange={(e) => setSearchProvider(e.currentTarget.value)}
            class="input w-auto border-0 focus:ring-2 focus:ring-primary-500"
          >
            <For each={providers}>
              {(provider) => (
                <option value={provider.value}>
                  {provider.label}
                </option>
              )}
            </For>
          </select>

          <Show when={searchProvider() !== 'tiles'}>
            <button type="submit" class="btn-primary whitespace-nowrap">
              Search
            </button>
          </Show>
        </div>
      </form>
    </div>
  );
}
