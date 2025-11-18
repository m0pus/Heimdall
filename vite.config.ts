import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import laravel from 'laravel-vite-plugin';
import path from 'path';

export default defineConfig({
  plugins: [
    laravel({
      input: ['resources/js/app.tsx', 'resources/css/app.css'],
      refresh: true,
    }),
    solidPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './resources/js'),
      '@components': path.resolve(__dirname, './resources/js/components'),
      '@queries': path.resolve(__dirname, './resources/js/queries'),
      '@lib': path.resolve(__dirname, './resources/js/lib'),
      '@types': path.resolve(__dirname, './resources/js/types'),
      '@api': path.resolve(__dirname, './resources/js/api'),
      '@store': path.resolve(__dirname, './resources/js/store'),
    },
  },
  base: '/',
  server: {
    hmr: {
      host: 'localhost',
    },
  },
  build: {
    manifest: true,
    outDir: 'public/build',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
});
