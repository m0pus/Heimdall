import { Show, For, createMemo, createSignal, JSX } from 'solid-js';
import { useQueryClient } from '@tanstack/solid-query';
import { createSettingsQuery, createUpdateSettingMutation } from '@/queries/settings';
import SettingGroup from '@/components/settings/SettingGroup';
import SettingField from '@/components/settings/SettingField';
import Button from '@/components/Button';
import { t, changeLocale } from '@/lib/i18n';

interface SettingsSectionProps {
  onHeaderActionsChange?: (actions: JSX.Element) => void;
}

export default function SettingsSection(props: SettingsSectionProps) {
  const queryClient = useQueryClient();
  const settingsQuery = createSettingsQuery();
  const updateMutation = createUpdateSettingMutation();

  // Track which groups are expanded (groupId -> boolean)
  const [expandedGroups, setExpandedGroups] = createSignal<Map<number, boolean>>(new Map());
  const [allExpanded, setAllExpanded] = createSignal(true);

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

  const toggleAllGroups = () => {
    const newState = !allExpanded();
    setAllExpanded(newState);

    // Update all groups
    const newMap = new Map<number, boolean>();
    settingsQuery.data?.groups.forEach(group => {
      newMap.set(group.id, newState);
    });
    setExpandedGroups(newMap);
  };

  const handleGroupToggle = (groupId: number, isOpen: boolean) => {
    const newMap = new Map(expandedGroups());
    newMap.set(groupId, isOpen);
    setExpandedGroups(newMap);

    // Check if all groups are expanded or collapsed
    const allOpen = Array.from(newMap.values()).every(v => v);
    const allClosed = Array.from(newMap.values()).every(v => !v);
    if (allOpen) setAllExpanded(true);
    if (allClosed) setAllExpanded(false);
  };

  const isGroupExpanded = (groupId: number) => {
    const state = expandedGroups().get(groupId);
    return state !== undefined ? state : true; // Default to expanded
  };

  // Create collapse/expand all button
  const collapseExpandButton = () => (
    <Button
      variant="secondary"
      size="sm"
      onClick={toggleAllGroups}
    >
      <svg class="h-4 w-4 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d={allExpanded() ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} />
      </svg>
      <span class="hidden sm:inline">
        {allExpanded() ? (t('app.buttons.collapse_all') || 'Collapse All') : (t('app.buttons.expand_all') || 'Expand All')}
      </span>
    </Button>
  );

  // Notify parent of header actions when data is loaded
  createMemo(() => {
    if (settingsQuery.data && props.onHeaderActionsChange) {
      props.onHeaderActionsChange(collapseExpandButton());
    }
  });

  return (
    <>
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

      {/* Settings groups - Masonry Layout */}
      <Show when={settingsQuery.data}>
        {/* Masonry columns layout */}
        <div class="max-w-[1600px] mx-auto">
          <style>{`
            @media (min-width: 1280px) {
              .settings-masonry {
                columns: 2;
                column-gap: 1.5rem;
              }
            }
            .settings-masonry > * {
              break-inside: avoid;
              margin-bottom: 1.5rem;
            }
            /* Remove any column rules/borders */
            .settings-masonry {
              column-rule: none;
            }
          `}</style>
          <div class="settings-masonry">
            <For each={settingsQuery.data!.groups} fallback={<div>No groups</div>}>
              {(group) => (
                <SettingGroup
                  group={group}
                  isOpen={isGroupExpanded(group.id)}
                  onToggle={(open) => handleGroupToggle(group.id, open)}
                >
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
              )}
            </For>
          </div>
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
    </>
  );
}
