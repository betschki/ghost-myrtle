import OpenAI from 'openai';
import { BaseProvider } from './base.js';
import type {
  GenerationRequest,
  GenerationResponse,
  OpenRouterConfig,
} from '../types/index.js';
import { ProviderError } from '../types/index.js';

/**
 * OpenRouter provider implementation
 * OpenRouter uses OpenAI-compatible API
 */
export class OpenRouterProvider extends BaseProvider {
  name = 'openrouter' as const;
  private client: OpenAI | null = null;
  private config: OpenRouterConfig;

  constructor(config: OpenRouterConfig) {
    super();
    this.config = config;
    if (this.isConfigured()) {
      this.client = new OpenAI({
        apiKey: this.config.apiKey,
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': 'https://github.com/betschki/ghost-myrtle',
          'X-Title': 'Ghost Myrtle',
        },
      });
    }
  }

  isConfigured(): boolean {
    return !!this.config.apiKey && this.config.enabled;
  }

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    this.validateRequest(request);

    if (!this.client) {
      throw new ProviderError('OpenRouter client not configured', 'openrouter');
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
          `OpenRouter API error: ${error.message}`,
          'openrouter'
        );
      }
      throw new ProviderError(
        `OpenRouter generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'openrouter'
      );
    }
  }

  async listModels(): Promise<string[]> {
    try {
      // Fetch models from OpenRouter's public API
      const response = await fetch('https://openrouter.ai/api/v1/models');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as { data?: Array<{ id: string }> };

      // Extract model IDs from the response
      // OpenRouter returns { data: [{ id: "model-id", ... }, ...] }
      if (data.data && Array.isArray(data.data)) {
        return data.data
          .map((model) => model.id)
          .sort();
      }

      throw new Error('Unexpected API response format');
    } catch (error) {
      throw new ProviderError(
        `Failed to fetch OpenRouter models: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'openrouter'
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
        console.error(`\n❌ OpenRouter API Error: ${error.message}`);

        // Add helpful tips based on error type
        if (error.message.includes('credits') || error.message.includes('balance')) {
          console.error('💡 Visit https://openrouter.ai/account to add credits\n');
        } else if (error.message.includes('authentication') || error.message.includes('api key')) {
          console.error('💡 Check your API key at https://openrouter.ai/keys\n');
        } else if (error.message.includes('model')) {
          console.error('💡 This model may not be available. Visit https://openrouter.ai/models\n');
        }
      } else if (error instanceof Error) {
        console.error(`\n❌ Connection error: ${error.message}\n`);
      }
      return false;
    }
  }

  /**
   * Estimate cost for OpenRouter models
   * Note: OpenRouter prices vary by model, these are approximate
   */
  protected estimateCost(
    promptTokens: number,
    completionTokens: number,
    model: string
  ): number {
    // Approximate pricing (per 1M tokens)
    const pricing: Record<
      string,
      { prompt: number; completion: number }
    > = {
      'anthropic/claude-3.5-sonnet': { prompt: 3.0, completion: 15.0 },
      'anthropic/claude-3-opus': { prompt: 15.0, completion: 75.0 },
      'openai/gpt-4-turbo': { prompt: 10.0, completion: 30.0 },
      'openai/gpt-4': { prompt: 30.0, completion: 60.0 },
      'google/gemini-pro-1.5': { prompt: 2.5, completion: 10.0 },
      'meta-llama/llama-3-70b': { prompt: 0.7, completion: 0.9 },
      'mistralai/mixtral-8x7b': { prompt: 0.5, completion: 0.5 },
    };

    // Find matching model pricing
    let modelPricing = { prompt: 1.0, completion: 2.0 }; // default
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
