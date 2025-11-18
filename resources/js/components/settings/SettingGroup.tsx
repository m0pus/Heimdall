import { createSignal, Show, JSX, createEffect } from 'solid-js';
import type { SettingGroup as SettingGroupType } from '@/types';
import { t } from '@/lib/i18n';

interface SettingGroupProps {
  group: SettingGroupType;
  children: JSX.Element;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
}

export default function SettingGroup(props: SettingGroupProps) {
  const [isOpen, setIsOpen] = createSignal(props.isOpen ?? true);

  // Sync with parent-controlled state if provided
  createEffect(() => {
    if (props.isOpen !== undefined) {
      setIsOpen(props.isOpen);
    }
  });

  const handleToggle = () => {
    const newState = !isOpen();
    setIsOpen(newState);
    props.onToggle?.(newState);
  };

  return (
    <div class="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Group header */}
      <button
        type="button"
        onClick={handleToggle}
        class="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
      >
        <h2 class="text-lg font-semibold text-gray-900">
          {t(props.group.title) || props.group.title}
        </h2>
        <svg
          class="w-5 h-5 text-gray-500 transition-transform"
          classList={{
            'rotate-180': isOpen(),
          }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Group content */}
      <Show when={isOpen()}>
        <div class="px-6 pt-1 pb-2">
          {props.children}
        </div>
      </Show>
    </div>
  );
}
