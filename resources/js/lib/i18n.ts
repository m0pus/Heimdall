import { createSignal, createEffect, createMemo } from 'solid-js';
import { makePersisted } from '@solid-primitives/storage';
import apiClient from '@/api/client';

interface TranslationData {
  locale: string;
  translations: Record<string, Record<string, string>>;
}

// Global translation state
const [translations, setTranslations] = createSignal<Record<string, Record<string, string>>>({});
const [currentLocale, setCurrentLocale] = makePersisted(createSignal<string>('en'), {
  name: 'heimdall_locale',
});
const [isLoading, setIsLoading] = createSignal(true);

/**
 * Initialize translations by fetching from API
 */
export async function initTranslations(locale?: string) {
  try {
    setIsLoading(true);
    const targetLocale = locale || currentLocale();

    const response = await apiClient.get<{ status: string; data: TranslationData }>(
      `/api/translations/${targetLocale}`
    );

    if (response.data.status === 'success') {
      setTranslations(response.data.data.translations);
      setCurrentLocale(response.data.data.locale);
    }
  } catch (error) {
    console.error('Failed to load translations:', error);
    // Fallback to English
    if (locale !== 'en') {
      await initTranslations('en');
    }
  } finally {
    setIsLoading(false);
  }
}

/**
 * Internal translation logic (non-reactive)
 */
function translateInternal(trans: Record<string, Record<string, string>>, key: string, replacements?: Record<string, string>): string {
  // Split key into namespace and path
  const parts = key.split('.');
  const namespace = parts[0];
  const path = parts.slice(1).join('.');

  // Get translation
  let value: string | undefined;

  if (trans[namespace] && trans[namespace][path]) {
    value = trans[namespace][path];
  } else if (trans['app'] && trans['app'][key]) {
    // Backward compatibility: if namespace.path not found, try app.full_key
    // This allows both translate('app.dashboard.settings') and translate('dashboard.settings')
    value = trans['app'][key];
  } else {
    // Return key if translation not found
    return key;
  }

  // Apply replacements
  if (replacements && value) {
    Object.entries(replacements).forEach(([placeholder, replacement]) => {
      value = value!.replace(new RegExp(`:${placeholder}`, 'g'), replacement);
    });
  }

  return value;
}

/**
 * Get a translation by key (REACTIVE - automatically updates when locale changes)
 * Supports dot notation: translate('app.settings.system')
 * Backward compatible: translate('settings.system') will try 'app.settings.system'
 *
 * Usage in components:
 * ```tsx
 * <h1>{t('app.dashboard.settings')}</h1>
 * ```
 *
 * This will automatically re-render when the locale changes.
 *
 * @param key - Translation key in format 'namespace.key' or 'namespace.key.subkey'
 * @param replacements - Object with replacements for :placeholder syntax
 * @returns Translated string or the key if not found
 */
export function translate(key: string, replacements?: Record<string, string>): string {
  // By calling translations() signal here, this becomes reactive in SolidJS tracking contexts
  const trans = translations();
  return translateInternal(trans, key, replacements);
}

/**
 * Shorthand for translate() - REACTIVE
 * This is a reactive function that will cause components to re-render when locale changes.
 *
 * Usage: {t('app.settings.title')}
 */
export const t = translate;

/**
 * Get current locale
 */
export function getLocale(): string {
  return currentLocale();
}

/**
 * Change locale and reload translations
 */
export async function changeLocale(locale: string) {
  await initTranslations(locale);
}

/**
 * Check if translations are loading
 */
export function isTranslationsLoading(): boolean {
  return isLoading();
}

/**
 * Reactive translation hook for use in components
 * Returns an accessor function that automatically updates when translations change
 *
 * Usage:
 * ```tsx
 * const title = useTranslation('app.dashboard.settings');
 * return <h1>{title()}</h1>; // Note the () - it's an accessor!
 * ```
 *
 * @param key - Translation key
 * @param replacements - Optional replacements
 * @returns Accessor function that returns the translated string
 */
export function useTranslation(key: string, replacements?: Record<string, string>) {
  return createMemo(() => translate(key, replacements));
}

/**
 * Export the translations signal for advanced usage
 * Components can subscribe to this to re-render on locale changes
 */
export function getTranslationsSignal() {
  return translations;
}

// Auto-initialize on import
initTranslations();
