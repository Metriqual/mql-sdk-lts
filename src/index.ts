import { HttpClient, MQLAPIError } from './client';
import { ChatAPI } from './api/chat';
import { ProxyKeysAPI } from './api/proxy-keys';
import { FiltersAPI } from './api/filters';
import { SystemPromptsAPI } from './api/system-prompts';
import { OrganizationsAPI } from './api/organizations';
import { AnalyticsAPI } from './api/analytics';
import { ModelsAPI } from './api/models';
import { WebhooksAPI } from './api/webhooks';
import { PricingAPI } from './api/pricing';
import { ExperimentsAPI } from './api/experiments';
import { FeedbackAPI } from './api/feedback';
import { PromptHubAPI } from './api/prompt-hub';
import type { MQLClientOptions } from './types';

/**
 * MQL SDK Client
 * 
 * The main entry point for interacting with the MQL AI Proxy Gateway.
 * Provides access to chat completions, proxy key management, content filtering,
 * system prompts, organizations, and analytics.
 * 
 * @example Basic usage with a proxy key
 * ```typescript
 * import { MQL } from '@metriqual/sdk';
 * 
 * const mql = new MQL({ apiKey: 'mql-...' });
 * 
 * const response = await mql.chat.create({
 *   messages: [{ role: 'user', content: 'Hello!' }]
 * });
 * ```
 * 
 * @example Streaming chat completion
 * ```typescript
 * for await (const chunk of mql.chat.stream({ messages: [...] })) {
 *   process.stdout.write(chunk.choices[0].delta.content || '');
 * }
 * ```
 * 
 * @example Managing proxy keys (requires Supabase token)
 * ```typescript
 * const mql = new MQL({ token: 'your-supabase-jwt' });
 * 
 * const { proxyKey } = await mql.proxyKeys.create({
 *   providers: [
 *     { provider: 'openai', model: 'gpt-4o-mini', apiKey: 'sk-...', usageLimit: 100 }
 *   ]
 * });
 * ```
 */
export class MQL {
  private readonly httpClient: HttpClient;

  /** Chat completions API (OpenAI compatible) */
  public readonly chat: ChatAPI;
  
  /** Proxy keys management API */
  public readonly proxyKeys: ProxyKeysAPI;
  
  /** Content filters API */
  public readonly filters: FiltersAPI;
  
  /** System prompts API */
  public readonly systemPrompts: SystemPromptsAPI;
  
  /** Organizations API */
  public readonly organizations: OrganizationsAPI;
  
  /** Analytics API */
  public readonly analytics: AnalyticsAPI;
  
  /** Models listing API */
  public readonly models: ModelsAPI;

  /** Webhooks API */
  public readonly webhooks: WebhooksAPI;

  /** Pricing API */
  public readonly pricing: PricingAPI;

  /** Experiments API (A/B Testing) */
  public readonly experiments: ExperimentsAPI;

  /** Feedback API */
  public readonly feedback: FeedbackAPI;

  /** Prompt Hub API */
  public readonly promptHub: PromptHubAPI;

  /**
   * Create a new MQL SDK client
   * 
   * @param options - Client configuration options
   * @param options.baseUrl - Base URL of the MQL API (default: https://api.metriqual.com)
   * @param options.apiKey - Proxy key for chat completions (starts with 'mql-')
   * @param options.token - Supabase JWT for management operations
   * @param options.timeout - Request timeout in ms (default: 30000)
   * @param options.maxRetries - Number of retries for failed requests (default: 3)
   * @param options.fetch - Custom fetch implementation
   */
  constructor(options: MQLClientOptions = {}) {
    this.httpClient = new HttpClient(options);

    this.chat = new ChatAPI(this.httpClient);
    this.proxyKeys = new ProxyKeysAPI(this.httpClient);
    this.filters = new FiltersAPI(this.httpClient);
    this.systemPrompts = new SystemPromptsAPI(this.httpClient);
    this.organizations = new OrganizationsAPI(this.httpClient);
    this.analytics = new AnalyticsAPI(this.httpClient);
    this.models = new ModelsAPI(this.httpClient);
    this.webhooks = new WebhooksAPI(this.httpClient);
    this.pricing = new PricingAPI(this.httpClient);
    this.experiments = new ExperimentsAPI(this.httpClient);
    this.feedback = new FeedbackAPI(this.httpClient);
    this.promptHub = new PromptHubAPI(this.httpClient);
  }

  /**
   * Create a new client with different authentication
   * Useful for switching between proxy key and user token
   * 
   * @example
   * ```typescript
   * // Start with no auth
   * const mql = new MQL({ baseUrl: 'http://localhost:8080' });
   * 
   * // Create a version with proxy key for chat
   * const chatClient = mql.withAuth({ apiKey: 'mql-...' });
   * 
   * // Create a version with user token for management
   * const mgmtClient = mql.withAuth({ token: 'eyJ...' });
   * ```
   */
  withAuth(auth: { apiKey?: string; token?: string }): MQL {
    const newClient = this.httpClient.updateAuth(auth);
    return new MQL({
      baseUrl: this.httpClient.getBaseUrl(),
      apiKey: auth.apiKey,
      token: auth.token,
    });
  }

  /**
   * Get the base URL of the API
   */
  getBaseUrl(): string {
    return this.httpClient.getBaseUrl();
  }
}

// Export all types
export * from './types';

// Export the error class
export { MQLAPIError };

// Export API classes for advanced usage
export {
  ChatAPI,
  ProxyKeysAPI,
  FiltersAPI,
  SystemPromptsAPI,
  OrganizationsAPI,
  AnalyticsAPI,
  ModelsAPI,
  WebhooksAPI,
  PricingAPI,
  ExperimentsAPI,
  FeedbackAPI,
  PromptHubAPI,
};

// Default export
export default MQL;
