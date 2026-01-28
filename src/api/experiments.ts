import type { HttpClient } from '../client';

// ============================================================================
// Experiment Types
// ============================================================================

export type ExperimentStatus = 'draft' | 'running' | 'paused' | 'completed';

export interface Experiment {
  id: string;
  name: string;
  description: string | null;
  status: ExperimentStatus;
  traffic_percentage: number;
  target_proxy_key_ids: string[] | null;
  created_by: string;
  org_id: string | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  ended_at: string | null;
}

export interface ExperimentVariant {
  id: string;
  experiment_id: string;
  name: string;
  is_control: boolean;
  weight: number;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ExperimentWithVariants extends Experiment {
  variants: ExperimentVariant[];
}

export interface CreateExperimentRequest {
  name: string;
  description?: string;
  traffic_percentage: number;
  target_proxy_key_ids?: string[];
}

export interface UpdateExperimentRequest {
  name?: string;
  description?: string;
  traffic_percentage?: number;
  target_proxy_key_ids?: string[];
}

export interface CreateVariantRequest {
  name: string;
  is_control?: boolean;
  weight: number;
  config: Record<string, any>;
}

export interface UpdateVariantRequest {
  name?: string;
  weight?: number;
  config?: Record<string, any>;
}

export interface VariantAnalytics {
  variant_id: string;
  variant_name: string;
  is_control: boolean;
  summary: {
    request_count: number;
    avg_latency_ms: number;
    latency_p50: number | null;
    latency_p95: number | null;
    latency_p99: number | null;
    total_cost: number;
    avg_input_tokens: number;
    avg_output_tokens: number;
    error_rate: number;
  };
}

export interface ExperimentAnalytics {
  experiment_id: string;
  experiment_name: string;
  variants: VariantAnalytics[];
}

/**
 * Experiments API
 *
 * Manage A/B testing experiments to compare different LLM configurations
 */
export class ExperimentsAPI {
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Create a new experiment
   *
   * @example
   * ```typescript
   * const experiment = await mql.experiments.create({
   *   name: "GPT-4 vs Claude",
   *   description: "Compare model performance",
   *   traffic_percentage: 0.5
   * });
   * ```
   */
  async create(data: CreateExperimentRequest): Promise<Experiment> {
    return this.httpClient.post<Experiment>('/v1/experiments', data);
  }

  /**
   * List all experiments
   *
   * @example
   * ```typescript
   * const experiments = await mql.experiments.list();
   * ```
   */
  async list(): Promise<Experiment[]> {
    return this.httpClient.get<Experiment[]>('/v1/experiments');
  }

  /**
   * Get a single experiment with its variants
   *
   * @example
   * ```typescript
   * const experiment = await mql.experiments.get('exp_123');
   * console.log(experiment.variants);
   * ```
   */
  async get(id: string): Promise<ExperimentWithVariants> {
    return this.httpClient.get<ExperimentWithVariants>(`/v1/experiments/${id}`);
  }

  /**
   * Update an experiment
   *
   * @example
   * ```typescript
   * await mql.experiments.update('exp_123', {
   *   traffic_percentage: 0.8
   * });
   * ```
   */
  async update(id: string, data: UpdateExperimentRequest): Promise<Experiment> {
    return this.httpClient.patch<Experiment>(`/v1/experiments/${id}`, data);
  }

  /**
   * Delete an experiment
   *
   * @example
   * ```typescript
   * await mql.experiments.delete('exp_123');
   * ```
   */
  async delete(id: string): Promise<{ message: string }> {
    return this.httpClient.delete(`/v1/experiments/${id}`);
  }

  /**
   * Start an experiment
   *
   * @example
   * ```typescript
   * await mql.experiments.start('exp_123');
   * ```
   */
  async start(id: string): Promise<Experiment> {
    return this.httpClient.post<Experiment>(`/v1/experiments/${id}/start`, {});
  }

  /**
   * Pause a running experiment
   *
   * @example
   * ```typescript
   * await mql.experiments.pause('exp_123');
   * ```
   */
  async pause(id: string): Promise<Experiment> {
    return this.httpClient.post<Experiment>(`/v1/experiments/${id}/pause`, {});
  }

  /**
   * Complete an experiment
   *
   * @example
   * ```typescript
   * await mql.experiments.complete('exp_123');
   * ```
   */
  async complete(id: string): Promise<Experiment> {
    return this.httpClient.post<Experiment>(`/v1/experiments/${id}/complete`, {});
  }

  /**
   * Add a variant to an experiment
   *
   * @example
   * ```typescript
   * const variant = await mql.experiments.createVariant('exp_123', {
   *   name: "Variant A",
   *   weight: 0.5,
   *   config: { model: "gpt-4o", temperature: 0.7 }
   * });
   * ```
   */
  async createVariant(experimentId: string, data: CreateVariantRequest): Promise<ExperimentVariant> {
    return this.httpClient.post<ExperimentVariant>(`/v1/experiments/${experimentId}/variants`, data);
  }

  /**
   * Update a variant
   *
   * @example
   * ```typescript
   * await mql.experiments.updateVariant('exp_123', 'var_456', {
   *   weight: 0.6
   * });
   * ```
   */
  async updateVariant(
    experimentId: string,
    variantId: string,
    data: UpdateVariantRequest
  ): Promise<ExperimentVariant> {
    return this.httpClient.patch<ExperimentVariant>(
      `/v1/experiments/${experimentId}/variants/${variantId}`,
      data
    );
  }

  /**
   * Delete a variant
   *
   * @example
   * ```typescript
   * await mql.experiments.deleteVariant('exp_123', 'var_456');
   * ```
   */
  async deleteVariant(experimentId: string, variantId: string): Promise<{ message: string }> {
    return this.httpClient.delete(`/v1/experiments/${experimentId}/variants/${variantId}`);
  }

  /**
   * Get analytics for an experiment
   *
   * @example
   * ```typescript
   * const analytics = await mql.experiments.getAnalytics('exp_123');
   * console.log(analytics.variants);
   * ```
   */
  async getAnalytics(id: string): Promise<ExperimentAnalytics> {
    return this.httpClient.get<ExperimentAnalytics>(`/v1/experiments/${id}/analytics`);
  }
}
