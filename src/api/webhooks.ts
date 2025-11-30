import { HttpClient } from '../client';
import type {
  Webhook,
  CreateWebhookRequest,
  UpdateWebhookRequest,
} from '../types';

/**
 * Webhooks API
 * Manage webhooks for event notifications
 */
export class WebhooksAPI {
  constructor(private readonly client: HttpClient) {}

  /**
   * List all webhooks
   * 
   * @example
   * ```typescript
   * const webhooks = await mql.webhooks.list();
   * webhooks.forEach(w => console.log(w.url, w.events, w.enabled));
   * ```
   */
  async list(): Promise<Webhook[]> {
    const response = await this.client.get<Array<Record<string, unknown>>>('/v1/webhooks');
    return response.map(w => this.transformWebhook(w));
  }

  /**
   * Create a new webhook
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

  // ============================================================================
  // Transform helpers
  // ============================================================================

  private transformWebhook(data: Record<string, unknown>): Webhook {
    const w = data as {
      id: string;
      url: string;
      events: string[];
      secret: string | null;
      enabled: boolean;
      created_at?: string;
      updated_at?: string;
    };

    return {
      id: w.id,
      url: w.url,
      events: w.events as Webhook['events'],
      secret: w.secret,
      enabled: w.enabled,
      createdAt: w.created_at || new Date().toISOString(),
      updatedAt: w.updated_at || new Date().toISOString(),
    };
  }
}
