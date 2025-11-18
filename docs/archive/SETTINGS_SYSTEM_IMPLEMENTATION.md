# Settings System Implementation Plan

## Overview

Implement a comprehensive settings interface in the SolidJS frontend that matches Heimdall's core settings functionality, allowing users to configure system-wide and per-user preferences.

## Current Heimdall Settings

### Setting Groups

| ID | Title | Order | Purpose |
|----|-------|-------|---------|
| 1 | System | 0 | System info, language, version |
| 2 | Appearance | 1 | Background, visual settings |
| 3 | Miscellaneous | 2 | Search, window behavior |
| 4 | Advanced | 3 | Custom CSS/JS |

### Individual Settings

#### System Settings (Group 1)
- **version** (text, system) - Current version (read-only)
- **language** (select) - Interface language
- **support** (text, system) - Support links (read-only)
- **donate** (text, system) - Donation links (read-only)

#### Appearance Settings (Group 2)
- **background_image** (image) - Custom background upload
- **trianglify** (boolean) - Enable geometric pattern background
- **trianglify_seed** (text) - Seed for pattern generation
- **treat_tags_as** (select) - folders/tags/categories display mode

#### Miscellaneous Settings (Group 3)
- **homepage_search** (boolean) - Enable search bar
- **search_provider** (select) - Google/DuckDuckGo/Bing/etc
- **window_target** (select) - How links open (current/heimdall/_blank)

#### Advanced Settings (Group 4)
- **custom_css** (textarea) - Custom CSS injection
- **custom_js** (textarea) - Custom JavaScript injection

## Database Schema

### `settings` Table
```sql
CREATE TABLE settings (
    id INTEGER PRIMARY KEY,
    group_id INTEGER,                 -- Links to setting_groups
    key VARCHAR(255),                 -- Setting identifier
    type VARCHAR(50),                 -- text/select/boolean/image/textarea
    options TEXT,                     -- JSON options for select type
    label VARCHAR(255),               -- Translation key
    value TEXT,                       -- Default/system value
    order INTEGER,                    -- Display order in group
    system INTEGER DEFAULT 0          -- 1 = read-only, 0 = editable
);
```

### `setting_user` Pivot Table
```sql
CREATE TABLE setting_user (
    id INTEGER PRIMARY KEY,
    setting_id INTEGER,               -- Links to settings
    user_id INTEGER,                  -- Links to users
    uservalue TEXT                    -- User-specific override
);
```

### `setting_groups` Table
```sql
CREATE TABLE setting_groups (
    id INTEGER PRIMARY KEY,
    title VARCHAR(255),               -- Translation key
    order INTEGER                     -- Display order
);
```

## Frontend Architecture

### Components Structure

```
resources/js/
├── pages/
│   └── Settings.tsx                 # Main settings page
├── components/
│   ├── settings/
│   │   ├── SettingGroup.tsx         # Group container
│   │   ├── SettingField.tsx         # Individual field
│   │   ├── TextSetting.tsx          # Text input
│   │   ├── SelectSetting.tsx        # Dropdown
│   │   ├── BooleanSetting.tsx       # Toggle switch
│   │   ├── ImageSetting.tsx         # File upload
│   │   └── TextareaSetting.tsx      # Multiline text
│   └── Button.tsx                   # Already exists
├── queries/
│   └── settings.ts                  # TanStack Query hooks
├── api/
│   └── settings.ts                  # API client
└── types/
    └── index.ts                     # TypeScript types
```

### API Endpoints Needed

```typescript
// GET /api/settings - Get all settings
{
  "status": "success",
  "data": {
    "groups": [...],
    "settings": [...],
    "userSettings": [...]  // User-specific overrides
  }
}

// PUT /api/settings/{id} - Update a setting
{
  "value": "new_value"
}

// POST /api/settings/{id}/reset - Reset to default
// DELETE /api/settings/{id}/image - Delete uploaded image
```

### TypeScript Types

```typescript
// Setting group
export interface SettingGroup {
  id: number;
  title: string;
  order: number;
}

// Individual setting
export interface Setting {
  id: number;
  group_id: number;
  key: string;
  type: 'text' | 'select' | 'boolean' | 'image' | 'textarea';
  options: Record<string, string> | null;  // For select type
  label: string;
  value: string | null;
  order: number;
  system: boolean;  // Read-only if true
}

// User-specific override
export interface UserSetting {
  id: number;
  setting_id: number;
  user_id: number;
  uservalue: string;
}

// Combined settings response
export interface SettingsResponse {
  groups: SettingGroup[];
  settings: Setting[];
  userSettings: UserSetting[];
}
```

