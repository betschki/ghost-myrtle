/**
 * Core types for Ghost Myrtle v2
 */

// ============================================================================
// Provider Types
// ============================================================================

export type ProviderName = 'openai' | 'anthropic' | 'openrouter' | 'selfHosted';

export interface GenerationOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
}

export interface GenerationRequest {
  prompt: string;
  systemPrompt?: string;
  options?: GenerationOptions;
  model?: string;
}

export interface GenerationResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: ProviderName;
  cost?: number;
}

export interface Provider {
  name: ProviderName;
  isConfigured(): boolean;
  generate(request: GenerationRequest): Promise<GenerationResponse>;
  listModels?(): Promise<string[]>;
  testConnection(): Promise<boolean>;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface GhostConfig {
  url: string;
  adminApiKey: string;
}

export interface OpenAIConfig {
  apiKey: string;
  defaultModel: string;
  enabled: boolean;
}

export interface AnthropicConfig {
  apiKey: string;
  defaultModel: string;
  enabled: boolean;
}

export interface OpenRouterConfig {
  apiKey: string;
  defaultModel: string;
  enabled: boolean;
}

export interface SelfHostedConfig {
  endpoint: string;
  apiKey?: string;
  defaultModel: string;
  enabled: boolean;
}

export interface PexelsConfig {
  apiKey?: string;
  enabled: boolean;
}

export interface GenerationConfig {
  titles: GenerationOptions;
  content: GenerationOptions;
}

export interface PromptsConfig {
  useCustom: boolean;
  templatesPath?: string;
}

export interface Config {
  ghost: GhostConfig;
  providers: {
    openai?: OpenAIConfig;
    anthropic?: AnthropicConfig;
    openrouter?: OpenRouterConfig;
    selfHosted?: SelfHostedConfig;
  };
  activeProvider: ProviderName;
  generation: GenerationConfig;
  prompts: PromptsConfig;
  pexels?: PexelsConfig;
}

// ============================================================================
// Content Generation Types
// ============================================================================

export interface SiteContext {
  siteName: string;
  themeType: string;
  storyDescription: string;
  targetAudience?: string;
}

export interface ContentRequest {
  type: 'page' | 'post' | 'title';
  title?: string;
  context: SiteContext;
  category?: string;
  keywords?: string[];
  customPrompt?: string;
}

export interface FeaturedImage {
  url: string;
  alt: string;
  caption?: string;
}

export interface GeneratedContent {
  title: string;
  content: string;
  excerpt?: string;
  featureImage?: FeaturedImage;
  metadata?: {
    keywords?: string[];
    readingTime?: number;
    wordCount?: number;
  };
}

export interface PageContent {
  title: string;
  content?: string;
  lexical?: string;
  slug?: string;
}

export interface PostContent {
  title: string;
  content: string;
  featureImage?: FeaturedImage;
}

export interface CategoryContent {
  category: string;
  posts: PostContent[];
}

// ============================================================================
// Ghost API Types
// ============================================================================

export interface GhostPage {
  title: string;
  html?: string;
  lexical?: string;
  slug?: string;
  status: 'draft' | 'published';
}

export interface GhostPost {
  title: string;
  html: string;
  feature_image?: string;
  feature_image_alt?: string;
  feature_image_caption?: string;
  tags: Array<{
    name: string;
    description?: string;
  }>;
  status: 'draft' | 'published';
}

// ============================================================================
// CLI Types
// ============================================================================

export interface CreateCommandAnswers {
  siteName: string;
  themeType: string;
  storyDescription: string;
  pageTitles: string;
  categoryTitles: string;
  postsPerCategory: string;
}

export interface ConfigCommandAnswers {
  ghostUrl: string;
  ghostAdminApiKey: string;
}

export interface ProviderConfigAnswers {
  provider: ProviderName;
  apiKey?: string;
  endpoint?: string;
  defaultModel: string;
}

// ============================================================================
// Prompt Template Types
// ============================================================================

export interface PromptVariables {
  [key: string]: string | number | boolean | undefined;
}

export interface PromptTemplate {
  system?: string;
  user: string;
  variables: PromptVariables;
}

export interface PromptBuilderOptions {
  provider: ProviderName;
  contentType: 'page' | 'post' | 'title';
  context: SiteContext;
  customVariables?: PromptVariables;
}

// ============================================================================
// Cost Tracking Types
// ============================================================================

export interface CostInfo {
  provider: ProviderName;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

export interface SessionCosts {
  total: number;
  byProvider: Record<ProviderName, number>;
  items: CostInfo[];
}

// ============================================================================
// Error Types
// ============================================================================

export class MyrException extends Error {
  constructor(
    message: string,
    public code: string,
    public provider?: ProviderName
  ) {
    super(message);
    this.name = 'MyrtleError';
  }
}

export class ProviderError extends MyrException {
  constructor(message: string, provider: ProviderName) {
    super(message, 'PROVIDER_ERROR', provider);
    this.name = 'ProviderError';
  }
}

export class ConfigError extends MyrException {
  constructor(message: string) {
    super(message, 'CONFIG_ERROR');
    this.name = 'ConfigError';
  }
}

export class GhostApiError extends MyrException {
  constructor(message: string) {
    super(message, 'GHOST_API_ERROR');
    this.name = 'GhostApiError';
  }
}
