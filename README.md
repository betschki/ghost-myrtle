# Ghost Myrtle

A modern CLI tool to generate high-quality, AI-powered content for Ghost CMS demo sites

Ghost Myrtle helps Ghost theme developers and site creators generate sample content for their themes and demo sites. Using language models from multiple AI providers, it creates realistic blog posts, static pages, and comprehensive content that showcases your theme's capabilities—**no more lorem ipsum!**

## ✨ Features

- **🤖 Multiple AI Providers**: OpenAI, Anthropic (Claude), OpenRouter, or self-hosted models
- **📸 Keyword-Relevant Images**: Automatic Pexels integration for relevant stock photos (or Lorem Picsum fallback)
- **📝 Rich Content Generation**: Blog posts with proper formatting, SEO structure, and images
- **🎨 Style Guide Page**: Optional comprehensive showcase of Ghost's formatting capabilities
- **💾 Resume Functionality**: Interrupted sessions automatically save and can be resumed
- **🔄 Flexible Configuration**: Easy provider switching and per-generation settings

## 📋 Requirements

- **Node.js**: v22.0.0 or higher
- **Ghost Site**: Local or remote Ghost installation with Admin API access
- **AI Provider Account**: At least one of the following:
  - [OpenAI API key](https://platform.openai.com/api-keys) (GPT-4, GPT-3.5, etc.)
  - [Anthropic API key](https://console.anthropic.com/) (Claude models)
  - [OpenRouter API key](https://openrouter.ai/keys) (access to 100+ models)
  - Self-hosted LLM with OpenAI-compatible API

## 🚀 Installation

Install Ghost Myrtle globally using npm:

```bash
npm install -g ghost-myrtle
```

Or use it directly with npx:

```bash
npx ghost-myrtle [command]
```

## ⚙️ Configuration

### Initial Setup

Run the configuration wizard to set up your Ghost site and AI provider:

```bash
myrtle config
```

You'll be guided through:

1. **Ghost Configuration**: Enter your Ghost site URL and Admin API key
2. **Provider Selection**: Choose your preferred AI provider
3. **Provider Setup**: Configure API credentials and model selection
4. **Generation Settings**: Set default temperature and token limits

### Ghost Admin API Key

To get your Ghost Admin API key:

1. Go to your Ghost Admin panel
2. Navigate to **Settings** → **Integrations**
3. Create a new **Custom Integration**
4. Copy the **Admin API Key** and **API URL**

### Provider-Specific Configuration

#### OpenAI

```bash
myrtle config provider openai
```

- **API Key**: Get from [OpenAI Platform](https://platform.openai.com/api-keys)
- **Models**: Fetched automatically (GPT-4, GPT-3.5-turbo, etc.)

#### Anthropic (Claude)

```bash
myrtle config provider anthropic
```

- **API Key**: Get from [Anthropic Console](https://console.anthropic.com/)
- **Models**: Claude Sonnet 4.5, Opus 3, Haiku 3.5

#### OpenRouter

```bash
myrtle config provider openrouter
```

- **API Key**: Get from [OpenRouter](https://openrouter.ai/keys)
- **Models**: 100+ models fetched automatically
- **Note**: Check [OpenRouter pricing](https://openrouter.ai/models) for model costs

#### Self-Hosted

```bash
myrtle config provider self-hosted
```

- **Endpoint**: Your local/remote model endpoint (e.g., `http://localhost:11434/v1`)
- **Models**: Fetched from your endpoint's `/models` API

### Image Configuration (Optional)

#### Pexels API

Configure Pexels to get keyword-relevant images in your blog posts:

```bash
myrtle config pexels
```

- **API Key**: Get free from [Pexels API](https://www.pexels.com/api/)
- **Free Tier**: 200 requests/hour, 20,000/month
- **Benefits**:
  - Keyword-relevant featured images and inline stock photos automatically added to posts
  - Proper photographer attribution
- **Fallback**: If not configured, posts use Lorem Picsum placeholder images for featured and inline post images

**Getting a Pexels API Key:**
1. Visit [pexels.com/api](https://www.pexels.com/api/)
2. Sign up for a free account
3. Get instant API key (no approval needed)
4. Run `myrtle config pexels` and paste your key


## 📖 Usage

### Generate Content

Start the content generation wizard:

```bash
myrtle create
```

You'll be prompted for:

- **Site Information**: Name, type, description, target audience
- **Content Options**: Static pages, style guide, blog categories
- **Post Configuration**: Number of posts per category

The tool will then:

1. ✅ Generate static pages (About, Contact, etc.)
2. ✅ Create style guide page (optional)
3. ✅ Generate diverse blog post titles for each category
4. ✅ Write full blog posts with images and formatting
5. ✅ Push everything to your Ghost site

### Resume Interrupted Sessions

If generation is interrupted (API limits, network issues, etc.), simply run:

```bash
myrtle create
```

The tool will detect your saved progress and offer to resume.

### Command Options

```bash
# Dry run (generate without pushing to Ghost)
myrtle create --dry-run

# Preview content as it's generated
myrtle create --preview

# Use a specific provider for this session
myrtle create --provider anthropic

# Override temperature setting
myrtle create --temperature 0.9
```

### Other Commands

```bash
# Show help
myrtle help
myrtle --help

# Show version
myrtle --version

# Configure a specific provider
myrtle config provider [openai|anthropic|openrouter|self-hosted]
```

### Theme Showcase

Enable the **Style Guide** option to generate a comprehensive page showing:
- Typography (headings, paragraphs, blockquotes)
- Lists (ordered, unordered, nested)
- Code blocks and inline code
- Images and galleries
- Tables and embeds
- Ghost-specific cards (buttons, toggles, etc.)

## 🔍 Troubleshooting

### "Provider not configured" Error

Run the configuration for your provider:

```bash
myrtle config provider [provider-name]
```

### "Could not connect to Ghost" Error

1. Verify your Ghost site is accessible
2. Check Admin API key is correct
3. Ensure API URL includes `/ghost/api/admin/` path
4. Test connection: `curl [YOUR_GHOST_URL]/ghost/api/admin/site/`

### "API Error" or Rate Limits

- **OpenAI**: Check [usage limits](https://platform.openai.com/account/limits)
- **Anthropic**: Check [console billing](https://console.anthropic.com/settings/billing)
- **OpenRouter**: Check [credits balance](https://openrouter.ai/credits)
- Use `--provider` flag to switch to a different provider

### Resume Not Working

The state file `.myrtle-state.json` should be in your current directory. Check:

```bash
ls -la .myrtle-state.json
```

If missing, the session completed or was cleared. Start a new generation.

## 🏗️ Development

### Build from Source

```bash
# Clone the repository
git clone https://github.com/betschki/ghost-myrtle.git
cd ghost-myrtle

# Install dependencies
npm install

# Build TypeScript
npm run build

# Link for local testing
npm link
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## 📄 License

Ghost Myrtle is [MIT licensed](LICENSE).

## 🐛 Issues

If you encounter any issues, please report them on [GitHub Issues](https://github.com/betschki/ghost-myrtle/issues).

## 🙏 Acknowledgments

- Built for the [Ghost](https://ghost.org) publishing platform
- Powered by [OpenAI](https://openai.com), [Anthropic](https://anthropic.com), and [OpenRouter](https://openrouter.ai)
- Created to help theme developers showcase their work with realistic content
- Initially created for sample content on [Kyiv](https://kyiv.magicpages.co), updated to version 2.0.0 for sample content on [Alpine](https://alpine.magicpages.co)
