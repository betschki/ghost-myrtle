import fs from 'fs/promises';
import path from 'path';
import { Config, ConfigError } from '../types/index.js';
import { ConfigSchema } from './schema.js';

/**
 * Configuration file manager
 */
export class ConfigManager {
  private static CONFIG_FILE = 'myrtle.config.json';
  private static config: Config | null = null;

  /**
   * Get the config file path (in current working directory)
   */
  private static getConfigPath(): string {
    return path.join(process.cwd(), this.CONFIG_FILE);
  }

  /**
   * Check if config file exists
   */
  static async exists(): Promise<boolean> {
    try {
      await fs.access(this.getConfigPath());
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Load configuration from file
   */
  static async load(): Promise<Config> {
    if (this.config) {
      return this.config;
    }

    const configPath = this.getConfigPath();

    try {
      const fileContent = await fs.readFile(configPath, 'utf-8');
      const rawConfig = JSON.parse(fileContent);

      // Validate with Zod
      const validatedConfig = ConfigSchema.parse(rawConfig);
      this.config = validatedConfig;

      return validatedConfig;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new ConfigError(
          `Configuration file not found. Run 'myrtle config' to create one.`
        );
      }

      if (error instanceof Error) {
        throw new ConfigError(`Failed to load config: ${error.message}`);
      }

      throw new ConfigError('Failed to load configuration');
    }
  }

  /**
   * Save configuration to file
   */
  static async save(config: Config): Promise<void> {
    const configPath = this.getConfigPath();

    try {
      // Validate with Zod before saving
      const validatedConfig = ConfigSchema.parse(config);

      await fs.writeFile(
        configPath,
        JSON.stringify(validatedConfig, null, 2),
        'utf-8'
      );

      this.config = validatedConfig;
    } catch (error) {
      if (error instanceof Error) {
        throw new ConfigError(`Failed to save config: ${error.message}`);
      }
      throw new ConfigError('Failed to save configuration');
    }
  }

  /**
   * Update partial configuration
   */
  static async update(partialConfig: Partial<Config>): Promise<Config> {
    const currentConfig = await this.load();
    const updatedConfig = { ...currentConfig, ...partialConfig };

    await this.save(updatedConfig);
    return updatedConfig;
  }

  /**
   * Reset cached configuration (force reload on next access)
   */
  static reset(): void {
    this.config = null;
  }

  /**
   * Check if Ghost is configured
   */
  static async isGhostConfigured(): Promise<boolean> {
    try {
      const config = await this.load();
      return !!config.ghost.url && !!config.ghost.adminApiKey;
    } catch {
      return false;
    }
  }

  /**
   * Check if at least one provider is configured
   */
  static async hasProvider(): Promise<boolean> {
    try {
      const config = await this.load();
      return (
        (!!config.providers.openai?.enabled &&
          !!config.providers.openai.apiKey) ||
        (!!config.providers.anthropic?.enabled &&
          !!config.providers.anthropic.apiKey) ||
        (!!config.providers.openrouter?.enabled &&
          !!config.providers.openrouter.apiKey) ||
        (!!config.providers.selfHosted?.enabled &&
          !!config.providers.selfHosted.endpoint)
      );
    } catch {
      return false;
    }
  }

  /**
   * Get active provider config
   */
  static async getActiveProviderConfig(): Promise<{
    name: string;
    config: unknown;
  }> {
    const config = await this.load();
    const providerName = config.activeProvider;

    switch (providerName) {
      case 'openai':
        if (!config.providers.openai) {
          throw new ConfigError('OpenAI provider not configured');
        }
        return { name: providerName, config: config.providers.openai };

      case 'anthropic':
        if (!config.providers.anthropic) {
          throw new ConfigError('Anthropic provider not configured');
        }
        return { name: providerName, config: config.providers.anthropic };

      case 'openrouter':
        if (!config.providers.openrouter) {
          throw new ConfigError('OpenRouter provider not configured');
        }
        return { name: providerName, config: config.providers.openrouter };

      case 'selfHosted':
        if (!config.providers.selfHosted) {
          throw new ConfigError('Self-hosted provider not configured');
        }
        return { name: providerName, config: config.providers.selfHosted };

      default:
        throw new ConfigError(`Unknown provider: ${providerName}`);
    }
  }
}
