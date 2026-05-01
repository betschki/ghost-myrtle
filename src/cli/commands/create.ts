import inquirer from 'inquirer';
import ora from 'ora';
import { ConfigManager } from '../../config/config-manager.js';
import { ProviderFactory } from '../../providers/factory.js';
import { ContentGenerator } from '../../generators/content-generator.js';
import { TitleGenerator } from '../../generators/title-generator.js';
import { GhostClient } from '../../ghost/ghost-client.js';
import { generateStyleguide } from '../../generators/styleguide-generator.js';
import { StateManager, type GenerationState } from '../../utils/state-manager.js';
import type {
  SiteContext,
  PageContent,
  CategoryContent,
  PostContent,
  ProviderName,
} from '../../types/index.js';

interface CreateOptions {
  dryRun?: boolean;
  preview?: boolean;
  provider?: string;
  model?: string;
  temperature?: number;
}

/**
 * Parse command-line options
 */
function parseOptions(args: string[]): CreateOptions {
  const options: CreateOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--preview':
        options.preview = true;
        break;
      case '--provider':
        options.provider = args[++i];
        break;
      case '--model':
        options.model = args[++i];
        break;
      case '--temperature':
        options.temperature = parseFloat(args[++i]);
        break;
    }
  }

  return options;
}

/**
 * Main create command
 */
