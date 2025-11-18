/**
 * Color extraction utilities for extracting dominant colors from images
 */

interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Extract the dominant color from an image URL
 * Uses canvas to analyze pixel data and find the most common color
 */
export async function extractDominantColor(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Scale down image for faster processing
        const maxSize = 100;
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        // Count color occurrences
        const colorCounts = new Map<string, { count: number; rgb: RGB }>();
        const threshold = 20; // Threshold to group similar colors

        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];

          // Skip transparent or near-transparent pixels
          if (a < 50) continue;

          // Skip very light colors (likely background)
          if (r > 240 && g > 240 && b > 240) continue;

          // Quantize colors to reduce variations
          const qr = Math.round(r / threshold) * threshold;
          const qg = Math.round(g / threshold) * threshold;
          const qb = Math.round(b / threshold) * threshold;

          const key = `${qr},${qg},${qb}`;

          if (colorCounts.has(key)) {
            colorCounts.get(key)!.count++;
          } else {
            colorCounts.set(key, { count: 1, rgb: { r: qr, g: qg, b: qb } });
          }
        }

        // Find most common color
        let maxCount = 0;
        let dominantColor: RGB = { r: 59, g: 130, b: 246 }; // Default blue

        colorCounts.forEach(({ count, rgb }) => {
          if (count > maxCount) {
            maxCount = count;
            dominantColor = rgb;
          }
        });

        // Convert to hex
        const hex = rgbToHex(dominantColor.r, dominantColor.g, dominantColor.b);
        resolve(hex);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      // Fallback to default color on error
      resolve('#3b82f6');
    };

    img.src = imageUrl;
  });
}

/**
 * Extract a palette of colors from an image
 * Returns an array of the most common colors
 */
export async function extractColorPalette(
  imageUrl: string,
  numColors: number = 5
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        const maxSize = 100;
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        const colorCounts = new Map<string, { count: number; rgb: RGB }>();
        const threshold = 20;

        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];

          if (a < 50) continue;
          if (r > 240 && g > 240 && b > 240) continue;

          const qr = Math.round(r / threshold) * threshold;
          const qg = Math.round(g / threshold) * threshold;
          const qb = Math.round(b / threshold) * threshold;

          const key = `${qr},${qg},${qb}`;

          if (colorCounts.has(key)) {
            colorCounts.get(key)!.count++;
          } else {
            colorCounts.set(key, { count: 1, rgb: { r: qr, g: qg, b: qb } });
          }
        }

        // Sort by count and take top N
        const sortedColors = Array.from(colorCounts.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, numColors)
          .map((color) => rgbToHex(color.rgb.r, color.rgb.g, color.rgb.b));

        resolve(sortedColors.length > 0 ? sortedColors : ['#3b82f6']);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      resolve(['#3b82f6']);
    };

    img.src = imageUrl;
  });
}

/**
 * Calculate the brightness of a color (0-255)
 */
export function getBrightness(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 128;

  // Perceived brightness formula
  return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
}

/**
 * Determine if a color is light or dark
 */
export function isLightColor(hex: string): boolean {
  return getBrightness(hex) > 128;
}

/**
 * Darken a color by a percentage (0-100)
 */
export function darkenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const factor = 1 - percent / 100;
  const r = Math.max(0, Math.round(rgb.r * factor));
  const g = Math.max(0, Math.round(rgb.g * factor));
  const b = Math.max(0, Math.round(rgb.b * factor));

  return rgbToHex(r, g, b);
}

/**
 * Lighten a color by a percentage (0-100)
 */
export function lightenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const factor = percent / 100;
  const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * factor));
  const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * factor));
  const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * factor));

  return rgbToHex(r, g, b);
}

/**
 * Get a complementary background color for an icon color
 * Returns a slightly muted version suitable for tile backgrounds
 */
export function getComplementaryBackground(iconColor: string): string {
  const brightness = getBrightness(iconColor);

  if (brightness > 180) {
    // Very light color - darken it significantly
    return darkenColor(iconColor, 60);
  } else if (brightness > 128) {
    // Medium-light color - darken moderately
    return darkenColor(iconColor, 30);
  } else if (brightness < 50) {
    // Very dark color - lighten it
    return lightenColor(iconColor, 40);
  } else {
    // Medium-dark color - use as-is or slightly muted
    return darkenColor(iconColor, 10);
  }
}

/**
 * Convert RGB to hex color
 */
function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

/**
 * Convert hex to RGB
 */
function hexToRgb(hex: string): RGB | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}
