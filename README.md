# Ghost Myrtle

Ghost Myrtle is a NodeJS command-line interface (CLI) tool that aims to make it easier for Ghost theme developers to create content for their theme demo sites.

In a nutshell, it uses the OpenAI GPT-3.5-turbo model to generate content that breathes life into your theme. **No more lorem ipsum!**

## Table of contents

- [Ghost Myrtle](#ghost-myrtle)
  - [Table of contents](#table-of-contents)
  - [Installation](#installation)
  - [Usage](#usage)
  - [Commands](#commands)
  - [License](#license)
  - [Bugs](#bugs)

## Installation

Before you begin, ensure you have [Node.js](https://nodejs.org/) installed on your system.

Install Ghost Myrtle globally using npm:

```bash
npm install -g ghost-myrtle
```

## Usage

After installation, you can use the `myrtle` command in your terminal to interact with the tool. Run `myrtle --help` to see a list of available commands.

## Commands

- `myrtle config`: Configure your environment. You will be prompted to enter your Ghost URL, Ghost Admin API key, and OpenAI API key. This data will be saved locally in a `.env` file.

- `myrtle create`: Create content for your theme. You will be prompted to enter details about your site and the type of content you want to create. The tool will then generate content and push it to your Ghost site using the Ghost Admin API. No manual copy-pasting required!

- `myrtle help`: Show a help message including a list of commands and their descriptions.

## License

Ghost Myrtle is [MIT licensed](LICENSE).

## Bugs

If you encounter any issues, please report them [here](https://github.com/betschki/ghost-myrtle/issues).