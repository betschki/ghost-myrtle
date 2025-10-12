import type { Provider, SiteContext, GenerationOptions } from '../types/index.js';
import { generateTitlePrompt } from '../prompts/templates/blog.js';

/**
 * Title generator for blog posts
 */
export class TitleGenerator {
  private previousTitles: string[] = [];

  constructor(private provider: Provider) {}

  /**
   * Generate multiple titles for a category
   */
  async generateTitles(
    context: SiteContext,
    category: string,
    count: number,
    keywords?: string[],
    options?: GenerationOptions
  ): Promise<string[]> {
    const { prompt, systemPrompt } = generateTitlePrompt(
      context,
      category,
      count,
      keywords,
      this.previousTitles
    );

    const response = await this.provider.generate({
      prompt,
      systemPrompt,
      options: options || {
        temperature: 0.8,
        maxTokens: 500,
      },
    });

    // Parse titles from response
    const titles = response.content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => this.cleanTitle(line))
      .filter((title) => title.length > 0)
      .slice(0, count);

    // Store titles for context in next generation
    this.previousTitles.push(...titles);

    return titles;
  }

  /**
   * Reset the title history (useful for new generation sessions)
   */
  resetHistory(): void {
    this.previousTitles = [];
  }

  /**
   * Clean up a title (remove numbering, quotes, etc.)
   */
  private cleanTitle(title: string): string {
    let cleaned = title.trim();

    // Remove numbering (1., 2., etc.)
    cleaned = cleaned.replace(/^\d+\.\s*/, '');

    // Remove quotes
    cleaned = cleaned.replace(/^["']|["']$/g, '');

    // Remove trailing punctuation (except ?, !)
    cleaned = cleaned.replace(/[.:;,]$/, '');

    // Limit to 255 characters (Ghost limit)
    cleaned = cleaned.slice(0, 255);

    return cleaned;
  }
}
