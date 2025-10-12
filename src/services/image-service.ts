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
      photographer: 'Lorem Picsum',
      photographerUrl: 'https://picsum.photos',
    };
  }

  /**
   * Get images for a blog post - tries Pexels, falls back to Lorem Picsum
   */
  async getImagesForPost(
    keywords: string[],
    count: number = 2
  ): Promise<ImageResult[]> {
    if (!this.isConfigured()) {
      // Return fallback images
      return keywords.slice(0, count).map((keyword) =>
        this.getFallbackImage(keyword)
      );
    }

    try {
      // Use the first keyword for search
      const query = keywords[0] || 'landscape';
      return await this.searchImages(query, count);
    } catch (error) {
      // If Pexels fails, fall back to Lorem Picsum
      console.warn(
        'Pexels API failed, using fallback images:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return keywords.slice(0, count).map((keyword) =>
        this.getFallbackImage(keyword)
      );
    }
  }
}
