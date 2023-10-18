import fs from 'fs/promises';
import inquirer from 'inquirer';
import ora from 'ora';

/**
 * This function is used to prompt the user for their Ghost URL,
 * their Ghost Admin API key, and their OpenAI API key.
 *
 * This data is then saved to a .env file.
 */

export default async function () {
  console.log(
    "Welcome to Myrtle! Let's configure your environment. All answers will be saved locally in a .env file. You can change these values at any time by running `myrtle config` again."
  );

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'ghostUrl',
      message:
        'Enter your Ghost URL, including the protocol (http:// or https://):',
      default: 'http://localhost:2368',
    },
    {
      type: 'input',
      name: 'ghostAdminApiKey',
      message: 'Enter your Ghost Admin API key:',
      default: '1234567890',
    },
    {
      type: 'input',
      name: 'openaiApiKey',
      message: 'Enter your OpenAI API key:',
      default: 'sk-1234567890',
    },
  ]);

  const spinner = ora('Saving config...').start();

  try {
    const result = await saveConfig(answers);

    if (result.error) {
      spinner.fail(result.message);
    } else {
        spinner.succeed('Config saved! You can now run `myrtle create` to create content for your new theme 👻🎉');
    }
  } catch (error) {
    spinner.fail(error.message);
  }
}

async function saveConfig(answers) {
    const config = `GHOST_URL=${answers.ghostUrl}\nGHOST_ADMIN_API_KEY=${answers.ghostAdminApiKey}\nOPENAI_API_KEY=${answers.openaiApiKey}`;

    try {
        await fs.writeFile('.env', config);
        return { error: false };
    } catch (error) {
        return { error: true, message: error.message };
    }
}
