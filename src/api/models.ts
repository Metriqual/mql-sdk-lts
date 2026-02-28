import { HttpClient } from '../client';
import type { Model, ModelListResponse } from '../types';

/**
 * Models API
 * List available models from different providers
 */
export class ModelsAPI {
  constructor(private readonly client: HttpClient) {}

  /**
   * List all available models from a specific provider (OpenAI format)
   * 
   * Note: The backend requires a provider prefix. Use listByProvider() directly.
   * This method defaults to 'openai'.
   * 
   * @example
   * ```typescript
   * const { data } = await mql.models.list();
   * data.forEach(model => console.log(model.id, model.ownedBy));
   * ```
   */
  async list(provider: string = 'openai'): Promise<ModelListResponse> {
    return this.listByProvider(provider);
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
   * Get a specific model by ID from a provider
   * 
   * Note: Currently fetches the full model list from the provider 
   * and filters by ID since no single-model endpoint exists.
   * 
   * @example
   * ```typescript
   * const model = await mql.models.get('gpt-4o-mini', 'openai');
   * ```
   */
  async get(modelId: string, provider: string = 'openai'): Promise<Model> {
    const response = await this.listByProvider(provider);
    const model = response.data.find(m => m.id === modelId);
    if (!model) {
      throw new Error(`Model '${modelId}' not found for provider '${provider}'`);
    }
    return model;
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
