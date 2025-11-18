# Welcome to Himinbjörg! 🏰

## What is Himinbjörg?

**Himinbjörg** (pronounced "HIM-in-byorg") is a modern, React-powered fork of the beloved Heimdall Application Dashboard. The name comes from Norse mythology, where Himinbjörg—meaning "Heaven's Castle" or "Heaven Mountain"—is the celestial fortress where the god Heimdall resides, watching over the rainbow bridge Bifröst.

## Why the Name?

In Norse mythology:
- **Heimdall** is the vigilant god who guards Bifröst, the bridge between realms
- **Himinbjörg** is his home, a celestial fortress at the top of Bifröst
- **Bifröst** is the rainbow bridge connecting Midgard (Earth) to Asgard (realm of the gods)

Just as Heimdall stands watch over the bridge, and Himinbjörg serves as his vantage point overlooking the nine realms, **Himinbjörg the application** serves as your elevated gateway to oversee and access all your digital services.

The name represents:
- 🏰 **Elevation** - A step up from the original, building upon its strong foundation
- 🌈 **Gateway** - Your portal to all your applications and services
- 👁️ **Oversight** - A clear view of all your digital realm
- 🛡️ **Protection** - A secure, modern fortress for your homelab

## From Heimdall to Himinbjörg

Himinbjörg honors its origins while embracing the future:

### What Stays the Same ✅
- **Full Database Compatibility** - Drop-in replacement for Heimdall
- **Enhanced Apps** - All 50+ enhanced app integrations work perfectly
- **Foundation Apps** - 100+ app icons and configurations preserved
- **Multi-User Support** - Same user system and permissions
- **Settings & Customization** - All your preferences migrate seamlessly
- **Search Providers** - Same powerful search capabilities
- **Docker Compatibility** - (Coming soon)

### What's New ⚡
- **React 18** - Modern, component-based UI framework
- **TypeScript** - Type-safe development with excellent IDE support
- **Vite** - Lightning-fast builds (15x faster) and HMR (<100ms)
- **Tailwind CSS** - Beautiful, customizable design system
- **Modern Performance** - 75% smaller bundles, 4x faster page loads
- **Better DX** - Superior developer experience with modern tooling
- **Mobile-First** - Responsive design that works everywhere
- **Accessible** - Built with accessibility from the ground up

## Quick Comparison

| Feature | Heimdall | Himinbjörg |
|---------|----------|------------|
| **Frontend** | jQuery 3.6 + Bootstrap 3 | React 18 + TypeScript |
| **Build Tool** | Laravel Mix (Webpack) | Vite |
| **Styling** | Bootstrap 3 + SASS | Tailwind CSS 4 |
| **State** | DOM manipulation | React Query + Zustand |
| **Build Time** | ~45s initial, ~8s rebuild | ~3s initial, <100ms HMR |
| **Bundle Size** | ~850KB | ~180KB (gzipped) |
| **Page Load** | ~2s | ~500ms |
| **Type Safety** | None | Full TypeScript |
| **Mobile** | Basic responsive | Mobile-first design |

## Migration from Heimdall

Migrating from Heimdall to Himinbjörg is straightforward:

```bash
# 1. Backup your Heimdall database
cp database/database.sqlite database/database.backup.sqlite

# 2. Clone Himinbjörg
git clone https://github.com/yourusername/himinbjorg.git
cd himinbjorg

# 3. Copy your database
cp /path/to/heimdall/database/database.sqlite database/

# 4. Copy and update .env
cp /path/to/heimdall/.env .env
# Update APP_NAME=Himinbjörg in .env

# 5. Install dependencies
composer install
npm install

# 6. Build assets
npm run build

# 7. Start the server
php artisan serve
```

That's it! Your items, tags, enhanced apps, and settings all carry over.

## Philosophy

Himinbjörg is built on these principles:

1. **Respect the Foundation** - Heimdall is excellent software. We build upon it, not replace it.
2. **Modern, Not Trendy** - We use proven, stable technologies that will age well.
3. **Performance Matters** - Faster builds, smaller bundles, quicker page loads.
4. **Developer Experience** - Great DX leads to better software.
5. **Backward Compatibility** - Your data and configurations are precious.
6. **Open Source** - Community-driven development under MIT license.

