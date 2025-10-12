import { z } from 'zod';

/**
 * Zod schemas for configuration validation
 */

export const GhostConfigSchema = z.object({
  url: z.string().url('Ghost URL must be a valid URL'),
  adminApiKey: z.string().min(1, 'Ghost Admin API key is required'),
});

export const OpenAIConfigSchema = z.object({
  apiKey: z.string().min(1, 'OpenAI API key is required'),
  defaultModel: z.string().default('gpt-4-turbo'),
  enabled: z.boolean().default(true),
});

export const AnthropicConfigSchema = z.object({
  apiKey: z.string().min(1, 'Anthropic API key is required'),
  defaultModel: z.string().default('claude-3-5-sonnet-20250226'),
  enabled: z.boolean().default(true),
});

export const OpenRouterConfigSchema = z.object({
  apiKey: z.string().min(1, 'OpenRouter API key is required'),
  defaultModel: z.string().default('anthropic/claude-3.5-sonnet'),
  enabled: z.boolean().default(true),
});

export const SelfHostedConfigSchema = z.object({
  endpoint: z.string().url('Endpoint must be a valid URL'),
  apiKey: z.string().optional(),
  defaultModel: z.string().default('llama3:70b'),
  enabled: z.boolean().default(true),
});

export const PexelsConfigSchema = z.object({
  apiKey: z.string().optional(),
  enabled: z.boolean().default(false),
});

export const GenerationOptionsSchema = z.object({
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().positive().default(4000),
  topP: z.number().min(0).max(1).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
});

export const GenerationConfigSchema = z.object({
  titles: GenerationOptionsSchema.default({
    temperature: 0.8,
    maxTokens: 100,
  }),
  content: GenerationOptionsSchema.default({
    temperature: 0.7,
    maxTokens: 4000,
  }),
});

export const PromptsConfigSchema = z.object({
  useCustom: z.boolean().default(false),
  templatesPath: z.string().optional(),
});

export const ConfigSchema = z.object({
  ghost: GhostConfigSchema,
  providers: z.object({
    openai: OpenAIConfigSchema.optional(),
    anthropic: AnthropicConfigSchema.optional(),
    openrouter: OpenRouterConfigSchema.optional(),
    selfHosted: SelfHostedConfigSchema.optional(),
  }),
  activeProvider: z.enum(['openai', 'anthropic', 'openrouter', 'selfHosted']),
  generation: GenerationConfigSchema.default({
    titles: {
      temperature: 0.8,
      maxTokens: 100,
    },
    content: {
      temperature: 0.7,
      maxTokens: 4000,
    },
  }),
  prompts: PromptsConfigSchema.default({
    useCustom: false,
  }),
  pexels: PexelsConfigSchema.optional(),
});

// Export type inference
export type ConfigSchemaType = z.infer<typeof ConfigSchema>;
