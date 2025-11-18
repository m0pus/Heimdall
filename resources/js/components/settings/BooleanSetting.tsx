interface BooleanSettingProps {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export default function BooleanSetting(props: BooleanSettingProps) {
  return (
    <label class="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={props.value}
        onChange={(e) => props.onChange(e.currentTarget.checked)}
        disabled={props.disabled}
        class="sr-only peer"
      />
      <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
      <span class="ml-3 text-sm font-medium text-gray-700">
        {props.value ? 'Enabled' : 'Disabled'}
      </span>
    </label>
  );
}
