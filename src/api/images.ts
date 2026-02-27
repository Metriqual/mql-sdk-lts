import { HttpClient } from '../client';

// ============================================================================
// Types
// ============================================================================

export interface ImageGenerationRequest {
  /** The model to use: "gpt-image-1", "dall-e-3", etc. */
  model: string;
  /** A text description of the desired image(s) */
  prompt: string;
  /** Number of images to generate (1-10, default 1) */
  n?: number;
  /** Image size: "1024x1024", "1024x1792", "1792x1024" */
  size?: '1024x1024' | '1024x1792' | '1792x1024' | string;
  /** Quality: "auto", "high", "medium", "low" */
  quality?: 'auto' | 'high' | 'medium' | 'low';
  /** Style: "natural", "vivid" */
  style?: 'natural' | 'vivid';
  /** Output format: "png", "jpeg", "webp" */
  output_format?: 'png' | 'jpeg' | 'webp';
  /** Return format: "url" or "b64_json" */
  response_format?: 'url' | 'b64_json';
  /** Background: "auto", "transparent", "opaque" */
  background?: 'auto' | 'transparent' | 'opaque';
}

export interface ImageGenerationResponse {
  /** Unix timestamp of creation */
  created: number;
  /** Array of generated images */
  data: ImageData[];
  /** Provider used */
  provider?: string;
  /** Model used */
  model?: string;
}

export interface ImageData {
  /** URL to the image (if response_format=url) */
  url?: string;
  /** Base64-encoded image data (if response_format=b64_json) */
  b64_json?: string;
  /** Revised prompt (dall-e-3) */
  revised_prompt?: string;
}

// ============================================================================
// Images API
// ============================================================================

/**
 * Images API
 * Image generation with DALL-E 3, GPT-Image, and more
 */
export class ImagesAPI {
  constructor(private readonly client: HttpClient) {}

  /**
   * Generate images from a text prompt
   * 
   * @example
   * ```typescript
   * const response = await mql.images.generate({
   *   model: 'dall-e-3',
   *   prompt: 'A white siamese cat in an impressionist style',
   *   size: '1024x1024',
   *   quality: 'high',
   * });
   * console.log('Image URL:', response.data[0].url);
   * ```
   */
  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    return this.client.post<ImageGenerationResponse>('/v1/images/generations', request);
  }

  /**
   * Generate images and return base64 encoded data
   * 
   * @example
   * ```typescript
   * const response = await mql.images.generateBase64({
   *   model: 'gpt-image-1',
   *   prompt: 'A modern abstract painting',
   * });
   * const imageBase64 = response.data[0].b64_json;
   * ```
   */
  async generateBase64(request: Omit<ImageGenerationRequest, 'response_format'>): Promise<ImageGenerationResponse> {
    return this.generate({
      ...request,
      response_format: 'b64_json',
    });
  }

  /**
   * Generate images and return URLs
   * 
   * @example
   * ```typescript
   * const urls = await mql.images.generateUrls({
   *   model: 'dall-e-3',
   *   prompt: 'A futuristic city at night',
   *   n: 2,
   * });
   * console.log('URLs:', urls);
   * ```
   */
  async generateUrls(request: Omit<ImageGenerationRequest, 'response_format'>): Promise<string[]> {
    const response = await this.generate({
      ...request,
      response_format: 'url',
    });
    return response.data.map(d => d.url).filter((url): url is string => !!url);
  }
}
