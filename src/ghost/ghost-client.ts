import GhostAdminApi from '@tryghost/admin-api';
import type {
  GhostConfig,
  PageContent,
  CategoryContent,
  GhostPost,
  PostContent,
} from '../types/index.js';
import { GhostApiError } from '../types/index.js';

/**
 * Ghost CMS API client wrapper
 */
export class GhostClient {
  private api: GhostAdminApi;

  constructor(config: GhostConfig) {
    this.api = new GhostAdminApi({
      url: config.url,
      version: 'v5.0',
      key: config.adminApiKey,
    });
  }

  /**
   * Test connection to Ghost API
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try to fetch site info as a connection test
      await this.api.site.read();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Push a single page to Ghost
   */
  async pushPage(
    page: PageContent,
    status: 'draft' | 'published' = 'published'
  ): Promise<void> {
    try {
      // Add slug if provided
      const baseData: any = {
        title: page.title,
        status,
      };

      if (page.slug) {
        baseData.slug = page.slug;
      }

      // Use lexical if provided, otherwise use html
      if (page.lexical) {
        baseData.lexical = page.lexical;
        await this.api.pages.add(baseData);
      } else if (page.content) {
        baseData.html = page.content;
        await this.api.pages.add(baseData, { source: 'html' });
      } else {
        throw new GhostApiError('Page must have either content or lexical data');
      }
    } catch (error) {
      throw new GhostApiError(
        `Failed to push page "${page.title}": ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Push a single post to Ghost
   */
  async pushPost(
    post: PostContent,
    tags: string[],
    status: 'draft' | 'published' = 'published'
  ): Promise<void> {
    try {
      const ghostPost: GhostPost = {
        title: post.title,
        html: post.content,
        custom_excerpt: post.excerpt,
        feature_image: post.featureImage?.url,
        feature_image_alt: post.featureImage?.alt,
        feature_image_caption: post.featureImage?.caption,
        tags: tags.map((tag) => ({
          name: tag,
          description: `Content related to ${tag}`,
        })),
        status,
      };

      await this.api.posts.add(ghostPost, { source: 'html' });
    } catch (error) {
      throw new GhostApiError(
        `Failed to push post "${post.title}": ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Push multiple pages to Ghost
   */
  async pushPages(
    pages: PageContent[],
    status: 'draft' | 'published' = 'published'
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const page of pages) {
      try {
        await this.pushPage(page, status);
        success++;
      } catch (error) {
        failed++;
        errors.push(
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }

    return { success, failed, errors };
  }

  /**
   * Push categories and their posts to Ghost
   */
  async pushCategoriesWithPosts(
    categories: CategoryContent[],
    status: 'draft' | 'published' = 'published'
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const category of categories) {
      for (const post of category.posts) {
        try {
          await this.pushPost(post, [category.category], status);
          success++;
        } catch (error) {
          failed++;
          errors.push(
            error instanceof Error ? error.message : 'Unknown error'
          );
        }
      }
    }

    return { success, failed, errors };
  }

  /**
   * Push all content (pages and categories) to Ghost
   */
  async pushAllContent(
    pages: PageContent[],
    categories: CategoryContent[],
    status: 'draft' | 'published' = 'published'
  ): Promise<{
    pages: { success: number; failed: number };
    posts: { success: number; failed: number };
    errors: string[];
  }> {
    const pagesResult = await this.pushPages(pages, status);
    const postsResult = await this.pushCategoriesWithPosts(categories, status);

    return {
      pages: {
        success: pagesResult.success,
        failed: pagesResult.failed,
      },
      posts: {
        success: postsResult.success,
        failed: postsResult.failed,
      },
      errors: [...pagesResult.errors, ...postsResult.errors],
    };
  }
}
