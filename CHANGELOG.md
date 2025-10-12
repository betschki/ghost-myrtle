# Changelog

All notable changes to Ghost Myrtle will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-01-12

### 🚀 Major Changes

- **TypeScript Migration**: Complete rewrite in TypeScript for better type safety and developer experience
- **Multiple AI Provider Support**: Added support for Anthropic (Claude), OpenRouter, and self-hosted models alongside OpenAI
- **Dynamic Model Fetching**: All providers now fetch available models dynamically from their APIs (no hardcoded models)
- **Resume Functionality**: Interrupted generation sessions can now be resumed from where they left off
- **Enhanced Content Generation**: Improved prompts with universal diversity framework for more varied and natural content

### ✨ New Features

- **Anthropic (Claude) Provider**: Full support for Claude models (Sonnet 3.5, Opus 3, Haiku 3.5)
- **OpenRouter Provider**: Access to hundreds of models through OpenRouter's unified API
- **Self-Hosted Provider**: Support for local LLMs via OpenAI-compatible endpoints
- **State Management**: Generation progress is automatically saved and can be resumed after interruptions
- **Pexels Image Integration**: Keyword-relevant images automatically fetched from Pexels API
  - Falls back to Lorem Picsum if Pexels is not configured
  - Optional configuration with free API key (200 requests/hour)
  - Proper photographer attribution included
- **Style Guide Generator**: Optional comprehensive Ghost formatting showcase page
- **Title Diversity System**: Advanced prompting ensures varied and unique blog post titles across all categories
- **Better Error Messages**: Provider-specific error messages with helpful troubleshooting links
- **Configuration Management**: Enhanced config command with provider-specific setup workflows

### 🔧 Improvements

- **Model Selection**: Interactive model selection with dynamic fetching from provider APIs
- **Better Prompts**: Optimized prompts for both Claude (XML format) and OpenAI/OpenRouter (Markdown format)
- **Content Quality**:
  - Added dimension-based diversity framework (structure, tone, perspective, scope, vocabulary)
  - Contrastive learning to avoid repetitive patterns
  - Better SEO structure with proper headers and internal linking opportunities
- **CLI Experience**: More informative progress indicators and better error handling
- **Configuration**: Centralized config management with validation

### 📝 Technical Changes

- Migrated from JavaScript to TypeScript
- Added Zod for runtime schema validation
- Added Anthropic SDK (`@anthropic-ai/sdk` v0.32.1) for Claude support
- Added OpenAI SDK (v4.75.0) with full API client support
- Added comprehensive type definitions
- Build system with TypeScript compiler
- Entry point changed to `dist/cli/index.js`
- Image service always instantiated for consistent behavior (Pexels or fallback)
- Content extraction now strips `<thinking>` tags from Claude responses

### 📚 Documentation

- Updated README with comprehensive v2.0 documentation
- Added detailed installation and configuration instructions
- Documented all four provider configurations
- Added troubleshooting guide
- Included examples and best practices

### 🔄 Breaking Changes

- Configuration format changed (run `myrtle config` to reconfigure)
- Minimum Node.js version requirement (check README)
- Command-line arguments may have changed
- `.env` configuration replaced with `.myrtle-config.json`

---

## [1.x] - Previous Versions

Legacy versions with OpenAI GPT-3.5-turbo only support. See git history for details.
