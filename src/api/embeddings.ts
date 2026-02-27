import { HttpClient } from '../client';

// ============================================================================
// Types
// ============================================================================

export interface EmbeddingRequest {
  /** Model: "text-embedding-3-small", "text-embedding-3-large", "text-embedding-ada-002" */
  model: string;
  /** Input text(s) to embed — string, array of strings, or array of token arrays */
  input: string | string[] | number[] | number[][];
  /** Output encoding format: "float" (default) or "base64" */
  encoding_format?: 'float' | 'base64';
  /** Number of dimensions to return (only for text-embedding-3 and later) */
  dimensions?: number;
  /** A unique identifier representing your end-user */
  user?: string;
}

export interface EmbeddingObject {
  /** "embedding" */
  object: string;
  /** The embedding vector (array of floats or base64) */
  embedding: number[] | string;
  /** Index of this embedding in the request */
  index: number;
}

export interface EmbeddingUsage {
  /** Number of tokens in the input */
  prompt_tokens: number;
  /** Total tokens (same as prompt_tokens for embeddings) */
  total_tokens: number;
}

export interface EmbeddingResponse {
  /** "list" */
  object: string;
  /** Array of embedding objects */
  data: EmbeddingObject[];
  /** Model used */
  model: string;
  /** Token usage stats */
  usage: EmbeddingUsage;
}

// ============================================================================
// Embeddings API
// ============================================================================

/**
 * Embeddings API
 * Create embeddings for text input (useful for RAG, semantic search, clustering)
 */
export class EmbeddingsAPI {
  constructor(private readonly client: HttpClient) {}

  /**
   * Create embeddings for text input
   * 
   * @example
   * ```typescript
   * // Single text embedding
   * const response = await mql.embeddings.create({
   *   model: 'text-embedding-3-small',
   *   input: 'The quick brown fox jumps over the lazy dog',
   * });
   * console.log('Embedding:', response.data[0].embedding);
   * 
   * // Batch embedding
   * const batch = await mql.embeddings.create({
   *   model: 'text-embedding-3-large',
   *   input: [
   *     'First document',
   *     'Second document',
   *     'Third document',
   *   ],
   * });
   * batch.data.forEach((emb, idx) => {
   *   console.log(`Document ${idx}:`, emb.embedding.slice(0, 5));
   * });
   * ```
   */
  async create(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    return this.client.post<EmbeddingResponse>('/v1/embeddings', request);
  }

  /**
   * Create embeddings with reduced dimensions (text-embedding-3 only)
   * Useful for reducing storage and improving performance
   * 
   * @example
   * ```typescript
   * const response = await mql.embeddings.createWithDimensions({
   *   model: 'text-embedding-3-large',
   *   input: 'Sample text',
   *   dimensions: 512, // Reduce from default 3072 to 512
   * });
   * console.log('Reduced embedding length:', response.data[0].embedding.length);
   * ```
   */
  async createWithDimensions(
    request: Omit<EmbeddingRequest, 'dimensions'> & { dimensions: number }
  ): Promise<EmbeddingResponse> {
    return this.create(request);
  }

  /**
   * Create embeddings and return as base64 (more compact transfer)
   * 
   * @example
   * ```typescript
   * const response = await mql.embeddings.createBase64({
   *   model: 'text-embedding-3-small',
   *   input: 'Text to embed',
   * });
   * // response.data[0].embedding is now a base64 string
   * ```
   */
  async createBase64(request: Omit<EmbeddingRequest, 'encoding_format'>): Promise<EmbeddingResponse> {
    return this.create({
      ...request,
      encoding_format: 'base64',
    });
  }
}
