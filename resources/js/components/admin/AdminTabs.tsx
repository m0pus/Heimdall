import { For, JSX } from 'solid-js';
import { A } from '@solidjs/router';

export interface TabItem {
  id: string;
  label: string;
  icon?: JSX.Element;
  href: string;
}

interface AdminTabsProps {
  tabs: TabItem[];
  activeTab: string;
}

export default function AdminTabs(props: AdminTabsProps) {
  return (
    <div class="border-b border-gray-200 mb-6">
      <nav class="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
        <For each={props.tabs}>
          {(tab) => (
            <A
              href={tab.href}
              class={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm inline-flex items-center gap-2 transition-colors
                ${props.activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
              aria-current={props.activeTab === tab.id ? 'page' : undefined}
            >
              {tab.icon}
              {tab.label}
            </A>
          )}
        </For>
      </nav>
    </div>
  );
}
