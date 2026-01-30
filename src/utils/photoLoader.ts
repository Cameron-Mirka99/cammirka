/**
 * Photo preloading and batch management utilities
 */

import { Photo } from '../types/photo';
import photoCache from './photoCache';

/**
 * Get newly received photos that haven't been seen before
 */
export const getNewPhotos = (
  photos: Photo[],
  seenKeys: Set<string>
): Photo[] => {
  return photos.filter(p => !seenKeys.has(p.key));
};

/**
 * Determine which photos to preload on initial load
 * Preloads only the first batch for immediate display
 */
export const getFirstBatchPhotos = (
  photos: Photo[],
  columnsCount: number
): Photo[] => {
  const batchSize = Math.max(3, columnsCount * 2);
  return photos.slice(0, batchSize);
};

/**
 * Preload a batch of photos into the cache
 */
export const preloadPhotoBatch = async (photos: Photo[]): Promise<void> => {
  try {
    const photoUrls = photos.map(p => p.url);
    await photoCache.preloadMany(photoUrls);
  } catch (error) {
    console.error('Error preloading photos:', error);
  }
};

/**
 * Shuffle an array of photos randomly
 */
export const shufflePhotos = (photos: Photo[]): Photo[] => {
  return [...photos].sort(() => Math.random() - 0.5);
};
