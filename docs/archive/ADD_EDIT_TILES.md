# Add/Edit Tiles Feature

The tile management feature allows you to add new application tiles and edit existing ones through an intuitive sidebar form.

## Features

### ✅ Add New Tiles
- Click "Add Item" button in edit mode
- Fill out the form with app details
- Choose from 100+ enhanced apps
- Customize colors and icons
- Assign to categories (tags)

### ✅ Edit Existing Tiles
- Click any tile in edit mode
- Modify any field
- Changes save instantly
- Maintains all relationships

### ✅ Enhanced Apps
- Search from library of supported apps
- Auto-populates title, icon, and color
- Live stats displayed on tiles
- Config options for API connections

## User Flow

### Adding a New Tile

1. **Enter Edit Mode**
   - Click the gear icon in the top right
   - Or press `E` (keyboard shortcut - future)

2. **Click "Add Item"**
   - Green button appears next to gear icon
   - Sidebar slides in from the right

3. **Fill Out Form**
   - **Title** (required): Display name for the tile
   - **URL** (required): Link to open when clicked
   - **Enhanced App** (optional): Select from library
   - **Icon URL** (optional): Custom icon image
   - **Background Color**: Choose tile color
   - **Tags**: Assign to categories
   - **Pin to Top**: Keep at top of grid

4. **Submit**
   - Click "Add Item" button
   - Tile appears immediately
   - Form closes automatically

### Editing an Existing Tile

1. **Enter Edit Mode**
   - Click the gear icon

2. **Click a Tile**
   - Any tile in the grid
   - Sidebar opens with pre-filled form

3. **Modify Fields**
   - Change any field as needed
   - Preview color in real-time

4. **Update**
   - Click "Update Item" button
   - Changes reflected immediately

## Form Fields

### Required Fields

#### Title
- Display name shown on the tile
- Max 255 characters
- Example: "Plex Media Server"

#### URL
- Full URL including protocol
- Example: `https://plex.example.com`
- Can be internal or external

### Optional Fields

#### Enhanced App
- Searchable dropdown
- 100+ supported applications
- Shows live stats on tile
- Auto-fills title, icon, and color

**Popular Enhanced Apps:**
- Plex (media server stats)
- Sonarr (TV show management)
- Radarr (movie management)
- Nextcloud (file storage)
- Pi-hole (DNS blocking)
- Home Assistant (smart home)

#### Icon URL
- Direct link to image file
- Supports PNG, JPG, SVG
- Falls back to enhanced app icon
- Example: `https://example.com/logo.png`

#### Background Color
- Color picker + hex input
- Default: `#3b82f6` (blue)
- Enhanced apps have preset colors
- Supports any hex color code

#### Tags
- Multi-select from existing tags
- Create tags in Settings (future)
- Filters by category
- Optional - tiles can have no tags

#### Pin to Top
- Checkbox to pin tile
- Pinned tiles always show first
- Useful for frequently accessed apps
- Can unpin from tile menu

## Enhanced App Selection

### How It Works

1. **Type to Search**
   - Search box appears when no app selected
   - Filters as you type
   - Shows app name and description

2. **Select an App**
   - Click an app from dropdown
   - Auto-populates:
     - Title (editable)
     - Icon (from app repository)
     - Background color (app default)

3. **Clear Selection**
   - Click X button next to app name
   - Reverts to manual mode
   - Fields remain editable

### Enhanced App Benefits

- **Live Stats**: Shows data on tile
  - Plex: Currently watching, library size
  - Sonarr: Upcoming episodes, queue size
  - Pi-hole: Blocked queries, percentage

- **Auto-Updates**: Stats refresh periodically
- **Custom Icons**: Professional app logos
- **Preset Colors**: Brand colors from apps

## Color Picker

### Options
1. **Color Picker**: Visual selector
2. **Hex Input**: Type hex code directly
3. **Preview**: See color in real-time

### Tips
- Use brand colors for apps
- Light colors work better for text
- Dark mode support (future)

## Form Validation

### Client-Side
- Title required (red asterisk)
- URL required and must be valid format
- Color must be valid hex code

### Server-Side
- Duplicate URL detection (warning)
- XSS protection on all inputs
- CSRF token validation

### Error Handling
- Inline error messages
- Form stays open on error
- All data preserved

## Keyboard Shortcuts (Future)

- `E` - Toggle edit mode
- `A` - Add new item (when in edit mode)
- `Esc` - Close sidebar
- `Cmd+S` / `Ctrl+S` - Save form

## API Integration

### Enhanced App Configuration

When selecting an enhanced app that requires configuration (API keys, URLs, etc.):

