import { createSignal } from 'solid-js';
import { makePersisted } from '@solid-primitives/storage';

// Dashboard state
export const [editMode, setEditMode] = createSignal(false);
export const [sidebarOpen, setSidebarOpen] = createSignal(false);
export const [selectedTag, setSelectedTag] = makePersisted(
  createSignal<number | 'all'>('all'),
  { name: 'himinbjorg-selected-tag' }
);
export const [searchQuery, setSearchQuery] = createSignal('');
export const [searchProvider, setSearchProvider] = makePersisted(
  createSignal('tiles'),
  { name: 'himinbjorg-search-provider' }
);

// Helper actions
export const toggleEditMode = () => setEditMode(!editMode());
export const toggleSidebar = () => setSidebarOpen(!sidebarOpen());

export const resetDashboard = () => {
  setEditMode(false);
  setSidebarOpen(false);
  setSelectedTag('all');
  setSearchQuery('');
  setSearchProvider('tiles');
};
