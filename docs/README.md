# Himinbjörg Documentation

> A modern, drop-in replacement for Heimdall built with SolidJS, Laravel 11, and Vite.

## 📚 Documentation Index

### Getting Started
- **[Quick Start Guide](guides/QUICKSTART.md)** - Get up and running in 5 minutes
- **[Installation](guides/INSTALLATION.md)** - Detailed installation instructions
- **[Deployment](guides/DEPLOYMENT.md)** - Production deployment guide
- **[Migration from Heimdall](migration/FROM_HEIMDALL.md)** - Upgrading from Heimdall

### Development
- **[Development Setup](development/SETUP.md)** - Setting up your dev environment
- **[Frontend Architecture](development/FRONTEND.md)** - SolidJS frontend guide
- **[Translation System](development/TRANSLATIONS.md)** - i18n implementation
- **[Testing](development/TESTING.md)** - Running and writing tests

### Architecture
- **[System Overview](architecture/OVERVIEW.md)** - High-level architecture
- **[Enhanced Apps](architecture/ENHANCED_APPS.md)** - Enhanced apps system
- **[Settings System](architecture/SETTINGS.md)** - Settings implementation
- **[API Reference](architecture/API.md)** - REST API documentation

### Changelog
- **[Changelog](changelog/CHANGELOG.md)** - Version history and changes

### Archive
- **[Archived Documentation](archive/)** - Historical documentation from development process
  - Implementation notes, fixes, and migration details
  - Preserved for reference and historical context

## 🎯 What is Himinbjörg?

Himinbjörg (pronounced "HEE-min-byorg") is a modernized version of Heimdall that maintains 100% backward compatibility while providing:

- ⚡ **Modern Frontend**: SolidJS for blazing-fast reactivity
- 🎨 **Better UX**: Improved UI/UX throughout
- 🌐 **i18n Ready**: Full translation support (26+ languages)
- 🔧 **Drop-in Replacement**: Same database, same ports, same everything
- 📦 **Modern Tooling**: Vite build system, TypeScript support

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/himinbjorg.git
cd himinbjorg

# Install dependencies
composer install
npm install

# Set up environment
cp .env.example .env
php artisan key:generate

# Build frontend
npm run build

# Run migrations
php artisan migrate

# Seed database
php artisan db:seed

# Start server
php artisan serve
```

Visit http://localhost:8000

## 🐳 Docker Quick Start

```bash
# Using Docker Compose (same as Heimdall)
docker-compose up -d
```

## 📖 Key Features

### 🔄 Drop-in Replacement
- Same database schema as Heimdall
- Same API endpoints
- Same configuration
- Just swap the Docker image!

### ⚡ Modern Stack
- **Frontend**: SolidJS + TypeScript
- **Backend**: Laravel 11 + PHP 8.2+
- **Build**: Vite 6
- **Styling**: Tailwind CSS 3
- **State**: TanStack Query (Solid)

### 🎨 Enhanced Features
- Improved app selection with infinite scroll
- Auto color extraction from app icons
- Live translation switching
- Better error handling
- Cleaner, more intuitive UI

### 🌐 Internationalization
- 26+ languages supported
- Dynamic locale switching
- Translation API endpoint
- Backward compatible with Heimdall translations

## 🔧 Development

### Requirements
- PHP 8.2+
- Node.js 20+
- Composer 2.x
- SQLite/MySQL/PostgreSQL

### Dev Workflow

```bash
# Start development servers
npm run dev
# Runs: Vite (port 5173) + Laravel (port 8000)

# Build for production
npm run build

# Run tests
php artisan test

# Lint TypeScript
npm run lint:ts
```

## 📂 Project Structure

```
himinbjorg/
├── app/                    # Laravel application
├── database/               # Migrations & seeders
├── docs/                   # 📚 Documentation (you are here)
├── lang/                   # Translation files (26+ languages)
├── public/                 # Public assets
│   └── build/             # Built Vite assets (production)
├── resources/
│   ├── css/               # Styles
│   ├── js/                # TypeScript/SolidJS frontend
│   │   ├── api/          # API clients
│   │   ├── components/   # UI components
│   │   ├── lib/          # Utilities (i18n, etc.)
│   │   ├── pages/        # Page components
│   │   ├── queries/      # TanStack Query hooks
│   │   ├── store/        # Global state
│   │   └── types/        # TypeScript types
│   └── views/             # Blade templates
├── routes/                 # API & web routes
├── tests/                  # Feature & unit tests
└── vite.config.ts         # Vite configuration
```

## 🤝 Contributing

We welcome contributions! Please see:
- [Development Setup](development/SETUP.md)
- [Frontend Architecture](development/FRONTEND.md)
- [Testing Guide](development/TESTING.md)

## 📝 License

MIT License - Same as Heimdall

## 🙏 Credits

Based on [Heimdall](https://github.com/linuxserver/Heimdall) by LinuxServer.io

## 📬 Support

- **Issues**: [GitHub Issues](https://github.com/your-org/himinbjorg/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/himinbjorg/discussions)
- **Discord**: [Join our Discord](https://discord.gg/your-invite)

## 🗺️ Roadmap

- [ ] PWA support
- [ ] Dark mode toggle
- [ ] Mobile app
- [ ] Enhanced app marketplace
- [ ] Plugin system
- [ ] Advanced RBAC

## ⚡ Performance

- **Bundle Size**: 72 kB gzipped (JS + CSS)
- **First Paint**: < 1s
- **Interactive**: < 1.5s
- **Lighthouse Score**: 95+

## 🔐 Security

- CSRF protection
- XSS prevention (SVG sanitization)
- SQL injection protection (Eloquent ORM)
- SSRF protection (IP validation)
- Regular security updates

---

**Made with ❤️ using SolidJS, Laravel, and Vite**
