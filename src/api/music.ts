import { HttpClient } from '../client';

// ============================================================================
// Types
// ============================================================================

export interface MusicGenerationRequest {
  /** Style/genre/theme description (required). e.g. "Create a bollywood song" or "upbeat pop" */
  prompt: string;
  /** Song lyrics (optional). If not provided, lyrics are auto-generated from the prompt. */
  lyrics?: string;
}

export interface MusicGenerationResponse {
  /** "music.generation" */
  object: string;
  /** URL to download the generated music (MP3 format) */
  audio_url: string;
  /** Duration of the generated music in seconds */
  duration_seconds: number;
  /** Cost of generation in USD */
  cost: number;
  /** Request processing time in milliseconds */
  latency_ms: number;
  /** Provider used (e.g., "minimax") */
  provider: string;
  /** The lyrics that were actually used for music generation */
  lyrics_used: string;
  /** Whether lyrics were auto-generated (true) or provided by the user (false) */
  lyrics_auto_generated: boolean;
}

// ============================================================================
// Music API
// ============================================================================

/**
 * Music API
 * Generate music from lyrics and style prompts using MiniMax
 */
export class MusicAPI {
  constructor(private readonly client: HttpClient) {}

  /**
   * Generate music from a prompt and optional lyrics
   * 
   * If lyrics are not provided, they will be auto-generated from the prompt.
   * 
   * @example
   * ```typescript
   * // Generate music with auto-generated lyrics
   * const music = await mql.music.generate({
   *   prompt: 'Create an upbeat pop song about summer vacation',
   * });
   * console.log('Music URL:', music.audio_url);
   * console.log('Duration:', music.duration_seconds, 'seconds');
   * console.log('Auto-generated lyrics:', music.lyrics_used);
   * 
   * // Generate music with custom lyrics
   * const custom = await mql.music.generate({
   *   prompt: 'A rock song with electric guitars',
   *   lyrics: `[Verse 1]
   * Walking down the street
   * Feeling the beat
   * Life is complete
   * 
   * [Chorus]
   * We are alive tonight
   * Dancing in the moonlight`,
   * });
   * console.log('Music with custom lyrics:', custom.audio_url);
   * ```
   */
  async generate(request: MusicGenerationRequest): Promise<MusicGenerationResponse> {
    return this.client.post<MusicGenerationResponse>('/v1/music/generations', request);
  }

  /**
   * Generate music with prompt only (lyrics auto-generated)
   * 
   * @example
   * ```typescript
   * const music = await mql.music.generateFromPrompt('A jazzy tune for a coffee shop');
   * console.log('Generated:', music.audio_url);
   * ```
   */
  async generateFromPrompt(prompt: string): Promise<MusicGenerationResponse> {
    return this.generate({ prompt });
  }

  /**
   * Generate music with specific lyrics
   * 
   * @example
   * ```typescript
   * const music = await mql.music.generateWithLyrics(
   *   'An emotional ballad',
   *   `[Verse 1]
   *   When the night falls down
   *   I hear your voice
   *   
   *   [Chorus]
   *   You're my everything
   *   Forever and always`
   * );
   * ```
   */
  async generateWithLyrics(prompt: string, lyrics: string): Promise<MusicGenerationResponse> {
    return this.generate({ prompt, lyrics });
  }
}
