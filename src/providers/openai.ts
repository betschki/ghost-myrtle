import OpenAI from 'openai';
import { BaseProvider } from './base.js';
import type {
  GenerationRequest,
  GenerationResponse,
  OpenAIConfig,
} from '../types/index.js';
import { ProviderError } from '../types/index.js';

/**
 * OpenAI provider implementation
 */
export class OpenAIProvider extends BaseProvider {
  name = 'openai' as const;
  private client: OpenAI | null = null;
  private config: OpenAIConfig;

  constructor(config: OpenAIConfig) {
    super();
    this.config = config;
    if (this.isConfigured()) {
      this.client = new OpenAI({ apiKey: this.config.apiKey });
    }
  }

  isConfigured(): boolean {
    return !!this.config.apiKey && this.config.enabled;
  }

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    this.validateRequest(request);

    if (!this.client) {
      throw new ProviderError('OpenAI client not configured', 'openai');
    }

    const model = request.model || this.config.defaultModel;

    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

      if (request.systemPrompt) {
        messages.push({
          role: 'system',
          content: request.systemPrompt,
        });
      }

      messages.push({
        role: 'user',
        content: request.prompt,
      });

      const response = await this.client.chat.completions.create({
        model,
        messages,
        temperature: request.options?.temperature ?? 0.7,
        max_tokens: request.options?.maxTokens ?? 4000,
        top_p: request.options?.topP,
        presence_penalty: request.options?.presencePenalty,
        frequency_penalty: request.options?.frequencyPenalty,
      });

      const content = response.choices[0]?.message?.content || '';
      const usage = response.usage;

      return {
        content,
        usage: usage
          ? {
              promptTokens: usage.prompt_tokens,
              completionTokens: usage.completion_tokens,
              totalTokens: usage.total_tokens,
            }
          : undefined,
        model: response.model,
        provider: this.name,
        cost: usage
          ? this.estimateCost(
              usage.prompt_tokens,
              usage.completion_tokens,
              response.model
            )
          : undefined,
      };
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        throw new ProviderError(
          `OpenAI API error: ${error.message}`,
          'openai'
        );
      }
      throw new ProviderError(
        `OpenAI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'openai'
      );
    }
  }

  async listModels(): Promise<string[]> {
    if (!this.client) {
      throw new ProviderError('OpenAI client not configured', 'openai');
    }

    try {
      const models = await this.client.models.list();
      return models.data
        .filter((m) => m.id.includes('gpt'))
        .map((m) => m.id)
        .sort();
    } catch (error) {
      throw new ProviderError(
        `Failed to list OpenAI models: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'openai'
      );
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      // Simple test with minimal tokens
      await this.client.chat.completions.create({
        model: this.config.defaultModel,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
      });
      return true;
    } catch (error) {
      // Display user-friendly error message
      if (error instanceof OpenAI.APIError) {
        console.error(`\n❌ OpenAI API Error: ${error.message}`);

        // Add helpful tips based on error type
        if (error.message.includes('quota') || error.message.includes('billing')) {
          console.error('💡 Visit https://platform.openai.com/account/billing to check your credits\n');
        } else if (error.message.includes('authentication') || error.message.includes('api key')) {
          console.error('💡 Check your API key at https://platform.openai.com/api-keys\n');
        } else if (error.message.includes('model')) {
          console.error('💡 This model may not be available. Try gpt-4o-mini or gpt-3.5-turbo\n');
        }
      } else if (error instanceof Error) {
        console.error(`\n❌ Connection error: ${error.message}\n`);
      }
      return false;
    }
  }

  /**
   * Estimate cost for OpenAI models
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
      'gpt-4-turbo': { prompt: 10.0, completion: 30.0 },
      'gpt-4': { prompt: 30.0, completion: 60.0 },
      'gpt-4-32k': { prompt: 60.0, completion: 120.0 },
      'gpt-3.5-turbo': { prompt: 0.5, completion: 1.5 },
      'gpt-3.5-turbo-16k': { prompt: 3.0, completion: 4.0 },
    };

    // Find matching model pricing
    let modelPricing = pricing['gpt-3.5-turbo']; // default
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
