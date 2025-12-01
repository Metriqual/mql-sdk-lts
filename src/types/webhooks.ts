/**
 * Webhook event types
 */
export type WebhookEventType =
  | 'usage.threshold'
  | 'fallback.activated'
  | 'provider.exhausted'
  | 'filter.blocked'
  | 'filter.warned'
  | 'request.completed'
  | 'error.occurred';

/**
 * Create webhook request
 */
export interface CreateWebhookRequest {
  /** Webhook URL to receive events */
  url: string;
  /** Array of event types to subscribe to */
  events: WebhookEventType[];
  /** Optional HMAC secret for signature verification */
  secret?: string;
  /** Optional organization ID for org-level webhooks */
  orgId?: string;
}

/**
 * Update webhook request
 */
export interface UpdateWebhookRequest {
  /** Webhook URL to receive events */
  url?: string;
  /** Array of event types to subscribe to */
  events?: WebhookEventType[];
  /** HMAC secret for signature verification */
  secret?: string;
  /** Whether webhook is enabled */
  enabled?: boolean;
}

/**
 * Webhook response
 */
export interface WebhookResponse {
  /** Webhook ID */
  id: string;
  /** User ID (null for org webhooks) */
  userId?: string;
  /** Organization ID (null for user webhooks) */
  orgId?: string;
  /** Webhook URL */
  url: string;
  /** Subscribed event types */
  events: WebhookEventType[];
  /** HMAC secret (if configured) */
  secret?: string;
  /** Whether webhook is enabled */
  enabled: boolean;
  /** Creation timestamp (ISO 8601) */
  createdAt: string;
  /** Last update timestamp (ISO 8601) */
  updatedAt: string;
}

/**
 * Webhook delivery attempt
 */
export interface WebhookDeliveryResponse {
  /** Delivery ID */
  id: string;
  /** Webhook ID */
  webhookId: string;
  /** Event type that was delivered */
  eventType: WebhookEventType;
  /** Event payload */
  payload: Record<string, unknown>;
  /** HTTP status code (if request succeeded) */
  statusCode?: number;
  /** Response body from webhook endpoint */
  responseBody?: string;
  /** Error message (if delivery failed) */
  errorMessage?: string;
  /** Whether delivery was successful */
  success: boolean;
  /** When delivery was attempted (ISO 8601) */
  attemptedAt: string;
}

/**
 * List webhooks response
 */
export interface ListWebhooksResponse {
  webhooks: WebhookResponse[];
  count: number;
}
