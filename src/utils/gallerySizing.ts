/**
 * Image sizing calculation utilities
 */

export type ThumbnailDimensions = {
  width: number;
  height: string;
};

/**
 * Calculate thumbnail dimensions based on column count and container width
 */
export const calculateThumbnailDimensions = (
  containerWidth: number,
  columnsCount: number
): ThumbnailDimensions => {
  // Cap at 3 columns maximum
  const maxColumns = Math.min(columnsCount, 3);

  // Account for gaps between items
  const gapSize = 16; // spacing between items (in pixels)
  const totalGaps = (maxColumns - 1) * gapSize;
  const availableWidth = containerWidth - totalGaps;
  const thumbnailWidth = Math.floor(availableWidth / maxColumns);

  // Height is auto to preserve image aspect ratios
  const thumbnailHeight = 'auto';

  return { width: thumbnailWidth, height: thumbnailHeight };
};

/**
 * Get the effective column count (capped at 3)
 */
export const getEffectiveColumnCount = (columnsCount: number): number => {
  return Math.min(columnsCount, 3);
};
