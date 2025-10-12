import Anthropic from '@anthropic-ai/sdk';
import { BaseProvider } from './base.js';
import type {
  GenerationRequest,
  GenerationResponse,
  AnthropicConfig,
} from '../types/index.js';
import { ProviderError } from '../types/index.js';

/**
 * Anthropic (Claude) provider implementation
 */
export class AnthropicProvider extends BaseProvider {
  name = 'anthropic' as const;
  private client: Anthropic | null = null;
  private config: AnthropicConfig;

  constructor(config: AnthropicConfig) {
    super();
    this.config = config;
    if (this.isConfigured()) {
      this.client = new Anthropic({ apiKey: this.config.apiKey });
    }
  }

  isConfigured(): boolean {
    return !!this.config.apiKey && this.config.enabled;
  }

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    this.validateRequest(request);

    if (!this.client) {
      throw new ProviderError('Anthropic client not configured', 'anthropic');
    }

    const model = request.model || this.config.defaultModel;

    try {
      const response = await this.client.messages.create({
        model,
        max_tokens: request.options?.maxTokens ?? 4000,
        temperature: request.options?.temperature ?? 0.7,
        top_p: request.options?.topP,
        system: request.systemPrompt,
        messages: [
          {
            role: 'user',
            content: request.prompt,
          },
        ],
      });

      const content =
        response.content[0]?.type === 'text' ? response.content[0].text : '';

      return {
        content,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
        model: response.model,
        provider: this.name,
        cost: this.estimateCost(
          response.usage.input_tokens,
          response.usage.output_tokens,
          response.model
        ),
      };
    } catch (error) {
      if (error instanceof Anthropic.APIError) {
        throw new ProviderError(
          `Anthropic API error: ${error.message}`,
          'anthropic'
        );
      }
      throw new ProviderError(
        `Anthropic generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'anthropic'
      );
    }
  }

  async listModels(): Promise<string[]> {
    // Anthropic doesn't have a public API to list models
    // Return known models as of January 2025
    return [
      'claude-sonnet-4-5-20250929',
      'claude-sonnet-4-20250514',
      'claude-3-7-sonnet-20250219',
      'claude-opus-4-1-20250805',
      'claude-opus-4-20250514',
      'claude-3-5-haiku-20241022',
      'claude-3-haiku-20240307',
    ];
  }

  async testConnection(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      // Simple test with minimal tokens
      await this.client.messages.create({
        model: this.config.defaultModel,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
      });
      return true;
    } catch (error) {
      // Parse and display user-friendly error message
      if (error instanceof Anthropic.APIError) {
        let errorMessage = error.message;

        // Try to parse JSON error details
        try {
          const errorMatch = error.message.match(/\{.*\}/);
          if (errorMatch) {
            const errorData = JSON.parse(errorMatch[0]);
            if (errorData.error?.message) {
              errorMessage = errorData.error.message;
            }
          }
        } catch {
          // If parsing fails, use the original message
        }

        console.error(`\n❌ Anthropic API Error: ${errorMessage}`);

        // Add helpful tips based on error type
        if (errorMessage.includes('credit balance')) {
          console.error('💡 Visit https://console.anthropic.com/settings/billing to add credits\n');
        } else if (errorMessage.includes('authentication') || errorMessage.includes('api key')) {
          console.error('💡 Check your API key at https://console.anthropic.com/settings/keys\n');
        } else if (errorMessage.includes('model')) {
          console.error('💡 This model may not be available yet. Try claude-3-5-haiku-20241022\n');
        }
      } else if (error instanceof Error) {
        console.error(`\n❌ Connection error: ${error.message}\n`);
      }
      return false;
    }
  }

  /**
   * Estimate cost for Anthropic models
   * Prices as of October 2024 (per 1M tokens)
   */
  protected estimateCost(
    promptTokens: number,
    completionTokens: number,
    model: string
  ): number {
    const pricing: Record<
      string,
      { prompt: number; completion: number }
    > = {
      'claude-3-5-sonnet': { prompt: 3.0, completion: 15.0 },
      'claude-3-opus': { prompt: 15.0, completion: 75.0 },
      'claude-3-sonnet': { prompt: 3.0, completion: 15.0 },
      'claude-3-haiku': { prompt: 0.25, completion: 1.25 },
    };

    // Find matching model pricing
    let modelPricing = pricing['claude-3-haiku']; // default to cheapest
    for (const [key, value] of Object.entries(pricing)) {
      if (model.includes(key)) {
        modelPricing = value;
        break;
      }
    }

    const promptCost = (promptTokens / 1_000_000) * modelPricing.prompt;
    const completionCost =
      (completionTokens / 1_000_000) * modelPricing.completion;

    return promptCost + completionCost;
  }
}
