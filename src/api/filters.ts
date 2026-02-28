import { HttpClient } from '../client';
import type {
  Filter,
  FilterListResponse,
  CreateFilterRequest,
  UpdateFilterRequest,
  FilterTemplatesResponse,
  CreateFilterFromTemplateRequest,
  TestFilterRequest,
  TestFilterResponse,
  FilterType,
  FilterAction,
  FilterApplyTo,
} from '../types';

/**
 * Filters API
 * Manage content filters for PII protection, profanity filtering, and custom rules
 */
export class FiltersAPI {
  constructor(private readonly client: HttpClient) {}

  /**
   * List all filters for the authenticated user
   * 
   * @example
   * ```typescript
   * const { filters } = await mql.filters.list();
   * filters.forEach(f => console.log(f.name, f.filterType, f.enabled));
   * ```
   */
  async list(): Promise<FilterListResponse> {
    const response = await this.client.get<Record<string, unknown>>('/v1/user/filters');
    return this.transformListResponse(response);
  }

  /**
   * Create a new filter
   * 
   * @example
   * ```typescript
   * const filter = await mql.filters.create({
   *   name: 'Block PII',
   *   filterType: 'PII',
   *   action: 'BLOCK',
   *   applyTo: 'BOTH',
   *   config: { types: ['email', 'ssn', 'credit_card'] },
   * });
   * ```
   */
  async create(request: CreateFilterRequest): Promise<Filter> {
    const body = this.transformCreateRequest(request);
    const response = await this.client.post<Record<string, unknown>>('/v1/user/filters', body);
    return this.transformFilter(response);
  }

  /**
   * Update an existing filter
   * 
   * @example
   * ```typescript
   * const updated = await mql.filters.update('filter-id', {
   *   enabled: false,
   *   action: 'WARN',
   * });
   * ```
   */
  async update(filterId: string, request: UpdateFilterRequest): Promise<Filter> {
    const body = this.transformUpdateRequest(request);
    const response = await this.client.patch<Record<string, unknown>>(`/v1/user/filters/${filterId}`, body);
    return this.transformFilter(response);
  }

  /**
   * Toggle a filter's enabled status
   * 
   * @example
   * ```typescript
   * const toggled = await mql.filters.toggle('filter-id');
   * console.log(`Filter is now ${toggled.enabled ? 'enabled' : 'disabled'}`);
   * ```
   */
  async toggle(filterId: string): Promise<Filter> {
    const response = await this.client.post<Record<string, unknown>>(`/v1/user/filters/${filterId}/toggle`);
    return this.transformFilter(response);
  }

  /**
   * Delete a filter
   * 
   * @example
   * ```typescript
   * await mql.filters.delete('filter-id');
   * ```
   */
  async delete(filterId: string): Promise<void> {
    await this.client.delete(`/v1/user/filters/${filterId}`);
  }

  /**
   * Get all available filter templates
   * 
   * @example
   * ```typescript
   * const { templates, categories } = await mql.filters.getTemplates();
   * templates.forEach(t => console.log(t.name, t.category, t.description));
   * ```
   */
  async getTemplates(): Promise<FilterTemplatesResponse> {
    const response = await this.client.get<Record<string, unknown>>('/v1/filters/templates');
    return this.transformTemplatesResponse(response);
  }

  /**
   * Create a filter from a template
   * 
   * @example
   * ```typescript
   * const filter = await mql.filters.createFromTemplate({
   *   templateId: 'pii-redact-all',
   *   name: 'My PII Filter',
   *   proxyKeyId: 'key-id',
   * });
   * ```
   */
  async createFromTemplate(request: CreateFilterFromTemplateRequest): Promise<Filter> {
    const body = {
      template_id: request.templateId,
      name: request.name,
      proxy_key_id: request.proxyKeyId,
      org_id: request.orgId,
    };
    const response = await this.client.post<Record<string, unknown>>('/v1/filters/from-template', body);
    return this.transformFilter(response);
  }

