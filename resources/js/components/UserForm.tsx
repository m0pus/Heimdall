import { createSignal, createEffect, Show, onCleanup } from 'solid-js';
import Button from './Button';
import type { User, UserFormData } from '@/types';
import { t } from '@/lib/i18n';

interface UserFormProps {
  user?: User | null;
  onSubmit: (data: UserFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  error?: string | null;
}

export default function UserForm(props: UserFormProps) {
  const [username, setUsername] = createSignal(props.user?.username ?? '');
  const [email, setEmail] = createSignal(props.user?.email ?? '');
  const [password, setPassword] = createSignal('');
  const [passwordConfirmation, setPasswordConfirmation] = createSignal('');
  const [publicFront, setPublicFront] = createSignal(props.user?.public_front ?? true);
  const [autologinAllow, setAutologinAllow] = createSignal(Boolean(props.user?.autologin));
  const [clearPassword, setClearPassword] = createSignal(false);
  const [avatarFile, setAvatarFile] = createSignal<File | null>(null);
  const [avatarPreview, setAvatarPreview] = createSignal<string | null>(props.user?.avatar_url ?? null);

  createEffect(() => {
    setUsername(props.user?.username ?? '');
    setEmail(props.user?.email ?? '');
    setPublicFront(props.user?.public_front ?? true);
    setAutologinAllow(Boolean(props.user?.autologin));
    setClearPassword(false);
    setPassword('');
    setPasswordConfirmation('');
    setAvatarFile(null);
    setAvatarPreview(props.user?.avatar_url ?? null);
  });

  const handleFileChange = (event: Event & { currentTarget: HTMLInputElement; target: HTMLInputElement }) => {
    const input = event.currentTarget;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const previewUrl = URL.createObjectURL(file);
      const previous = avatarPreview();
      if (previous?.startsWith('blob:')) {
        URL.revokeObjectURL(previous);
      }
      setAvatarFile(file);
      setAvatarPreview(previewUrl);
    }
  };

  onCleanup(() => {
    const preview = avatarPreview();
    if (preview?.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
  });

  const handleSubmit = (event: Event) => {
    event.preventDefault();

    const payload: UserFormData = {
      username: username().trim(),
      email: email().trim(),
      password: password() || undefined,
      password_confirmation: passwordConfirmation() || undefined,
      public_front: publicFront(),
      autologin_allow: autologinAllow(),
      avatar: avatarFile() ?? undefined,
      clear_password: props.user && clearPassword() ? true : undefined,
    };

    props.onSubmit(payload);
  };

  return (
    <form class="space-y-6" onSubmit={handleSubmit}>
      <Show when={props.error}>
        <div class="rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-100">
          {props.error}
        </div>
      </Show>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">
            {t('app.user.username')}
          </label>
          <input
            type="text"
            required
            value={username()}
            onInput={(e) => setUsername(e.currentTarget.value)}
            class="input"
            placeholder="heimdall"
          />
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">
            {t('app.user.email')}
          </label>
          <input
            type="email"
            required
            value={email()}
            onInput={(e) => setEmail(e.currentTarget.value)}
            class="input"
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">
            {t('app.apps.password')}
          </label>
          <input
            type="password"
            value={password()}
            onInput={(e) => setPassword(e.currentTarget.value)}
            class="input"
            placeholder={props.user ? '••••••••' : 'Choose a password'}
          />
          <p class="text-xs text-gray-500">
            {props.user
              ? 'Leave blank to keep the current password.'
              : 'Optional. If omitted the user can log in without a password.'}
          </p>
        </div>

        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">
            {t('app.user.password_confirm')}
          </label>
          <input
            type="password"
            value={passwordConfirmation()}
            onInput={(e) => setPasswordConfirmation(e.currentTarget.value)}
            class="input"
            placeholder={t('app.user.password_confirm')}
          />
        </div>
      </div>

      <Show when={props.user}>
        <div class="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
          <input
            type="checkbox"
            id="clear_password"
            checked={clearPassword()}
            onChange={(e) => setClearPassword(e.currentTarget.checked)}
            class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label for="clear_password" class="text-sm text-gray-700">
            Remove password and allow passwordless access
          </label>
        </div>
      </Show>

      <div class="space-y-3">
        <label class="block text-sm font-medium text-gray-700">
          {t('app.user.avatar')}
        </label>
        <div class="flex items-center gap-4">
          <div class="h-20 w-20 overflow-hidden rounded-full bg-gray-100">
            <Show when={avatarPreview()} fallback={<div class="h-full w-full bg-gray-200" /> }>
              {(src) => (
                <img src={src()} alt="Avatar preview" class="h-full w-full object-cover" />
              )}
            </Show>
          </div>
          <div class="space-y-2">
            <label class="inline-flex cursor-pointer rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
              <input type="file" accept="image/*" class="hidden" onChange={handleFileChange} />
              {t('app.buttons.upload')}
            </label>
            <Show when={avatarPreview()}>
              <button
                type="button"
                class="block text-sm text-red-600 hover:underline"
                onClick={() => {
                  const preview = avatarPreview();
                  if (preview?.startsWith('blob:')) {
                    URL.revokeObjectURL(preview);
                  }
                  setAvatarFile(null);
                  setAvatarPreview(props.user?.avatar_url ?? null);
                }}
              >
                Clear selection
              </button>
            </Show>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <ToggleField
          label="Public dashboard access"
          description={t('app.user.secure_front')}
          checked={publicFront()}
          onChange={setPublicFront}
        />

        <ToggleField
          label="Autologin link"
          description={t('app.user.autologin')}
          checked={autologinAllow()}
          onChange={setAutologinAllow}
        />

        <Show when={props.user?.autologin && autologinAllow()}>
          <div class="rounded-md bg-gray-50 p-4 text-sm text-gray-600">
            <p class="font-medium text-gray-800">Autologin URL</p>
            <a
              href={props.user!.autologin_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              class="break-all text-primary-600 hover:underline"
            >
              {props.user!.autologin_url}
            </a>
          </div>
        </Show>
      </div>

      <div class="flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={props.onCancel}
          disabled={props.isSubmitting}
        >
          {t('app.buttons.cancel')}
        </Button>
        <Button type="submit" variant="primary" isLoading={props.isSubmitting}>
          {t('app.buttons.save')}
        </Button>
      </div>
    </form>
  );
}

interface ToggleFieldProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleField(props: ToggleFieldProps) {
  return (
    <div class="flex items-start justify-between rounded-lg border border-gray-200 p-4">
      <div>
        <p class="text-sm font-medium text-gray-900">{props.label}</p>
        <Show when={props.description}>
          <p class="mt-1 text-sm text-gray-500">{props.description}</p>
        </Show>
      </div>
      <label class="relative inline-flex cursor-pointer items-center">
        <input
          type="checkbox"
          class="peer sr-only"
          checked={props.checked}
          onChange={(e) => props.onChange(e.currentTarget.checked)}
        />
        <div class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary-600 peer-checked:after:translate-x-full"></div>
      </label>
    </div>
  );
}