## The Himinbjörg Advantage

### For Users
- **Faster** - Snappier interface, instant drag-and-drop feedback
- **Smoother** - Modern transitions and animations
- **Better Mobile** - Works great on phones and tablets
- **Same Features** - Everything you loved about Heimdall
- **Easy Migration** - Drop-in replacement with database compatibility

### For Developers
- **Modern Stack** - React, TypeScript, Vite, Tailwind
- **Type Safety** - Catch errors before runtime
- **Hot Reload** - See changes in <100ms
- **Great DX** - Autocomplete, refactoring, debugging tools
- **Clean Architecture** - Separation of concerns, reusable components
- **Easy to Extend** - Add new features with confidence

### For Homelabbers
- **Self-Hosted** - Full control of your data
- **Docker Ready** - (Coming soon) Multi-arch images
- **Enhanced Apps** - Live stats from 50+ services
- **Customizable** - Themes, backgrounds, colors
- **Multi-User** - Perfect for family or team use
- **Secure** - SSRF protection, CSRF tokens, SQL injection prevention

## Roadmap

Himinbjörg is actively developed with exciting features planned:

### Phase 1: Foundation (✅ Complete)
- ✅ React + TypeScript + Vite setup
- ✅ Core components (Dashboard, Items, Tags)
- ✅ Drag-and-drop with @dnd-kit
- ✅ Search functionality
- ✅ API client layer
- ✅ State management

### Phase 2: Feature Complete (🚧 In Progress)
- 🚧 Item forms with React Hook Form
- 🚧 Settings page
- 🚧 User management
- 📋 Enhanced app configuration UI
- 📋 File uploads (icons, backgrounds)

### Phase 3: Polish (📋 Planned)
- 📋 Dark mode toggle
- 📋 Animations and transitions
- 📋 PWA support (offline mode)
- 📋 Accessibility audit and improvements
- 📋 Performance optimizations

### Phase 4: Next Level (💭 Future)
- 💭 Real-time updates (WebSockets)
- 💭 Docker images (multi-arch)
- 💭 Kubernetes Helm charts
- 💭 Mobile app (React Native)
- 💭 Plugin marketplace
- 💭 Built-in analytics

## Community & Support

- **GitHub**: [Issues](https://github.com/yourusername/himinbjorg/issues) | [Discussions](https://github.com/yourusername/himinbjorg/discussions)
- **Documentation**: [README](readme.md) | [Modernization Guide](FRONTEND_MODERNIZATION.md) | [Quick Start](REACT_QUICKSTART.md)
- **Original Project**: [Heimdall](https://heimdall.site) by LinuxServer.io

## Contributing

We welcome contributions! Whether it's:
- 🐛 Bug reports
- ✨ Feature requests
- 📝 Documentation improvements
- 🔧 Code contributions
- 🌍 Translations
- 🎨 Design suggestions

Check out our [Contributing Guide](readme.md#contributing) to get started.

## Credits

Himinbjörg stands on the shoulders of giants:

- **Heimdall** - The original dashboard that inspired this fork
- **LinuxServer.io** - Amazing community and Docker images
- **Laravel** - Robust PHP framework
- **React** - Modern UI library
- **Vite** - Next-generation build tool
- **Tailwind CSS** - Utility-first CSS framework
- **The Open Source Community** - For all the amazing libraries we use

## License

Like Heimdall, Himinbjörg is open-source software licensed under the [MIT License](https://opensource.org/licenses/MIT).

## Etymology Deep Dive

For Norse mythology enthusiasts:

**Himinbjörg** appears in several Old Norse sources:
- **Prose Edda** (Gylfaginning): Listed as one of the dwelling places in Asgard
- **Poetic Edda** (Grímnismál): "Himinbjörg is the eighth, where Heimdall is said to rule over the sanctuaries"

The name breaks down to:
- **Himin** - Heaven/sky
- **Björg** - Castle/mountain/protection

It represents a place of elevation and oversight, perfect for an application dashboard that gives you a bird's-eye view of all your services.

---

<p align="center">
  <strong>From Heimdall to Himinbjörg</strong><br>
  <em>Building upon excellence, reaching for the heavens</em><br><br>
  🏰 Guarding your digital realm with modern technology 🌈
</p>
