import { For, Show, createMemo, createSignal } from 'solid-js';
import { A } from '@solidjs/router';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import AlertDialog from '@/components/AlertDialog';
import UserForm from '@/components/UserForm';
import { createUsersQuery, createCreateUserMutation, createUpdateUserMutation, createDeleteUserMutation } from '@/queries/users';
import type { User, UserFormData } from '@/types';
import { t } from '@/lib/i18n';

export default function Users() {
  const usersQuery = createUsersQuery();
  const createUserMutation = createCreateUserMutation();
  const updateUserMutation = createUpdateUserMutation();
  const deleteUserMutation = createDeleteUserMutation();

  const [isFormOpen, setFormOpen] = createSignal(false);
  const [editingUser, setEditingUser] = createSignal<User | null>(null);
  const [formError, setFormError] = createSignal<string | null>(null);
  const [userToDelete, setUserToDelete] = createSignal<User | null>(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = createSignal(false);
  const [alertOpen, setAlertOpen] = createSignal(false);
  const [alertConfig, setAlertConfig] = createSignal({
    variant: 'info' as 'success' | 'error' | 'info' | 'warning',
    title: '',
    message: '',
  });

  const isSubmitting = () => createUserMutation.isPending || updateUserMutation.isPending;

  const users = createMemo(() => usersQuery.data || []);

  const openCreateForm = () => {
    setEditingUser(null);
    setFormError(null);
    setFormOpen(true);
  };

  const openEditForm = (user: User) => {
    setEditingUser(user);
    setFormError(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setFormError(null);
  };

  const extractErrorMessage = (error: any): string => {
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }
    const errors = error?.response?.data?.errors;
    if (errors) {
      const firstKey = Object.keys(errors)[0];
      if (firstKey) {
        return errors[firstKey][0];
      }
    }
    return 'Something went wrong. Please try again.';
  };

  const showAlert = (variant: 'success' | 'error' | 'info' | 'warning', message: string, title?: string) => {
    setAlertConfig({
      variant,
      message,
      title: title || (variant === 'error' ? 'Error' : 'Success'),
    });
    setAlertOpen(true);
  };

  const handleFormSubmit = (data: UserFormData) => {
    setFormError(null);
    if (editingUser()) {
      updateUserMutation.mutate(
        { id: editingUser()!.id, data },
        {
          onSuccess: () => {
            showAlert('success', t('app.alert.success.user_updated'));
            closeForm();
          },
          onError: (error) => {
            setFormError(extractErrorMessage(error));
          },
        }
      );
    } else {
      createUserMutation.mutate(data, {
        onSuccess: () => {
          showAlert('success', t('app.alert.success.user_created'));
          closeForm();
        },
        onError: (error) => {
          setFormError(extractErrorMessage(error));
        },
      });
    }
  };

  const confirmDelete = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    const target = userToDelete();
    if (!target) return;

    deleteUserMutation.mutate(target.id, {
      onSuccess: () => {
        showAlert('success', t('app.alert.success.user_deleted'));
      },
      onError: (error) => {
        showAlert('error', extractErrorMessage(error), 'Unable to delete user');
      },
    });
  };

  return (
    <div class="min-h-screen bg-gray-50">
      <header class="bg-white shadow-sm">
        <div class="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="text-sm uppercase tracking-wide text-gray-500">Administration</p>
            <h1 class="text-3xl font-bold text-gray-900">{t('app.user.user_list')}</h1>
            <p class="mt-1 text-sm text-gray-500">Manage all dashboard users, avatars, and secure access.</p>
          </div>
          <div class="flex flex-wrap gap-3">
            <A href="/">
              <Button variant="secondary">Back to dashboard</Button>
            </A>
            <Button onClick={openCreateForm}>
              <svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('app.user.add_user')}
            </Button>
          </div>
        </div>
      </header>

      <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Show when={usersQuery.isError}>
          <div class="mb-6 rounded-md border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            Unable to load users. Please refresh and try again.
          </div>
        </Show>
        <Show
          when={!usersQuery.isLoading}
          fallback={
            <div class="flex h-64 items-center justify-center rounded-lg bg-white shadow">
              <div class="text-center">
                <svg class="mx-auto h-10 w-10 animate-spin text-primary-600" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p class="mt-4 text-sm text-gray-500">Loading users…</p>
              </div>
            </div>
          }
        >
          <Show
            when={users().length > 0}
            fallback={
              <div class="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm">
                <h3 class="text-lg font-semibold text-gray-900">No users yet</h3>
                <p class="mt-2 text-sm text-gray-500">Add your first user to start managing access.</p>
                <Button class="mt-6" onClick={openCreateForm}>
                  {t('app.user.add_user')}
                </Button>
              </div>
            }
          >
            <div class="overflow-hidden rounded-lg bg-white shadow">
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">User</th>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('app.apps.password')}</th>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Public access</th>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('app.apps.autologin_url')}</th>
                      <th scope="col" class="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100 bg-white">
                    <For each={users()}>
                      {(user) => (
                        <tr>
                          <td class="whitespace-nowrap px-6 py-4">
                            <div class="flex items-center gap-3">
                              <div class="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
                                <Show when={user.avatar_url} fallback={<div class="h-full w-full bg-gray-200" /> }>
                                  {(src) => (
                                    <img src={src()} alt={user.username} class="h-full w-full object-cover" />
                                  )}
                                </Show>
                              </div>
                              <div>
                                <p class="text-sm font-semibold text-gray-900">{user.username}</p>
                                <p class="text-sm text-gray-500">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td class="px-6 py-4">
                            <span class={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${user.has_password ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                              {user.has_password ? 'Set' : 'Passwordless'}
                            </span>
                          </td>
                          <td class="px-6 py-4">
                            <span class={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${user.public_front ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                              {user.public_front ? 'Allowed' : 'Restricted'}
                            </span>
                          </td>
                          <td class="max-w-xs px-6 py-4">
                            <Show when={user.autologin_url} fallback={<span class="text-xs text-gray-400">Disabled</span>}>
                              {(url) => (
                                <div class="space-y-1">
                                  <a href={url()} class="break-all text-sm text-primary-600 hover:underline" target="_blank" rel="noopener noreferrer">
                                    {url()}
                                  </a>
                                  <button
                                    type="button"
                                    class="text-xs font-medium text-gray-500 hover:text-gray-900"
                                    onClick={async () => {
                                      try {
                                        await navigator.clipboard.writeText(url());
                                        showAlert('info', 'Autologin URL copied to clipboard', 'Copied');
                                      } catch (error) {
                                        showAlert('error', 'Unable to copy URL. Copy it manually.', 'Clipboard error');
                                      }
                                    }}
                                  >
                                    Copy link
                                  </button>
                                </div>
                              )}
                            </Show>
                          </td>
                          <td class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                            <div class="flex justify-end gap-3">
                             <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => openEditForm(user)}
                              >
                                {t('app.settings.edit')}
                              </Button>
                              <Button
                                type="button"
                                variant="danger"
                                size="sm"
                                disabled={!user.can_delete}
                                onClick={() => confirmDelete(user)}
                              >
                                {t('app.delete')}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
            </div>
          </Show>
        </Show>
      </main>

      <Modal
        isOpen={isFormOpen()}
        onClose={closeForm}
        maxWidth="xl"
        title={editingUser() ? t('app.settings.edit') + ' ' + editingUser()!.username : t('app.user.add_user')}
      >
        <UserForm
          user={editingUser()}
          onSubmit={handleFormSubmit}
          onCancel={closeForm}
          isSubmitting={isSubmitting()}
          error={formError()}
        />
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen()}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete user"
        message="This action will permanently remove the user. This cannot be undone."
        confirmText={t('app.delete')}
        cancelText={t('app.buttons.cancel')}
        variant="danger"
      />

      <AlertDialog
        isOpen={alertOpen()}
        onClose={() => setAlertOpen(false)}
        title={alertConfig().title}
        message={alertConfig().message}
        variant={alertConfig().variant}
      />
    </div>
  );
}
