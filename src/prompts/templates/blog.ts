import type { SiteContext, ProviderName } from '../../types/index.js';
import type { ImageResult } from '../../services/image-service.js';
import {
  getBaseSystemPrompt,
  getSiteContextText,
  getForbiddenPhrasesText,
  WRITING_STYLE_REQUIREMENTS,
  HTML_STRUCTURE,
} from './base.js';

/**
 * Generate prompt for blog post titles
 */
export function generateTitlePrompt(
  context: SiteContext,
  category: string,
  count: number,
  keywords?: string[],
  previousTitles: string[] = []
): { prompt: string; systemPrompt?: string } {
  const systemPrompt = `You are an expert blog title writer. You create compelling, specific titles that:
- Are 45-65 characters (optimal for SEO)
- Include relevant keywords naturally
- Create curiosity without being clickbait
- Are specific and descriptive
- Avoid generic AI phrases like "Ultimate Guide" or "Complete Guide"
- Sound human and authentic
- Use DIVERSE perspectives, structures, and word choices`;

  const keywordsText = keywords?.length
    ? `\nKeywords: ${keywords.join(', ')}`
    : '';

  const previousTitlesText = previousTitles.length > 0
    ? `\n\nALREADY GENERATED (DO NOT REPEAT these styles, structures, or word patterns):\n${previousTitles.map(t => `- ${t}`).join('\n')}`
    : '';

  const prompt = `Generate ${count} MAXIMALLY DIFFERENT blog post titles for "${category}".

Site Context:
${getSiteContextText(context)}${keywordsText}${previousTitlesText}

DIVERSITY REQUIREMENTS (critical):
Each title must use a DISTINCT approach. Vary ALL of these dimensions:
1. STRUCTURE: Mix question/statement/how-to/narrative/list
2. TONE: Mix personal/analytical/provocative/practical/philosophical
3. PERSPECTIVE: Mix first-person/second-person/third-person/universal
4. SCOPE: Mix specific examples with broad concepts
5. VOCABULARY: Use completely different nouns and verbs in each title

Title Structure Examples (choose different ones for each):
- Personal experience: "The Day I...", "When I...", "My First..."
- Direct how-to: "How I...", "Why I Started...", "The Way I..."
- Philosophical: "What If...", "Why Does...", "Is It True That..."
- Factual/Historical: "The Hidden Story of...", "What We Get Wrong About..."
- Comparative: "Before and After...", "Then vs Now in..."
- Experiential: "What It Feels Like to...", "A Season of..."
- Contrarian: "Why X Isn't...", "The Surprising Truth About..."
- Time/Place specific: "In [Season/Year] at [Place]", "Beneath the..."
- Actionable: "Start With...", "Try This Instead of..."

Requirements:
- 45-65 characters each
- NO repeated key words across titles (check for noun/verb repetition)
- NO repeated sentence structures
- Target audience: ${context.targetAudience || 'general readers'}
- Sound natural and human (avoid AI clichés)

${getForbiddenPhrasesText()}

Return ONLY the titles, one per line, no numbering or formatting.`;

  return { prompt, systemPrompt };
}

/**
 * Generate prompt for blog post content (Claude-optimized with XML)
 */
export function generateBlogPostPromptClaude(
  context: SiteContext,
  title: string,
  category?: string,
  keywords?: string[],
  images?: ImageResult[]
): { prompt: string; systemPrompt: string } {
  const systemPrompt = getBaseSystemPrompt('blog posts');

  const keywordsText = keywords?.length
    ? `<primary_keyword>${keywords[0]}</primary_keyword>
<secondary_keywords>${keywords.slice(1).join(', ')}</secondary_keywords>`
    : '';

  // Generate image instructions with provided URLs
  let imageInstructions = '';
  if (images && images.length > 0) {
    imageInstructions = `   - Add ${images.length} relevant images using EXACTLY these URLs:
${images.map((img, i) => `     Image ${i + 1}: <figure><img src="${img.url}" alt="${img.alt}"><figcaption>Photo by ${img.photographer}</figcaption></figure>`).join('\n')}
   - Place these images naturally throughout the content to break up text
   - Use the EXACT URLs provided above - do not modify them`;
  }

  const prompt = `<context>
<site_info>
${getSiteContextText(context)}
</site_info>

<seo_requirements>
${keywordsText}
<target_length>2000-3000 words</target_length>
<reading_level>High school to college level</reading_level>
</seo_requirements>

${category ? `<category>${category}</category>` : ''}
</context>

<task>
Write a comprehensive, engaging blog post titled: "${title}"

The post should provide genuine value and actionable insights. Target readers who want ${context.storyDescription}.
</task>

<constraints>
<forbidden_phrases>
${getForbiddenPhrasesText()}
</forbidden_phrases>

<required_style>
${WRITING_STYLE_REQUIREMENTS}
</required_style>

<html_structure>
${HTML_STRUCTURE}
</html_structure>

<seo_structure>
1. Hook (150-200 words): Start with a specific question, surprising fact, or compelling scenario. NO generic intros.

2. Main Content (1800-2500 words):
   - 3-5 main sections, each with an H2 header
   - Each section: 400-600 words with specific examples
   - Use H3 subheadings to break up longer sections
   - Include concrete data, statistics, or real examples
   - Add practical tips and actionable advice

3. Conclusion (150-200 words):
   - Summarize key takeaways
   - End with actionable next steps
   - Include a subtle call-to-action related to ${context.themeType}

4. Throughout:
   - Integrate keywords naturally (${keywords?.join(', ') || 'main topic'})
${imageInstructions}
   - Mark 2-3 internal linking opportunities with <!-- internal link: suggested page -->
   - Use lists and blockquotes to break up text
</seo_structure>
</constraints>

<output_format>
Return ONLY the HTML content for the blog post body.

CRITICAL REQUIREMENTS:
- NO markdown formatting
- NO wrapper tags (html, body, head, etc.)
- NO <thinking> tags or internal reasoning
- NO <h1> tags (Ghost adds the title automatically)
- Start directly with <h2> or <p>
- Include ONLY the content that should appear on the page

Before writing, think about:
1. What specific problem or question does this post solve?
2. What unique angle or insight can make this stand out?
3. What concrete examples will resonate with ${context.targetAudience || 'the audience'}?
4. How can we balance SEO optimization with authentic, engaging writing?

Then write the HTML content directly.
</output_format>`;

  return { prompt, systemPrompt };
}

