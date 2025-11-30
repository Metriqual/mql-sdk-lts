import { HttpClient } from '../client';
import type {
  CreateProxyKeyRequest,
  CreateProxyKeyResponse,
  ProxyKeyListResponse,
  ProxyKeyUsageResponse,
  RegenerateProxyKeyResponse,
  ProviderConfig,
  TestProxyKeyRequest,
  ChatCompletionResponse,
} from '../types';

/**
 * Proxy Keys API
 * Manage proxy keys with provider fallback chains and usage limits
 */
export class ProxyKeysAPI {
  constructor(private readonly client: HttpClient) {}

  /**
   * List all proxy keys for the authenticated user
   * 
   * @example
   * ```typescript
   * const { keys, count } = await mql.proxyKeys.list();
   * keys.forEach(key => console.log(key.keyPreview, key.activeProvider));
   * ```
   */
  async list(): Promise<ProxyKeyListResponse> {
    const response = await this.client.get<Record<string, unknown>>('/v1/user/proxy-keys');
    return this.transformListResponse(response);
  }

  /**
   * Create a new proxy key with provider fallback chain
   * 
   * @example
   * ```typescript
   * const { proxyKey, providers } = await mql.proxyKeys.create({
   *   providers: [
   *     { provider: 'openai', model: 'gpt-4o-mini', apiKey: 'sk-...', usageLimit: 100 },
   *     { provider: 'anthropic', model: 'claude-3-haiku', apiKey: 'sk-ant-...', usageLimit: 50 },
   *   ],
   *   filterIds: ['filter-id-1'],
   *   systemPromptIds: ['prompt-id-1'],
   * });
   * ```
   */
  async create(request: CreateProxyKeyRequest): Promise<CreateProxyKeyResponse> {
    const body = this.transformCreateRequest(request);
    const response = await this.client.post<Record<string, unknown>>('/v1/user/proxy-keys', body);
    return this.transformCreateResponse(response);
  }

  /**
   * Get usage details for a specific proxy key
   * 
   * @example
   * ```typescript
   * const usage = await mql.proxyKeys.getUsage('key-id');
   * console.log(`Active provider: ${usage.activeProvider}`);
   * console.log(`All exhausted: ${usage.allExhausted}`);
   * ```
   */
  async getUsage(keyId: string): Promise<ProxyKeyUsageResponse> {
    const response = await this.client.get<Record<string, unknown>>(`/v1/user/proxy-keys/${keyId}/usage`);
    return this.transformUsageResponse(response);
  }

  /**
   * Delete a proxy key
   * 
   * @example
   * ```typescript
   * await mql.proxyKeys.delete('key-id');
   * ```
   */
  async delete(keyId: string): Promise<void> {
    await this.client.delete(`/v1/user/proxy-keys/${keyId}`);
  }

  /**
   * Regenerate a proxy key (creates new value, preserves config)
   * 
   * @example
   * ```typescript
   * const { proxyKey, message } = await mql.proxyKeys.regenerate('key-id');
   * console.log(`New key: ${proxyKey}`);
   * ```
   */
  async regenerate(keyId: string): Promise<RegenerateProxyKeyResponse> {
    const response = await this.client.post<Record<string, unknown>>(`/v1/user/proxy-keys/${keyId}/regenerate`);
    return this.transformRegenerateResponse(response);
  }

  /**
   * Test a proxy key by making a chat completion request
   * 
   * @example
   * ```typescript
   * const response = await mql.proxyKeys.test('key-id', {
   *   model: 'gpt-4o-mini',
   *   messages: [{ role: 'user', content: 'Hello' }],
   * });
   * ```
   */
  async test(keyId: string, request: TestProxyKeyRequest): Promise<ChatCompletionResponse> {
    const response = await this.client.post<Record<string, unknown>>(`/v1/user/proxy-keys/${keyId}/test`, request);
    return this.transformTestResponse(response);
  }

  // ============================================================================
  // Organization Proxy Keys
  // ============================================================================

  /**
   * List all proxy keys for an organization
   */
  async listForOrg(orgId: string): Promise<ProxyKeyListResponse> {
    const response = await this.client.get<Record<string, unknown>>(`/v1/organizations/${orgId}/proxy-keys`);
    return this.transformListResponse(response);
  }

  /**
   * Create a new proxy key for an organization
   */
  async createForOrg(orgId: string, request: CreateProxyKeyRequest): Promise<CreateProxyKeyResponse> {
    const body = this.transformCreateRequest(request);
    const response = await this.client.post<Record<string, unknown>>(`/v1/organizations/${orgId}/proxy-keys`, body);
    return this.transformCreateResponse(response);
  }

