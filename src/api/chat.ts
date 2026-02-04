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
   * Handles both OpenAI standard format and MQL custom format
   */
  private transformResponse(response: Record<string, unknown>): ChatCompletionResponse {
    // Check if this is MQL format (has 'message' field instead of 'choices')
    if ('message' in response && 'metadata' in response) {
      // MQL custom format
      const resp = response as {
        id: string;
        object: 'chat.completion';
        model: string;
        message: ChatMessage;
        metadata: {
          provider_id?: string;
          tokens_used?: number;
          completion_tokens?: number;
          prompt_tokens?: number;
          created?: number;
          finish_reason?: string;
        };
        provider: string;
      };

      return {
        id: resp.id,
        object: resp.object,
        created: resp.metadata.created || Date.now(),
        model: resp.model,
        choices: [{
          index: 0,
          message: resp.message,
          finishReason: (resp.metadata.finish_reason || 'stop') as ChatCompletionResponse['choices'][0]['finishReason'],
        }],
        usage: {
          promptTokens: resp.metadata.prompt_tokens || 0,
          completionTokens: resp.metadata.completion_tokens || 0,
          totalTokens: resp.metadata.tokens_used || 0,
        },
      };
    }

    // OpenAI standard format
    const resp = response as {
      id: string;
      object: 'chat.completion';
      created: number;
      model: string;
      choices: Array<{
        index: number;
        message: ChatMessage;
        finish_reason: string | null;
      }>;
      usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
    };

    return {
      id: resp.id,
      object: resp.object,
      created: resp.created,
      model: resp.model,
      choices: resp.choices.map(choice => ({
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
