import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { SiteContext } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Generate a comprehensive styleguide page showing all Ghost formatting options
 * Uses the Lexical format from the template
 */
export function generateStyleguide(_context: SiteContext): {
  title: string;
  lexical: string;
  slug: string;
} {
  // Load the lexical template
  const templatePath = join(__dirname, 'templates', 'styleguide-lexical.json');
  const lexicalData = readFileSync(templatePath, 'utf-8');

  return {
    title: 'Style Guide & Content Showcase',
    slug: 'styleguide',
    lexical: lexicalData,
  };
}

/**
 * Legacy HTML version (kept for reference, not used)
 */
export function generateStyleguideHTML(_context: SiteContext): {
  title: string;
  content: string;
  slug: string;
} {
  return {
    title: 'Style Guide & Content Showcase',
    slug: 'styleguide',
    content: `
<p>This page demonstrates all the content formatting options available in Ghost. Use this as a reference for content creation and to test your theme's styling.</p>

<h2>Typography</h2>

<h3>Headers</h3>
<p>Ghost supports headers from H2 to H6. H1 is reserved for the post title.</p>

<h2>This is an H2 Header</h2>
<h3>This is an H3 Header</h3>
<h4>This is an H4 Header</h4>
<h5>This is an H5 Header</h5>
<h6>This is an H6 Header</h6>

<h3>Text Formatting</h3>
<p>You can use <strong>bold text</strong>, <em>italic text</em>, <del>strikethrough</del>, and even <code>inline code snippets</code> within your content.</p>

<p>Here's a paragraph with a <a href="https://ghost.org">link to Ghost</a>. Links should be clearly styled and accessible.</p>

<h3>Lists</h3>

<h4>Unordered List</h4>
<ul>
  <li>First item in the list</li>
  <li>Second item with more detail
    <ul>
      <li>Nested item one</li>
      <li>Nested item two</li>
    </ul>
  </li>
  <li>Third item with a conclusion</li>
</ul>

<h4>Ordered List</h4>
<ol>
  <li>First step in the process</li>
  <li>Second step with instructions</li>
  <li>Final step to completion</li>
</ol>

<h2>Quotes & Code</h2>

<h3>Blockquote</h3>
<blockquote>
  <p>"This is a blockquote. It's perfect for highlighting important quotes, testimonials, or key insights. Blockquotes should stand out visually from regular text."</p>
  <p>— Author Name</p>
</blockquote>

<h3>Code Block</h3>
<pre><code class="language-javascript">// Example code block
function greet(name) {
  console.log(\`Hello, \${name}!\`);
  return true;
}

greet('World');
</code></pre>

<h2>Images</h2>

<h3>Single Image</h3>
<figure>
  <img src="https://source.unsplash.com/1600x900/?technology,coding" alt="Technology and coding workspace">
  <figcaption>Example image with caption from Unsplash</figcaption>
</figure>

<h3>Wide Image</h3>
<figure class="kg-width-wide">
  <img src="https://source.unsplash.com/2000x800/?nature,landscape" alt="Beautiful nature landscape">
  <figcaption>Wide image showcasing landscape photography</figcaption>
</figure>

<h2>Special Elements</h2>

<h3>Horizontal Divider</h3>
<p>Use horizontal rules to separate major sections:</p>
<hr>

<h3>Callout / Aside</h3>
<aside>
  <p><strong>💡 Pro Tip:</strong> This is a callout box or aside. It's useful for highlighting tips, warnings, or important information that deserves special attention.</p>
</aside>

<h3>Button</h3>
<div style="text-align: center; margin: 2em 0;">
  <a href="#" style="display: inline-block; padding: 12px 24px; background-color: #15171A; color: #fff; text-decoration: none; border-radius: 4px; font-weight: 600;">Call to Action Button</a>
</div>

<h2>Tables</h2>

<p>Tables are great for displaying structured data:</p>

<table>
  <thead>
    <tr>
      <th>Feature</th>
      <th>Description</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Dynamic Routing</td>
      <td>Custom URL structures for content</td>
      <td>✅ Supported</td>
    </tr>
    <tr>
      <td>Markdown</td>
      <td>Write content in Markdown format</td>
      <td>✅ Supported</td>
    </tr>
    <tr>
      <td>Custom Templates</td>
      <td>Override default theme templates</td>
      <td>✅ Supported</td>
    </tr>
  </tbody>
</table>

<h2>Media Embeds</h2>

<h3>YouTube Video</h3>
<figure class="kg-card kg-embed-card">
  <iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</figure>

<h2>Content Cards</h2>

<h3>Bookmark Card</h3>
<figure class="kg-card kg-bookmark-card">
  <a class="kg-bookmark-container" href="https://ghost.org">
    <div class="kg-bookmark-content">
      <div class="kg-bookmark-title">Ghost - The Professional Publishing Platform</div>
      <div class="kg-bookmark-description">Ghost is a powerful app for new-media creators to publish, share, and grow a business around their content.</div>
      <div class="kg-bookmark-metadata">
        <span class="kg-bookmark-publisher">Ghost</span>
      </div>
    </div>
    <div class="kg-bookmark-thumbnail">
      <img src="https://ghost.org/images/meta/ghost.png" alt="Ghost">
    </div>
  </a>
</figure>

<h2>Gallery</h2>

<p>Image galleries showcase multiple images in a grid:</p>

<figure class="kg-card kg-gallery-card">
  <div class="kg-gallery-container">
    <div class="kg-gallery-row">
      <div class="kg-gallery-image">
        <img src="https://source.unsplash.com/800x600/?office" alt="Modern office space">
      </div>
      <div class="kg-gallery-image">
        <img src="https://source.unsplash.com/800x600/?workspace" alt="Creative workspace">
      </div>
    </div>
    <div class="kg-gallery-row">
      <div class="kg-gallery-image">
        <img src="https://source.unsplash.com/800x600/?computer" alt="Computer setup">
      </div>
      <div class="kg-gallery-image">
        <img src="https://source.unsplash.com/800x600/?laptop" alt="Laptop workstation">
      </div>
    </div>
  </div>
</figure>

<h2>Conclusion</h2>

<p>This styleguide demonstrates the rich formatting options available in Ghost. Your theme should handle all these elements gracefully, providing a consistent and beautiful reading experience.</p>

<p>For more information about Ghost's content features, visit the <a href="https://ghost.org/docs/content/">official documentation</a>.</p>
`.trim(),
  };
}
