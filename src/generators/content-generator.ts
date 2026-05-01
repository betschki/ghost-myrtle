import type {
  Provider,
  SiteContext,
  GeneratedContent,
  GenerationOptions,
} from '../types/index.js';
import { generateBlogPostPrompt } from '../prompts/templates/blog.js';
import { generateStaticPagePrompt } from '../prompts/templates/static-pages.js';
import {
  ImageService,
  formatPhotoCredit,
  type ImageResult,
} from '../services/image-service.js';

/**
 * Content generator for pages and posts
 */
export class ContentGenerator {
  private imageService: ImageService;

  constructor(private provider: Provider, pexelsApiKey?: string) {
    // Always create image service - it handles fallback internally
    this.imageService = new ImageService(pexelsApiKey);
  }

  /**
   * Generate content for a blog post
   */
  async generateBlogPost(
    context: SiteContext,
    title: string,
    category?: string,
    keywords?: string[],
    options?: GenerationOptions
  ): Promise<GeneratedContent> {
    // Fetch images (will use Pexels if configured, Lorem Picsum otherwise)
    let featureImage: GeneratedContent['featureImage'] | undefined;
    let inlineImages: ImageResult[] | undefined;

    try {
      const searchKeywords = keywords || [category || title];
      const images = await this.imageService.getImagesForPost(searchKeywords, 3);
      if (images[0]) {
        const credit = formatPhotoCredit(images[0]);
        featureImage = {
          url: images[0].url,
          alt: images[0].alt,
          caption: credit || undefined,
        };
      }
      inlineImages = images.slice(1);
    } catch (error) {
      // If image fetching fails, continue without images
      console.warn('Failed to fetch images:', error);
    }

    const { prompt, systemPrompt } = generateBlogPostPrompt(
      context,
      title,
      this.provider.name,
      category,
      keywords,
      inlineImages
    );

    const response = await this.provider.generate({
      prompt,
      systemPrompt,
      options: options || {
        temperature: 0.7,
        maxTokens: 4000,
      },
    });

    const content = this.extractContent(response.content);
    const wordCount = this.countWords(content);

    return {
      title,
      content,
      featureImage,
      metadata: {
        keywords,
        wordCount,
        readingTime: Math.ceil(wordCount / 200), // Assuming 200 words/minute
      },
    };
  }

  /**
   * Generate content for a static page
   */
  async generateStaticPage(
    context: SiteContext,
    pageTitle: string,
    options?: GenerationOptions
  ): Promise<GeneratedContent> {
    const { prompt, systemPrompt } = generateStaticPagePrompt(
      context,
      pageTitle,
      this.provider.name
    );

    const response = await this.provider.generate({
      prompt,
      systemPrompt,
      options: options || {
        temperature: 0.7,
        maxTokens: 2000,
      },
    });

    const content = this.extractContent(response.content);
    const wordCount = this.countWords(content);

    return {
      title: pageTitle,
      content,
      metadata: {
        wordCount,
        readingTime: Math.ceil(wordCount / 200),
      },
    };
  }

  /**
   * Extract content from response, removing any wrapper tags
   */
  private extractContent(html: string): string {
    // Remove any markdown code blocks if present
    let content = html.replace(/```html\n?/g, '').replace(/```\n?/g, '');

    // Remove thinking tags (Claude sometimes includes these)
    content = content.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');

    // Remove any standalone thinking blocks that might not have closing tags
    content = content.replace(/<thinking>[\s\S]*/gi, '');

    // Extract body content if present
    const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      content = bodyMatch[1];
    }

    // Remove any h1 tags (Ghost adds these automatically)
    content = content.replace(/<h1[^>]*>[\s\S]*?<\/h1>/gi, '');

    return content.trim();
  }

  /**
   * Count words in HTML content
   */
  private countWords(html: string): number {
    // Strip HTML tags
    const text = html.replace(/<[^>]*>/g, ' ');

    // Count words
    const words = text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);

    return words.length;
  }

  /**
   * Generate excerpt from content
   */
  generateExcerpt(html: string, maxLength: number = 160): string {
    // Strip HTML tags
    const text = html.replace(/<[^>]*>/g, ' ').trim();

    // Get first sentence or maxLength characters
    const sentences = text.split(/[.!?]\s+/);
    const firstSentence = sentences[0] || text;

    if (firstSentence.length <= maxLength) {
      return firstSentence + '.';
    }

    return text.substring(0, maxLength).trim() + '...';
  }
}
