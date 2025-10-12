import type {
  Provider,
  GenerationRequest,
  GenerationResponse,
  ProviderName,
} from '../types/index.js';

/**
 * Base abstract class for AI providers
 */
export abstract class BaseProvider implements Provider {
  abstract name: ProviderName;

  /**
   * Check if the provider is properly configured
   */
  abstract isConfigured(): boolean;

  /**
   * Generate content using the provider's AI model
   */
  abstract generate(request: GenerationRequest): Promise<GenerationResponse>;

  /**
   * List available models (optional)
   */
  async listModels(): Promise<string[]> {
    return [];
  }

  /**
   * Test connection to the provider
   */
  abstract testConnection(): Promise<boolean>;

  /**
   * Estimate cost for a generation request
   * @param _promptTokens Number of tokens in the prompt
   * @param _completionTokens Number of tokens in the completion
   * @param _model Model name
   */
  protected estimateCost(
    _promptTokens: number,
    _completionTokens: number,
    _model: string
  ): number {
    // Default implementation - override in specific providers
    return 0;
  }

  /**
   * Validate generation request
   */
  protected validateRequest(request: GenerationRequest): void {
    if (!request.prompt || request.prompt.trim().length === 0) {
      throw new Error('Prompt cannot be empty');
    }

    if (request.options?.temperature !== undefined) {
      if (request.options.temperature < 0 || request.options.temperature > 2) {
        throw new Error('Temperature must be between 0 and 2');
      }
    }

    if (request.options?.maxTokens !== undefined) {
      if (request.options.maxTokens < 1) {
        throw new Error('Max tokens must be positive');
      }
    }
  }

  /**
   * Count tokens (rough estimate)
   * More accurate implementations should be in specific providers
   */
  protected estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }
}
