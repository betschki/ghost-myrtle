import OpenAI from 'openai';
import { BaseProvider } from './base.js';
import type {
  GenerationRequest,
  GenerationResponse,
  SelfHostedConfig,
} from '../types/index.js';
import { ProviderError } from '../types/index.js';

/**
 * Self-hosted LLM provider implementation
 * Supports Ollama, LM Studio, vLLM, text-generation-webui, and other OpenAI-compatible endpoints
 */
export class SelfHostedProvider extends BaseProvider {
  name = 'selfHosted' as const;
  private client: OpenAI | null = null;
  private config: SelfHostedConfig;

  constructor(config: SelfHostedConfig) {
    super();
    this.config = config;
    if (this.isConfigured()) {
      this.client = new OpenAI({
        apiKey: this.config.apiKey || 'not-needed',
        baseURL: this.config.endpoint,
      });
    }
  }

  isConfigured(): boolean {
    return !!this.config.endpoint && this.config.enabled;
  }

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    this.validateRequest(request);

    if (!this.client) {
      throw new ProviderError(
        'Self-hosted client not configured',
        'selfHosted'
      );
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
        cost: 0, // Self-hosted models are free (no API cost)
      };
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        throw new ProviderError(
          `Self-hosted API error: ${error.message}`,
          'selfHosted'
        );
      }
      throw new ProviderError(
        `Self-hosted generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'selfHosted'
      );
    }
  }

  async listModels(): Promise<string[]> {
    if (!this.client) {
      throw new ProviderError(
        'Self-hosted client not configured',
        'selfHosted'
      );
    }

    try {
      const models = await this.client.models.list();
      return models.data.map((m) => m.id).sort();
    } catch (error) {
      // Some self-hosted servers may not support listing models
      throw new ProviderError(
        `Failed to list self-hosted models: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'selfHosted'
      );
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      // Try to list models as a connection test
      await this.client.models.list();
      return true;
    } catch {
      // If listing models fails, try a simple generation
      try {
        await this.client.chat.completions.create({
          model: this.config.defaultModel,
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 5,
        });
        return true;
      } catch (error) {
        // Display user-friendly error message
        if (error instanceof OpenAI.APIError) {
          console.error(`\n❌ Self-hosted API Error: ${error.message}`);
        } else if (error instanceof Error) {
          console.error(`\n❌ Connection error: ${error.message}`);
          console.error(`💡 Check that your endpoint (${this.config.endpoint}) is accessible and running\n`);
        }
        return false;
      }
    }
  }

  /**
   * Self-hosted models have no API cost
   */
  protected estimateCost(): number {
    return 0;
  }
}