  /**
   * Delete an organization proxy key
   */
  async deleteForOrg(orgId: string, keyId: string): Promise<void> {
    await this.client.delete(`/v1/organizations/${orgId}/proxy-keys/${keyId}`);
  }

  /**
   * Regenerate an organization proxy key
   */
  async regenerateForOrg(orgId: string, keyId: string): Promise<RegenerateProxyKeyResponse> {
    const response = await this.client.post<Record<string, unknown>>(`/v1/organizations/${orgId}/proxy-keys/${keyId}/regenerate`);
    return this.transformRegenerateResponse(response);
  }

  // ============================================================================
  // Transform helpers
  // ============================================================================

  private transformCreateRequest(request: CreateProxyKeyRequest): Record<string, unknown> {
    return {
      providers: request.providers.map((p: ProviderConfig) => ({
        provider: p.provider,
        model: p.model,
        api_key: p.apiKey,
        usage_limit: p.usageLimit,
      })),
      filter_ids: request.filterIds,
      system_prompt_ids: request.systemPromptIds,
    };
  }

  private transformListResponse(response: Record<string, unknown>): ProxyKeyListResponse {
    const data = response as {
      keys: Array<{
        id: string;
        key_preview: string;
        org_id: string | null;
        created_at: string;
        total_usage_dollars: number;
        provider_count: number;
        active_provider: string | null;
        all_exhausted: boolean;
      }>;
      count: number;
    };

    return {
      keys: data.keys.map(k => ({
        id: k.id,
        keyPreview: k.key_preview,
        orgId: k.org_id,
        createdAt: k.created_at,
        totalUsageDollars: k.total_usage_dollars,
        providerCount: k.provider_count,
        activeProvider: k.active_provider,
        allExhausted: k.all_exhausted,
      })),
      count: data.count,
    };
  }

  private transformCreateResponse(response: Record<string, unknown>): CreateProxyKeyResponse {
    const data = response as {
      proxy_key: string;
      providers: Array<{
        provider: string;
        model: string | null;
        priority: number;
        usage_limit: number;
        usage_count: number;
        remaining: number;
        is_exhausted: boolean;
      }>;
      created_at: string;
    };

    return {
      proxyKey: data.proxy_key,
      providers: data.providers.map(p => ({
        provider: p.provider,
        model: p.model,
        priority: p.priority,
        usageLimit: p.usage_limit,
        usageCount: p.usage_count,
        remaining: p.remaining,
        isExhausted: p.is_exhausted,
      })),
      createdAt: data.created_at,
    };
  }

  private transformUsageResponse(response: Record<string, unknown>): ProxyKeyUsageResponse {
    const data = response as {
      proxy_key?: string;
      providers: Array<{
        provider: string;
        model: string | null;
        priority: number;
        usage_limit: number;
        usage_count: number;
        remaining: number;
        is_exhausted: boolean;
      }>;
      active_provider: string | null;
      all_exhausted: boolean;
    };

    return {
      proxyKey: data.proxy_key || '',
      providers: data.providers.map(p => ({
        provider: p.provider,
        model: p.model,
        priority: p.priority,
        usageLimit: p.usage_limit,
        usageCount: p.usage_count,
        remaining: p.remaining,
        isExhausted: p.is_exhausted,
      })),
      activeProvider: data.active_provider,
      allExhausted: data.all_exhausted,
    };
  }

  private transformRegenerateResponse(response: Record<string, unknown>): RegenerateProxyKeyResponse {
    const data = response as {
      proxy_key: string;
      id: string;
      providers: Array<{
        provider: string;
        model: string | null;
        priority: number;
        usage_limit: number;
        usage_count: number;
        remaining: number;
        is_exhausted: boolean;
      }>;
      message: string;
    };

    return {
      proxyKey: data.proxy_key,
      id: data.id,
      providers: data.providers.map(p => ({
        provider: p.provider,
        model: p.model,
        priority: p.priority,
        usageLimit: p.usage_limit,
        usageCount: p.usage_count,
        remaining: p.remaining,
        isExhausted: p.is_exhausted,
      })),
      message: data.message,
    };
  }

  private transformTestResponse(response: Record<string, unknown>): ChatCompletionResponse {
    // Test endpoint returns standard OpenAI format
    const data = response as {
      id: string;
      object: 'chat.completion';
      created: number;
      model: string;
      choices: Array<{
        index: number;
        message: { role: string; content: string };
        finish_reason: string | null;
      }>;
      usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
    };

    return {
      id: data.id,
      object: data.object,
      created: data.created,
      model: data.model,
      choices: data.choices.map(c => ({
        index: c.index,
        message: c.message as ChatCompletionResponse['choices'][0]['message'],
        finishReason: c.finish_reason as ChatCompletionResponse['choices'][0]['finishReason'],
      })),
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
    };
  }
}
