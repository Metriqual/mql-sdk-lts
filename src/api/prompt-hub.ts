import type { HttpClient } from '../client';

// ============================================================================
// Prompt Hub Types
// ============================================================================

export type PromptVisibility = 'private' | 'public' | 'shared';
export type PromptCategory = 'general' | 'coding' | 'writing' | 'analysis' | 'customer-support' | 'other';

export interface PromptHubPrompt {
  id: string;
  user_id: string;
  org_id: string | null;
  name: string;
  description: string | null;
  content: string;
  category: PromptCategory;
  tags: string[] | null;
  model: string | null;
  temperature: number | null;
  is_published: boolean;
  is_public: boolean;
  star_count: number;
  fork_count: number;
  forked_from: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePromptRequest {
  name: string;
  description?: string;
  content: string;
  category?: PromptCategory;
  tags?: string[];
  model?: string;
  temperature?: number;
}

export interface UpdatePromptRequest {
  name?: string;
  description?: string;
  content?: string;
  category?: PromptCategory;
  tags?: string[];
  model?: string;
  temperature?: number;
}

export interface SharePromptRequest {
  share_with_user_id?: string;
  share_with_org_id?: string;
  can_edit?: boolean;
}

export interface PromptShare {
  id: string;
  prompt_id: string;
  shared_by: string;
  shared_with_user_id: string | null;
  shared_with_org_id: string | null;
  can_edit: boolean;
  created_at: string;
}

export interface DiscoverPromptsParams {
  category?: PromptCategory;
  search?: string;
  tags?: string[];
  model?: string;
  sort_by?: 'recent' | 'popular' | 'stars';
  limit?: number;
  offset?: number;
}

export interface StarredPrompt {
  id: string;
  user_id: string;
  prompt_id: string;
  created_at: string;
  prompt: PromptHubPrompt;
}

/**
 * Prompt Hub API
 *
 * Discover, share, and manage AI prompts
 */
export class PromptHubAPI {
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Create a new prompt
   *
   * @example
   * ```typescript
   * const prompt = await mql.promptHub.create({
   *   name: "Code Reviewer",
   *   description: "Reviews code and provides feedback",
   *   content: "You are an expert code reviewer...",
   *   category: "coding",
   *   tags: ["code-review", "programming"]
   * });
   * ```
   */
  async create(data: CreatePromptRequest): Promise<PromptHubPrompt> {
    return this.httpClient.post<PromptHubPrompt>('/v1/prompt-hub/prompts', data);
  }

  /**
   * List your prompts
   *
   * @example
   * ```typescript
   * const prompts = await mql.promptHub.list();
   * ```
   */
  async list(): Promise<PromptHubPrompt[]> {
    return this.httpClient.get<PromptHubPrompt[]>('/v1/prompt-hub/prompts');
  }

  /**
   * Get a prompt by ID
   *
   * @example
   * ```typescript
   * const prompt = await mql.promptHub.get('prompt_123');
   * ```
   */
  async get(id: string): Promise<PromptHubPrompt> {
    return this.httpClient.get<PromptHubPrompt>(`/v1/prompt-hub/prompts/${id}`);
  }

  /**
   * Update a prompt
   *
   * @example
   * ```typescript
   * await mql.promptHub.update('prompt_123', {
   *   content: "Updated prompt content..."
   * });
   * ```
   */
  async update(id: string, data: UpdatePromptRequest): Promise<PromptHubPrompt> {
    return this.httpClient.patch<PromptHubPrompt>(`/v1/prompt-hub/prompts/${id}`, data);
  }

  /**
   * Delete a prompt
   *
   * @example
   * ```typescript
   * await mql.promptHub.delete('prompt_123');
   * ```
   */
  async delete(id: string): Promise<{ message: string }> {
    return this.httpClient.delete(`/v1/prompt-hub/prompts/${id}`);
  }

  /**
   * Publish a prompt to make it discoverable
   *
   * @example
   * ```typescript
   * await mql.promptHub.publish('prompt_123');
   * ```
   */
  async publish(id: string): Promise<PromptHubPrompt> {
    return this.httpClient.post<PromptHubPrompt>(`/v1/prompt-hub/prompts/${id}/publish`, {});
  }

  /**
   * Unpublish a prompt
   *
   * @example
   * ```typescript
   * await mql.promptHub.unpublish('prompt_123');
   * ```
   */
  async unpublish(id: string): Promise<PromptHubPrompt> {
    return this.httpClient.post<PromptHubPrompt>(`/v1/prompt-hub/prompts/${id}/unpublish`, {});
  }

  /**
   * Share a prompt with a user or organization
   *
   * @example Share with a user
   * ```typescript
   * await mql.promptHub.share('prompt_123', {
   *   share_with_user_id: 'user_456',
   *   can_edit: false
   * });
   * ```
   *
   * @example Share with an organization
   * ```typescript
   * await mql.promptHub.share('prompt_123', {
   *   share_with_org_id: 'org_789',
   *   can_edit: true
   * });
   * ```
   */
  async share(id: string, data: SharePromptRequest): Promise<PromptShare> {
    return this.httpClient.post<PromptShare>(`/v1/prompt-hub/prompts/${id}/share`, data);
  }

