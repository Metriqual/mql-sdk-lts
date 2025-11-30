import { HttpClient } from '../client';
import type {
  SystemPrompt,
  SystemPromptListResponse,
  CreateSystemPromptRequest,
  UpdateSystemPromptRequest,
  SystemPromptTemplatesResponse,
  InjectionMode,
} from '../types';

/**
 * System Prompts API
 * Manage behavioral control through system prompt injection
 */
export class SystemPromptsAPI {
  constructor(private readonly client: HttpClient) {}

  /**
   * List all system prompts for the authenticated user
   * 
   * @example
   * ```typescript
   * const { prompts, total } = await mql.systemPrompts.list();
   * prompts.forEach(p => console.log(p.name, p.injectionMode, p.priority));
   * ```
   */
  async list(): Promise<SystemPromptListResponse> {
    const response = await this.client.get<Record<string, unknown>>('/v1/user/system-prompts');
    return this.transformListResponse(response);
  }

  /**
   * Get a specific system prompt by ID
   * 
   * @example
   * ```typescript
   * const prompt = await mql.systemPrompts.get('prompt-id');
   * console.log(prompt.content);
   * ```
   */
  async get(promptId: string): Promise<SystemPrompt> {
    const response = await this.client.get<Record<string, unknown>>(`/v1/user/system-prompts/${promptId}`);
    return this.transformPrompt(response);
  }

  /**
   * Create a new system prompt
   * 
   * @example
   * ```typescript
   * const prompt = await mql.systemPrompts.create({
   *   name: 'Safety Guidelines',
   *   content: 'Always prioritize user safety. Never provide harmful information.',
   *   injectionMode: 'prepend',
   *   priority: 0,
   * });
   * ```
   */
  async create(request: CreateSystemPromptRequest): Promise<SystemPrompt> {
    const body = this.transformCreateRequest(request);
    const response = await this.client.post<Record<string, unknown>>('/v1/user/system-prompts', body);
    return this.transformPrompt(response);
  }

  /**
   * Update an existing system prompt
   * 
   * @example
   * ```typescript
   * const updated = await mql.systemPrompts.update('prompt-id', {
   *   content: 'Updated safety guidelines...',
   *   priority: 1,
   * });
   * ```
   */
  async update(promptId: string, request: UpdateSystemPromptRequest): Promise<SystemPrompt> {
    const body = this.transformUpdateRequest(request);
    const response = await this.client.patch<Record<string, unknown>>(`/v1/user/system-prompts/${promptId}`, body);
    return this.transformPrompt(response);
  }

  /**
   * Delete a system prompt
   * 
   * @example
   * ```typescript
   * await mql.systemPrompts.delete('prompt-id');
   * ```
   */
  async delete(promptId: string): Promise<void> {
    await this.client.delete(`/v1/user/system-prompts/${promptId}`);
  }

  /**
   * Get all available system prompt templates
   * 
   * @example
   * ```typescript
   * const { templates, categories } = await mql.systemPrompts.getTemplates();
   * templates.forEach(t => console.log(t.name, t.category, t.useCases));
   * ```
   */
  async getTemplates(): Promise<SystemPromptTemplatesResponse> {
    const response = await this.client.get<Record<string, unknown>>('/v1/system-prompts/templates');
    return this.transformTemplatesResponse(response);
  }

  /**
   * Create a system prompt from a template
   * 
   * @example
   * ```typescript
   * const prompt = await mql.systemPrompts.createFromTemplate('helpful-assistant', {
   *   name: 'My Custom Assistant',
   * });
   * ```
   */
  async createFromTemplate(
    templateId: string,
    overrides?: { name?: string; description?: string }
  ): Promise<SystemPrompt> {
    const body = {
      template_id: templateId,
      name: overrides?.name,
      description: overrides?.description,
    };
    const response = await this.client.post<Record<string, unknown>>('/v1/user/system-prompts/from-template', body);
    return this.transformPrompt(response);
  }

  // ============================================================================
  // Organization System Prompts
  // ============================================================================

  /**
   * List all system prompts for an organization
   */
  async listForOrg(orgId: string): Promise<SystemPromptListResponse> {
    const response = await this.client.get<Record<string, unknown>>(`/v1/organizations/${orgId}/system-prompts`);
    return this.transformListResponse(response);
  }

  /**
   * Create a system prompt for an organization
   */
  async createForOrg(orgId: string, request: CreateSystemPromptRequest): Promise<SystemPrompt> {
    const body = this.transformCreateRequest(request);
    const response = await this.client.post<Record<string, unknown>>(`/v1/organizations/${orgId}/system-prompts`, body);
    return this.transformPrompt(response);
  }

  /**
   * Update an organization system prompt
   */
  async updateForOrg(orgId: string, promptId: string, request: UpdateSystemPromptRequest): Promise<SystemPrompt> {
    const body = this.transformUpdateRequest(request);
    const response = await this.client.patch<Record<string, unknown>>(`/v1/organizations/${orgId}/system-prompts/${promptId}`, body);
    return this.transformPrompt(response);
  }

  /**
   * Delete an organization system prompt
   */
  async deleteForOrg(orgId: string, promptId: string): Promise<void> {
    await this.client.delete(`/v1/organizations/${orgId}/system-prompts/${promptId}`);
  }

  // ============================================================================
  // Transform helpers
  // ============================================================================

  private transformCreateRequest(request: CreateSystemPromptRequest): Record<string, unknown> {
    return {
      name: request.name,
      description: request.description,
      content: request.content,
      injection_mode: request.injectionMode || 'prepend',
      priority: request.priority || 0,
    };
  }

  private transformUpdateRequest(request: UpdateSystemPromptRequest): Record<string, unknown> {
    return {
      name: request.name,
      description: request.description,
      content: request.content,
      injection_mode: request.injectionMode,
      priority: request.priority,
    };
  }

  private transformPrompt(data: Record<string, unknown>): SystemPrompt {
    const p = data as {
      id: string;
      name: string;
      description: string | null;
      content: string;
      injection_mode: string;
      priority: number;
      is_template: boolean;
      user_id: string | null;
      org_id: string | null;
      proxy_key_id: string | null;
      created_at: string;
      updated_at: string;
    };

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      content: p.content,
      injectionMode: p.injection_mode as InjectionMode,
      priority: p.priority,
      isTemplate: p.is_template,
      userId: p.user_id,
      orgId: p.org_id,
      proxyKeyId: p.proxy_key_id,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    };
  }

  private transformListResponse(response: Record<string, unknown>): SystemPromptListResponse {
    const data = response as {
      prompts: Array<Record<string, unknown>>;
      total: number;
    };

    return {
      prompts: data.prompts.map(p => this.transformPrompt(p)),
      total: data.total,
    };
  }

  private transformTemplatesResponse(response: Record<string, unknown>): SystemPromptTemplatesResponse {
    const data = response as {
      templates: Array<{
        id: string;
        name: string;
        description: string;
        content: string;
        category: string;
        injection_mode: string;
        use_cases: string[];
      }>;
      categories: string[];
    };

    return {
      templates: data.templates.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        content: t.content,
        category: t.category,
        injectionMode: t.injection_mode as InjectionMode,
        useCases: t.use_cases,
      })),
      categories: data.categories,
    };
  }
}
