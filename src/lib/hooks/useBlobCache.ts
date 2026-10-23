const cache = new Map<string, string>();
const inFlight = new Map<string, Promise<string>>();

/** In-memory blob-URL cache so repeated lightbox opens don't re-fetch. */
export async function preloadBlob(url: string): Promise<string> {
  const cached = cache.get(url);
  if (cached) return cached;

  const pending = inFlight.get(url);
  if (pending) return pending;

  const promise = fetch(url)
    .then((res) => res.blob())
    .then((blob) => {
      const objectUrl = URL.createObjectURL(blob);
      cache.set(url, objectUrl);
      inFlight.delete(url);
      return objectUrl;
    })
    .catch((err) => {
      inFlight.delete(url);
      throw err;
    });

  inFlight.set(url, promise);
  return promise;
}

export function getCachedBlob(url: string): string | undefined {
  return cache.get(url);
}
