import dotenv from 'dotenv';
import GhostAdminApi from '@tryghost/admin-api';
import inquirer from 'inquirer';
import OpenAI from 'openai';
import ora from 'ora';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function pushToGhost(pageContents, categoryContents) {
  const api = new GhostAdminApi({
    url: process.env.GHOST_URL,
    version: 'v5.0',
    key: process.env.GHOST_ADMIN_API_KEY,
  });

  const spinner = ora('Pushing content to Ghost...').start();

  try {
    // Push static pages
    for (const page of pageContents) {
      spinner.text = `Pushing page: ${page.title}`;

      await api.pages.add(
        {
          title: page.title,
          html: page.content,
          status: 'published',
        },
        { source: 'html' }
      );
    }

    // Push categories (tags in Ghost) and related posts
    for (const category of categoryContents) {
      spinner.text = `Pushing category: ${category.category}`;

      for (const post of category.posts) {
        spinner.text = `Pushing post: ${post.title}`;
        await api.posts.add(
          {
            title: post.title,
            html: post.content,
            tags: [
              {
                name: category.category,
                description: `This is a tag for ${category.category} posts.`,
              },
            ],
            status: 'published',
          },
          { source: 'html' }
        );
      }
    }
    spinner.succeed('All content pushed to Ghost successfully.');
  } catch (error) {
    spinner.fail('Error pushing content to Ghost.');
    console.error('Error with Ghost API:', error);
  }
}

function extractContent(html) {
  // Extract the content between <body>...</body> tags
  const bodyMatch = html.match(/<body>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : html;

  // Extract only content wrapped inside tags like <p>, <h2>, <h3>, etc. and excluding <h1>.
  const tagContentMatches = bodyContent.match(
    /<(p|h[2-6]|ul|ol|li)>([\s\S]*?)<\/\1>/gi
  );
  return tagContentMatches ? tagContentMatches.join('\n') : '';
}

function cleanTitle(title) {
  // Remove numbering (e.g. 1., 2., 1), 2)) and wrapping quotes
  return title.replace(/^\d+[\.)]\s+\"|\"$/g, '').trim();
}

async function generatePostTitles(promptContent, count) {
  const spinner = ora('Generating post titles...').start();
  try {
    const chatCompletion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: promptContent }],
      model: 'gpt-3.5-turbo',
    });
    spinner.succeed('Post titles generated successfully.');
    const rawTitles = chatCompletion.choices[0].message.content
      .split('\n')
      .slice(0, count)
      .map(cleanTitle); // Clean each title
    return rawTitles;
  } catch (error) {
    spinner.fail('Error generating post titles.');
    console.error('Error generating titles with OpenAI:', error);
    return [];
  }
}

async function generateContent(promptContent, title) {
  const spinner = ora(`Generating content for page/post "${title}"...`).start();
  try {
    const chatCompletion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: promptContent }],
      model: 'gpt-3.5-turbo',
    });
    spinner.succeed(`Content for page/post "${title}" generated successfully.`);
    const rawContent = chatCompletion.choices[0].message.content.trim();

    // Extracting title between <h1> tags
    const h1Match = rawContent.match(/<h1>(.*?)<\/h1>/i);
    const extractedTitle = h1Match ? h1Match[1] : 'Untitled';

    // Removing h1 tags from content
    const content = extractContent(rawContent); // Extract content
    return { title: extractedTitle, content };
  } catch (error) {
    spinner.fail('Error generating content.');
    console.error('Error generating content with OpenAI:', error);
    return null;
  }
}

async function generatePostContentUsingTitle(title, promptContent) {
  const { content } = await generateContent(promptContent, title);
  return { title, content };
}

export default async function () {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'siteName',
      message: 'What would you like to name your site?',
      default: 'Magic Pages',
    },
    {
      type: 'input',
      name: 'themeType',
      message:
        'What kind of theme would you like to create? (e.g. blog, portfolio, newsletter)',
      default: 'blog',
    },
    {
      type: 'input',
      name: 'storyDescription',
      message:
        'Describe your theme in a few sentences (this is important for OpenAI to generate relevant content):',
      default:
        'This is the blog of a content marketer who writes about marketing, SEO, and content repurposing to help small coffee shops grow their business.',
    },
    {
      type: 'input',
      name: 'pageTitles',
      message:
        'Enter the titles of all the static pages you want to create (comma separated):',
      default: 'About, Contact, Services',
    },
    {
      type: 'input',
      name: 'categoryTitles',
      message:
        'Enter the titles of all the categories you want to create (comma separated):',
      default: 'Marketing, SEO, Content Repurposing',
    },
    {
      type: 'input',
      name: 'postsPerCategory',
      message:
        'Enter number of posts per category (titles and content will be auto-generated):',
      default: '3',
    },
  ]);

  const openai = new OpenAI({
    apiKey: answers.openaiApiKey,
  });

  // Generate content for static pages
  const pages = answers.pageTitles.split(',').map((title) => title.trim());
  const pageContents = [];
  for (const page of pages) {
    const { title, content } = await generateContent(
      `Write content for ${answers.siteName}, a ${answers.themeType} Ghost site, specifically for a ${page} page related to: ${answers.storyDescription}. The goal is to write content that is relevant to the theme of the site and the page. The content should be written in a way that is engaging and informative. The reading level should be at a high school level. The structure and content of the page should be similar to other ${page} pages on the web, keeping in mind the theme of the site. The content should be returned as html, which can then be inserted into a CMS (e.g. wrap the title in an <h1>, then start directly with a <p> tag ).`,
      page
    );
    pageContents.push({ title, content: extractContent(content) }); // Extract content
  }

  const categories = answers.categoryTitles
    .split(',')
    .map((title) => title.trim());

  const categoryContents = [];

  for (const category of categories) {
    const posts = [];
    const titlePrompts = `Provide ${answers.postsPerCategory} unique blog post titles related to ${category}. The titles should be relevant to the theme: ${answers.storyDescription}, yet not mention the site name ${answers.siteName}. The titles should be written in a way that is engaging and informative. The reading level should be at a high school level.`;
    const postTitles = await generatePostTitles(
      titlePrompts,
      answers.postsPerCategory
    );

    for (const title of postTitles) {
      const contentPrompts = `Write content for ${answers.siteName}, a ${answers.themeType} Ghost site, specifically for a blog post titled: ${title}. The goal is to write content that is relevant to the theme of the site and the blog post. The content should be written in a way that is engaging and informative. The reading level should be at a high school level. The structure and content of the blog post should be similar to other blog posts on the web, keeping in mind the theme of the site. The content should be returned as html, which can then be inserted into a CMS (e.g. wrap the title in an <h1>, then start directly with a <p> tag ).`;
      const postContent = await generatePostContentUsingTitle(
        title,
        contentPrompts
      );
      posts.push(postContent);
    }
    categoryContents.push({ category, posts });
  }

  // Pushing content to Ghost
  await pushToGhost(pageContents, categoryContents);
}
