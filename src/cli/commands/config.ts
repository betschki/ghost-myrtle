import inquirer from 'inquirer';
import ora from 'ora';
import { ConfigManager } from '../../config/config-manager.js';
import { ConfigMigration } from '../../config/migration.js';
import type { Config, ProviderName } from '../../types/index.js';
import { ProviderFactory } from '../../providers/factory.js';

/**
 * Configure Ghost connection
 */
export async function configureGhost(): Promise<{
  url: string;
  adminApiKey: string;
}> {
  console.log('\n📝 Ghost Configuration\n');

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'url',
      message: 'Enter your Ghost URL (including http:// or https://):',
      default: 'http://localhost:2368',
      validate: (input: string) => {
        try {
          new URL(input);
          return true;
        } catch {
          return 'Please enter a valid URL';
        }
      },
    },
    {
      type: 'input',
      name: 'adminApiKey',
      message: 'Enter your Ghost Admin API key:',
      validate: (input: string) =>
        input.length > 0 || 'API key is required',
    },
  ]);

  return answers;
}

/**
 * Configure a specific provider
 */
export async function configureProvider(
  providerName: ProviderName
): Promise<void> {
  console.log(`\n🤖 ${providerName.toUpperCase()} Configuration\n`);

  // Load current config or create new
  let config: Config;
  try {
    config = await ConfigManager.load();
  } catch {
    // No config exists, create minimal one
    console.log('No configuration found. Creating new configuration...\n');
    const ghostConfig = await configureGhost();
    config = {
      ghost: ghostConfig,
      providers: {},
      activeProvider: providerName,
      generation: {
        titles: { temperature: 0.8, maxTokens: 100 },
        content: { temperature: 0.7, maxTokens: 4000 },
      },
      prompts: { useCustom: false },
    };
  }

  switch (providerName) {
    case 'openai': {
      const apiKeyAnswer = await inquirer.prompt([
        {
          type: 'input',
          name: 'apiKey',
          message: 'Enter your OpenAI API key:',
          validate: (input: string) =>
            input.startsWith('sk-') || 'OpenAI API keys start with "sk-"',
        },
      ]);

      // Fetch available models dynamically
      const spinner = ora('Fetching available models...').start();
      let modelChoices: Array<{ name: string; value: string }> = [];

      try {
        const OpenAI = (await import('openai')).default;
        const tempClient = new OpenAI({ apiKey: apiKeyAnswer.apiKey });
        const models = await tempClient.models.list();

        const gptModels = models.data
          .filter((m) => m.id.includes('gpt'))
          .map((m) => m.id)
          .sort()
          .reverse(); // Show newest first

        modelChoices = gptModels.map((id) => ({ name: id, value: id }));
        spinner.succeed(`Found ${modelChoices.length} models`);
      } catch (error) {
        spinner.fail('Failed to fetch models');
        console.log(
          '⚠️  Could not fetch models. You can enter a model name manually.\n'
        );
        modelChoices = [
          { name: 'Enter manually', value: 'manual' },
        ];
      }

      const modelAnswer = await inquirer.prompt([
        {
          type: 'list',
          name: 'defaultModel',
          message: 'Select default model:',
          choices: modelChoices,
          pageSize: 15,
        },
      ]);

      let defaultModel = modelAnswer.defaultModel;
      if (defaultModel === 'manual') {
        const manualAnswer = await inquirer.prompt([
          {
            type: 'input',
            name: 'modelName',
            message: 'Enter model name:',
            default: 'gpt-4-turbo-preview',
          },
        ]);
        defaultModel = manualAnswer.modelName;
      }

      config.providers.openai = {
        apiKey: apiKeyAnswer.apiKey,
        defaultModel,
        enabled: true,
      };
      break;
    }

    case 'anthropic': {
      console.log(
        '\n💡 Available Anthropic models:'
      );
      console.log('   • claude-sonnet-4-5-20250929 (Sonnet 4.5 - recommended)');
      console.log('   • claude-sonnet-4-20250514 (Sonnet 4)');
      console.log('   • claude-3-7-sonnet-20250219 (Sonnet 3.7)');
      console.log('   • claude-opus-4-1-20250805 (Opus 4.1)');
      console.log('   • claude-opus-4-20250514 (Opus 4)');
      console.log('   • claude-3-5-haiku-20241022 (Haiku 3.5)');
      console.log('   • claude-3-haiku-20240307 (Haiku 3)\n');

      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'apiKey',
          message: 'Enter your Anthropic API key:',
          validate: (input: string) =>
            input.startsWith('sk-ant-') ||
            'Anthropic API keys start with "sk-ant-"',
        },
        {
          type: 'input',
          name: 'defaultModel',
          message: 'Enter default model name:',
          default: 'claude-sonnet-4-5-20250929',
          validate: (input: string) =>
            input.startsWith('claude-') || 'Model name should start with "claude-"',
        },
      ]);

      config.providers.anthropic = {
        apiKey: answers.apiKey,
        defaultModel: answers.defaultModel,
        enabled: true,
      };
      break;
    }

    case 'openrouter': {
      const apiKeyAnswer = await inquirer.prompt([
        {
          type: 'input',
          name: 'apiKey',
          message: 'Enter your OpenRouter API key:',
          validate: (input: string) =>
            input.startsWith('sk-or-') ||
            'OpenRouter API keys start with "sk-or-"',
        },
      ]);

      // Fetch available models dynamically from OpenRouter API
      const spinner = ora('Fetching available models from OpenRouter...').start();
      let modelChoices: Array<{ name: string; value: string }> = [];

      try {
        const response = await fetch('https://openrouter.ai/api/v1/models');

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = (await response.json()) as {
          data?: Array<{ id: string; name?: string }>;
        };

        if (data.data && Array.isArray(data.data)) {
          // Sort by name and limit to reasonable number with pagination
          const models = data.data.sort((a, b) => a.id.localeCompare(b.id));

          modelChoices = models.map((m) => ({
            name: m.name || m.id,
            value: m.id,
          }));

          spinner.succeed(`Found ${modelChoices.length} models`);
        } else {
          throw new Error('Unexpected API response');
        }
      } catch (error) {
        spinner.fail('Failed to fetch models');
        console.log(
          '⚠️  Could not fetch models from OpenRouter. You can enter a model name manually.\n'
        );
        modelChoices = [{ name: 'Enter manually', value: 'manual' }];
      }

      const modelAnswer = await inquirer.prompt([
        {
          type: 'list',
          name: 'defaultModel',
          message: 'Select default model:',
          choices: modelChoices,
          pageSize: 20,
          loop: false,
        },
      ]);

      let defaultModel = modelAnswer.defaultModel;
      if (defaultModel === 'manual') {
        const manualAnswer = await inquirer.prompt([
          {
            type: 'input',
            name: 'modelName',
            message: 'Enter model ID (e.g., anthropic/claude-3.5-sonnet):',
            default: 'anthropic/claude-3.5-sonnet',
          },
        ]);
        defaultModel = manualAnswer.modelName;
      }

      config.providers.openrouter = {
        apiKey: apiKeyAnswer.apiKey,
        defaultModel,
        enabled: true,
      };
      break;
    }

    case 'selfHosted': {
      const endpointAnswers = await inquirer.prompt([
        {
          type: 'input',
          name: 'endpoint',
          message: 'Enter the API endpoint URL:',
          default: 'http://localhost:11434/v1',
          validate: (input: string) => {
            try {
              new URL(input);
              return true;
            } catch {
              return 'Please enter a valid URL';
            }
          },
        },
        {
          type: 'input',
          name: 'apiKey',
          message: 'Enter API key (leave empty if not required):',
          default: '',
        },
      ]);

      // Try to fetch available models from the endpoint
      const spinner = ora('Fetching available models from endpoint...').start();
      let modelChoices: Array<{ name: string; value: string }> = [];

      try {
        const OpenAI = (await import('openai')).default;
        const tempClient = new OpenAI({
          apiKey: endpointAnswers.apiKey || 'not-needed',
          baseURL: endpointAnswers.endpoint,
        });

        const models = await tempClient.models.list();
        const modelIds = models.data.map((m) => m.id).sort();

        modelChoices = modelIds.map((id) => ({ name: id, value: id }));
        spinner.succeed(`Found ${modelChoices.length} models`);
      } catch (error) {
        spinner.fail('Failed to fetch models from endpoint');
        console.log(
          '⚠️  Could not fetch models. You can enter a model name manually.\n'
        );
        modelChoices = [{ name: 'Enter manually', value: 'manual' }];
      }

      const modelAnswer = await inquirer.prompt([
        {
          type: 'list',
          name: 'defaultModel',
          message: 'Select default model:',
          choices: modelChoices,
          pageSize: 15,
        },
      ]);

      let defaultModel = modelAnswer.defaultModel;
      if (defaultModel === 'manual') {
        const manualAnswer = await inquirer.prompt([
          {
            type: 'input',
            name: 'modelName',
            message: 'Enter model name:',
            default: 'llama3:70b',
          },
        ]);
        defaultModel = manualAnswer.modelName;
      }

      config.providers.selfHosted = {
        endpoint: endpointAnswers.endpoint,
        apiKey: endpointAnswers.apiKey || undefined,
        defaultModel,
        enabled: true,
      };
      break;
    }
  }

  // Set as active provider
  config.activeProvider = providerName;

  // Save config
  const spinner = ora('Saving configuration...').start();
  try {
    await ConfigManager.save(config);
    spinner.succeed('Configuration saved successfully!');

    // Test connection
    spinner.start('Testing connection...');
    const provider = ProviderFactory.createProvider(providerName, config);
    const connected = await provider.testConnection();

    if (connected) {
      spinner.succeed('Connection test successful! ✨');
    } else {
      spinner.warn('Connection test failed. Please check your configuration.');
    }
  } catch (error) {
    spinner.fail('Failed to save configuration');
    console.error(
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Configure Pexels for images
 */
export async function configurePexels(): Promise<void> {
  console.log('\n📸 Pexels Configuration\n');
  console.log('Pexels provides free stock photos for your blog posts.');
  console.log('Get your free API key at: https://www.pexels.com/api/\n');

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'apiKey',
      message: 'Enter your Pexels API key (or leave empty to skip):',
      default: '',
    },
  ]);

  // Load config or create minimal one
  let config: Config;
  try {
    config = await ConfigManager.load();
  } catch {
    console.log('\n❌ No configuration found. Please run `myrtle config` first to set up Ghost and AI provider.\n');
    return;
  }

  // Update Pexels config
  config.pexels = {
    apiKey: answers.apiKey || undefined,
    enabled: answers.apiKey.length > 0,
  };

  // Save config
  const spinner = ora('Saving configuration...').start();
  try {
    await ConfigManager.save(config);

    if (config.pexels.enabled) {
      spinner.succeed('Pexels configured! Images will use keyword-relevant photos.');
    } else {
      spinner.succeed('Pexels skipped. Images will use Lorem Picsum placeholders.');
    }
  } catch (error) {
    spinner.fail('Failed to save configuration');
    console.error(
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Main config command
 */
export async function configCommand(args: string[]): Promise<void> {
  // Check for migration
  const hasOldConfig = await ConfigMigration.hasOldConfig();
  const hasNewConfig = await ConfigManager.exists();

  if (hasOldConfig && !hasNewConfig) {
    console.log('📦 Found v1 configuration (.env file)');
    const { migrate } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'migrate',
        message: 'Would you like to migrate to v2 configuration?',
        default: true,
      },
    ]);

    if (migrate) {
      const spinner = ora('Migrating configuration...').start();
      const result = await ConfigMigration.migrateWithBackup();

      if (result.success) {
        spinner.succeed(
          'Migration successful! Your old .env file has been backed up to .env.v1.backup'
        );
        console.log('\n✅ You can now use myrtle with the new configuration!');
        console.log(
          '💡 Run `myrtle config provider <name>` to add more providers\n'
        );
        return;
      } else {
        spinner.fail(`Migration failed: ${result.error}`);
        return;
      }
    }
  }

  // Handle subcommands
  if (args.length === 0) {
    // Interactive configuration
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to configure?',
        choices: [
          { name: 'Ghost CMS connection', value: 'ghost' },
          { name: 'OpenAI provider', value: 'openai' },
          { name: 'Anthropic provider', value: 'anthropic' },
          { name: 'OpenRouter provider', value: 'openrouter' },
          { name: 'Self-hosted LLM', value: 'selfHosted' },
          { name: 'Pexels images (optional)', value: 'pexels' },
        ],
      },
    ]);

    if (action === 'ghost') {
      const ghostConfig = await configureGhost();
      const spinner = ora('Saving Ghost configuration...').start();

      try {
        const config = await ConfigManager.load();
        config.ghost = ghostConfig;
        await ConfigManager.save(config);
        spinner.succeed('Ghost configuration saved!');
      } catch {
        // No existing config, create minimal one
        const { provider } = await inquirer.prompt([
          {
            type: 'list',
            name: 'provider',
            message: 'Which AI provider would you like to use?',
            choices: [
              'openai',
              'anthropic',
              'openrouter',
              'selfHosted',
            ],
          },
        ]);

        await configureProvider(provider as ProviderName);
      }
    } else if (action === 'pexels') {
      await configurePexels();
    } else {
      await configureProvider(action as ProviderName);
    }
  } else if (args[0] === 'pexels') {
    // Configure Pexels images
    await configurePexels();
  } else if (args[0] === 'provider' && args[1]) {
    // Configure specific provider
    const providerName = args[1] as ProviderName;
    await configureProvider(providerName);
  } else if (args[0] === 'migrate') {
    // Manual migration trigger
    const spinner = ora('Migrating configuration...').start();
    const result = await ConfigMigration.migrateWithBackup();

    if (result.success) {
      spinner.succeed('Migration successful!');
    } else {
      spinner.fail(`Migration failed: ${result.error}`);
    }
  } else {
    console.log('Unknown config command. Try `myrtle config` or `myrtle config provider <name>`');
  }
}