  /**
   * List shares for a prompt
   *
   * @example
   * ```typescript
   * const shares = await mql.promptHub.listShares('prompt_123');
   * ```
   */
  async listShares(id: string): Promise<PromptShare[]> {
    return this.httpClient.get<PromptShare[]>(`/v1/prompt-hub/prompts/${id}/shares`);
  }

  /**
   * Revoke a share
   *
   * @example
   * ```typescript
   * await mql.promptHub.revokeShare('prompt_123', 'share_456');
   * ```
   */
  async revokeShare(promptId: string, shareId: string): Promise<{ message: string }> {
    return this.httpClient.delete(`/v1/prompt-hub/prompts/${promptId}/shares/${shareId}`);
  }

  /**
   * Get a shared prompt
   *
   * @example
   * ```typescript
   * const prompt = await mql.promptHub.getShared('share_token_123');
   * ```
   */
  async getShared(shareToken: string): Promise<PromptHubPrompt> {
    return this.httpClient.get<PromptHubPrompt>(`/v1/prompt-hub/shared/${shareToken}`);
  }

  /**
   * Discover public prompts
   *
   * @example Search by category
   * ```typescript
   * const prompts = await mql.promptHub.discover({
   *   category: 'coding',
   *   sort_by: 'popular'
   * });
   * ```
   *
   * @example Search by keywords
   * ```typescript
   * const prompts = await mql.promptHub.discover({
   *   search: 'code review',
   *   tags: ['programming', 'quality']
   * });
   * ```
   */
  async discover(params?: DiscoverPromptsParams): Promise<PromptHubPrompt[]> {
    const queryParams: Record<string, string> = {};
    if (params?.category) queryParams.category = params.category;
    if (params?.search) queryParams.search = params.search;
    if (params?.tags) queryParams.tags = params.tags.join(',');
    if (params?.model) queryParams.model = params.model;
    if (params?.sort_by) queryParams.sort_by = params.sort_by;
    if (params?.limit) queryParams.limit = params.limit.toString();
    if (params?.offset) queryParams.offset = params.offset.toString();

    return this.httpClient.get<PromptHubPrompt[]>('/v1/prompt-hub/discover', queryParams);
  }

  /**
   * Get a public prompt by ID
   *
   * @example
   * ```typescript
   * const prompt = await mql.promptHub.getPublic('prompt_123');
   * ```
   */
  async getPublic(id: string): Promise<PromptHubPrompt> {
    return this.httpClient.get<PromptHubPrompt>(`/v1/prompt-hub/public/${id}`);
  }

  /**
   * Star a prompt
   *
   * @example
   * ```typescript
   * await mql.promptHub.star('prompt_123');
   * ```
   */
  async star(id: string): Promise<{ message: string }> {
    return this.httpClient.post(`/v1/prompt-hub/prompts/${id}/star`, {});
  }

  /**
   * Unstar a prompt
   *
   * @example
   * ```typescript
   * await mql.promptHub.unstar('prompt_123');
   * ```
   */
  async unstar(id: string): Promise<{ message: string }> {
    return this.httpClient.delete(`/v1/prompt-hub/prompts/${id}/star`);
  }

  /**
   * List starred prompts
   *
   * @example
   * ```typescript
   * const starred = await mql.promptHub.listStarred();
   * ```
   */
  async listStarred(): Promise<StarredPrompt[]> {
    return this.httpClient.get<StarredPrompt[]>('/v1/prompt-hub/starred');
  }

  /**
   * Fork a prompt to create your own copy
   *
   * @example
   * ```typescript
   * const forkedPrompt = await mql.promptHub.fork('prompt_123');
   * ```
   */
  async fork(id: string): Promise<PromptHubPrompt> {
    return this.httpClient.post<PromptHubPrompt>(`/v1/prompt-hub/prompts/${id}/fork`, {});
  }

  /**
   * Attach a prompt to a proxy key
   *
   * @example
   * ```typescript
   * await mql.promptHub.attachToKey('prompt_123', 'key_456');
   * ```
   */
  async attachToKey(promptId: string, proxyKeyId: string): Promise<{ message: string }> {
    return this.httpClient.post(`/v1/prompt-hub/prompts/${promptId}/attach`, {
      proxy_key_id: proxyKeyId
    });
  }

  /**
   * Detach a prompt from a proxy key
   *
   * @example
   * ```typescript
   * await mql.promptHub.detachFromKey('prompt_123', 'key_456');
   * ```
   */
  async detachFromKey(promptId: string, proxyKeyId: string): Promise<{ message: string }> {
    return this.httpClient.delete(`/v1/prompt-hub/prompts/${promptId}/keys/${proxyKeyId}`);
  }

  /**
   * List prompts attached to a proxy key
   *
   * @example
   * ```typescript
   * const prompts = await mql.promptHub.listKeyPrompts('key_123');
   * ```
   */
  async listKeyPrompts(proxyKeyId: string): Promise<PromptHubPrompt[]> {
    return this.httpClient.get<PromptHubPrompt[]>(`/v1/prompt-hub/keys/${proxyKeyId}/prompts`);
  }

  /**
   * Get prompts for a proxy key (internal use)
   *
   * @example
   * ```typescript
   * const prompts = await mql.promptHub.getPromptsForKey('pk_123');
   * ```
   */
  async getPromptsForKey(proxyKey: string): Promise<PromptHubPrompt[]> {
    return this.httpClient.get<PromptHubPrompt[]>(`/v1/prompt-hub/proxy-key/${proxyKey}/prompts`);
  }
}
