import { HttpClient } from '../client';
import type {
  Webhook,
  WebhookDelivery,
  CreateWebhookRequest,
  UpdateWebhookRequest,
} from '../types';

/**
 * Webhooks API
 * Manage webhooks for real-time event notifications.
 * 
 * @experimental These endpoints are not yet available on the backend.
 * Calling these methods will return 404 until the backend routes are registered.
 */
export class WebhooksAPI {
  constructor(private readonly client: HttpClient) {}

  // ============================================================================
  // User-level Webhooks
  // ============================================================================

  /**
   * List all user webhooks
   *
   * @example
   * ```typescript
   * const webhooks = await mql.webhooks.list();
   * webhooks.forEach(w => console.log(w.url, w.events, w.enabled));
   * ```
   */
  async list(): Promise<Webhook[]> {
    const response = await this.client.get<Array<Record<string, unknown>>>('/v1/webhooks');
    return Array.isArray(response) ? response.map(w => this.transformWebhook(w)) : [];
  }

  /**
   * Create a new user-level webhook
   *
   * @example
   * ```typescript
   * const webhook = await mql.webhooks.create({
   *   url: 'https://api.example.com/webhooks',
   *   events: ['usage.threshold', 'fallback.activated', 'provider.exhausted'],
   *   secret: 'my-webhook-secret',
   * });
   * ```
   */
  async create(request: CreateWebhookRequest): Promise<Webhook> {
    const body = {
      url: request.url,
      events: request.events,
      secret: request.secret,
      org_id: request.orgId,
    };
    const response = await this.client.post<Record<string, unknown>>('/v1/webhooks', body);
    return this.transformWebhook(response);
  }

  /**
   * Update an existing webhook
   *
   * @example
   * ```typescript
   * const updated = await mql.webhooks.update('webhook-id', {
   *   enabled: false,
   *   events: ['error.occurred'],
   * });
   * ```
   */
  async update(webhookId: string, request: UpdateWebhookRequest): Promise<Webhook> {
    const body = {
      url: request.url,
      events: request.events,
      secret: request.secret,
      enabled: request.enabled,
    };
    const response = await this.client.patch<Record<string, unknown>>(`/v1/webhooks/${webhookId}`, body);
    return this.transformWebhook(response);
  }

  /**
   * Delete a webhook
   *
   * @example
   * ```typescript
   * await mql.webhooks.delete('webhook-id');
   * ```
   */
  async delete(webhookId: string): Promise<void> {
    await this.client.delete(`/v1/webhooks/${webhookId}`);
  }

  /**
   * Get delivery attempts for a webhook
   *
   * @example
   * ```typescript
   * const deliveries = await mql.webhooks.getDeliveries('webhook-id');
   * deliveries.forEach(d => console.log(d.success, d.attemptedAt));
   * ```
   */
  async getDeliveries(webhookId: string): Promise<WebhookDelivery[]> {
    const response = await this.client.get<Array<Record<string, unknown>>>(`/v1/webhooks/${webhookId}/deliveries`);
    return Array.isArray(response) ? response.map(d => this.transformDelivery(d)) : [];
  }

  // ============================================================================
  // Organization-level Webhooks
  // ============================================================================

  /**
   * List all webhooks for an organization
   *
   * @example
   * ```typescript
   * const webhooks = await mql.webhooks.listForOrg('org-id');
   * ```
   */
  async listForOrg(orgId: string): Promise<Webhook[]> {
    const response = await this.client.get<Array<Record<string, unknown>>>(`/v1/organizations/${orgId}/webhooks`);
    return Array.isArray(response) ? response.map(w => this.transformWebhook(w)) : [];
  }

  /**
   * Create an organization-level webhook
   *
   * @example
   * ```typescript
   * const webhook = await mql.webhooks.createForOrg('org-id', {
   *   url: 'https://api.example.com/webhooks',
   *   events: ['usage.threshold'],
   *   secret: 'org-secret',
   * });
   * ```
   */
  async createForOrg(orgId: string, request: CreateWebhookRequest): Promise<Webhook> {
    const body = {
      url: request.url,
      events: request.events,
      secret: request.secret,
    };
    const response = await this.client.post<Record<string, unknown>>(`/v1/organizations/${orgId}/webhooks`, body);
    return this.transformWebhook(response);
  }

  /**
   * Delete an organization webhook
   *
   * @example
   * ```typescript
   * await mql.webhooks.deleteForOrg('org-id', 'webhook-id');
   * ```
   */
  async deleteForOrg(orgId: string, webhookId: string): Promise<void> {
    await this.client.delete(`/v1/organizations/${orgId}/webhooks/${webhookId}`);
  }

  // ============================================================================
  // Transform helpers
  // ============================================================================

  private transformWebhook(data: Record<string, unknown>): Webhook {
    const w = data as {
      id: string;
      user_id?: string;
      org_id?: string;
      url: string;
      events: string[];
      secret?: string;
      enabled: boolean;
      created_at: string;
      updated_at: string;
    };

    return {
      id: w.id,
      userId: w.user_id,
      orgId: w.org_id,
      url: w.url,
      events: w.events as Webhook['events'],
      secret: w.secret,
      enabled: w.enabled,
      createdAt: w.created_at,
      updatedAt: w.updated_at,
    };
  }

  private transformDelivery(data: Record<string, unknown>): WebhookDelivery {
    const d = data as {
      id: string;
      webhook_id: string;
      event_type: string;
      payload: Record<string, unknown>;
      status_code?: number;
      response_body?: string;
      error_message?: string;
      success: boolean;
      attempted_at: string;
    };

    return {
      id: d.id,
      webhookId: d.webhook_id,
      eventType: d.event_type as Webhook['events'][0],
      payload: d.payload,
      statusCode: d.status_code,
      responseBody: d.response_body,
      errorMessage: d.error_message,
      success: d.success,
      attemptedAt: d.attempted_at,
    };
  }
}
