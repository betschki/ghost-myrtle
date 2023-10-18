# Ghost Myrtle

Ghost Myrtle is a NodeJS command-line interface (CLI) tool that aims to make it easier for Ghost theme developers to create content for their theme demo sites.

In a nutshell, it uses the OpenAI GPT-3.5-turbo model to generate content that breathes life into your theme. **No more lorem ipsum!**

**The Gotcha:** Ghost Myrtle is not a magic bullet. It's a tool that can help you create content for
your theme demo sites, but it's not a replacement for human creativity. Do not expect to be able to
use the tool to generate content for your production sites. Additionally, you might want to manually
add some images to the content that the tool generates.

## Requirements
In order to use Ghost Myrtle, you will need the following:

* A [Ghost](https://ghost.org/) site that is accessible for Myrtle. Either on localhost or on a remote server.
* A [Ghost Admin API key](https://ghost.org/docs/admin-api/#token-authentication) for the site.
* An [OpenAI API key](https://openai.com/blog/openai-api) with access to the GPT-3.5-turbo model.

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