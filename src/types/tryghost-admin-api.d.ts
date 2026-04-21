declare module '@tryghost/admin-api' {
  interface GhostAdminAPIOptions {
    url: string;
    key: string;
    version: string;
  }

  interface PageObject {
    title: string;
    html: string;
    status?: 'draft' | 'published';
  }

  interface PostObject {
    title: string;
    html: string;
    feature_image?: string;
    feature_image_alt?: string;
    feature_image_caption?: string;
    tags?: Array<{
      name: string;
      description?: string;
    }>;
    status?: 'draft' | 'published';
  }

  interface AddOptions {
    source?: 'html' | 'mobiledoc';
  }

  class GhostAdminAPI {
    constructor(options: GhostAdminAPIOptions);

    site: {
      read(): Promise<unknown>;
    };

    pages: {
      add(page: PageObject, options?: AddOptions): Promise<unknown>;
      browse(): Promise<unknown>;
      read(options: { id: string }): Promise<unknown>;
      edit(page: PageObject & { id: string }): Promise<unknown>;
      delete(options: { id: string }): Promise<unknown>;
    };

    posts: {
      add(post: PostObject, options?: AddOptions): Promise<unknown>;
      browse(): Promise<unknown>;
      read(options: { id: string }): Promise<unknown>;
      edit(post: PostObject & { id: string }): Promise<unknown>;
      delete(options: { id: string }): Promise<unknown>;
    };
  }

  export = GhostAdminAPI;
}