  /**
   * Test a filter against sample content
   * 
   * @example
   * ```typescript
   * const result = await mql.filters.test({
   *   filterType: 'PII',
   *   action: 'REDACT',
   *   config: { types: ['email'] },
   *   testContent: 'Contact me at test@example.com',
   * });
   * console.log(result.matchesFound); // true
   * console.log(result.resultContent); // "Contact me at [REDACTED]"
   * ```
   */
  async test(request: TestFilterRequest): Promise<TestFilterResponse> {
    const body = {
      filter_type: request.filterType,
      action: request.action,
      config: request.config,
      test_content: request.testContent,
    };
    const response = await this.client.post<Record<string, unknown>>('/v1/filters/test', body);
    return this.transformTestResponse(response);
  }

  // ============================================================================
  // Organization Filters
  // ============================================================================

  /**
   * List all filters for an organization
   */
  async listForOrg(orgId: string): Promise<FilterListResponse> {
    const response = await this.client.get<Record<string, unknown>>(`/v1/organizations/${orgId}/filters`);
    return this.transformListResponse(response);
  }

  /**
   * Create a filter for an organization
   * @experimental Org filter creation is not yet available. Backend only supports listing.
   */
  async createForOrg(orgId: string, request: CreateFilterRequest): Promise<Filter> {
    const body = this.transformCreateRequest({ ...request, orgId });
    const response = await this.client.post<Record<string, unknown>>(`/v1/organizations/${orgId}/filters`, body);
    return this.transformFilter(response);
  }

  // ============================================================================
  // Transform helpers
  // ============================================================================

  private transformCreateRequest(request: CreateFilterRequest): Record<string, unknown> {
    return {
      org_id: request.orgId,
      proxy_key_id: request.proxyKeyId,
      name: request.name,
      description: request.description,
      filter_type: request.filterType,
      action: request.action,
      apply_to: request.applyTo,
      config: request.config,
    };
  }

  private transformUpdateRequest(request: UpdateFilterRequest): Record<string, unknown> {
    return {
      name: request.name,
      description: request.description,
      enabled: request.enabled,
      filter_type: request.filterType,
      action: request.action,
      apply_to: request.applyTo,
      config: request.config,
    };
  }

  private transformFilter(data: Record<string, unknown>): Filter {
    const f = data as {
      id: string;
      org_id: string | null;
      user_id: string | null;
      proxy_key_id: string | null;
      name: string;
      description: string | null;
      enabled: boolean;
      filter_type: string;
      action: string;
      apply_to: string;
      config: Record<string, unknown>;
      created_at: string;
      updated_at: string;
    };

    return {
      id: f.id,
      orgId: f.org_id,
      userId: f.user_id,
      proxyKeyId: f.proxy_key_id,
      name: f.name,
      description: f.description,
      enabled: f.enabled,
      filterType: f.filter_type as FilterType,
      action: f.action as FilterAction,
      applyTo: f.apply_to as FilterApplyTo,
      config: f.config,
      createdAt: f.created_at,
      updatedAt: f.updated_at,
    };
  }

  private transformListResponse(response: Record<string, unknown>): FilterListResponse {
    const data = response as { filters: Array<Record<string, unknown>> };
    return {
      filters: data.filters.map(f => this.transformFilter(f)),
    };
  }

  private transformTemplatesResponse(response: Record<string, unknown>): FilterTemplatesResponse {
    const data = response as {
      templates: Array<{
        id: string;
        name: string;
        description: string;
        category: string;
        filter_type: string;
        action: string;
        apply_to: string;
        config: Record<string, unknown>;
      }>;
      categories: string[];
    };

    return {
      templates: data.templates.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category,
        filterType: t.filter_type as FilterType,
        action: t.action as FilterAction,
        applyTo: t.apply_to as FilterApplyTo,
        config: t.config,
      })),
      categories: data.categories,
    };
  }

  private transformTestResponse(response: Record<string, unknown>): TestFilterResponse {
    const data = response as {
      matches_found: boolean;
      action_taken: string;
      matches: Array<{
        matched_text: string;
        pattern: string;
        position: [number, number];
      }>;
      result_content: string | null;
    };

    return {
      matchesFound: data.matches_found,
      actionTaken: data.action_taken,
      matches: data.matches.map(m => ({
        matchedText: m.matched_text,
        pattern: m.pattern,
        position: m.position,
      })),
      resultContent: data.result_content,
    };
  }
}
