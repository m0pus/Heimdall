import { Show, For, createMemo } from 'solid-js';
import { A } from '@solidjs/router';
import { useQueryClient } from '@tanstack/solid-query';
import { createSettingsQuery, createUpdateSettingMutation } from '@/queries/settings';
import SettingGroup from '@/components/settings/SettingGroup';
import SettingField from '@/components/settings/SettingField';
import { t, changeLocale } from '@/lib/i18n';

export default function Settings() {
  const queryClient = useQueryClient();
  const settingsQuery = createSettingsQuery();
  const updateMutation = createUpdateSettingMutation();

  // Reactive translations
  const backText = createMemo(() => t('app.dashboard.reorder') || 'Back to Dashboard');
  const settingsTitleText = createMemo(() => t('app.dashboard.settings'));
  const subtitleText = createMemo(() => t('app.settings.search') || 'Configure your application preferences');

  // Group settings by group_id
  const groupedSettings = createMemo(() => {
    const data = settingsQuery.data;
    if (!data) return new Map();

    const map = new Map();
    data.settings.forEach((setting) => {
      if (!map.has(setting.group_id)) {
        map.set(setting.group_id, []);
      }
      map.get(setting.group_id).push(setting);
    });

    return map;
  });

  const handleUpdate = async (settingId: number, value: any) => {
    // Find the setting being updated
    const setting = settingsQuery.data?.settings.find(s => s.id === settingId);

    // Update the setting value
    updateMutation.mutate({ id: settingId, value });

    // If it's the language setting, reload translations
    if (setting?.key === 'language') {
      await changeLocale(value);
    }

    // If it's a background setting, refetch background
    if (setting?.key === 'trianglify' || setting?.key === 'trianglify_seed' || setting?.key === 'background_image') {
      queryClient.invalidateQueries({ queryKey: ['background'] });
    }
  };

  return (
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sticky Header */}
      <div class="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div class="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <A
                href="/"
                class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span class="hidden sm:inline">{backText()}</span>
              </A>
              <div class="h-6 w-px bg-gray-300 hidden sm:block" />
              <div>
                <h1 class="text-xl sm:text-2xl font-bold text-gray-900">{settingsTitleText()}</h1>
                <p class="hidden md:block text-sm text-gray-600 mt-0.5">
                  {subtitleText()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div class="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-8">
        {/* Loading state */}
        <Show when={settingsQuery.isLoading}>
          <div class="flex items-center justify-center py-24">
            <div class="text-center">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p class="mt-4 text-gray-600">Loading settings...</p>
            </div>
          </div>
        </Show>

        {/* Error state */}
        <Show when={settingsQuery.isError}>
          <div class="max-w-2xl mx-auto">
            <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800">
              <div class="flex items-start gap-3">
                <svg class="h-6 w-6 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
                <div>
                  <p class="font-medium">Failed to load settings</p>
                  <p class="text-sm mt-1">{settingsQuery.error?.message || 'Unknown error'}</p>
                </div>
              </div>
            </div>
          </div>
        </Show>

        {/* Settings groups - Responsive Grid */}
        <Show when={settingsQuery.data}>
          <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-[1600px] mx-auto">
            <For each={settingsQuery.data!.groups} fallback={<div>No groups</div>}>
              {(group) => (
                <div class="h-fit">
                  <SettingGroup group={group}>
                    <For each={groupedSettings().get(group.id) || []} fallback={<div>No settings</div>}>
                      {(setting) => (
                        <SettingField
                          key={setting.id}
                          setting={setting}
                          onUpdate={(value) => handleUpdate(setting.id, value)}
                          isLoading={updateMutation.isPending}
                        />
                      )}
                    </For>
                  </SettingGroup>
                </div>
              )}
            </For>
          </div>

          {/* Footer info */}
          <div class="mt-12 max-w-2xl mx-auto">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div class="flex items-start gap-3">
                <svg class="h-6 w-6 flex-shrink-0 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                </svg>
                <div class="text-sm text-blue-800">
                  <p class="font-medium">About Settings</p>
                  <ul class="mt-2 space-y-1 list-disc list-inside">
                    <li>Settings are saved automatically when changed</li>
                    <li>System settings (with lock icon) are read-only</li>
                    <li>Changes take effect immediately</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
}
