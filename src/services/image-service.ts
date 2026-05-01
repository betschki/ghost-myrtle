/**
 * Image service for fetching images from Pexels API
 */

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  alt: string;
}

interface PexelsSearchResponse {
  photos: PexelsPhoto[];
  total_results: number;
  page: number;
  per_page: number;
}

export interface ImageResult {
  url: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
  /** True for Pexels results, false for the Lorem Picsum fallback. */
  fromPexels: boolean;
}

const LOREM_PICSUM_PHOTOGRAPHER = 'Lorem Picsum';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeHttpUrl(value: string): string | null {
  try {
    const parsed = new URL(value);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
  } catch {
    // fall through
  }
  return null;
}

/**
 * Render Pexels-compliant photo credit as HTML. Returns an empty string for
 * Lorem Picsum fallbacks (no attribution required, and "Photo by Lorem Picsum"
 * looks odd on a polished demo site). Pexels' API guidelines require linking
 * both the photographer's profile and pexels.com.
 */
export function formatPhotoCredit(image: ImageResult): string {
  if (!image.fromPexels) {
    return '';
  }

  const photographer = escapeHtml(image.photographer);
  const profileUrl = safeHttpUrl(image.photographerUrl);
  const photographerHtml = profileUrl
    ? `<a href="${escapeHtml(profileUrl)}">${photographer}</a>`
    : photographer;

  return `Photo by ${photographerHtml} on <a href="https://www.pexels.com">Pexels</a>`;
}

export class ImageService {
  private apiKey: string | null;
  private baseUrl = 'https://api.pexels.com/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || null;
  }

  /**
   * Check if the service is configured
   */
  isConfigured(): boolean {
    return this.apiKey !== null && this.apiKey.length > 0;
  }

  /**
   * Search for images by keyword
   */
  async searchImages(
    query: string,
    count: number = 1
  ): Promise<ImageResult[]> {
    if (!this.isConfigured()) {
      throw new Error(
        'Pexels API key not configured. Run `myrtle config` to add your Pexels API key.'
      );
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
        {
          headers: {
            Authorization: this.apiKey!,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            'Invalid Pexels API key. Please check your configuration.'
          );
        }
        throw new Error(
          `Pexels API error: ${response.status} ${response.statusText}`
        );
      }

      const data = (await response.json()) as PexelsSearchResponse;

      return data.photos.map((photo) => ({
        url: photo.src.large,
        alt: photo.alt || query,
        photographer: photo.photographer,
        photographerUrl: photo.photographer_url,
        fromPexels: true,
      }));
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch images from Pexels');
    }
  }

  /**
   * Get a fallback Lorem Picsum image (no API key needed)
   */
  getFallbackImage(keyword: string): ImageResult {
    // Use keyword directly as seed for predictable, reproducible images
    // Replace spaces with hyphens for clean URLs
    const cleanSeed = keyword.toLowerCase().replace(/\s+/g, '-');

    return {
      url: `https://picsum.photos/seed/${cleanSeed}/1600/900`,
      alt: `${keyword} - placeholder image`,
      photographer: LOREM_PICSUM_PHOTOGRAPHER,
      photographerUrl: 'https://picsum.photos',
      fromPexels: false,
    };
  }

  /**
   * Get images for a blog post - tries Pexels (with progressively broader
   * keywords), falls back to Lorem Picsum on errors or zero results.
   */
  async getImagesForPost(
    keywords: string[],
    count: number = 2
  ): Promise<ImageResult[]> {
    if (!this.isConfigured()) {
      return this.fallbackImages(keywords, count);
    }

    // Try each keyword in order so specific titles fall back to broader
    // category terms before giving up on Pexels entirely. Title queries are
    // often too specific to match Pexels stock photos.
    const queries = keywords.length > 0 ? keywords : ['landscape'];

    for (const query of queries) {
      try {
        const results = await this.searchImages(query, count);
        if (results.length > 0) {
          return results;
        }
      } catch (error) {
        console.warn(
          'Pexels API failed, using fallback images:',
          error instanceof Error ? error.message : 'Unknown error'
        );
        return this.fallbackImages(keywords, count);
      }
    }

    return this.fallbackImages(keywords, count);
  }

  /**
   * Build a list of Lorem Picsum images, one per distinct keyword, capped at
   * `count`. Avoids padding with duplicate seeds (same seed = same picsum
   * image), which would put the same URL on the hero and an inline slot.
   */
  private fallbackImages(keywords: string[], count: number): ImageResult[] {
    const seeds = keywords.length > 0 ? keywords : ['placeholder'];
    return seeds.slice(0, count).map((seed) => this.getFallbackImage(seed));
  }
}
