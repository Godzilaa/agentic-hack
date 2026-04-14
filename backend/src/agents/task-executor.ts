import type { LocusClient } from '../services/locus-client.js';
import type { Task, TaskType, TaskOutput, GigDefinition } from '../lib/types.js';

// Available gig definitions
export const GIG_DEFINITIONS: GigDefinition[] = [
  {
    type: 'lead_generation',
    name: 'Lead Generation',
    description: 'Find potential customers for a business',
    estimatedCost: 0.05,
    reward: 5.00,
    requiredApis: [
      { name: 'brave', category: 'search', estimatedCost: 0.01, endpoint: '/wrapped/brave/search' },
      { name: 'firecrawl', category: 'scraping', estimatedCost: 0.02, endpoint: '/wrapped/firecrawl/scrape' },
      { name: 'anthropic', category: 'ai', estimatedCost: 0.02, endpoint: '/wrapped/anthropic/messages' },
    ],
    estimatedTimeMs: 30000,
  },
  {
    type: 'competitor_research',
    name: 'Competitor Research',
    description: 'Analyze competitors and generate insights',
    estimatedCost: 0.03,
    reward: 4.00,
    requiredApis: [
      { name: 'perplexity', category: 'search', estimatedCost: 0.02, endpoint: '/wrapped/perplexity/chat' },
      { name: 'firecrawl', category: 'scraping', estimatedCost: 0.01, endpoint: '/wrapped/firecrawl/scrape' },
    ],
    estimatedTimeMs: 25000,
  },
  {
    type: 'content_summarization',
    name: 'Content Summarization',
    description: 'Summarize articles, documents, or web content',
    estimatedCost: 0.02,
    reward: 3.00,
    requiredApis: [
      { name: 'anthropic', category: 'ai', estimatedCost: 0.015, endpoint: '/wrapped/anthropic/messages' },
      { name: 'firecrawl', category: 'scraping', estimatedCost: 0.005, endpoint: '/wrapped/firecrawl/scrape' },
    ],
    estimatedTimeMs: 15000,
  },
  {
    type: 'data_enrichment',
    name: 'Data Enrichment',
    description: 'Enrich data with additional context and metadata',
    estimatedCost: 0.04,
    reward: 4.50,
    requiredApis: [
      { name: 'exa', category: 'search', estimatedCost: 0.02, endpoint: '/wrapped/exa/search' },
      { name: 'anthropic', category: 'ai', estimatedCost: 0.02, endpoint: '/wrapped/anthropic/messages' },
    ],
    estimatedTimeMs: 20000,
  },
  {
    type: 'website_analysis',
    name: 'Website Analysis',
    description: 'Analyze a website and provide insights',
    estimatedCost: 0.08,
    reward: 6.00,
    requiredApis: [
      { name: 'screenshotone', category: 'tools', estimatedCost: 0.03, endpoint: '/wrapped/screenshotone/take' },
      { name: 'anthropic', category: 'ai', estimatedCost: 0.04, endpoint: '/wrapped/anthropic/messages' },
      { name: 'firecrawl', category: 'scraping', estimatedCost: 0.01, endpoint: '/wrapped/firecrawl/scrape' },
    ],
    estimatedTimeMs: 35000,
  },
];

export class TaskExecutor {
  private locusClient: LocusClient;
  private costTracker: Map<string, number> = new Map();

  constructor(locusClient: LocusClient) {
    this.locusClient = locusClient;
  }

  getGigDefinition(type: TaskType): GigDefinition | undefined {
    return GIG_DEFINITIONS.find(g => g.type === type);
  }

  getTaskCost(taskId: string): number {
    return this.costTracker.get(taskId) || 0;
  }

  async executeTask(task: Task): Promise<TaskOutput> {
    const gig = this.getGigDefinition(task.type);
    if (!gig) {
      throw new Error(`Unknown task type: ${task.type}`);
    }

    let totalCost = 0;
    this.costTracker.set(task.id, 0);

    try {
      switch (task.type) {
        case 'lead_generation':
          return await this.executeLeadGeneration(task, gig, totalCost);
        case 'competitor_research':
          return await this.executeCompetitorResearch(task, gig, totalCost);
        case 'content_summarization':
          return await this.executeContentSummarization(task, gig, totalCost);
        case 'data_enrichment':
          return await this.executeDataEnrichment(task, gig, totalCost);
        case 'website_analysis':
          return await this.executeWebsiteAnalysis(task, gig, totalCost);
        default:
          throw new Error(`Unsupported task type: ${task.type}`);
      }
    } finally {
      this.costTracker.delete(task.id);
    }
  }

