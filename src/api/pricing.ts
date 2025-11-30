import { HttpClient } from '../client';
import type { ModelPricing, ProviderPricingResponse } from '../types';

/**
 * Pricing API
 * Get pricing information for provider models
 */
export class PricingAPI {
  constructor(private readonly client: HttpClient) {}

  /**
   * Get pricing for a specific provider
   * 
   * @example
   * ```typescript
   * const pricing = await mql.pricing.getByProvider('openai');
   * pricing.models.forEach(m => {
   *   console.log(`${m.model}: $${m.inputPricePerToken}/input, $${m.outputPricePerToken}/output`);
   * });
   * ```
   */
  async getByProvider(provider: string): Promise<ProviderPricingResponse> {
    const response = await this.client.get<Record<string, unknown>>(`/${provider}/v1/pricing`);
    return this.transformResponse(response);
  }

  /**
   * Get pricing for OpenAI models
   */
  async getOpenAI(): Promise<ProviderPricingResponse> {
    return this.getByProvider('openai');
  }

  /**
   * Get pricing for Anthropic models
   */
  async getAnthropic(): Promise<ProviderPricingResponse> {
    return this.getByProvider('anthropic');
  }

  /**
   * Get pricing for Mistral models
   */
  async getMistral(): Promise<ProviderPricingResponse> {
    return this.getByProvider('mistral');
  }

  /**
   * Get pricing for Google Gemini models
   */
  async getGemini(): Promise<ProviderPricingResponse> {
    return this.getByProvider('gemini');
  }

  /**
   * Get pricing for Cohere models
   */
  async getCohere(): Promise<ProviderPricingResponse> {
    return this.getByProvider('cohere');
  }

  // ============================================================================
  // Transform helpers
  // ============================================================================

  private transformResponse(data: Record<string, unknown>): ProviderPricingResponse {
    const r = data as {
      provider: string;
      models: Array<{
        model: string;
        input_price_per_token?: number;
        output_price_per_token?: number;
        input_price_per_1m?: number;
        output_price_per_1m?: number;
        context_length?: number;
        supports_vision?: boolean;
        supports_function_calling?: boolean;
      }>;
    };

    return {
      provider: r.provider,
      models: r.models.map(m => ({
        model: m.model,
        inputPricePerToken: m.input_price_per_token,
        outputPricePerToken: m.output_price_per_token,
        inputPricePer1M: m.input_price_per_1m,
        outputPricePer1M: m.output_price_per_1m,
        contextLength: m.context_length,
        supportsVision: m.supports_vision,
        supportsFunctionCalling: m.supports_function_calling,
      })),
    };
  }
}
