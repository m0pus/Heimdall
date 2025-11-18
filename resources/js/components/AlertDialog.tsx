import { Show } from 'solid-js';
import Modal from './Modal';
import Button from './Button';

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  variant?: 'success' | 'error' | 'info' | 'warning';
  buttonText?: string;
}

export default function AlertDialog(props: AlertDialogProps) {
  const variant = props.variant || 'info';

  return (
    <Modal isOpen={props.isOpen} onClose={props.onClose} maxWidth="sm">
      <div class="text-center">
        {/* Icon */}
        <Show when={variant === 'success'}>
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </Show>

        <Show when={variant === 'error'}>
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </Show>

        <Show when={variant === 'warning'}>
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
            <svg class="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </Show>

        <Show when={variant === 'info'}>
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <svg class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </Show>

        {/* Title */}
        <Show when={props.title}>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">{props.title}</h3>
        </Show>

        {/* Message */}
        <p class="text-sm text-gray-600 mb-6 whitespace-pre-line">{props.message}</p>

        {/* Action */}
        <Button
          variant="primary"
          onClick={props.onClose}
          class="w-full"
        >
          {props.buttonText || 'OK'}
        </Button>
      </div>
    </Modal>
  );
}
