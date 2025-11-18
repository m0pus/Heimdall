export interface Item {
  id: number;
  title: string;
  url: string;
  colour: string | null;
  icon: string | null;
  description: string | null; // Enhanced app config (JSON)
  appdescription: string | null; // User-provided description (for tooltips)
  pinned: boolean;
  order: number;
  type: 0 | 1; // 0 = item, 1 = tag
  user_id: number;
  appid: string | null;
  class: string | null;
  role: string | null;
  config: Record<string, any> | null;
  tags?: Tag[];
  enhanced?: boolean;
  enhanced_enabled?: boolean;
  stats?: ItemStats | null;
  enhanced_status?: 'active' | 'inactive' | 'error' | string | null;
  enhanced_error?: string | null;
  enhanced_last_polled_at?: string | null;
  enhanced_next_poll_at?: string | null;
  enhanced_response_time_ms?: number | null;
  enhanced_is_fresh?: boolean;
  enhanced_raw_html?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface Tag {
  id: number;
  title: string;
  colour: string | null;
  icon: string | null;
  pinned: boolean;
  order: number;
  items?: Item[];
  created_at?: string;
  updated_at?: string;
}

export interface Application {
  appid: string;
  name: string;
  sha: string;
  icon: string;
  website: string;
  license: string;
  description: string;
  enhanced: boolean;
  tile_background: string;
  class: string;
  config?: ApplicationConfig[];
}

export interface ApplicationConfig {
  name: string;
  label: string;
  type: 'text' | 'password' | 'select' | 'url' | 'number' | 'boolean';
  options?: string[];
  default?: any;
  required?: boolean;
}

export interface ItemStats {
  [key: string]: string | number | boolean;
}

export interface User {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  avatar_url: string | null;
  public_front: boolean;
  autologin: string | null;
  autologin_url: string | null;
  has_password: boolean;
  can_delete: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserFormData {
  username: string;
  email: string;
  password?: string;
  password_confirmation?: string;
  public_front: boolean;
  autologin_allow: boolean;
  avatar?: File | null;
  clear_password?: boolean;
}

export interface SettingGroup {
  id: number;
  title: string;
  order: number;
}

export interface Setting {
  id: number;
  group_id: number;
  key: string;
  type: 'text' | 'select' | 'boolean' | 'image' | 'textarea';
  options: string | null; // JSON string of options for select type
  label: string;
  value: string | null;
  order: number;
  system: number; // 1 = read-only, 0 = editable
}

export interface SettingsResponse {
  groups: SettingGroup[];
  settings: Setting[];
}

export interface SearchProvider {
  name: string;
  url: string;
  method: 'get' | 'post';
  enabled: boolean;
}

export interface DashboardState {
  viewMode: 'grid' | 'list';
  selectedTag: number | 'all';
  editMode: boolean;
  searchQuery: string;
  searchProvider: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: 'success' | 'error';
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export type ItemFormData = Omit<Item, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>;
export type TagFormData = Omit<Tag, 'id' | 'items' | 'created_at' | 'updated_at'>;
