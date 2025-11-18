import { Show, createSignal } from 'solid-js';
import { createUploadImageMutation, createDeleteImageMutation } from '@/queries/settings';

interface ImageSettingProps {
  value: string | null;
  settingId: number;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function ImageSetting(props: ImageSettingProps) {
  const [dragOver, setDragOver] = createSignal(false);
  const uploadMutation = createUploadImageMutation();
  const deleteMutation = createDeleteImageMutation();

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    uploadMutation.mutate({ id: props.settingId, file });
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this image?')) {
      deleteMutation.mutate(props.settingId);
    }
  };

  return (
    <div class="space-y-3">
      {/* Preview */}
      <Show when={props.value}>
        <div class="relative inline-block">
          <img
            src={`/storage/${props.value}`}
            alt="Setting preview"
            class="max-w-sm max-h-48 rounded border border-gray-200"
          />
          <button
            type="button"
            onClick={handleDelete}
            disabled={props.disabled || deleteMutation.isPending}
            class="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded shadow-lg transition-colors disabled:opacity-50"
            title="Delete image"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </Show>

      {/* Upload area */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        class="relative"
      >
        <label
          class="flex flex-col items-center justify-center w-full max-w-md h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors"
          classList={{
            'border-gray-300 bg-gray-50 hover:bg-gray-100': !dragOver() && !props.disabled,
            'border-blue-500 bg-blue-50': dragOver(),
            'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50': props.disabled,
          }}
        >
          <div class="flex flex-col items-center justify-center pt-5 pb-6">
            <svg class="w-8 h-8 mb-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p class="mb-1 text-sm text-gray-500">
              <span class="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p class="text-xs text-gray-500">PNG, JPG or SVG (max 5MB)</p>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.currentTarget.files?.[0];
              if (file) handleFileSelect(file);
            }}
            disabled={props.disabled}
            class="hidden"
          />
        </label>

        {/* Loading overlay */}
        <Show when={uploadMutation.isPending}>
          <div class="absolute inset-0 flex items-center justify-center bg-white/75 rounded-lg">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </Show>
      </div>
    </div>
  );
}