## Implementation Plan

### Phase 1: Backend API (Priority: HIGH)

1. **Create Settings API Routes** (`routes/api.php`)
   ```php
   Route::get('/settings', [SettingsController::class, 'index']);
   Route::put('/settings/{id}', [SettingsController::class, 'update']);
   Route::post('/settings/{id}/reset', [SettingsController::class, 'reset']);
   Route::delete('/settings/{id}/image', [SettingsController::class, 'deleteImage']);
   ```

2. **Create Settings Controller** (if needed)
   - Or use existing `SettingsController`
   - Return settings with user overrides applied

### Phase 2: Frontend Foundation (Priority: HIGH)

1. **Create API Client** (`resources/js/api/settings.ts`)
   ```typescript
   export const settingsApi = {
     getAll: async (): Promise<SettingsResponse> => {...},
     update: async (id: number, value: any): Promise<Setting> => {...},
     reset: async (id: number): Promise<void> => {...},
     deleteImage: async (id: number): Promise<void> => {...},
   };
   ```

2. **Create Query Hooks** (`resources/js/queries/settings.ts`)
   ```typescript
   export function createSettingsQuery() {...}
   export function createUpdateSettingMutation() {...}
   export function createResetSettingMutation() {...}
   ```

3. **Add TypeScript Types** (`resources/js/types/index.ts`)

### Phase 3: UI Components (Priority: MEDIUM)

1. **Base Field Component** (`SettingField.tsx`)
   - Wrapper for all setting types
   - Handles label, description, system badge
   - Manages loading/error states

2. **Specific Field Types**
   - `TextSetting.tsx` - Text input
   - `SelectSetting.tsx` - Dropdown with options
   - `BooleanSetting.tsx` - Toggle switch
   - `ImageSetting.tsx` - File upload with preview
   - `TextareaSetting.tsx` - Code editor style for CSS/JS

3. **Group Container** (`SettingGroup.tsx`)
   - Collapsible sections
   - Group title
   - Contains multiple settings

### Phase 4: Main Settings Page (Priority: MEDIUM)

1. **Create Settings Page** (`resources/js/pages/Settings.tsx`)
   ```tsx
   export default function Settings() {
     const settingsQuery = createSettingsQuery();
     const updateMutation = createUpdateSettingMutation();

     // Group settings by group_id
     const groupedSettings = createMemo(() => {
       // Logic to organize settings by group
     });

     return (
       <div class="settings-page">
         <header>
           <h1>Settings</h1>
         </header>

         <For each={settingsQuery.data?.groups}>
           {(group) => (
             <SettingGroup group={group}>
               <For each={getSettingsForGroup(group.id)}>
                 {(setting) => (
                   <SettingField
                     setting={setting}
                     onUpdate={(value) => updateMutation.mutate({ id: setting.id, value })}
                   />
                 )}
               </For>
             </SettingGroup>
           )}
         </For>
       </div>
     );
   }
   ```

2. **Add Route** (`resources/js/app.tsx`)
   ```tsx
   <Route path="/settings" component={Settings} />
   ```

3. **Add Navigation Link** (Dashboard or navbar)

### Phase 5: Advanced Features (Priority: LOW)

1. **Search/Filter Settings**
   - Search bar at top
   - Filter by group
   - Highlight matches

2. **Import/Export Settings**
   - Export as JSON
   - Import from file
   - Useful for backup/migration

3. **Reset All**
   - Bulk reset to defaults
   - With confirmation dialog

4. **Setting Validation**
   - Client-side validation
   - Server-side validation
   - Clear error messages

## UI Design

### Layout

