import { For, Show, createMemo, createSignal, createEffect } from 'solid-js';
import ItemTile from '@/components/ItemTile';
import { createEnhancedSamplesQuery } from '@/queries/enhanced';
import type { EnhancedSample } from '@/api/enhanced';
import type { Item } from '@/types';
import { extractDominantColor, getComplementaryBackground } from '@/lib/colorExtractor';

type EnhancedStatus = 'active' | 'inactive' | 'error' | 'pending';

const statusCycle: EnhancedStatus[] = ['active', 'inactive', 'error', 'pending'];

const scenarioOptions: Array<{ value: 'mixed' | EnhancedStatus; label: string }> = [
  { value: 'mixed', label: 'Mixed sample data' },
  { value: 'active', label: 'All online' },
  { value: 'inactive', label: 'All offline' },
  { value: 'error', label: 'All error state' },
  { value: 'pending', label: 'All waiting' },
];

function buildStats(sample: EnhancedSample, seed: number) {
  const entries = Object.entries(sample.stats || {});
  const result: Record<string, string | number> = {};

  entries.forEach(([label, value], idx) => {
    if (typeof value === 'number') {
      result[label] = value + ((seed + idx) % 5);
    } else if (typeof value === 'string' && value.trim() !== '') {
      result[label] = value;
    } else {
      result[label] = (seed + idx + 1) * 3;
    }
  });

  if (entries.length === 0) {
    result['Status'] = seed % 2 === 0 ? 'OK' : 'Warn';
  }

  return result;
}

function createSampleItem(sample: EnhancedSample, index: number, status: EnhancedStatus, colour: string): Item {
  const now = Date.now();
  const lastPoll = status === 'pending' ? null : new Date(now - (index % 5) * 60_000).toISOString();
  const nextPoll = new Date(now + 5 * 60_000).toISOString();

  return {
    id: 10_000 + index,
    title: sample.name,
    url: 'https://example.com',
    colour,
    icon: sample.icon || '/img/heimdall-icon-small.png',
    description: null,
    appdescription: sample.description,
    pinned: false,
    order: index,
    type: 0,
    user_id: 0,
    class: `App::${sample.appid}`,
    appid: sample.appid,
    role: null,
    tags: [],
    enhanced: true,
    enhanced_enabled: true,
    stats: status === 'error' || status === 'pending' ? null : buildStats(sample, index),
    enhanced_status: status,
    enhanced_error: status === 'error' ? 'Simulated timeout (demo data)' : null,
    enhanced_last_polled_at: lastPoll,
    enhanced_next_poll_at: status === 'pending' ? null : nextPoll,
    enhanced_response_time_ms: status === 'error' ? null : 150 + (index % 5) * 25,
    enhanced_is_fresh: status === 'active',
    enhanced_raw_html: null,
  } as Item;
}

export default function EnhancedDemo() {
  const samplesQuery = createEnhancedSamplesQuery();
  const [scenario, setScenario] = createSignal<'mixed' | EnhancedStatus>('mixed');
  const [colourMap, setColourMap] = createSignal<Record<string, string>>({});

  const statusForIndex = (index: number): EnhancedStatus => {
    const mode = scenario();
    return mode === 'mixed' ? statusCycle[index % statusCycle.length] : mode;
  };

  const sampleItems = createMemo(() => {
    const map = colourMap();
    return (samplesQuery.data || []).map((sample, index) => {
      const fallback = sample.colour || (sample.tile_background === 'light' ? '#fafbfc' : '#161b1f');
      const colour = map[sample.appid] || fallback;
      return createSampleItem(sample, index, statusForIndex(index), colour);
    });
  });

  createEffect(() => {
    const samples = samplesQuery.data || [];
    samples.forEach((sample) => {
      if (!sample.icon) return;
      const current = colourMap();
      if (current[sample.appid]) return;

      extractDominantColor(sample.icon)
        .then((dominant) => getComplementaryBackground(dominant))
        .catch(() => sample.colour || (sample.tile_background === 'light' ? '#fafbfc' : '#161b1f'))
        .then((computed) => {
          setColourMap((prev) => (prev[sample.appid] ? prev : { ...prev, [sample.appid]: computed }));
        });
    });
  });

  return (
    <div class="min-h-screen bg-gray-50 py-10 px-4">
      <div class="mx-auto max-w-6xl space-y-6">
        <header class="space-y-2">
          <p class="text-sm uppercase tracking-wide text-gray-500">QA Playground</p>
          <h1 class="text-3xl font-bold text-gray-900">Enhanced App Visual Test</h1>
          <p class="text-gray-600 max-w-3xl">
            Automatically renders an ItemTile preview for every enhanced application shipped with Heimdall so visual
            tests can confirm status badges, metric layouts, and error states without relying on real infrastructure.
          </p>

          <div class="mt-4 rounded-xl border border-gray-200 bg-white/70 p-4 shadow-sm">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p class="text-sm font-semibold text-gray-900">Scenario preset</p>
                <p class="text-xs text-gray-500">Switch between good/offline/error/pending states for every tile.</p>
              </div>
              <select
                class="input sm:max-w-xs"
                value={scenario()}
                onChange={(e) => setScenario(e.currentTarget.value as 'mixed' | EnhancedStatus)}
              >
                <For each={scenarioOptions}>{(option) => (
                  <option value={option.value}>{option.label}</option>
                )}</For>
              </select>
            </div>
          </div>
        </header>

        <Show when={!samplesQuery.isLoading} fallback={
          <div class="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm">
            Loading application catalog…
          </div>
        }>
          <Show when={sampleItems().length > 0} fallback={
            <div class="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm">
              No enhanced applications were found in the current catalog.
            </div>
          }>
            <div class="flex items-center justify-between rounded-2xl bg-white px-5 py-3 text-sm text-gray-600 shadow-sm">
              <span>Total enhanced apps: <strong>{sampleItems().length}</strong></span>
              <span>Data source: <code class="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">/api/enhanced-apps/samples</code></span>
            </div>

            <div class="rounded-2xl bg-white p-4 shadow-sm">
              <div class="item-grid">
                <For each={sampleItems()}>{(item) => (
                  <ItemTile item={item} editMode={false} />
                )}</For>
              </div>
            </div>
          </Show>
        </Show>

        <section class="rounded-2xl border border-gray-200 bg-white p-6 space-y-3 text-sm text-gray-600">
          <h2 class="text-lg font-semibold text-gray-900">Usage tips</h2>
          <ul class="list-disc pl-5 space-y-1">
            <li>Hook Percy/Loki/Playwright snapshots to <code class="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">/qa/enhanced-demo</code>.</li>
            <li>Inspect individual tiles to verify status badges (Active/Inactive/Error/Pending) and timestamp messaging.</li>
            <li>Adjust <code class="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">App\Services\EnhancedAppSample</code> if a template introduces new data points.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
