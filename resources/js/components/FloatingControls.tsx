import { Show, createSignal } from 'solid-js';
import { A } from '@solidjs/router';
import Button from '@/components/Button';
import { t } from '@/lib/i18n';

interface FloatingControlsProps {
  editMode: boolean;
  onToggleEdit: () => void;
  onAdd: () => void;
  onDownloadApps: () => void;
  isDownloading: boolean;
}

export default function FloatingControls(props: FloatingControlsProps) {
  const [menuOpen, setMenuOpen] = createSignal(false);

  const toggleMenu = () => setMenuOpen(!menuOpen());
  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      {/* Desktop: Individual buttons in bottom-right corner */}
      <div class="hidden md:flex fixed bottom-6 right-6 gap-2 z-40 flex-col items-end">
        {/* Settings Button */}
        <A href="/settings">
          <Button
            variant="secondary"
            size="sm"
            class="shadow-lg hover:shadow-xl transition-shadow"
            title="Settings"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Button>
        </A>

        {/* Users Button */}
        <A href="/users">
          <Button
            variant="secondary"
            size="sm"
            class="shadow-lg hover:shadow-xl transition-shadow"
            title={t('app.user.user_list')}
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M5.121 17.804A15.941 15.941 0 0112 16c2.5 0 4.847.576 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 14a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </Button>
        </A>

        {/* Download Apps Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={props.onDownloadApps}
          isLoading={props.isDownloading}
          class="shadow-lg hover:shadow-xl transition-shadow"
          title="Download/update enhanced apps"
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
        </Button>

        {/* Edit/Done Button */}
        <Button
          variant={props.editMode ? "success" : "secondary"}
          size="sm"
          onClick={props.onToggleEdit}
          class="shadow-lg hover:shadow-xl transition-shadow"
          title={props.editMode ? "Done editing" : "Edit dashboard"}
        >
          <Show
            when={props.editMode}
            fallback={
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            }
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M5 13l4 4L19 7" />
            </svg>
          </Show>
        </Button>

        {/* Add Button (only in edit mode) */}
        <Show when={props.editMode}>
          <Button
            variant="primary"
            size="sm"
            onClick={props.onAdd}
            class="shadow-lg hover:shadow-xl transition-shadow"
            title="Add new item"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M12 4v16m8-8H4" />
            </svg>
          </Button>
        </Show>
      </div>

      {/* Mobile: Collapsible cog menu */}
      <div class="md:hidden fixed bottom-6 right-6 z-40">
        {/* Menu items (shown when open) */}
        <Show when={menuOpen()}>
          <div class="absolute bottom-16 right-0 flex flex-col gap-2 items-end mb-2">
            {/* Add Button (only in edit mode) */}
            <Show when={props.editMode}>
              <Button
                variant="primary"
                size="sm"
                onClick={() => { props.onAdd(); closeMenu(); }}
                class="shadow-lg"
                title="Add new item"
              >
                <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M12 4v16m8-8H4" />
                </svg>
                Add
              </Button>
            </Show>

            {/* Edit/Done Button */}
            <Button
              variant={props.editMode ? "success" : "secondary"}
              size="sm"
              onClick={() => { props.onToggleEdit(); closeMenu(); }}
              class="shadow-lg"
              title={props.editMode ? "Done editing" : "Edit dashboard"}
            >
              <Show
                when={props.editMode}
                fallback={
                  <>
                    <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </>
                }
              >
                <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M5 13l4 4L19 7" />
                </svg>
                Done
              </Show>
            </Button>

            {/* Download Apps Button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { props.onDownloadApps(); closeMenu(); }}
              isLoading={props.isDownloading}
              class="shadow-lg"
              title="Download/update enhanced apps"
            >
              <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Download Apps
            </Button>

            {/* Settings Button */}
            <A href="/settings">
              <Button
                variant="secondary"
                size="sm"
                class="shadow-lg"
                title="Settings"
              >
                <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </Button>
            </A>

            {/* Users Button */}
            <A href="/users">
              <Button
                variant="secondary"
                size="sm"
                class="shadow-lg"
                title={t('app.user.user_list')}
              >
                <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M5.121 17.804A15.941 15.941 0 0112 16c2.5 0 4.847.576 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 14a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {t('app.user.user_list')}
              </Button>
            </A>
          </div>
        </Show>

        {/* Main cog button */}
        <Button
          variant="secondary"
          size="md"
          onClick={toggleMenu}
          class="shadow-lg hover:shadow-xl rounded-full h-14 w-14 p-0"
          classList={{ 'rotate-90 transition-transform duration-200': menuOpen() }}
          title="Menu"
        >
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </Button>
      </div>

      {/* Backdrop for mobile menu */}
      <Show when={menuOpen()}>
        <div
          class="md:hidden fixed inset-0 bg-black bg-opacity-20 z-30"
          onClick={closeMenu}
        />
      </Show>
    </>
  );
}