```
┌─────────────────────────────────────────────────┐
│ Settings                                    [×] │
├─────────────────────────────────────────────────┤
│                                                 │
│ ┌─ System ────────────────────────────────┐    │
│ │                                          │    │
│ │ Version                    [2.7.7] 🔒   │    │
│ │ Language                   [English ▼]   │    │
│ │                                          │    │
│ └──────────────────────────────────────────┘    │
│                                                 │
│ ┌─ Appearance ────────────────────────────┐    │
│ │                                          │    │
│ │ Background Image           [Upload]      │    │
│ │ Geometric Pattern          [Toggle ON]   │    │
│ │ Pattern Seed               [heimdall]    │    │
│ │ Display Mode               [Folders ▼]   │    │
│ │                                          │    │
│ └──────────────────────────────────────────┘    │
│                                                 │
│ ┌─ Miscellaneous ─────────────────────────┐    │
│ │                                          │    │
│ │ Homepage Search            [Toggle ON]   │    │
│ │ Search Provider            [Google ▼]    │    │
│ │ Link Behavior              [New Tab ▼]   │    │
│ │                                          │    │
│ └──────────────────────────────────────────┘    │
│                                                 │
│ ┌─ Advanced ──────────────────────────────┐    │
│ │                                          │    │
│ │ Custom CSS                 [Edit]        │    │
│ │ Custom JavaScript          [Edit]        │    │
│ │                                          │    │
│ └──────────────────────────────────────────┘    │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Styling Guidelines

- **Groups**: Collapsible cards with borders
- **Read-only fields**: Lock icon, gray text
- **Toggles**: Modern switch design (like iOS)
- **Dropdowns**: Native select or custom with search
- **File upload**: Drag-and-drop with preview
- **Code editors**: Syntax highlighting for CSS/JS

## User Permissions

### System Settings (system = 1)
- **Read-only** for all users
- Display value only
- Show lock icon
- Examples: version, support links

### User Settings (system = 0)
- **Editable** by all users
- Changes affect only current user
- Can reset to default
- Examples: language, search provider

### Global Settings
- Only shown if user is admin
- Affects all users
- Requires elevated permissions

## Validation Rules

### Text Fields
- Max length varies by field
- Trim whitespace
- Escape HTML (unless specific field like custom_css)

### Select Fields
- Must match one of the options
- Fallback to first option if invalid

### Boolean Fields
- Convert to 1/0 or true/false
- Handle null as false

### Image Fields
- Max file size: 5MB
- Allowed types: jpg, png, svg (sanitized)
- Store in `storage/app/public/backgrounds/`

### Textarea Fields (CSS/JS)
- Max length: 50,000 characters
- Warning if exceeds 10,000
- Syntax validation (optional)

## Caching Strategy

### Backend
```php
// Current Heimdall approach
protected static $cache = [];

public static function fetch($key) {
    if (isset(self::$cache[$key])) {
        return self::$cache[$key];
    }
    // ... fetch from DB
}
```

### Frontend
```typescript
// TanStack Query handles caching
export function createSettingsQuery() {
  return createQuery(() => ({
    queryKey: ['settings'],
    queryFn: () => settingsApi.getAll(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  }));
}
```

## Migration Notes

### Backward Compatibility

- ✅ Keep existing Setting model
- ✅ Keep existing SettingsController
- ✅ Keep existing database tables
- ✅ API returns same format as Blade views expect
- ✅ No breaking changes to existing code

### Coexistence

- Old Blade UI and new SolidJS UI can work simultaneously
- Settings changed in one interface appear in the other
- Shared database, no duplication

## Testing Checklist

- [ ] Can view all settings groups
- [ ] Can expand/collapse groups
- [ ] Can edit text settings
- [ ] Can change select options
- [ ] Can toggle boolean settings
- [ ] Can upload background image
- [ ] Can delete background image
- [ ] Can edit custom CSS
- [ ] Can edit custom JavaScript
- [ ] Changes save successfully
- [ ] Changes persist after refresh
- [ ] User-specific overrides work
- [ ] System settings are read-only
- [ ] Reset to default works
- [ ] Validation errors display
- [ ] Loading states work
- [ ] Error handling works

## Future Enhancements

1. **Setting Presets**
   - Dark mode preset
   - Minimal preset
   - Power user preset

2. **Setting History**
   - Track changes
   - Rollback capability
   - Audit log

3. **Conditional Settings**
   - Show/hide based on other settings
   - E.g., only show `trianglify_seed` if `trianglify` is enabled

4. **Setting Descriptions**
   - Hover tooltips
   - Help text
   - Examples

5. **Live Preview**
   - See changes before saving
   - Apply temporarily
   - Confirm or cancel

## Related Files

- [ENHANCED_APPS_ARCHITECTURE.md](ENHANCED_APPS_ARCHITECTURE.md)
- [app/Setting.php](app/Setting.php)
- [app/SettingGroup.php](app/SettingGroup.php)
- [app/Http/Controllers/SettingsController.php](app/Http/Controllers/SettingsController.php)

## Next Steps

1. Create API endpoints for settings
2. Build API client and query hooks
3. Create base UI components
4. Build settings page
5. Add routing
6. Test thoroughly
7. Document for users
