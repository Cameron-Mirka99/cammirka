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
  locationHash: boolean;
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

export const createGalleryConfig = (
  items: GalleryItem[],
  thumbnailWidth: number,
  thumbnailHeight: string
): GalleryConfig => {
  return {
    items,

    gallery: { layout: "masonry" },

    // ✅ REQUIRED for React / SPA routing
    // Prevents hash/history updates that instantly close the lightbox
    locationHash: false,

    thumbnailHoverEffect2:
      "image_scale_1.00_1.05_5000|image_rotateZ_0deg_2deg_5000",

    thumbnailHeight,
    thumbnailWidth,
    thumbnailAlignment: "center",
    thumbnailDisplayScale: 100,

    lazyLoad: true,
    lazyLoadTreshold: 100,

    viewerImageDisplay: "upscale",
    viewerTools: {
      topRight: "close",
      topLeft: "",
    },
  };
};

export const initializeNanogallery2 = (
  element: HTMLDivElement,
  config: GalleryConfig
): void => {
  try {
    const w = window as any;
    if (!w.jQuery) throw new Error("jQuery not available");

    const $el = w.jQuery(element);

    // Clean init (safe even if not previously initialized)
    try {
      $el.nanogallery2("destroy");
    } catch {}

    $el.removeData("nanogallery2");
    $el.nanogallery2(config);
  } catch (error) {
    console.error("[initializeNanogallery2]", error);
  }
};

