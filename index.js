#!/usr/bin/env node

import config from './config.js';
import create from './create.js';

const HELP_MESSAGE = `
Usage: myrtle [command]

Commands:
    config  Configure your environment
    help    Show this help message
    create  Create content for your theme

Documentation can be found at https://github.com/betschki/ghost-myrtle
`;

async function createCommand() {
  try {
    await create();
  } catch (error) {
    console.error(`Error in create command: ${error.message}`);
  }
}

async function configCommand() {
  try {
    await config();
  } catch (error) {
    console.error(`Error in config command: ${error.message}`);
  }
}

async function unknownCommand(command) {
  console.error(
    `Unknown command: ${command}. Run \`myrtle --help\` for a list of commands.`
  );
}

// Check for subcommands
const args = process.argv.slice(2); // Drop node path and script path

if (args.length === 0) {
  createCommand();
} else {
  switch (args[0]) {
    case 'config':
      configCommand();
      break;
    case 'create':
      createCommand();
      break;
    case '-h':
    case '--help':
    case 'help':
      console.log(HELP_MESSAGE);
      break;
    default:
      unknownCommand(args[0]);
      break;
  }
}
