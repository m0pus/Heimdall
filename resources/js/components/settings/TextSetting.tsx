import { createSignal, createEffect, onCleanup } from 'solid-js';

interface TextSettingProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function TextSetting(props: TextSettingProps) {
  // Local state for the input to prevent focus loss
  const [localValue, setLocalValue] = createSignal(props.value);
  let debounceTimeout: number | undefined;

  // Update local value when prop changes (from external source)
  createEffect(() => {
    setLocalValue(props.value);
  });

  const handleInput = (e: InputEvent) => {
    const newValue = (e.currentTarget as HTMLInputElement).value;
    setLocalValue(newValue);

    // Clear existing timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    // Debounce the onChange call (500ms)
    debounceTimeout = setTimeout(() => {
      props.onChange(newValue);
    }, 500) as unknown as number;
  };

  // Cleanup timeout on unmount
  onCleanup(() => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
  });

  return (
    <input
      type="text"
      value={localValue()}
      onInput={handleInput}
      disabled={props.disabled}
      placeholder={props.placeholder}
      class="input w-full max-w-md"
    />
  );
}
