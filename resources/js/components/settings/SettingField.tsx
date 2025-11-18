import { Show, createMemo, Switch, Match } from 'solid-js';
import type { Setting } from '@/types';
import TextSetting from './TextSetting';
import SelectSetting from './SelectSetting';
import BooleanSetting from './BooleanSetting';
import ImageSetting from './ImageSetting';
import TextareaSetting from './TextareaSetting';
import { t } from '@/lib/i18n';

interface SettingFieldProps {
  setting: Setting;
  onUpdate: (value: any) => void;
  isLoading?: boolean;
}

export default function SettingField(props: SettingFieldProps) {
  // Get the setting value
  const value = createMemo(() => props.setting.value);

  // Check if this is a system setting (read-only)
  const isReadOnly = createMemo(() => props.setting.system === 1);

  // Parse options for select type
  const options = createMemo(() => {
    if (props.setting.type !== 'select' || !props.setting.options) {
      return {};
    }
    try {
      return JSON.parse(props.setting.options);
    } catch {
      return {};
    }
  });

  // Reactive label translation
  const translatedLabel = createMemo(() => t(props.setting.label) || props.setting.label);

  // Reactive read-only badge text
  const readOnlyText = createMemo(() => t('app.settings.label') || 'Read-only');

  return (
    <div class="py-2 border-b border-gray-100 last:border-0">
      <div class="flex-1 min-w-0">
        {/* Label with badges */}
        <div class="flex items-center gap-2 mb-1">
          <label class="text-sm font-medium text-gray-700">
            {translatedLabel()}
          </label>

          {/* Read-only badge */}
          <Show when={isReadOnly()}>
            <span class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {readOnlyText()}
            </span>
          </Show>
        </div>

          {/* Field based on type */}
          <Switch>
            <Match when={props.setting.type === 'text'}>
              <TextSetting
                value={value() || ''}
                onChange={props.onUpdate}
                disabled={isReadOnly() || props.isLoading}
              />
            </Match>

            <Match when={props.setting.type === 'select'}>
              <SelectSetting
                value={value() || ''}
                options={options()}
                onChange={props.onUpdate}
                disabled={isReadOnly() || props.isLoading}
              />
            </Match>

            <Match when={props.setting.type === 'boolean'}>
              <BooleanSetting
                value={value() === '1' || value() === 'true'}
                onChange={(checked) => props.onUpdate(checked ? '1' : '0')}
                disabled={isReadOnly() || props.isLoading}
              />
            </Match>

            <Match when={props.setting.type === 'image'}>
              <ImageSetting
                value={value()}
                settingId={props.setting.id}
                onChange={props.onUpdate}
                disabled={isReadOnly() || props.isLoading}
              />
            </Match>

            <Match when={props.setting.type === 'textarea'}>
              <TextareaSetting
                value={value() || ''}
                onChange={props.onUpdate}
                disabled={isReadOnly() || props.isLoading}
                placeholder={`Enter ${props.setting.label.toLowerCase()}...`}
              />
            </Match>
          </Switch>
      </div>
    </div>
  );
}
