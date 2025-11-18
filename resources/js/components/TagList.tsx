import { For, Show } from 'solid-js';
import { selectedTag, setSelectedTag } from '@/store/dashboard';
import { cn } from '@/lib/utils';
import type { Tag } from '@/types';

interface TagListProps {
  tags: Tag[];
  class?: string;
}

export default function TagList(props: TagListProps) {
  return (
    <div class={cn('flex flex-wrap gap-2', props.class)} id="taglist">
      <button
        onClick={() => setSelectedTag('all')}
        class={cn(
          'tag px-4 py-2 rounded-lg text-sm font-medium transition-colors',
          selectedTag() === 'all'
            ? 'bg-primary-600 text-white current'
            : 'bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
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
              'tag px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              selectedTag() === tag.id
                ? 'bg-primary-600 text-white current'
                : 'bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
            )}
            data-tag={tag.id}
            style={
              selectedTag() === tag.id && tag.colour
                ? {
                    'background-color': tag.colour,
                    color: '#ffffff',
                  }
                : undefined
            }
          >
            <Show when={tag.icon}>
              <img
                src={tag.icon}
                alt=""
                class="inline-block h-4 w-4 mr-1"
              />
            </Show>
            {tag.title}
          </button>
        )}
      </For>
    </div>
  );
}
