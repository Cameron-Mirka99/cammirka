declare module 'nanogallery2' {
  interface NGPlusItem {
    src: string;
    thumb?: string;
    title?: string;
    [key: string]: any;
  }

  interface NGPlusConfig {
    items?: NGPlusItem[];
    gallery?: {
      layout?: string;
      [key: string]: any;
    };
    thumbnailHeight?: number;
    thumbnailAlignment?: string;
    thumbnailDisplayScale?: number;
    viewerTools?: {
      topRight?: string;
      topLeft?: string;
      [key: string]: any;
    };
    [key: string]: any;
  }

  const NGPlus: {
    build(container: HTMLElement | string, config: NGPlusConfig): void;
    destroy(containerId: string): Promise<void>;
  };

  export default NGPlus;
}
