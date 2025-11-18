import { Show } from 'solid-js';
import Modal from './Modal';
import Button from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
}

export default function ConfirmDialog(props: ConfirmDialogProps) {
  const handleConfirm = () => {
    props.onConfirm();
    props.onClose();
  };

  const variantStyles = {
    danger: 'text-red-600',
    warning: 'text-yellow-600',
    primary: 'text-blue-600',
  };

  const buttonVariants = {
    danger: 'danger' as const,
    warning: 'warning' as const,
    primary: 'primary' as const,
  };

  const variant = props.variant || 'primary';

  return (
    <Modal isOpen={props.isOpen} onClose={props.onClose} maxWidth="sm">
      <div class="text-center">
        {/* Icon */}
        <Show when={props.variant === 'danger'}>
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </Show>

        <Show when={props.variant === 'warning'}>
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
            <svg class="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </Show>

        <Show when={!props.variant || props.variant === 'primary'}>
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
        <p class="text-sm text-gray-600 mb-6">{props.message}</p>

        {/* Actions */}
        <div class="flex gap-3 justify-center">
          <Button
            variant="secondary"
            onClick={props.onClose}
          >
            {props.cancelText || 'Cancel'}
          </Button>
          <Button
            variant={buttonVariants[variant]}
            onClick={handleConfirm}
          >
            {props.confirmText || 'Confirm'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