/**
 * Generate prompt for blog post content (OpenAI/OpenRouter-optimized)
 */
export function generateBlogPostPromptOpenAI(
  context: SiteContext,
  title: string,
  category?: string,
  keywords?: string[],
  images?: ImageResult[]
): { prompt: string; systemPrompt: string } {
  const systemPrompt = getBaseSystemPrompt('blog posts');

  const keywordsText = keywords?.length
    ? `\n**Primary Keyword:** ${keywords[0]}\n**Secondary Keywords:** ${keywords.slice(1).join(', ')}`
    : '';

  // Generate image instructions with provided URLs
  let imageInstructions = '';
  if (images && images.length > 0) {
    imageInstructions = `   - Add ${images.length} relevant images using EXACTLY these URLs:
${images.map((img, i) => `     Image ${i + 1}: <figure><img src="${img.url}" alt="${img.alt}"><figcaption>Photo by ${img.photographer}</figcaption></figure>`).join('\n')}
   - Place these images naturally throughout the content to break up text
   - Use the EXACT URLs provided above - do not modify them`;
  }

  const prompt = `# CONTEXT

## Site Information
${getSiteContextText(context)}

## SEO Requirements${keywordsText}
- **Target Length:** 2000-3000 words
- **Reading Level:** High school to college

${category ? `## Category\n${category}` : ''}

---

# TASK

Write a comprehensive, engaging blog post titled: **"${title}"**

The post should provide genuine value and actionable insights. Target readers who want ${context.storyDescription}.

---

# CONSTRAINTS

## Forbidden Phrases
${getForbiddenPhrasesText()}

## Required Writing Style
${WRITING_STYLE_REQUIREMENTS}

## HTML Structure
${HTML_STRUCTURE}

## SEO Structure

**1. Hook (150-200 words):** Start with a specific question, surprising fact, or compelling scenario. NO generic intros.

**2. Main Content (1800-2500 words):**
   - 3-5 main sections, each with an H2 header
   - Each section: 400-600 words with specific examples
   - Use H3 subheadings to break up longer sections
   - Include concrete data, statistics, or real examples
   - Add practical tips and actionable advice

**3. Conclusion (150-200 words):**
   - Summarize key takeaways
   - End with actionable next steps
   - Include a subtle call-to-action related to ${context.themeType}

**4. Throughout:**
   - Integrate keywords naturally (${keywords?.join(', ') || 'main topic'})
${imageInstructions}
   - Mark 2-3 internal linking opportunities with <!-- internal link: suggested page -->
   - Use lists and blockquotes to break up text

---

# OUTPUT FORMAT

Return ONLY the HTML content for the blog post body.

**CRITICAL REQUIREMENTS:**
- NO markdown formatting
- NO wrapper tags (html, body, head, etc.)
- NO thinking process or internal reasoning in the output
- NO <h1> tags (Ghost adds the title automatically)
- Start directly with <h2> or <p>
- Include ONLY the content that should appear on the page

**Before writing, think about:**
1. What specific problem or question does this post solve?
2. What unique angle or insight can make this stand out?
3. What concrete examples will resonate with ${context.targetAudience || 'the audience'}?
4. How can we balance SEO optimization with authentic, engaging writing?

Then write the HTML content directly.`;

  return { prompt, systemPrompt };
}

/**
 * Main function to generate blog post prompt for any provider
 */
export function generateBlogPostPrompt(
  context: SiteContext,
  title: string,
  provider: ProviderName,
  category?: string,
  keywords?: string[],
  images?: ImageResult[]
): { prompt: string; systemPrompt?: string } {
  // Claude gets optimized XML format
  if (provider === 'anthropic') {
    return generateBlogPostPromptClaude(context, title, category, keywords, images);
  }

  // OpenAI, OpenRouter, and self-hosted get Markdown format
  return generateBlogPostPromptOpenAI(context, title, category, keywords, images);
}
