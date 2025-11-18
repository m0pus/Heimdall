import { Show, JSX, createEffect } from 'solid-js';
import { Portal } from 'solid-js/web';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: JSX.Element;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Modal(props: ModalProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  // Handle escape key
  createEffect(() => {
    if (props.isOpen) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          props.onClose();
        }
      };
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  });

  return (
    <Show when={props.isOpen}>
      <Portal>
        {/* Backdrop */}
        <div
          class="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
          onClick={props.onClose}
        />

        {/* Modal */}
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div
            class={`bg-white rounded-lg shadow-xl ${maxWidthClasses[props.maxWidth || 'md']} w-full pointer-events-auto transform transition-all`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <Show when={props.title}>
              <div class="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 class="text-xl font-semibold text-gray-900">{props.title}</h3>
                <button
                  onClick={props.onClose}
                  class="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </Show>

            {/* Content */}
            <div class="p-6">
              {props.children}
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
}
