import { HttpClient } from '../client';
import type { Model, ModelListResponse } from '../types';

/**
 * Models API
 * List available models from different providers
 */
export class ModelsAPI {
  constructor(private readonly client: HttpClient) {}

  /**
   * List all available models (OpenAI format)
   * 
   * @example
   * ```typescript
   * const { data } = await mql.models.list();
   * data.forEach(model => console.log(model.id, model.ownedBy));
   * ```
   */
  async list(): Promise<ModelListResponse> {
    const response = await this.client.get<Record<string, unknown>>('/v1/models');
    return this.transformResponse(response);
  }

  /**
   * List models from a specific provider
   * 
   * @example
   * ```typescript
   * const openaiModels = await mql.models.listByProvider('openai');
   * const anthropicModels = await mql.models.listByProvider('anthropic');
   * ```
   */
  async listByProvider(provider: string): Promise<ModelListResponse> {
    const response = await this.client.get<Record<string, unknown>>(`/${provider}/v1/models`);
    return this.transformResponse(response);
  }

  /**
   * Get a specific model by ID
   * 
   * @example
   * ```typescript
   * const model = await mql.models.get('gpt-4o-mini');
   * ```
   */
  async get(modelId: string): Promise<Model> {
    const response = await this.client.get<Record<string, unknown>>(`/v1/models/${modelId}`);
    return this.transformModel(response);
  }

  // ============================================================================
  // Transform helpers
  // ============================================================================

  private transformModel(data: Record<string, unknown>): Model {
    const m = data as {
      id: string;
      object: 'model';
      created: number;
      owned_by: string;
    };

    return {
      id: m.id,
      object: m.object,
      created: m.created,
      ownedBy: m.owned_by,
    };
  }

  private transformResponse(data: Record<string, unknown>): ModelListResponse {
    const r = data as {
      object: 'list';
      data: Array<{
        id: string;
        object: 'model';
        created: number;
        owned_by: string;
      }>;
    };

    return {
      object: r.object,
      data: r.data.map(m => this.transformModel(m as Record<string, unknown>)),
    };
  }
}
