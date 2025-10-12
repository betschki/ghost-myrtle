import ora from 'ora';
import { ConfigManager } from '../../config/config-manager.js';
import { ProviderFactory } from '../../providers/factory.js';
import { GhostClient } from '../../ghost/ghost-client.js';
import type { ProviderName } from '../../types/index.js';

/**
 * Test command to verify provider and Ghost connections
 */
export async function testCommand(args: string[]): Promise<void> {
  const targetProvider = args[0] as ProviderName | 'all' | 'ghost' | undefined;

  // Check configuration
  const hasConfig = await ConfigManager.exists();
  if (!hasConfig) {
    console.log(
      '❌ No configuration found. Run `myrtle config` first to set up your environment.'
    );
    return;
  }

  const config = await ConfigManager.load();

  if (!targetProvider || targetProvider === 'all') {
    // Test all configured providers
    console.log('\n🧪 Testing all configured providers...\n');

    const providers = ProviderFactory.getAllProviders(config);

    if (providers.length === 0) {
      console.log('❌ No providers configured. Run `myrtle config provider <name>` to add providers.');
      return;
    }

    for (const provider of providers) {
      const spinner = ora(`Testing ${provider.name}...`).start();

      try {
        const isConnected = await provider.testConnection();

        if (isConnected) {
          spinner.succeed(`${provider.name} connection successful ✨`);
        } else {
          spinner.fail(`${provider.name} connection failed`);
        }
      } catch (error) {
        spinner.fail(`${provider.name} connection failed`);
        console.error(
          `   ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Test Ghost
    console.log();
    const ghostSpinner = ora('Testing Ghost CMS connection...').start();
    const ghostClient = new GhostClient(config.ghost);

    try {
      const isConnected = await ghostClient.testConnection();

      if (isConnected) {
        ghostSpinner.succeed('Ghost CMS connection successful ✨');
      } else {
        ghostSpinner.fail('Ghost CMS connection failed');
      }
    } catch (error) {
      ghostSpinner.fail('Ghost CMS connection failed');
      console.error(
        `   ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    console.log();
  } else if (targetProvider === 'ghost') {
    // Test Ghost only
    console.log('\n🧪 Testing Ghost CMS connection...\n');

    const spinner = ora('Connecting to Ghost...').start();
    const ghostClient = new GhostClient(config.ghost);

    try {
      const isConnected = await ghostClient.testConnection();

      if (isConnected) {
        spinner.succeed('Ghost CMS connection successful ✨');
        console.log(`   URL: ${config.ghost.url}\n`);
      } else {
        spinner.fail('Ghost CMS connection failed');
      }
    } catch (error) {
      spinner.fail('Ghost CMS connection failed');
      console.error(
        `   ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  } else {
    // Test specific provider
    console.log(`\n🧪 Testing ${targetProvider} connection...\n`);

    try {
      const provider = ProviderFactory.createProvider(
        targetProvider,
        config
      );

      if (!provider.isConfigured()) {
        console.log(
          `❌ Provider "${targetProvider}" is not configured. Run \`myrtle config provider ${targetProvider}\` to configure it.`
        );
        return;
      }

      const spinner = ora(`Connecting to ${targetProvider}...`).start();

      const isConnected = await provider.testConnection();

      if (isConnected) {
        spinner.succeed(
          `${targetProvider} connection successful ✨`
        );
        console.log();
      } else {
        spinner.fail(`${targetProvider} connection failed`);
      }
    } catch (error) {
      console.log(`❌ ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