  private async executeLeadGeneration(
    task: Task,
    gig: GigDefinition,
    totalCost: number
  ): Promise<TaskOutput> {
    const { query, targetCount = 5 } = task.input;

    // Step 1: Search for leads using Brave Search
    const searchResult = await this.locusClient.callWrappedApi('brave', 'search', {
      q: `${query} contact email`,
      count: targetCount * 2,
    });
    totalCost += 0.01;

    // Step 2: Scrape each result for contact info
    const leads: Array<{ name: string; company: string; email?: string; website: string }> = [];
    // @ts-expect-error - API response structure
    const results = searchResult?.data?.web?.results || [];

    for (const result of results.slice(0, targetCount)) {
      try {
        // @ts-expect-error - API response structure
        const scrapeResult = await this.locusClient.callWrappedApi('firecrawl', 'scrape', {
          url: result.url,
          formats: ['markdown'],
        });
        totalCost += 0.02;

        // @ts-expect-error - API response structure
        const content = scrapeResult?.data?.markdown || '';
        const emailMatch = content.match(/[\w.-]+@[\w.-]+\.\w+/);

        leads.push({
          name: result.title?.split(' - ')[0] || 'Unknown',
          company: new URL(result.url).hostname,
          email: emailMatch?.[0],
          website: result.url,
        });
      } catch {
        // Skip failed scrapes
        continue;
      }
    }

    // Step 3: Use AI to generate personalized outreach
    const outreachPrompt = `Generate personalized outreach messages for these leads found for "${query}":
${leads.map(l => `- ${l.name} from ${l.company} (${l.website})`).join('\n')}

For each lead, create a 2-3 sentence personalized outreach message.`;

    const aiResult = await this.locusClient.callWrappedApi('anthropic', 'messages', {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: outreachPrompt }],
    });
    totalCost += 0.02;

    this.costTracker.set(task.id, totalCost);

    return {
      result: { leads, outreach: aiResult },
      summary: `Found ${leads.length} potential leads for "${query}" with personalized outreach messages`,
      artifacts: leads.map(l => l.website),
    };
  }

  private async executeCompetitorResearch(
    task: Task,
    gig: GigDefinition,
    totalCost: number
  ): Promise<TaskOutput> {
    const { query } = task.input;

    // Use Perplexity for deep research
    const researchResult = await this.locusClient.callWrappedApi('perplexity', 'chat', {
      model: 'llama-3.1-sonar-large-128k-online',
      messages: [
        {
          role: 'user',
          content: `Conduct detailed competitor research for: ${query}. Include:\n- Key competitors\n- Their strengths/weaknesses\n- Market positioning\n- Recent news\n- Pricing if available`,
        },
      ],
    });
    totalCost += 0.02;

    // Scrape competitor websites for additional data
    // @ts-expect-error - API response structure
    const content = researchResult?.choices?.[0]?.message?.content || '';

    this.costTracker.set(task.id, totalCost);

    return {
      result: { research: content, raw: researchResult },
      summary: `Completed competitor research for "${query}"`,
    };
  }

  private async executeContentSummarization(
    task: Task,
    gig: Task,
    gigDef: GigDefinition,
    totalCost: number
  ): Promise<TaskOutput> {
    const { query, context } = task.input;

    // Scrape the content if it's a URL
    let content = context || '';
    if (query.startsWith('http')) {
      const scrapeResult = await this.locusClient.callWrappedApi('firecrawl', 'scrape', {
        url: query,
        formats: ['markdown'],
      });
      totalCost += 0.005;
      // @ts-expect-error - API response structure
      content = scrapeResult?.data?.markdown || '';
    }

    // Summarize using AI
    const aiResult = await this.locusClient.callWrappedApi('anthropic', 'messages', {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `Summarize the following content concisely:\n\n${content}`,
        },
      ],
    });
    totalCost += 0.015;

    this.costTracker.set(task.id, totalCost);

    // @ts-expect-error - API response structure
    const summary = aiResult?.content?.[0]?.text || '';

    return {
      result: { summary, originalLength: content.length, summaryLength: summary.length },
      summary: `Summarized content from ${content.length} to ${summary.length} characters`,
    };
  }

  private async executeDataEnrichment(
    task: Task,
    gig: GigDefinition,
    totalCost: number
  ): Promise<TaskOutput> {
    const { query, context } = task.input;

    // Search for additional context
    const searchResult = await this.locusClient.callWrappedApi('exa', 'search', {
      query: query,
      numResults: 5,
      useAutoprompt: true,
    });
    totalCost += 0.02;

    // @ts-expect-error - API response structure
    const searchResults = searchResult?.results || [];

    // Enrich with AI analysis
    const aiResult = await this.locusClient.callWrappedApi('anthropic', 'messages', {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `Enrich this data with additional context:\n\nOriginal: ${context}\n\nSearch Results:\n${searchResults.map((r: { title: string; text: string }) => `- ${r.title}: ${r.text}`).join('\n')}\n\nProvide enriched data with additional metadata, insights, and recommendations.`,
        },
      ],
    });
    totalCost += 0.02;

    this.costTracker.set(task.id, totalCost);

    // @ts-expect-error - API response structure
    const enrichedData = aiResult?.content?.[0]?.text || '';

    return {
      result: { enriched: enrichedData, sources: searchResults },
      summary: `Enriched data with ${searchResults.length} additional sources`,
    };
  }

  private async executeWebsiteAnalysis(
    task: Task,
    gig: GigDefinition,
    totalCost: number
  ): Promise<TaskOutput> {
    const { query: url } = task.input;

    // Take a screenshot
    const screenshotResult = await this.locusClient.callWrappedApi('screenshotone', 'take', {
      url,
      format: 'png',
      viewport_width: 1280,
      viewport_height: 800,
    });
    totalCost += 0.03;

    // Scrape the website content
    const scrapeResult = await this.locusClient.callWrappedApi('firecrawl', 'scrape', {
      url,
      formats: ['markdown'],
    });
    totalCost += 0.01;

    // @ts-expect-error - API response structure
    const content = scrapeResult?.data?.markdown || '';

    // Analyze with AI
    const aiResult = await this.locusClient.callWrappedApi('anthropic', 'messages', {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this website and provide insights on:\n1. Design quality and UX\n2. Content quality\n3. SEO optimization\n4. Competitive positioning\n5. Improvement recommendations\n\nWebsite URL: ${url}\n\nContent:\n${content.slice(0, 5000)}`,
            },
          ],
        },
      ],
    });
    totalCost += 0.04;

    this.costTracker.set(task.id, totalCost);

    // @ts-expect-error - API response structure
    const analysis = aiResult?.content?.[0]?.text || '';

    return {
      result: { analysis, screenshotUrl: screenshotResult, contentLength: content.length },
      summary: `Completed website analysis for ${url}`,
      artifacts: [url],
    };
  }
}