import { For } from 'solid-js';
import { t } from '@/lib/i18n';

interface SelectSettingProps {
  value: string;
  options: Record<string, string>;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function SelectSetting(props: SelectSettingProps) {
  return (
    <select
      value={props.value}
      onChange={(e) => props.onChange(e.currentTarget.value)}
      disabled={props.disabled}
      class="input w-full max-w-md"
    >
      <For each={Object.entries(props.options)}>
        {([key, label]) => (
          <option value={key}>{t(label) || label}</option>
        )}
      </For>
    </select>
  );
}