1. **Config Fields Appear**
   - Dynamic fields based on app
   - Example: Plex needs server URL + token

2. **Test Connection**
   - "Test" button validates config
   - Shows success/error message

3. **Save Config**
   - Encrypted storage
   - Per-user or global

*Note: Config UI is not yet implemented but form structure supports it.*

## Advanced Features (Future)

### Bulk Import
- CSV upload
- Import from bookmarks
- Import from other dashboards

### Templates
- Save tile as template
- Apply template to new tiles
- Share templates

### Icon Upload
- Upload image files
- Crop and resize
- Save to server

### Custom Fields
- Add metadata
- Notes/descriptions
- Last accessed tracking

## Technical Details

### Component Architecture

```tsx
<Dashboard>
  └─ <ItemForm>
      ├─ Title Input
      ├─ URL Input
      ├─ Enhanced App Selector
      │   └─ Searchable Dropdown
      ├─ Icon URL Input
      ├─ Color Picker
      ├─ Tag Multi-Select
      ├─ Pin Checkbox
      └─ Submit/Cancel Buttons
</Dashboard>
```

### State Management

```typescript
// Form state (local to ItemForm)
const [title, setTitle] = createSignal('');
const [url, setUrl] = createSignal('');
const [colour, setColour] = createSignal('#3b82f6');
// ... more fields

// Global state (Dashboard)
const [editingItem, setEditingItem] = createSignal<Item | null>(null);
```

### Data Flow

```
User Clicks "Add Item"
  ↓
setEditingItem(null)
setSidebarOpen(true)
  ↓
ItemForm Renders (empty)
  ↓
User Fills Form
  ↓
handleFormSubmit(data)
  ↓
createItemMutation.mutate(data)
  ↓
API POST /api/items
  ↓
Query Invalidation
  ↓
Dashboard Refreshes
  ↓
Sidebar Closes
```

### Mutations

```typescript
// Create new item
createItemMutation.mutate(data, {
  onSuccess: () => {
    setSidebarOpen(false);
    // Query automatically refreshes
  },
  onError: (error) => {
    // Show error message
  }
});

// Update existing item
updateItemMutation.mutate({ id, data }, {
  onSuccess: () => {
    setSidebarOpen(false);
    setEditingItem(null);
  }
});
```

## Troubleshooting

### Form Won't Submit
- Check required fields (red asterisks)
- Verify URL format (must start with http:// or https://)
- Check browser console for errors

### Enhanced App Not Loading
- Verify internet connection
- Check API endpoint: `/api/applications`
- Refresh app repository in Settings

### Icon Not Showing
- Verify icon URL is accessible
- Check CORS if external URL
- Try different image format

### Color Not Applying
- Use valid hex format: `#RRGGBB`
- Try color picker instead of typing
- Clear browser cache

### Changes Not Saving
- Check network tab for failed requests
- Verify CSRF token is present
- Check server logs for errors

## Tips & Best Practices

### Organization
- Use tags to group related apps
- Pin frequently used apps
- Use consistent color schemes per category

### Performance
- Keep icon images small (<100KB)
- Use CDN URLs for icons when possible
- Limit enhanced apps to those you actively monitor

### Naming
- Use short, descriptive titles
- Include environment in title (e.g., "Plex - Home")
- Be consistent with capitalization

### URLs
- Use HTTPS when possible
- Include port if non-standard
- Use internal URLs when on local network

## Examples

### Example: Basic App
```
Title: Google
URL: https://google.com
Icon: https://www.google.com/favicon.ico
Color: #4285F4
Tags: [Search]
Pinned: No
```

### Example: Enhanced App (Plex)
```
Title: Plex Media Server
URL: https://plex.example.com
Enhanced App: Plex
Icon: (auto from Plex)
Color: #E5A00D (auto from Plex)
Tags: [Media]
Pinned: Yes
Config:
  - Server URL: http://192.168.1.100:32400
  - Token: abc123xyz789
```

### Example: Internal Tool
```
Title: Router Admin
URL: http://192.168.1.1
Icon: (none)
Color: #1e3a8a
Tags: [Network, Admin]
Pinned: No
```

## Future Enhancements

- [ ] Drag-and-drop icon upload
- [ ] Favicon auto-detection
- [ ] Custom tile sizes
- [ ] Tile templates
- [ ] Bulk operations
- [ ] Import/export
- [ ] Keyboard shortcuts
- [ ] Enhanced app config UI
- [ ] Tile preview before save
- [ ] Undo/redo
- [ ] Tile duplication
- [ ] Advanced permissions

---

**Status**: ✅ Implemented
**Version**: 1.0.0
**Last Updated**: 2025-10-15
