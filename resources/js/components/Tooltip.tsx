import { Show, createSignal, onCleanup, JSX } from 'solid-js';
import { Portal } from 'solid-js/web';
import { logger } from '@/lib/logger';

interface TooltipProps {
  content: string | null | undefined;
  children: JSX.Element;
  disabled?: boolean;
}

/**
 * Tooltip Component - Modern, accessible tooltip
 *
 * Features:
 * - Desktop: Shows on hover
 * - Mobile: Shows on tap (with auto-dismiss)
 * - Keyboard accessible
 * - Portal-based positioning
 * - Glass-morphism design matching tiles
 */
export default function Tooltip(props: TooltipProps) {
  const [isVisible, setIsVisible] = createSignal(false);
  const [position, setPosition] = createSignal({ top: 0, left: 0 });
  let triggerRef: HTMLDivElement | undefined;
  let hideTimeout: number | undefined;

  // Don't show if no content or disabled
  const hasContent = () => props.content && props.content.trim().length > 0;
  const shouldShow = () => !props.disabled && hasContent();

  const updatePosition = () => {
    if (!triggerRef) return;

    const rect = triggerRef.getBoundingClientRect();
    const scrollY = window.scrollY || window.pageYOffset;
    const scrollX = window.scrollX || window.pageXOffset;

    // Position tooltip above the element, centered
    setPosition({
      top: rect.top + scrollY - 8, // 8px gap above element
      left: rect.left + scrollX + rect.width / 2, // Center horizontally
    });
  };

  const show = () => {
    logger.debug('Tooltip', 'show() called', {
      content: props.content?.substring(0, 50) + '...',
      disabled: props.disabled,
      shouldShow: shouldShow(),
      hasContent: hasContent()
    });

    if (!shouldShow()) {
      logger.debug('Tooltip', 'Not showing - shouldShow() returned false');
      return;
    }

    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = undefined;
    }

    updatePosition();
    setIsVisible(true);
    logger.debug('Tooltip', 'Visible set to true', { position: position() });
  };

  const hide = (immediate = false) => {
    if (immediate) {
      setIsVisible(false);
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = undefined;
      }
    } else {
      // Small delay for better UX
      hideTimeout = window.setTimeout(() => {
        setIsVisible(false);
      }, 150);
    }
  };

  // Handle mobile tap
  const handleTap = (e: MouseEvent | TouchEvent) => {
    if (!shouldShow()) return;

    // Prevent default to avoid triggering the link on mobile
    if (isVisible()) {
      hide(true);
    } else {
      e.preventDefault();
      e.stopPropagation();
      show();

      // Auto-hide on mobile after 3 seconds
      setTimeout(() => {
        if (isVisible()) {
          hide(true);
        }
      }, 3000);
    }
  };

  // Clean up on unmount
  onCleanup(() => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
    }
  });

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={() => hide(false)}
        class="tooltip-trigger"
      >
        {props.children}
      </div>

      <Show when={isVisible() && hasContent()}>
        <Portal>
          <div
            class="tooltip"
            style={{
              top: `${position().top}px`,
              left: `${position().left}px`,
            }}
            role="tooltip"
          >
            <div class="tooltip-arrow" />
            <div class="tooltip-content">
              {props.content}
            </div>
          </div>
        </Portal>
      </Show>
    </>
  );
}
