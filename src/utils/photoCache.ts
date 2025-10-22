// Simple in-memory photo cache that stores object URLs for fetched image blobs.
// This prevents re-downloading the same image when components unmount/remount
// during client-side navigation.

const cache = new Map<string, string>(); // originalUrl -> objectUrl
const inFlight = new Map<string, Promise<void>>();

export async function preload(url: string): Promise<void> {
  if (!url) return;
  if (cache.has(url)) return;
  if (inFlight.has(url)) return inFlight.get(url) as Promise<void>;

  const p = (async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      cache.set(url, objectUrl);
    } catch (err) {
      // Don't throw — just log and allow callers to fall back to original URL
      // (browser may still cache the resource based on server headers).
      // eslint-disable-next-line no-console
      console.warn('photoCache preload failed for', url, err);
    } finally {
      inFlight.delete(url);
    }
  })();

  inFlight.set(url, p);
  return p;
}

export function get(url: string): string | undefined {
  return cache.get(url);
}

export async function preloadMany(urls: string[]): Promise<void[]> {
  const unique = Array.from(new Set(urls.filter(Boolean)));
  return Promise.all(unique.map(u => preload(u)));
}

export function has(url: string): boolean {
  return cache.has(url);
}

export function clear(): void {
  for (const objUrl of cache.values()) {
    try {
      URL.revokeObjectURL(objUrl);
    } catch (_) {
      // ignore
    }
  }
  cache.clear();
}

export const PhotoCache = {
  preload,
  preloadMany,
  get,
  has,
  clear,
};

export default PhotoCache;
