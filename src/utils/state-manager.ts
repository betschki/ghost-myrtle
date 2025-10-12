import fs from 'fs/promises';
import path from 'path';
import type { SiteContext, PageContent, PostContent } from '../types/index.js';

/**
 * Generation state for resuming interrupted sessions
 */
export interface GenerationState {
  siteContext: SiteContext;
  includeStyleguide: boolean;
  generatePages: boolean;
  pageTitles: string[];
  categories: Array<{
    name: string;
    postCount: number;
  }>;

  // Completed items
  completedPages: PageContent[];
  completedPosts: Array<{
    category: string;
    posts: PostContent[];
  }>;

  // Pending items
  pendingPages: string[];
  pendingPosts: Array<{
    category: string;
    titlesGenerated: boolean;
    titles: string[];
    pendingTitles: string[];
  }>;

  // Metadata
  startedAt: string;
  lastUpdated: string;
  totalPages: number;
  totalPosts: number;
}

/**
 * Manages generation state for resume functionality
 */
export class StateManager {
  private static STATE_FILE = '.myrtle-state.json';

  /**
   * Get the state file path (in current working directory)
   */
  private static getStatePath(): string {
    return path.join(process.cwd(), this.STATE_FILE);
  }

  /**
   * Check if a saved state exists
   */
  static async hasState(): Promise<boolean> {
    try {
      await fs.access(this.getStatePath());
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Load saved state
   */
  static async load(): Promise<GenerationState | null> {
    try {
      const content = await fs.readFile(this.getStatePath(), 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * Save current state
   */
  static async save(state: GenerationState): Promise<void> {
    state.lastUpdated = new Date().toISOString();
    await fs.writeFile(
      this.getStatePath(),
      JSON.stringify(state, null, 2),
      'utf-8'
    );
  }

  /**
   * Delete saved state (after successful completion)
   */
  static async clear(): Promise<void> {
    try {
      await fs.unlink(this.getStatePath());
    } catch {
      // File doesn't exist, that's fine
    }
  }

  /**
   * Create initial state
   */
  static createInitialState(
    siteContext: SiteContext,
    includeStyleguide: boolean,
    generatePages: boolean,
    pageTitles: string[],
    categories: Array<{ name: string; postCount: number }>
  ): GenerationState {
    const pendingPages: string[] = [];

    // Add styleguide to pending if requested
    if (includeStyleguide) {
      pendingPages.push('Style Guide & Content Showcase');
    }

    // Add custom pages to pending if requested
    if (generatePages) {
      pendingPages.push(...pageTitles);
    }

    return {
      siteContext,
      includeStyleguide,
      generatePages,
      pageTitles,
      categories,
      completedPages: [],
      completedPosts: [],
      pendingPages,
      pendingPosts: categories.map((cat) => ({
        category: cat.name,
        titlesGenerated: false,
        titles: [],
        pendingTitles: [],
      })),
      startedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      totalPages: pendingPages.length,
      totalPosts: categories.reduce((sum, cat) => sum + cat.postCount, 0),
    };
  }

  /**
   * Mark a page as completed
   */
  static markPageComplete(
    state: GenerationState,
    page: PageContent
  ): GenerationState {
    return {
      ...state,
      completedPages: [...state.completedPages, page],
      pendingPages: state.pendingPages.filter((p) => p !== page.title),
    };
  }

  /**
   * Mark titles as generated for a category
   */
  static markTitlesGenerated(
    state: GenerationState,
    category: string,
    titles: string[]
  ): GenerationState {
    return {
      ...state,
      pendingPosts: state.pendingPosts.map((pending) =>
        pending.category === category
          ? {
              ...pending,
              titlesGenerated: true,
              titles,
              pendingTitles: titles,
            }
          : pending
      ),
    };
  }

  /**
   * Mark a post as completed
   */
  static markPostComplete(
    state: GenerationState,
    category: string,
    post: PostContent
  ): GenerationState {
    // Update pending posts
    const updatedPendingPosts = state.pendingPosts.map((pending) =>
      pending.category === category
        ? {
            ...pending,
            pendingTitles: pending.pendingTitles.filter(
              (t) => t !== post.title
            ),
          }
        : pending
    );

    // Update completed posts
    const existingCategoryIndex = state.completedPosts.findIndex(
      (cp) => cp.category === category
    );

    let updatedCompletedPosts;
    if (existingCategoryIndex >= 0) {
      updatedCompletedPosts = state.completedPosts.map((cp, index) =>
        index === existingCategoryIndex
          ? { ...cp, posts: [...cp.posts, post] }
          : cp
      );
    } else {
      updatedCompletedPosts = [
        ...state.completedPosts,
        { category, posts: [post] },
      ];
    }

    return {
      ...state,
      completedPosts: updatedCompletedPosts,
      pendingPosts: updatedPendingPosts,
    };
  }

  /**
   * Get progress summary
   */
  static getProgress(state: GenerationState): {
    pagesComplete: number;
    pagesTotal: number;
    postsComplete: number;
    postsTotal: number;
    percentComplete: number;
  } {
    const pagesComplete = state.completedPages.length;
    const pagesTotal = state.totalPages;

    const postsComplete = state.completedPosts.reduce(
      (sum, cat) => sum + cat.posts.length,
      0
    );
    const postsTotal = state.totalPosts;

    const totalItems = pagesTotal + postsTotal;
    const completedItems = pagesComplete + postsComplete;
    const percentComplete =
      totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return {
      pagesComplete,
      pagesTotal,
      postsComplete,
      postsTotal,
      percentComplete,
    };
  }
}
