# Deployment Guide - Drop-in Heimdall Replacement

## Overview

Himinbjörg is designed as a **true drop-in replacement** for Heimdall. Users only need to swap the Docker image - no port changes, no configuration changes, no docker-compose modifications.

## How It Works

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Production                        │
│                                                     │
│   ┌──────────────────────────────────┐            │
│   │   Laravel (PHP) Server           │            │
│   │   Port: 80 or 443                │            │
│   │                                  │            │
│   │   Serves:                        │            │
│   │   • API endpoints (/api/*)       │            │
│   │   • Built assets (public/build/) │            │
│   │   • HTML (react.blade.php)       │            │
│   └──────────────────────────────────┘            │
│                                                     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                  Development                        │
│                                                     │
│   ┌──────────────┐         ┌────────────────┐     │
│   │ Vite Dev     │         │ Laravel (PHP)  │     │
│   │ Port: 5173   │◄────────┤ Port: 8000     │     │
│   │ (HMR only)   │  Proxy  │                │     │
│   └──────────────┘         └────────────────┘     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Production Serving

**Single Port**: Everything runs on one port (80/443/8000)

1. **Laravel serves the HTML**:
   ```php
   Route::get('/', function () {
       return view('react'); // react.blade.php
   });
   ```

2. **Blade template includes Vite directive**:
   ```blade
   @vite(['resources/js/app.tsx', 'resources/css/app.css'])
   ```

3. **@vite directive resolves to**:
   - **Development**: `<script type="module" src="http://localhost:5173/@vite/client"></script>`
   - **Production**: `<script type="module" src="/build/assets/app-[hash].js"></script>`

4. **Built assets served from public/build/**:
   ```
   public/build/
   ├── assets/
   │   ├── app-[hash].js
   │   └── app-[hash].css
   └── manifest.json
   ```

## Deployment Methods

### Method 1: Docker (Recommended)

**No changes needed from Heimdall setup!**

```yaml
# docker-compose.yml (same as Heimdall)
version: "3"
services:
  himinbjorg:
    image: your-registry/himinbjorg:latest
    container_name: himinbjorg
    ports:
      - "80:80"
    volumes:
      - ./config:/config
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=America/New_York
    restart: unless-stopped
```

**Dockerfile includes build step**:
```dockerfile
FROM php:8.2-apache

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get install -y nodejs

# Copy application
COPY . /var/www/html

# Install dependencies
RUN composer install --no-dev --optimize-autoloader
RUN npm ci

# Build assets for production
RUN npm run build

# Configure Apache
COPY docker/apache-config.conf /etc/apache2/sites-available/000-default.conf
RUN a2enmod rewrite

EXPOSE 80
```

### Method 2: Traditional Server

**1. Install dependencies:**
```bash
composer install --no-dev --optimize-autoloader
npm ci
```

**2. Build assets:**
```bash
npm run build
```

**3. Configure web server:**

**Apache (.htaccess already included)**:
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^(.*)$ public/$1 [L]
</IfModule>
```

**Nginx**:
```nginx
server {
    listen 80;
    server_name himinbjorg.local;
    root /var/www/himinbjorg/public;

    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

**4. Start server:**
```bash
php artisan serve --host=0.0.0.0 --port=80
# or use Apache/Nginx
```

### Method 3: Shared Hosting

**1. Upload files** via FTP/SFTP

**2. Run on server**:
```bash
composer install --no-dev
npm ci && npm run build
```

**3. Point domain** to `public/` directory

**4. Done!** - Single PHP process serves everything

## Build Process

### Development Build
```bash
npm run dev
```
- Runs Vite dev server on port 5173
- Runs Laravel server on port 8000
- Hot module replacement (HMR)
- Clears all caches first

### Production Build
```bash
npm run build
```
- Compiles TypeScript → JavaScript
- Bundles all modules
- Minifies and optimizes
- Generates `public/build/` directory
- Creates manifest.json
- No dev server needed

### Build Output
```
public/build/
├── assets/
│   ├── app-Cs8T9z6M.js      (198.26 kB minified, 65.96 kB gzipped)
│   └── app-BjxEq46A.css     (29.28 kB minified, 5.83 kB gzipped)
└── .vite/
    └── manifest.json         (asset references)
```

## Environment Variables

### Same as Heimdall ✅

```bash
APP_NAME=Himinbjörg
APP_ENV=production
APP_KEY=base64:...
APP_DEBUG=false
APP_URL=https://your-domain.com

DB_CONNECTION=sqlite
DB_DATABASE=/config/www/app.sqlite

# Optional: Custom app repository
APP_SOURCE=https://appslist.heimdall.site/

# Optional: Allow internal requests
ALLOW_INTERNAL_REQUESTS=false
```

**No new variables needed!**

## Port Configuration

### Production

**Only one port needed** (same as Heimdall):
- Port 80 (HTTP)
- Port 443 (HTTPS)
- Or custom port (e.g., 8080)

### Development

**Two ports** (local development only):
- Port 5173: Vite dev server (HMR)
- Port 8000: Laravel dev server

**Users never see these!**

## Verification

### Check Build Success

```bash
# 1. Build assets
npm run build

# 2. Check output
ls -lh public/build/assets/
# Should show app-[hash].js and app-[hash].css

# 3. Check manifest
cat public/build/.vite/manifest.json
# Should have asset references

# 4. Start Laravel
php artisan serve

# 5. Open browser
open http://localhost:8000
# Should load app without errors
```

### Check Production Mode

**Blade template should NOT reference localhost:5173**:

```bash
# Start server
php artisan serve

# Check page source
curl -s http://localhost:8000 | grep -E "(vite|localhost:5173)"

# Should ONLY find:
# <script type="module" src="/build/assets/app-[hash].js"></script>
# <link rel="stylesheet" href="/build/assets/app-[hash].css">

# Should NOT find:
# http://localhost:5173
```

## Migration from Heimdall

### For Docker Users

**1. Stop Heimdall**:
```bash
docker-compose down
```

**2. Backup data**:
```bash
cp -r ./config ./config.backup
```

**3. Update image** in docker-compose.yml:
```yaml
# Change from:
image: linuxserver/heimdall:latest

# To:
image: your-registry/himinbjorg:latest
```

**4. Start Himinbjörg**:
```bash
docker-compose up -d
```

**5. Access**:
- Same URL as before
- Same port as before
- Same data (database preserved)

### For Traditional Installs

**1. Backup**:
```bash
tar -czf heimdall-backup.tar.gz /var/www/heimdall
cp /var/www/heimdall/database/app.sqlite ~/app.sqlite.backup
```

**2. Replace code**:
```bash
cd /var/www/heimdall
git remote add himinbjorg https://github.com/your-org/himinbjorg.git
git fetch himinbjorg
git checkout himinbjorg/main
```

**3. Install & build**:
```bash
composer install --no-dev
npm ci
npm run build
```

**4. Restart web server**:
```bash
sudo systemctl restart apache2
# or
sudo systemctl restart nginx
```

**5. Done!**

## Troubleshooting

### Assets Not Loading (404)

**Problem**: 404 errors for `/build/assets/app-*.js`

**Solution**:
```bash
# 1. Check if files exist
ls -la public/build/assets/

# 2. If missing, rebuild
npm run build

# 3. Check permissions
chmod -R 755 public/build

# 4. Clear Laravel cache
php artisan cache:clear
php artisan config:clear
```

### Seeing Vite Dev URL in Production

**Problem**: Page tries to load `http://localhost:5173`

**Solution**:
```bash
# 1. Ensure APP_ENV=production
echo $APP_ENV  # should be "production"

# 2. Rebuild assets
npm run build

# 3. Clear cache
php artisan config:clear
php artisan view:clear

# 4. Restart server
```

### White Screen / JavaScript Errors

**Problem**: Blank page, no errors in PHP logs

**Solution**:
```bash
# 1. Check browser console
# 2. Look for JavaScript errors
# 3. Ensure build completed:
ls -lh public/build/assets/app-*.js
# Should be ~198 kB

# 4. Check manifest:
cat public/build/.vite/manifest.json
# Should have valid JSON

# 5. Rebuild if needed:
rm -rf public/build
npm run build
```

### Docker Container Issues

**Problem**: Container fails to start

**Solution**:
```bash
# 1. Check logs
docker logs himinbjorg

# 2. Verify build step in Dockerfile
docker build --no-cache -t himinbjorg .

# 3. Ensure npm run build completed:
docker run --rm himinbjorg ls -la /var/www/html/public/build/assets/

# 4. Check Apache config
docker exec himinbjorg cat /etc/apache2/sites-enabled/000-default.conf
```

## Performance Optimization

### Production Checklist

✅ **Run production build**:
```bash
npm run build
```

✅ **Enable OPcache** (php.ini):
```ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000
```

✅ **Enable Gzip** (Apache):
```apache
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript application/json
</IfModule>
```

✅ **Set cache headers** (Apache):
```apache
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/* "access plus 1 year"
</IfModule>
```

✅ **Optimize Laravel**:
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## Key Points

✅ **Single Port**: Everything on one port (80/443)
✅ **No Vite Server**: Vite only for development
✅ **Pre-built Assets**: Assets compiled at build time
✅ **Drop-in Replace**: Same ports, same config as Heimdall
✅ **Docker Compatible**: Works with existing Heimdall docker-compose.yml
✅ **Backward Compatible**: Uses same database, same structure

## Summary

| Aspect | Heimdall | Himinbjörg |
|--------|----------|------------|
| **Ports** | 80/443 | 80/443 (same!) |
| **Web Server** | Apache/Nginx | Apache/Nginx (same!) |
| **Database** | SQLite/MySQL/PostgreSQL | SQLite/MySQL/PostgreSQL (same!) |
| **Config** | .env | .env (same!) |
| **Docker** | docker-compose.yml | docker-compose.yml (same!) |
| **Assets** | Laravel Mix (built) | Vite (built) |
| **Frontend** | jQuery | SolidJS (compiled to JS) |
| **Serving** | PHP serves built JS | PHP serves built JS (same concept!) |

**Bottom line**: Users only change the Docker image name. Everything else stays the same!
