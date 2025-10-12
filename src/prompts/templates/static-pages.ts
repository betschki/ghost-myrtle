import type { SiteContext, ProviderName } from '../../types/index.js';
import {
  getBaseSystemPrompt,
  getSiteContextText,
  getForbiddenPhrasesText,
  WRITING_STYLE_REQUIREMENTS,
  HTML_STRUCTURE,
} from './base.js';

/**
 * Page-specific guidance for different static pages
 */
const PAGE_GUIDANCE: Record<
  string,
  { purpose: string; structure: string; tone: string }
> = {
  about: {
    purpose:
      'Tell the story behind the site/business, build trust and credibility',
    structure: `
- Personal or brand story (how it started)
- Mission and values
- What makes you/it different
- Credentials or experience
- Personal touch (photo suggestion, team if applicable)
- Call-to-action (contact, subscribe, etc.)`,
    tone: 'Authentic, personal, credible but not boastful',
  },
  contact: {
    purpose: 'Make it easy for visitors to get in touch',
    structure: `
- Why to get in touch (value proposition)
- Available contact methods (form, email, social)
- Response time expectations
- Location/hours if applicable
- Brief reassurance about privacy
- Alternative ways to stay connected`,
    tone: 'Welcoming, professional, reassuring',
  },
  services: {
    purpose: 'Clearly explain what you offer and the value it provides',
    structure: `
- Overview of services/offerings
- Individual service descriptions with benefits (not just features)
- Who each service is for
- Process or how it works
- Pricing transparency (if applicable)
- Social proof or results
- Clear next steps`,
    tone: 'Benefits-focused, clear, helpful, not salesy',
  },
  portfolio: {
    purpose: 'Showcase work and demonstrate expertise',
    structure: `
- Brief intro about your work/approach
- Case study highlights or project categories
- Process or methodology
- Results and impact
- What clients/users say
- Call-to-action to see more or get in touch`,
    tone: 'Confident but humble, results-focused',
  },
  privacy: {
    purpose: 'Explain data practices clearly and build trust',
    structure: `
- What data is collected and why
- How data is used
- Who data is shared with (if anyone)
- User rights and choices
- Security measures
- Contact for questions`,
    tone: 'Clear, transparent, respectful of privacy',
  },
};

/**
 * Get guidance for specific page type
 */
function getPageGuidance(pageTitle: string): {
  purpose: string;
  structure: string;
  tone: string;
} {
  const lowerTitle = pageTitle.toLowerCase();

  for (const [key, guidance] of Object.entries(PAGE_GUIDANCE)) {
    if (lowerTitle.includes(key)) {
      return guidance;
    }
  }

  // Default guidance for unknown page types
  return {
    purpose: 'Provide helpful information relevant to the page title',
    structure: `
- Clear introduction
- Main content organized logically
- Practical information
- Next steps or call-to-action`,
    tone: 'Clear, helpful, authentic',
  };
}

/**
 * Generate prompt for static pages (Claude-optimized)
 */
export function generateStaticPagePromptClaude(
  context: SiteContext,
  pageTitle: string
): { prompt: string; systemPrompt: string } {
  const systemPrompt = getBaseSystemPrompt('static pages');
  const guidance = getPageGuidance(pageTitle);

  const prompt = `<context>
<site_info>
${getSiteContextText(context)}
</site_info>

<page_purpose>
${guidance.purpose}
</page_purpose>
</context>

<task>
Write content for a "${pageTitle}" page for ${context.siteName}.

The page should feel authentic and align with the site's theme: ${context.storyDescription}
</task>

<constraints>
<forbidden_phrases>
${getForbiddenPhrasesText()}
</forbidden_phrases>

<required_style>
${WRITING_STYLE_REQUIREMENTS}

Tone: ${guidance.tone}
</required_style>

<html_structure>
${HTML_STRUCTURE}
</html_structure>

<page_structure>
${guidance.structure}

Length: 600-1000 words (comprehensive but concise)
</page_structure>
</constraints>

<thinking_process>
Before writing, consider:
1. What would visitors to this ${pageTitle} page want to know?
2. How can we build trust and credibility?
3. What makes ${context.siteName} unique in this context?
4. What action should visitors take after reading?

Think through your approach in <thinking> tags, then write the content.
</thinking_process>

<output_format>
Return ONLY the HTML content. No markdown. No wrapper tags.
Start directly with <h2> or <p> (NEVER <h1>).
</output_format>`;

  return { prompt, systemPrompt };
}

/**
 * Generate prompt for static pages (OpenAI/OpenRouter-optimized)
 */
export function generateStaticPagePromptOpenAI(
  context: SiteContext,
  pageTitle: string
): { prompt: string; systemPrompt: string } {
  const systemPrompt = getBaseSystemPrompt('static pages');
  const guidance = getPageGuidance(pageTitle);

  const prompt = `# CONTEXT

## Site Information
${getSiteContextText(context)}

## Page Purpose
${guidance.purpose}

---

# TASK

Write content for a **"${pageTitle}"** page for ${context.siteName}.

The page should feel authentic and align with the site's theme: ${context.storyDescription}

---

# CONSTRAINTS

## Forbidden Phrases
${getForbiddenPhrasesText()}

## Required Writing Style
${WRITING_STYLE_REQUIREMENTS}

**Tone:** ${guidance.tone}

## HTML Structure
${HTML_STRUCTURE}

## Page Structure
${guidance.structure}

**Length:** 600-1000 words (comprehensive but concise)

---

# APPROACH

Think step-by-step about:
1. What would visitors to this ${pageTitle} page want to know?
2. How can we build trust and credibility?
3. What makes ${context.siteName} unique in this context?
4. What action should visitors take after reading?

---

# OUTPUT FORMAT

Return ONLY the HTML content. No markdown. No wrapper tags.
Start directly with <h2> or <p> (NEVER <h1>).`;

  return { prompt, systemPrompt };
}

/**
 * Main function to generate static page prompt for any provider
 */
export function generateStaticPagePrompt(
  context: SiteContext,
  pageTitle: string,
  provider: ProviderName
): { prompt: string; systemPrompt?: string } {
  // Claude gets optimized XML format
  if (provider === 'anthropic') {
    return generateStaticPagePromptClaude(context, pageTitle);
  }

  // OpenAI, OpenRouter, and self-hosted get Markdown format
  return generateStaticPagePromptOpenAI(context, pageTitle);
}
