import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { Config } from '../types/index.js';
import { ConfigManager } from './config-manager.js';

/**
 * Migrate from v1 (.env file) to v2 (JSON config)
 */
export class ConfigMigration {
  private static ENV_FILE = '.env';

  /**
   * Check if old .env config exists
   */
  static async hasOldConfig(): Promise<boolean> {
    try {
      const envPath = path.join(process.cwd(), this.ENV_FILE);
      await fs.access(envPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Load .env file and parse it
   */
  private static async loadEnvFile(): Promise<Record<string, string>> {
    const envPath = path.join(process.cwd(), this.ENV_FILE);
    const envContent = await fs.readFile(envPath, 'utf-8');
    return dotenv.parse(envContent);
  }

  /**
   * Migrate from v1 to v2 configuration
   */
  static async migrate(): Promise<Config> {
    const hasOld = await this.hasOldConfig();
    if (!hasOld) {
      throw new Error('No v1 configuration found to migrate');
    }

    const env = await this.loadEnvFile();

    // Build v2 config from v1 env vars
    const config: Config = {
      ghost: {
        url: env.GHOST_URL || '',
        adminApiKey: env.GHOST_ADMIN_API_KEY || '',
      },
      providers: {},
      activeProvider: 'openai', // Default to OpenAI for backward compatibility
      generation: {
        titles: {
          temperature: 0.8,
          maxTokens: 100,
        },
        content: {
          temperature: 0.7,
          maxTokens: 4000,
        },
      },
      prompts: {
        useCustom: false,
      },
    };

    // Add OpenAI provider if API key exists
    if (env.OPENAI_API_KEY) {
      config.providers.openai = {
        apiKey: env.OPENAI_API_KEY,
        defaultModel: 'gpt-4-turbo', // Upgrade from old gpt-3.5-turbo
        enabled: true,
      };
    }

    // Save the new config
    await ConfigManager.save(config);

    return config;
  }

  /**
   * Backup old .env file
   */
  static async backupOldConfig(): Promise<void> {
    const envPath = path.join(process.cwd(), this.ENV_FILE);
    const backupPath = path.join(process.cwd(), '.env.v1.backup');

    try {
      await fs.copyFile(envPath, backupPath);
    } catch (error) {
      console.warn('Could not backup old .env file:', error);
    }
  }

  /**
   * Full migration process with backup
   */
  static async migrateWithBackup(): Promise<{
    success: boolean;
    config?: Config;
    error?: string;
  }> {
    try {
      // Backup old config
      await this.backupOldConfig();

      // Migrate
      const config = await this.migrate();

      return {
        success: true,
        config,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Migration failed',
      };
    }
  }
}
