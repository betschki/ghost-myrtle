#!/usr/bin/env node

import { configCommand } from './commands/config.js';
import { createCommand } from './commands/create.js';
import { testCommand } from './commands/test.js';

const HELP_MESSAGE = `
🌿 Ghost Myrtle v2 - Modern AI Content Generation for Ghost CMS

Usage: myrtle [command] [options]

Commands:
  config                  Configure Ghost and AI providers
  config provider <name>  Configure a specific provider (openai, anthropic, openrouter, selfHosted)
  config migrate          Migrate from v1 configuration

  create                  Generate and push content to Ghost
  create --dry-run        Generate content without pushing to Ghost
  create --preview        Show preview of generated content
  create --provider <name>  Use specific provider (overrides config)
  create --model <model>  Use specific model
  create --temperature <n>  Set temperature (0-2)

  test [provider]         Test provider connection (all, openai, anthropic, openrouter, selfHosted, ghost)

  help                    Show this help message

Examples:
  myrtle config                              # Interactive configuration
  myrtle config provider anthropic           # Configure Anthropic/Claude
  myrtle create                              # Generate and push content
  myrtle create --dry-run --preview          # Generate and preview without pushing
  myrtle create --provider anthropic --model claude-sonnet-4-5-20250929
  myrtle test all                            # Test all connections
  myrtle test anthropic                      # Test Anthropic connection

Providers:
  openai        - OpenAI (GPT-3.5, GPT-4, GPT-4 Turbo)
  anthropic     - Anthropic (Claude 3.5 Sonnet, Opus, Haiku)
  openrouter    - OpenRouter (100+ models via single API)
  selfHosted    - Self-hosted LLMs (Ollama, LM Studio, etc.)

Documentation: https://github.com/betschki/ghost-myrtle
Report issues: https://github.com/betschki/ghost-myrtle/issues
`;

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Default to create command
    await createCommand([]);
    return;
  }

  const command = args[0];
  const commandArgs = args.slice(1);

  try {
    switch (command) {
      case 'config':
        await configCommand(commandArgs);
        break;

      case 'create':
        await createCommand(commandArgs);
        break;

      case 'test':
        await testCommand(commandArgs);
        break;

      case '-h':
      case '--help':
      case 'help':
        console.log(HELP_MESSAGE);
        break;

      case '-v':
      case '--version':
      case 'version':
        // Read version from package.json
        console.log('Ghost Myrtle v2.0.0');
        break;

      default:
        console.log(`Unknown command: ${command}`);
        console.log('Run \`myrtle --help\` for usage information.');
        process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

main();