export async function createCommand(args: string[]): Promise<void> {
  const options = parseOptions(args);

  // Check configuration
  const hasConfig = await ConfigManager.exists();
  if (!hasConfig) {
    console.log(
      '❌ No configuration found. Run `myrtle config` first to set up your environment.'
    );
    return;
  }

  const config = await ConfigManager.load();

  // Check for existing state (resume functionality)
  const hasState = await StateManager.hasState();
  let resumeState: GenerationState | null = null;

  if (hasState) {
    const savedState = await StateManager.load();
    if (savedState) {
      const progress = StateManager.getProgress(savedState);
      console.log('\n🔄 Found incomplete generation session:');
      console.log(`   Started: ${new Date(savedState.startedAt).toLocaleString()}`);
      console.log(`   Progress: ${progress.percentComplete}% complete`);
      console.log(`   Pages: ${progress.pagesComplete}/${progress.pagesTotal}`);
      console.log(`   Posts: ${progress.postsComplete}/${progress.postsTotal}\n`);

      const { resume } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'resume',
          message: 'Would you like to resume this session?',
          default: true,
        },
      ]);

      if (resume) {
        resumeState = savedState;
        console.log('✅ Resuming from saved state...\n');
      } else {
        await StateManager.clear();
        console.log('🗑️  Starting fresh session...\n');
      }
    }
  }

  // Get provider
  const providerName = (options.provider as ProviderName) || config.activeProvider;
  const provider = ProviderFactory.createProvider(providerName, config);

  if (!provider.isConfigured()) {
    console.log(
      `❌ Provider "${providerName}" is not configured. Run \`myrtle config provider ${providerName}\` to configure it.`
    );
    return;
  }

  console.log(`\n🤖 Using provider: ${providerName.toUpperCase()}`);
  if (options.model) {
    console.log(`📦 Model: ${options.model}`);
  }
  if (options.dryRun) {
    console.log('🔍 DRY RUN MODE - Content will not be pushed to Ghost');
  }
  console.log();

  // Use existing state or get new user input
  let siteContext: SiteContext;
  let includeStyleguide: boolean;
  let generatePages: boolean;
  let pageTitles: string[];
  let categoryConfigs: Array<{ name: string; postCount: number }>;
  let state: GenerationState;

  if (resumeState) {
    // Resume from saved state
    siteContext = resumeState.siteContext;
    includeStyleguide = resumeState.includeStyleguide;
    generatePages = resumeState.generatePages;
    pageTitles = resumeState.pageTitles;
    categoryConfigs = resumeState.categories;
    state = resumeState;
  } else {
    // Get user input for content generation
    const answers = await inquirer.prompt<{
    siteName: string;
    themeType: string;
    storyDescription: string;
    targetAudience: string;
    includeStyleguide: boolean;
    generatePages: boolean;
    pageTitles: string;
    generatePosts: boolean;
    categoryTitles: string;
    postsPerCategory: number;
  }>([
    {
      type: 'input',
      name: 'siteName',
      message: 'What would you like to name your site?',
      default: 'Magic Pages',
    },
    {
      type: 'input',
      name: 'themeType',
      message: 'What kind of site is this?',
      default: 'blog',
    },
    {
      type: 'input',
      name: 'storyDescription',
      message: 'Describe your site in detail (this is important for AI!):',
      default:
        'This is a blog for content marketers who want to learn about SEO, content strategy, and AI-powered content creation.',
    },
    {
      type: 'input',
      name: 'targetAudience',
      message: 'Who is your target audience?',
      default: 'Marketing professionals and content creators',
    },
    {
      type: 'confirm',
      name: 'includeStyleguide',
      message:
        'Include a Style Guide page? (Shows all Ghost formatting options)',
      default: true,
    },
    {
      type: 'confirm',
      name: 'generatePages',
      message: 'Generate static pages (About, Contact, etc.)?',
      default: true,
    },
    {
      type: 'input',
      name: 'pageTitles',
      message: 'Enter the static page titles (comma separated):',
      default: 'About, Contact, Services',
      when: (answers) => answers.generatePages,
    },
    {
      type: 'confirm',
      name: 'generatePosts',
      message: 'Generate blog posts?',
      default: true,
    },
    {
      type: 'input',
      name: 'categoryTitles',
      message: 'Enter category/tag names (comma separated):',
      default: 'SEO, Content Strategy, AI Tools',
      when: (answers) => answers.generatePosts,
    },
    {
      type: 'number',
      name: 'postsPerCategory',
      message: 'How many posts per category?',
      default: 3,
      validate: (input: number) =>
        input > 0 || 'Must be at least 1',
      when: (answers) => answers.generatePosts,
    },
  ]);

    siteContext = {
      siteName: answers.siteName,
      themeType: answers.themeType,
      storyDescription: answers.storyDescription,
      targetAudience: answers.targetAudience,
    };

    includeStyleguide = answers.includeStyleguide;
    generatePages = answers.generatePages;
    pageTitles = answers.pageTitles
      ? answers.pageTitles.split(',').map((p: string) => p.trim())
      : [];

    // Only create category configs if user wants to generate posts
    if (answers.generatePosts && answers.categoryTitles) {
      const categoryList = answers.categoryTitles
        .split(',')
        .map((c: string) => c.trim());
      categoryConfigs = categoryList.map((name) => ({
        name,
        postCount: answers.postsPerCategory,
      }));
    } else {
      categoryConfigs = [];
    }

    // Create initial state
    state = StateManager.createInitialState(
      siteContext,
      includeStyleguide,
      generatePages,
      pageTitles,
      categoryConfigs
    );

    // Save initial state
    await StateManager.save(state);
  }

  const contentGenerator = new ContentGenerator(provider, config.pexels?.apiKey);
  const titleGenerator = new TitleGenerator(provider);

  const generationOptions = {
    temperature: options.temperature ?? config.generation.content.temperature,
    maxTokens: config.generation.content.maxTokens,
  };

  const titleOptions = {
    temperature: config.generation.titles.temperature,
    maxTokens: config.generation.titles.maxTokens,
  };

  // Generate static pages
  const pages: PageContent[] = [...state.completedPages];

  if (state.pendingPages.length > 0) {
    console.log('\n📄 Generating static pages...\n');

    for (const pageTitle of state.pendingPages) {
      const spinner = ora(`Generating ${pageTitle} page...`).start();

      try {
        let pageContent: PageContent;

        // Handle styleguide specially (no AI generation)
        if (pageTitle === 'Style Guide & Content Showcase') {
          const styleguide = generateStyleguide(siteContext);
          pageContent = {
            title: styleguide.title,
            lexical: styleguide.lexical,
            slug: styleguide.slug,
          };
          spinner.succeed('✅ Style Guide page added (pre-made template with Lexical format)');
        } else {
          // Generate custom page with AI
          const generated = await contentGenerator.generateStaticPage(
            siteContext,
            pageTitle,
            generationOptions
          );

          pageContent = {
            title: generated.title,
            content: generated.content,
          };

          spinner.succeed(
            `Generated ${pageTitle} page (${generated.metadata?.wordCount} words)`
          );

          if (options.preview) {
            console.log(`\n--- Preview of ${pageTitle} ---`);
            console.log(generated.content.substring(0, 200) + '...\n');
          }
        }

        pages.push(pageContent);
        state = StateManager.markPageComplete(state, pageContent);
        await StateManager.save(state);
      } catch (error) {
        spinner.fail(`Failed to generate ${pageTitle} page`);
        console.error(
          error instanceof Error ? error.message : 'Unknown error'
        );
        console.log('\n💾 Progress saved. Run `myrtle create` to resume.\n');
        return; // Exit to allow resume
      }
    }
  } else if (state.completedPages.length === 0) {
    console.log('\n⏭️  Skipping static page generation\n');
  } else {
    console.log(`\n✅ Using ${state.completedPages.length} previously generated pages\n`);
  }

  // Generate blog posts by category
  const categories: CategoryContent[] = [...state.completedPosts];

  if (state.pendingPosts.length > 0) {
    console.log('\n📝 Generating blog posts...\n');

  for (let i = 0; i < state.pendingPosts.length; i++) {
    // Always get fresh reference from state to ensure we have latest pendingTitles
    const pendingCategory = state.pendingPosts[i];
    console.log(`\n🏷️  Category: ${pendingCategory.category}\n`);

    let titles = pendingCategory.titles;

    // Generate titles if not already done
    if (!pendingCategory.titlesGenerated) {
      const spinner = ora(`Generating post titles for ${pendingCategory.category}...`).start();

      try {
        const catConfig = state.categories.find((c) => c.name === pendingCategory.category);
        const postCount = catConfig?.postCount || 3;

        titles = await titleGenerator.generateTitles(
          siteContext,
          pendingCategory.category,
          postCount,
          [pendingCategory.category],
          titleOptions
        );

        spinner.succeed(
          `Generated ${titles.length} titles for ${pendingCategory.category}`
        );

        state = StateManager.markTitlesGenerated(state, pendingCategory.category, titles);
        await StateManager.save(state);

        // Get updated pendingCategory reference after state change
        const updatedPendingCategory = state.pendingPosts[i];
        titles = updatedPendingCategory.titles;
      } catch (error) {
        spinner.fail(`Failed to generate titles for ${pendingCategory.category}`);
        console.error(
          error instanceof Error ? error.message : 'Unknown error'
        );
        console.log('\n💾 Progress saved. Run `myrtle create` to resume.\n');
        return;
      }
    } else if (pendingCategory.pendingTitles.length < titles.length) {
      // Some posts already completed
      const completed = titles.length - pendingCategory.pendingTitles.length;
      console.log(`✅ ${completed} post(s) already completed for this category\n`);
    }

    // Get fresh reference again to ensure we have current pendingTitles
    const currentPendingCategory = state.pendingPosts[i];

    // Generate content for pending titles
    for (const title of currentPendingCategory.pendingTitles) {
      const spinner = ora(`Writing: "${title}"...`).start();

      try {
        const generated = await contentGenerator.generateBlogPost(
          siteContext,
          title,
          currentPendingCategory.category,
          [title, currentPendingCategory.category],
          generationOptions
        );

        const post: PostContent = {
          title: generated.title,
          content: generated.content,
          featureImage: generated.featureImage,
        };

        state = StateManager.markPostComplete(state, currentPendingCategory.category, post);
        await StateManager.save(state);

        spinner.succeed(
          `✨ Wrote: "${title}" (${generated.metadata?.wordCount} words, ${generated.metadata?.readingTime} min read)`
        );

        if (options.preview) {
          console.log(`\n--- Preview of "${title}" ---`);
          console.log(generated.content.substring(0, 300) + '...\n');
        }
      } catch (error) {
        spinner.fail(`Failed to generate post: ${title}`);
        console.error(
          error instanceof Error ? error.message : 'Unknown error'
        );
        console.log('\n💾 Progress saved. Run `myrtle create` to resume.\n');
        return;
      }
    }
  }

  // Rebuild categories from completed posts
  categories.length = 0;
  categories.push(...state.completedPosts);
  } else {
    console.log('\n⏭️  Skipping blog post generation\n');
  }

  // Summary
  const totalPages = pages.length;
  const totalPosts = categories.reduce((sum, cat) => sum + cat.posts.length, 0);

  console.log(`\n\n📊 Generation Summary:`);
  console.log(`   Pages: ${totalPages}`);
  console.log(`   Posts: ${totalPosts}`);
  console.log(`   Categories: ${categories.length}`);

  // Push to Ghost (if not dry run)
  if (!options.dryRun) {
    const { pushToGhost } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'pushToGhost',
        message: 'Push content to Ghost now?',
        default: true,
      },
    ]);

    if (pushToGhost) {
      const ghostClient = new GhostClient(config.ghost);

      // Test connection first
      const spinner = ora('Testing Ghost connection...').start();
      const connected = await ghostClient.testConnection();

      if (!connected) {
        spinner.fail(
          'Could not connect to Ghost. Please check your configuration.'
        );
        return;
      }

      spinner.succeed('Connected to Ghost');

      // Push content
      spinner.start('Pushing content to Ghost...');

      try {
        const result = await ghostClient.pushAllContent(
          pages,
          categories,
          'published'
        );

        if (result.errors.length > 0) {
          spinner.warn('Content pushed with some errors');
          console.log('\n⚠️  Errors:');
          result.errors.forEach((error) => console.log(`   - ${error}`));
        } else {
          spinner.succeed('All content pushed successfully! 🎉');
        }

        console.log(`\n✅ Pushed ${result.pages.success} pages`);
        console.log(`✅ Pushed ${result.posts.success} posts`);

        if (result.pages.failed > 0 || result.posts.failed > 0) {
          console.log(`\n❌ Failed: ${result.pages.failed} pages, ${result.posts.failed} posts`);
        }

        // Clear state after successful push
        await StateManager.clear();
      } catch (error) {
        spinner.fail('Failed to push content to Ghost');
        console.error(
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    } else {
      console.log('\n💾 Content generated but not pushed to Ghost.');
      console.log('   Run `myrtle create` again without --dry-run to push.\n');
    }
  } else {
    console.log('\n💾 Dry run complete. Content was not pushed to Ghost.\n');
    // Clear state after dry run completion
    await StateManager.clear();
  }
}
