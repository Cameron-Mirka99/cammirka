/**
 * Gallery configuration and initialization utilities
 */

export type GalleryItem = {
  src: string;
  thumb: string;
};

export type GalleryConfig = {
  items: GalleryItem[];
  gallery: { layout: string };
  thumbnailHoverEffect2: string;
  thumbnailHeight: string;
  thumbnailWidth: number;
  thumbnailAlignment: string;
  thumbnailDisplayScale: number;
  lazyLoad: boolean;
  lazyLoadTreshold: number;
  viewerImageDisplay: string;
  viewerTools: {
    topRight: string;
    topLeft: string;
  };
};

/**
 * Create nanogallery2 configuration object
 */
export const createGalleryConfig = (
  items: GalleryItem[],
  thumbnailWidth: number,
  thumbnailHeight: string
): GalleryConfig => {
  return {
    items,
    gallery: {
      layout: 'masonry',
    },
    thumbnailHoverEffect2: 'image_scale_1.00_1.05_5000|image_rotateZ_0deg_2deg_5000',
    thumbnailHeight,
    thumbnailWidth,
    thumbnailAlignment: 'center',
    thumbnailDisplayScale: 100,
    lazyLoad: true,
    lazyLoadTreshold: 100,
    viewerImageDisplay: 'upscale',
    viewerTools: {
      topRight: 'close',
      topLeft: '',
    },
  };
};

/**
 * Initialize nanogallery2 with configuration on a DOM element
 */
export const initializeNanogallery2 = (
  element: HTMLDivElement,
  config: GalleryConfig
): void => {
  try {
    if (typeof (window as any).jQuery === 'undefined') {
      throw new Error('jQuery is not available');
    }

    const jQueryElement = (window as any).jQuery(element);
    jQueryElement.nanogallery2(config);
  } catch (error) {
    console.error('Error initializing nanogallery2:', error);
  }
};
