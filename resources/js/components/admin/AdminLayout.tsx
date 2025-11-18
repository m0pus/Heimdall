import { JSX, Show, createMemo } from 'solid-js';
import { A } from '@solidjs/router';
import { t } from '@/lib/i18n';

interface AdminLayoutProps {
  children: JSX.Element;
  title?: string;
  description?: string;
  headerActions?: JSX.Element;
}

export default function AdminLayout(props: AdminLayoutProps) {
  const titleText = createMemo(() => props.title || t('app.dashboard.settings'));
  const descriptionText = createMemo(() => props.description || 'Configure your application preferences');

  return (
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sticky Header */}
      <div class="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div class="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-4">
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-4 min-w-0 flex-1">
              <A
                href="/"
                class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span class="hidden sm:inline">{t('app.dashboard.reorder') || 'Back to Dashboard'}</span>
              </A>
              <div class="h-6 w-px bg-gray-300 hidden sm:block flex-shrink-0" />
              <div class="min-w-0">
                <h1 class="text-xl sm:text-2xl font-bold text-gray-900 truncate">{titleText()}</h1>
                <Show when={props.description}>
                  <p class="hidden md:block text-sm text-gray-600 mt-0.5 truncate">
                    {descriptionText()}
                  </p>
                </Show>
              </div>
            </div>
            {/* Header Actions Slot */}
            <Show when={props.headerActions}>
              <div class="flex-shrink-0">
                {props.headerActions}
              </div>
            </Show>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div class="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-8">
        {props.children}
      </div>
    </div>
  );
}
