import type { HttpClient } from '../client';

// ============================================================================
// Feedback Types
// ============================================================================

export interface Feedback {
  id: string;
  request_id: string;
  proxy_key_id: string | null;
  org_id: string | null;
  user_id: string | null;
  experiment_id: string | null;
  variant_id: string | null;
  rating: number | null;
  thumbs_up: boolean | null;
  comment: string | null;
  corrected_output: string | null;
  tags: string[] | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface SubmitFeedbackRequest {
  request_id: string;
  rating?: number;
  thumbs_up?: boolean;
  comment?: string;
  corrected_output?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface FeedbackAnalytics {
  total_feedback: number;
  avg_rating: number | null;
  thumbs_up_count: number;
  thumbs_down_count: number;
  thumbs_up_percentage: number;
  by_model: Array<{
    model: string;
    count: number;
    avg_rating: number | null;
    thumbs_up_percentage: number;
  }>;
  by_experiment: Array<{
    experiment_id: string;
    experiment_name: string;
    count: number;
    avg_rating: number | null;
    thumbs_up_percentage: number;
  }> | null;
  by_tag: Array<{
    tag: string;
    count: number;
  }> | null;
}

export interface FeedbackAnalyticsParams {
  start_date?: string;
  end_date?: string;
  model?: string;
  experiment_id?: string;
  tags?: string[];
}

export interface ExportFeedbackParams {
  start_date?: string;
  end_date?: string;
  format?: 'jsonl' | 'csv';
  model?: string;
  experiment_id?: string;
  tags?: string[];
  limit?: number;
}

/**
 * Feedback API
 *
 * Collect and analyze user feedback on LLM responses.
 * 
 * @experimental These endpoints are not yet available on the backend.
 * Calling these methods will return 404 until the backend routes are registered.
 */
export class FeedbackAPI {
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Submit feedback for a request
   *
   * @example
   * ```typescript
   * const feedback = await mql.feedback.submit({
   *   request_id: "req_123",
   *   rating: 5,
   *   thumbs_up: true,
   *   comment: "Great response!",
   *   tags: ["helpful", "accurate"]
   * });
   * ```
   */
  async submit(data: SubmitFeedbackRequest): Promise<Feedback> {
    return this.httpClient.post<Feedback>('/v1/feedback', data);
  }

  /**
   * Get feedback for a specific request
   *
   * @example
   * ```typescript
   * const feedback = await mql.feedback.get('req_123');
   * ```
   */
  async get(requestId: string): Promise<Feedback> {
    return this.httpClient.get<Feedback>(`/v1/feedback/${requestId}`);
  }

  /**
   * Get feedback analytics
   *
   * @example
   * ```typescript
   * const analytics = await mql.feedback.getAnalytics({
   *   start_date: '2025-01-01',
   *   end_date: '2025-01-31'
   * });
   * console.log(`Average rating: ${analytics.avg_rating}`);
   * ```
   */
  async getAnalytics(params?: FeedbackAnalyticsParams): Promise<FeedbackAnalytics> {
    const queryParams = new URLSearchParams();
    if (params?.start_date) queryParams.set('start_date', params.start_date);
    if (params?.end_date) queryParams.set('end_date', params.end_date);
    if (params?.model) queryParams.set('model', params.model);
    if (params?.experiment_id) queryParams.set('experiment_id', params.experiment_id);
    if (params?.tags) queryParams.set('tags', params.tags.join(','));

    const url = `/v1/feedback/analytics${queryParams.toString() ? `?${queryParams}` : ''}`;
    return this.httpClient.get<FeedbackAnalytics>(url);
  }

  /**
   * Export feedback data
   *
   * @example Export as JSONL
   * ```typescript
   * const data = await mql.feedback.export({
   *   format: 'jsonl',
   *   start_date: '2025-01-01',
   *   limit: 1000
   * });
   * ```
   *
   * @example Export as CSV
   * ```typescript
   * const csv = await mql.feedback.export({
   *   format: 'csv',
   *   tags: ['production']
   * });
   * ```
   */
  async export(params?: ExportFeedbackParams): Promise<string> {
    const queryParams = new URLSearchParams();
    if (params?.start_date) queryParams.set('start_date', params.start_date);
    if (params?.end_date) queryParams.set('end_date', params.end_date);
    if (params?.format) queryParams.set('format', params.format);
    if (params?.model) queryParams.set('model', params.model);
    if (params?.experiment_id) queryParams.set('experiment_id', params.experiment_id);
    if (params?.tags) queryParams.set('tags', params.tags.join(','));
    if (params?.limit) queryParams.set('limit', params.limit.toString());

    const url = `/v1/feedback/export${queryParams.toString() ? `?${queryParams}` : ''}`;

    // For export, we want the raw text response, but we use get() and let it return the data
    // The backend will return the appropriate content type
    return this.httpClient.get<string>(url, undefined, {
      'Accept': params?.format === 'csv' ? 'text/csv' : 'application/x-ndjson',
    });
  }
}
