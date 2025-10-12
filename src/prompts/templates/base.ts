import type { SiteContext, ProviderName } from '../../types/index.js';

/**
 * Base prompt templates and utilities
 */

/**
 * AI clichés to avoid (based on 2025 research)
 */
export const AI_CLICHES = [
  'dive in',
  "let's dive in",
  "let's explore",
  'revolutionize',
  'game-changer',
  'game changer',
  'cutting-edge',
  'cutting edge',
  "in today's fast-paced world",
  "in today's digital landscape",
  "in today's digital age",
  'it is important to note that',
  'furthermore',
  'moreover',
  'indeed',
  'unlock the potential',
  'harness the power',
  'leverage',
  'paradigm shift',
  'synergy',
  'delve into',
  'landscape',
  'realm',
  'tapestry',
  'pivotal',
  'crucial',
  'innovative',
  'groundbreaking',
  'state-of-the-art',
  'robust',
  'seamless',
  'empower',
  'transformation',
  'disrupt',
  'at the end of the day',
  'the fact of the matter is',
  'in conclusion',
  'to sum up',
  'it goes without saying',
  'needless to say',
  'first and foremost',
  'last but not least',
  'each and every',
  'absolutely essential',
  'completely unique',
  'totally revolutionary',
  'unlock secrets',
  'master the art',
  'elevate your',
  'take your X to the next level',
];

/**
 * Writing style requirements for human-like content
 */
export const WRITING_STYLE_REQUIREMENTS = `
- Mix sentence lengths: Use both short sentences. And longer, more flowing sentences that develop ideas naturally and guide the reader through the content.
- Vary paragraph structure: Some paragraphs can be a single punchy sentence. Others can be 3-4 sentences that explore an idea.
- Start some paragraphs with questions to engage readers
- Use contractions naturally (don't, won't, can't, shouldn't)
- Include specific numbers, data points, and concrete examples
- Add personal perspective or industry insights where appropriate
- Use natural transitions between ideas (not formulaic connectors)
- Avoid corporate buzzwords and AI-generated clichés
- Write as if having a conversation with an intelligent reader
- Show personality and voice - don't be bland or generic
`;

/**
 * SEO requirements for Ghost CMS content
 */
export const SEO_REQUIREMENTS = `
- Target 2000-3000 words for blog posts (longer is better for SEO)
- Use clear header hierarchy: H2 for main sections, H3 for subsections
- Integrate keywords naturally throughout the content (no keyword stuffing)
- Create descriptive, scannable subheadings
- Include internal linking opportunities (mark with [link opportunity])
- Suggest image placements with descriptive alt text
- Front-load important keywords in first 100 words
- Use semantic HTML (lists, blockquotes, emphasis tags)
- Create content that answers specific questions
`;

/**
 * HTML structure requirements for Ghost CMS
 */
export const HTML_STRUCTURE = `
- NEVER use <h1> tags (Ghost adds these automatically from the title)
- Start main sections with <h2> tags
- Use <h3> tags for subsections
- Wrap all text in <p> tags
- Use <ul> or <ol> for lists
- Use <li> for list items
- Use <blockquote> for important callouts or quotes
- Use <strong> for emphasis (sparingly)
- Use <em> for subtle emphasis
- Suggest images as HTML comments: <!-- IMAGE: Description for alt text -->
- Mark internal linking opportunities: <!-- LINK: Suggested anchor text for internal link -->
`;

/**
 * Generate forbidden phrases list
 */
export function getForbiddenPhrasesText(): string {
  return `NEVER use these AI clichés and overused phrases:
${AI_CLICHES.map((phrase) => `- "${phrase}"`).join('\n')}

Be creative and find fresh, authentic ways to express ideas.`;
}

/**
 * Generate site context text
 */
export function getSiteContextText(context: SiteContext): string {
  return `
Site Name: ${context.siteName}
Theme Type: ${context.themeType}
Description: ${context.storyDescription}
${context.targetAudience ? `Target Audience: ${context.targetAudience}` : ''}
  `.trim();
}

/**
 * Generate base quality criteria
 */
export const QUALITY_CRITERIA = `
Quality Criteria for Excellent Content:
1. Authenticity: Sounds like a real person wrote it, not an AI
2. Specificity: Uses concrete examples and specific details
3. Value: Provides actionable insights or useful information
4. Engagement: Keeps readers interested with varied structure
5. SEO-Friendly: Optimized for search engines without feeling forced
6. Scannability: Easy to skim with clear headers and short paragraphs
7. Uniqueness: Offers a fresh perspective or unique angle
8. Completeness: Thoroughly covers the topic without fluff
`;

/**
 * Base system prompt for content writers (provider-agnostic)
 */
export function getBaseSystemPrompt(contentType: string): string {
  return `You are an expert content writer specializing in ${contentType} for Ghost CMS.

Your writing style:
${WRITING_STYLE_REQUIREMENTS}

${getForbiddenPhrasesText()}

${QUALITY_CRITERIA}`;
}

/**
 * Provider-specific prompt wrapper
 */
export function wrapForProvider(
  prompt: string,
  systemPrompt: string | undefined,
  provider: ProviderName
): { prompt: string; systemPrompt?: string } {
  // For providers that don't support system prompts well,
  // we can merge them into the user prompt
  if (provider === 'selfHosted') {
    // Some self-hosted models may not handle system prompts well
    return {
      prompt: systemPrompt
        ? `${systemPrompt}\n\n---\n\n${prompt}`
        : prompt,
    };
  }

  return {
    prompt,
    systemPrompt,
  };
}
