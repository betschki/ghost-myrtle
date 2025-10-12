import type { Provider, Config, ProviderName } from '../types/index.js';
import { ConfigError } from '../types/index.js';
import { OpenAIProvider } from './openai.js';
import { AnthropicProvider } from './anthropic.js';
import { OpenRouterProvider } from './openrouter.js';
import { SelfHostedProvider } from './self-hosted.js';

/**
 * Provider factory for creating provider instances
 */
export class ProviderFactory {
  /**
   * Create a provider instance based on configuration
   */
  static createProvider(
    providerName: ProviderName,
    config: Config
  ): Provider {
    switch (providerName) {
      case 'openai':
        if (!config.providers.openai) {
          throw new ConfigError('OpenAI provider not configured');
        }
        return new OpenAIProvider(config.providers.openai);

      case 'anthropic':
        if (!config.providers.anthropic) {
          throw new ConfigError('Anthropic provider not configured');
        }
        return new AnthropicProvider(config.providers.anthropic);

      case 'openrouter':
        if (!config.providers.openrouter) {
          throw new ConfigError('OpenRouter provider not configured');
        }
        return new OpenRouterProvider(config.providers.openrouter);

      case 'selfHosted':
        if (!config.providers.selfHosted) {
          throw new ConfigError('Self-hosted provider not configured');
        }
        return new SelfHostedProvider(config.providers.selfHosted);

      default:
        throw new ConfigError(`Unknown provider: ${providerName}`);
    }
  }

  /**
   * Get the active provider from configuration
   */
  static getActiveProvider(config: Config): Provider {
    const providerName = config.activeProvider;
    return this.createProvider(providerName, config);
  }

  /**
   * Get all configured providers
   */
  static getAllProviders(config: Config): Provider[] {
    const providers: Provider[] = [];

    if (config.providers.openai?.enabled) {
      providers.push(new OpenAIProvider(config.providers.openai));
    }

    if (config.providers.anthropic?.enabled) {
      providers.push(new AnthropicProvider(config.providers.anthropic));
    }

    if (config.providers.openrouter?.enabled) {
      providers.push(new OpenRouterProvider(config.providers.openrouter));
    }

    if (config.providers.selfHosted?.enabled) {
      providers.push(new SelfHostedProvider(config.providers.selfHosted));
    }

    return providers;
  }

  /**
   * Check if a provider is configured
   */
  static isProviderConfigured(
    providerName: ProviderName,
    config: Config
  ): boolean {
    try {
      const provider = this.createProvider(providerName, config);
      return provider.isConfigured();
    } catch {
      return false;
    }
  }
}
