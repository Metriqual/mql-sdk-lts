import { HttpClient } from '../client';
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionChunk,
  StreamOptions,
  ChatMessage,
} from '../types';

/**
 * Chat Completions API
 * OpenAI-compatible chat completions with automatic fallback and content filtering
 */
export class ChatAPI {
  constructor(private readonly client: HttpClient) {}

  /**
   * Create a chat completion
   * 
   * @example
   * ```typescript
   * const response = await mql.chat.create({
   *   messages: [
   *     { role: 'user', content: 'Hello, how are you?' }
   *   ]
   * });
   * console.log(response.choices[0].message.content);
   * ```
   */
  async create(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const body = this.transformRequest(request);
    const response = await this.client.post<Record<string, unknown>>('/v1/chat/completions', body);
    return this.transformResponse(response);
  }

  /**
   * Create a streaming chat completion
   * 
   * @example
   * ```typescript
   * // Using async iterator
   * for await (const chunk of mql.chat.stream({ messages: [...] })) {
   *   process.stdout.write(chunk.choices[0].delta.content || '');
   * }
   * 
   * // Using callbacks
   * await mql.chat.stream(
   *   { messages: [...] },
   *   {
   *     onChunk: (chunk) => process.stdout.write(chunk.choices[0].delta.content || ''),
   *     onComplete: (fullText) => console.log('\nDone:', fullText),
   *   }
   * );
   * ```
   */
  async *stream(
    request: ChatCompletionRequest,
    options?: StreamOptions
  ): AsyncGenerator<ChatCompletionChunk, string, unknown> {
    const body = this.transformRequest({ ...request, stream: true });
    let fullContent = '';

    try {
      for await (const data of this.client.stream('/v1/chat/completions', body, undefined, options?.signal)) {
        try {
          const chunk = JSON.parse(data) as ChatCompletionChunk;
          
          // Accumulate content for onComplete callback
          const deltaContent = chunk.choices[0]?.delta?.content;
          if (deltaContent) {
            fullContent += deltaContent;
          }

          options?.onChunk?.(chunk);
          yield chunk;
        } catch {
          // Skip invalid JSON chunks (like [DONE])
        }
      }

      options?.onComplete?.(fullContent);
      return fullContent;
    } catch (error) {
      if (options?.onError && error instanceof Error) {
        options.onError({
          error: error.message,
          status: (error as { status?: number }).status,
        });
      }
      throw error;
    }
  }

  /**
   * Create a streaming completion and collect the full response
   * Useful when you want streaming behavior but also need the complete response
   * 
   * @example
   * ```typescript
   * const { response, text } = await mql.chat.streamToCompletion({
   *   messages: [{ role: 'user', content: 'Tell me a story' }]
   * }, {
   *   onChunk: (chunk) => process.stdout.write(chunk.choices[0].delta.content || '')
   * });
   * ```
   */
  async streamToCompletion(
    request: ChatCompletionRequest,
    options?: StreamOptions
  ): Promise<{ response: ChatCompletionChunk[]; text: string }> {
    const chunks: ChatCompletionChunk[] = [];
    let text = '';

    for await (const chunk of this.stream(request, options)) {
      chunks.push(chunk);
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        text += content;
      }
    }

    return { response: chunks, text };
  }

  /**
   * Simple completion helper - returns just the text content
   * 
   * @example
   * ```typescript
   * const reply = await mql.chat.complete([
   *   { role: 'user', content: 'What is 2+2?' }
   * ]);
   * console.log(reply); // "4"
   * ```
   */
  async complete(messages: ChatMessage[], options?: Omit<ChatCompletionRequest, 'messages'>): Promise<string> {
    const response = await this.create({ ...options, messages });
    return response.choices[0]?.message?.content || '';
  }

  /**
   * Transform request from SDK format to API format
   */
  private transformRequest(request: ChatCompletionRequest): Record<string, unknown> {
    return {
      model: request.model,
      messages: request.messages,
      stream: request.stream,
      max_tokens: request.maxTokens,
      temperature: request.temperature,
      top_p: request.topP,
      n: request.n,
      stop: request.stop,
      presence_penalty: request.presencePenalty,
      frequency_penalty: request.frequencyPenalty,
      user: request.user,
      functions: request.functions,
      function_call: request.functionCall,
      tools: request.tools,
      tool_choice: request.toolChoice,
    };
  }

  /**
   * Transform response from API format to SDK format
   * Supports both OpenAI format (with choices array) and MQL local format (with message directly)
   */
  private transformResponse(response: Record<string, unknown>): ChatCompletionResponse {
    const resp = response as any;

    // Handle local API format (message + metadata)
    if (resp.message && !resp.choices && resp.metadata) {
      const metadata = resp.metadata as any;
      return {
        id: resp.id || '',
        object: 'chat.completion',
        created: metadata.created || Date.now(),
        model: resp.model || '',
        choices: [{
          index: 0,
          message: resp.message,
          finishReason: (metadata.finish_reason || 'stop') as ChatCompletionResponse['choices'][0]['finishReason'],
        }],
        usage: {
          promptTokens: metadata.prompt_tokens || 0,
          completionTokens: metadata.completion_tokens || 0,
          totalTokens: metadata.tokens_used || (metadata.prompt_tokens || 0) + (metadata.completion_tokens || 0),
        },
      };
    }

    // Handle standard OpenAI format (with choices array)
    return {
      id: resp.id,
      object: resp.object,
      created: resp.created,
      model: resp.model,
      choices: resp.choices.map((choice: any) => ({
        index: choice.index,
        message: choice.message,
        finishReason: choice.finish_reason as ChatCompletionResponse['choices'][0]['finishReason'],
      })),
      usage: {
        promptTokens: resp.usage.prompt_tokens,
        completionTokens: resp.usage.completion_tokens,
        totalTokens: resp.usage.total_tokens,
      },
    };
  }
}
