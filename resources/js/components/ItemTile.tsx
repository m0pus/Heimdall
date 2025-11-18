import { Show, For, createMemo } from 'solid-js';
import { cn, getIconUrl, getContrastColor, formatUrl, formatRelativeTime } from '@/lib/utils';
import Tooltip from './Tooltip';
import type { Item } from '@/types';

interface ItemTileProps {
  item: Item;
  editMode: boolean;
  onEdit?: (item: Item) => void;
  onDelete?: (item: Item) => void;
  onRefresh?: (item: Item) => void;
  onTogglePin?: (item: Item) => void;
}

/**
 * ItemTile Component - Modern, mobile-friendly application tile
 *
 * Features:
 * - Heimdall-inspired glass-morphism design
 * - Responsive sizing (mobile to desktop)
 * - Animated hover states
 * - Enhanced app stats display
 * - Touch-friendly interactions
 * - Pinned indicator
 * - Edit mode actions (pin, refresh, delete)
 */
export default function ItemTile(props: ItemTileProps) {
  const backgroundColor = () => props.item.colour || '#3b82f6';
  const textColor = () => getContrastColor(backgroundColor());
  const iconUrl = () => getIconUrl(props.item.icon);
  const showPinButton = () => props.editMode || props.item.pinned;
  const isStickyPin = () => props.item.pinned && !props.editMode;

  // Check if we have stats to display
  const hasStats = createMemo(() => {
    return props.item.enhanced && props.item.stats && Object.keys(props.item.stats).length > 0;
  });

  const enhancedStatus = createMemo(() => (props.item.enhanced_status || (props.item.enhanced ? 'unknown' : null))?.toLowerCase());
  const statusLabel = createMemo(() => {
    switch (enhancedStatus()) {
      case 'active':
        return 'Online';
      case 'inactive':
        return 'Offline';
      case 'error':
        return 'Error';
      default:
        return props.item.enhanced ? 'Waiting for data' : null;
    }
  });
  const statusDotClass = createMemo(() => {
    switch (enhancedStatus()) {
      case 'active':
        return 'bg-green-400';
      case 'inactive':
        return 'bg-gray-400';
      case 'error':
        return 'bg-red-400';
      default:
        return 'bg-amber-400';
    }
  });
  const lastUpdatedText = createMemo(() =>
    props.item.enhanced_last_polled_at ? formatRelativeTime(props.item.enhanced_last_polled_at) : null
  );

  const handleClick = (e: MouseEvent) => {
    if (props.editMode) {
      e.preventDefault();
      props.onEdit?.(props.item);
    }
  };

  return (
    <div
      class={cn(
        'tile-container group relative',
        props.editMode && 'edit-mode'
      )}
      data-id={props.item.id}
    >
      {/* Main Tile with Tooltip */}
      <Tooltip content={props.item.appdescription} disabled={props.editMode}>
        <a
          href={formatUrl(props.item.url)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          class="tile"
          style={{
            'background-color': backgroundColor(),
            color: textColor(),
          }}
        >
        {/* Decorative Circle (Heimdall style) */}
        <div class="tile-circle" />

        {/* Content Container */}
        <div class="tile-content">
          {/* Icon */}
          <Show when={iconUrl()} fallback={
            <div class="tile-icon-placeholder">
              <svg class="w-10 h-10 sm:w-12 sm:h-12" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
              </svg>
            </div>
          }>
            <div class="tile-icon">
              <img
                src={iconUrl()}
                alt={props.item.title}
                class="w-full h-full object-contain"
                loading="lazy"
              />
            </div>
          </Show>

          {/* Title and Stats */}
          <div class="tile-text-content">
            {/* Title */}
            <h3 class="tile-title">
              {props.item.title}
            </h3>

            <Show when={props.item.enhanced && statusLabel()}>
              <div class="tile-enhanced-status">
                <span class={cn('tile-status-dot', statusDotClass())} aria-hidden="true" />
                <span class="tile-status-label">{statusLabel()}</span>
                <Show when={lastUpdatedText()}>
                  <span class="tile-status-updated">Updated {lastUpdatedText()}</span>
                </Show>
              </div>
            </Show>

            <Show when={props.item.enhanced_status === 'error'}>
              <p class="tile-enhanced-error">
                {props.item.enhanced_error || 'Unable to fetch stats'}
              </p>
            </Show>

            {/* Enhanced App Stats */}
            <Show when={hasStats()}>
              <div class="tile-stats" innerHTML={props.item.stats?.html || ''} />
            </Show>
          </div>
        </div>

        {/* Link Icon (bottom right) */}
        <div class="tile-link-icon">
          <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </div>
      </a>
      </Tooltip>

      <Show when={showPinButton()}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!props.editMode) return;
            props.onTogglePin?.(props.item);
          }}
          class={cn(
            'tile-pin-button tile-action-btn',
            isStickyPin() && 'tile-pin-button--sticky'
          )}
          title={props.item.pinned ? 'Unpin item' : 'Pin item'}
          aria-label={props.item.pinned ? 'Unpin' : 'Pin'}
          aria-hidden={!props.editMode ? 'true' : undefined}
          tabIndex={props.editMode ? 0 : -1}
        >
          <svg
            class="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 384 512"
            style={{ opacity: props.item.pinned ? 1 : 0.5 }}
          >
            <path d="M32 32C32 14.3 46.3 0 64 0H320c17.7 0 32 14.3 32 32s-14.3 32-32 32H290.5l11.4 148.2c36.7 19.9 65.7 53.2 79.5 94.7l1 3c3.3 9.8 1.6 20.5-4.4 28.8s-15.7 13.3-26 13.3H32c-10.3 0-19.9-4.9-26-13.3s-7.7-19.1-4.4-28.8l1-3c13.8-41.5 42.8-74.8 79.5-94.7L93.5 64H64C46.3 64 32 49.7 32 32zM160 384h64v96c0 17.7-14.3 32-32 32s-32-14.3-32-32V384z"/>
          </svg>
        </button>
      </Show>

      {/* Hover-triggered Refresh Button (Enhanced Apps Only, Non-Edit Mode) */}
      <Show when={props.item.enhanced && !props.editMode}>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('[ItemTile] Refresh button clicked for item:', {
              id: props.item.id,
              title: props.item.title,
              enhanced: props.item.enhanced,
              class: props.item.class,
            });
            props.onRefresh?.(props.item);
          }}
          class="tile-hover-refresh-button tile-action-btn"
          style={{
            top: props.item.pinned ? '3rem' : '0.5rem'
          }}
          title="Refresh stats"
          aria-label="Refresh stats"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </Show>

      {/* Edit Mode Actions */}
      <Show when={props.editMode}>
        <div class="tile-actions">
          {/* Refresh Button (Enhanced Apps Only) */}
          <Show when={props.item.enhanced}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                props.onRefresh?.(props.item);
              }}
              class="tile-action-btn"
              title="Refresh stats"
              aria-label="Refresh stats"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </Show>

          {/* Delete Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              props.onDelete?.(props.item);
            }}
            class="tile-action-btn tile-action-btn-delete"
            title="Delete item"
            aria-label="Delete"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </Show>
    </div>
  );
}
