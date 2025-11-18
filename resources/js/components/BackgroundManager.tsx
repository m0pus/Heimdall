import { createEffect, onCleanup, onMount } from 'solid-js';
import { createQuery } from '@tanstack/solid-query';
import trianglify from 'trianglify';
import apiClient from '@/api/client';

interface BackgroundSettings {
  trianglify: boolean;
  trianglify_seed: string;
  background_image: string | null;
}

async function fetchBackgroundSettings(): Promise<BackgroundSettings> {
  const response = await apiClient.get<{ status: string; data: BackgroundSettings }>('/api/background');
  return response.data.data;
}

/**
 * BackgroundManager Component
 *
 * Handles background rendering for the application:
 * - Trianglify patterns (geometric backgrounds)
 * - Custom uploaded background images
 * - Falls back to default solid background
 *
 * Usage:
 * ```tsx
 * <BackgroundManager />
 * ```
 */
export default function BackgroundManager() {
  const backgroundQuery = createQuery(() => ({
    queryKey: ['background'],
    queryFn: fetchBackgroundSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  }));

  createEffect(() => {
    const data = backgroundQuery.data;
    if (!data) return;

    const appDiv = document.getElementById('app');
    if (!appDiv) return;

    // Remove existing background elements
    const existing = document.getElementById('trianglify-background');
    if (existing) {
      existing.remove();
    }

    // Mode 1: Trianglify Pattern
    if (data.trianglify) {
      try {
        const pattern = trianglify({
          width: window.innerWidth,
          height: window.innerHeight,
          seed: data.trianglify_seed || 'heimdall',
          cellSize: 75,
          variance: 0.75,
          xColors: 'random',
          yColors: 'match',
        });

        // Create canvas element
        const canvas = pattern.toCanvas();
        canvas.id = 'trianglify-background';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.zIndex = '-1';
        canvas.style.pointerEvents = 'none';

        // Insert canvas as first child of app
        appDiv.insertBefore(canvas, appDiv.firstChild);

        // Regenerate on window resize
        const handleResize = () => {
          const newPattern = trianglify({
            width: window.innerWidth,
            height: window.innerHeight,
            seed: data.trianglify_seed || 'heimdall',
            cellSize: 75,
            variance: 0.75,
            xColors: 'random',
            yColors: 'match',
          });
          const existingCanvas = document.getElementById('trianglify-background');
          if (existingCanvas) {
            const newCanvas = newPattern.toCanvas();
            newCanvas.id = 'trianglify-background';
            newCanvas.style.position = 'fixed';
            newCanvas.style.top = '0';
            newCanvas.style.left = '0';
            newCanvas.style.width = '100%';
            newCanvas.style.height = '100%';
            newCanvas.style.zIndex = '-1';
            newCanvas.style.pointerEvents = 'none';
            existingCanvas.replaceWith(newCanvas);
          }
        };

        window.addEventListener('resize', handleResize);

        onCleanup(() => {
          window.removeEventListener('resize', handleResize);
          const bg = document.getElementById('trianglify-background');
          if (bg) bg.remove();
        });
      } catch (error) {
        console.error('Failed to generate Trianglify background:', error);
      }
    }
    // Mode 2: Custom Background Image
    else if (data.background_image) {
      appDiv.style.backgroundImage = `url(${data.background_image})`;
      appDiv.style.backgroundSize = 'cover';
      appDiv.style.backgroundPosition = 'center';
      appDiv.style.backgroundRepeat = 'no-repeat';
      appDiv.style.backgroundAttachment = 'fixed';
    }
    // Mode 3: Default (no background)
    else {
      appDiv.style.backgroundImage = '';
      appDiv.style.backgroundSize = '';
      appDiv.style.backgroundPosition = '';
      appDiv.style.backgroundRepeat = '';
      appDiv.style.backgroundAttachment = '';
    }
  });

  // This component doesn't render anything visible
  return null;
}
