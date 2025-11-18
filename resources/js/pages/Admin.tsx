import { createMemo, Match, Switch, createSignal, createEffect, JSX } from 'solid-js';
import { useLocation } from '@solidjs/router';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminTabs, { type TabItem } from '@/components/admin/AdminTabs';
import SettingsSection from '@/components/admin/SettingsSection';
import UsersSection from '@/components/admin/UsersSection';
import { t } from '@/lib/i18n';

export default function Admin() {
  const location = useLocation();
  const [headerActions, setHeaderActions] = createSignal<JSX.Element | undefined>(undefined);

  // Determine active tab based on current route
  const activeTab = createMemo(() => {
    if (location.pathname === '/users') return 'users';
    return 'settings';
  });

  // Clear header actions when switching tabs
  createEffect(() => {
    activeTab(); // Track tab changes
    setHeaderActions(undefined);
  });

  const tabs: TabItem[] = [
    {
      id: 'settings',
      label: t('app.dashboard.settings') || 'Settings',
      href: '/settings',
      icon: (
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      id: 'users',
      label: t('app.user.user_list') || 'Users',
      href: '/users',
      icon: (
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
  ];

  return (
    <AdminLayout
      title={t('app.dashboard.settings') || 'Administration'}
      description="Manage system settings, users, and application configuration"
      headerActions={headerActions()}
    >
      <AdminTabs
        tabs={tabs}
        activeTab={activeTab()}
      />

      <Switch>
        <Match when={activeTab() === 'settings'}>
          <SettingsSection onHeaderActionsChange={setHeaderActions} />
        </Match>
        <Match when={activeTab() === 'users'}>
          <UsersSection />
        </Match>
      </Switch>
    </AdminLayout>
  );
}
