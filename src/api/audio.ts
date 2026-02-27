import { HttpClient } from '../client';

// ============================================================================
// Types
// ============================================================================

// --- TTS (Text-to-Speech) ---

export interface SpeechRequest {
  /** Model: "tts-1", "tts-1-hd" (OpenAI) or "speech-2.8-hd", "speech-2.8-turbo", etc. (MiniMax) */
  model: string;
  /** The text to generate audio for */
  input: string;
  /** Voice: alloy, echo, fable, onyx, nova, shimmer (OpenAI) or voice_id (MiniMax) */
  voice: string;
  /** Output format: mp3 (default), opus, aac, flac, wav, pcm */
  response_format?: 'mp3' | 'opus' | 'aac' | 'flac' | 'wav' | 'pcm';
  /** Speed 0.25–4.0 (default 1.0) */
  speed?: number;
}

export interface AsyncSpeechRequest {
  /** Model: speech-2.8-hd, speech-2.8-turbo, etc. (MiniMax) */
  model: string;
  /** Text to convert to speech (max 50,000 characters) */
  input: string;
  /** Voice ID */
  voice?: string;
  /** Speech speed (0.5 - 2.0) */
  speed?: number;
  /** Audio format: mp3, pcm, flac */
  response_format?: 'mp3' | 'pcm' | 'flac';
  /** Sample rate */
  sample_rate?: number;
  /** Bitrate for mp3 */
  bitrate?: number;
  /** Language boost: auto, English, Chinese, etc. */
  language_boost?: string;
  /** Emotion: happy, sad, angry, calm, etc. */
  emotion?: string;
  /** Pronunciation dictionary */
  pronunciation_dict?: string[];
  /** Voice pitch modification (-100 to 100) */
  voice_pitch?: number;
  /** Voice intensity modification (-100 to 100) */
  voice_intensity?: number;
  /** Sound effects: spacious_echo, auditorium_echo, lofi_telephone, robotic */
  sound_effects?: string;
}

export interface AsyncSpeechResponse {
  id: string;
  object: 'audio.speech.async';
  task_id: string;
  file_id: number;
  status: 'processing' | 'completed' | 'failed';
  usage_characters: number;
  created_at: number;
}

export interface AsyncSpeechStatusResponse {
  id: string;
  object: 'audio.speech.async.status';
  task_id: string;
  status: 'Pending' | 'Running' | 'Success' | 'Failed';
  download_url?: string;
  file_id?: number;
  error?: string;
}

// --- STT (Speech-to-Text) ---

export interface TranscriptionRequest {
  /** Audio file to transcribe */
  file: Blob | File;
  /** Model: whisper-1 */
  model: string;
  /** Language of the audio (ISO-639-1) */
  language?: string;
  /** Prompt to guide the model */
  prompt?: string;
  /** Response format: json, text, srt, verbose_json, vtt */
  response_format?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
  /** Temperature for sampling */
  temperature?: number;
}

export interface TranscriptionResponse {
  text: string;
  task?: string;
  language?: string;
  duration?: number;
  segments?: Array<{
    id: number;
    start: number;
    end: number;
    text: string;
  }>;
}

// --- Voice Clone ---

export interface VoiceCloneUploadResponse {
  id: string;
  object: 'audio.voice_clone.upload';
  file_id: number;
  bytes: number;
  filename: string;
  purpose: 'voice_clone';
  latency_ms: number;
}

export interface CloneVoiceRequest {
  /** File ID of audio to clone (from upload endpoint) */
  file_id: number;
  /** Custom voice ID (8-256 chars, starts with letter) */
  voice_id: string;
  /** Optional prompt audio file ID for better similarity */
  prompt_audio_id?: number;
  /** Optional transcript of prompt audio */
  prompt_text?: string;
  /** Optional preview text (up to 1000 chars) */
  preview_text?: string;
  /** Model for preview (required if preview_text is provided) */
  model?: string;
  /** Language boost */
  language_boost?: string;
  /** Enable noise reduction */
  noise_reduction?: boolean;
  /** Enable volume normalization */
  volume_normalization?: boolean;
}

export interface CloneVoiceResponse {
  id: string;
  object: 'audio.voice_clone';
  voice_id: string;
  demo_audio_url?: string;
  latency_ms: number;
}

// --- Voice Design ---

export interface DesignVoiceRequest {
  /** Natural-language description of the desired voice */
  prompt: string;
  /** Text to synthesize as a preview (max 500 chars) */
  preview_text: string;
  /** Optional custom voice_id; auto-generated if omitted */
  voice_id?: string;
}

export interface DesignVoiceResponse {
  id: string;
  object: 'audio.voice_design';
  voice_id: string;
  /** Hex-encoded preview audio bytes */
  trial_audio?: string;
  latency_ms: number;
}

// --- Prompt Audio ---

export interface PromptAudioUploadResponse {
  id: string;
  object: 'audio.prompt_audio.upload';
  file_id: number;
  bytes: number;
  filename: string;
  purpose: 'prompt_audio';
  latency_ms: number;
}

// --- Voice Management ---

/** Voice type for filtering */
export type VoiceType = 'system' | 'voice_cloning' | 'voice_generation' | 'all';

/** Request for listing voices */
export interface GetVoicesRequest {
  /** Voice type filter: "system", "voice_cloning", "voice_generation", or "all" */
  voice_type?: VoiceType;
}

/** System voice information */
export interface SystemVoice {
  id: string;
  object: 'voice';
  name?: string;
  description: string[];
  created_at?: string;
  type: 'system';
}

/** Cloned voice information */
export interface ClonedVoice {
  id: string;
  object: 'voice';
  description: string[];
  created_at?: string;
  type: 'voice_cloning';
}

/** Generated voice information */
export interface GeneratedVoice {
  id: string;
  object: 'voice';
  description: string[];
  created_at?: string;
  type: 'voice_generation';
}

/** Voices data container */
export interface VoicesData {
  system_voices: SystemVoice[];
  cloned_voices: ClonedVoice[];
  generated_voices: GeneratedVoice[];
}

/** Response for listing voices */
export interface GetVoicesResponse {
  object: 'list';
  data: VoicesData;
  latency_ms: number;
}

// ============================================================================
// Audio API
// ============================================================================

/**
 * Audio API
 * Text-to-speech, speech-to-text, voice cloning, and voice design
 */
export class AudioAPI {
  constructor(private readonly client: HttpClient) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Text-to-Speech (TTS)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Create speech from text (synchronous)
   * Returns raw audio bytes
   * 
   * @example
   * ```typescript
   * const audioBuffer = await mql.audio.speech({
   *   model: 'tts-1',
   *   input: 'Hello, world!',
   *   voice: 'alloy',
   * });
   * // Save to file or play
   * ```
   */
  async speech(request: SpeechRequest): Promise<ArrayBuffer> {
    return this.client.postBinary('/v1/audio/speech', request);
  }

  /**
   * Create async speech task for long text (up to 50,000 characters)
   * Returns a task ID to poll for completion
   * 
   * @example
   * ```typescript
   * const task = await mql.audio.speechAsync({
   *   model: 'speech-2.8-hd',
   *   input: longText,
   *   voice: 'English_expressive_narrator',
   * });
   * console.log('Task ID:', task.task_id);
   * ```
   */
  async speechAsync(request: AsyncSpeechRequest): Promise<AsyncSpeechResponse> {
    return this.client.post<AsyncSpeechResponse>('/v1/audio/speech/async', request);
  }

  /**
   * Get status of an async speech task
   * 
   * @example
   * ```typescript
   * const status = await mql.audio.speechAsyncStatus('task_123');
   * if (status.status === 'Success') {
   *   console.log('Download URL:', status.download_url);
   * }
   * ```
   */
  async speechAsyncStatus(taskId: string, includeDownloadUrl = true): Promise<AsyncSpeechStatusResponse> {
    const params = new URLSearchParams();
    if (includeDownloadUrl) {
      params.set('include_download_url', 'true');
    }
    return this.client.get<AsyncSpeechStatusResponse>(`/v1/audio/speech/async/${taskId}?${params.toString()}`);
  }

  /**
   * Download completed async speech audio
   * Returns raw audio bytes
   * 
   * @example
   * ```typescript
   * const audioBuffer = await mql.audio.speechAsyncDownload('task_123');
   * ```
   */
  async speechAsyncDownload(taskId: string): Promise<ArrayBuffer> {
    return this.client.getBinary(`/v1/audio/speech/async/${taskId}/download`);
  }

  /**
   * Create async speech and wait for completion
   * Convenience method that handles polling
   * 
   * @example
   * ```typescript
   * const audioBuffer = await mql.audio.speechAsyncAndWait({
   *   model: 'speech-2.8-hd',
   *   input: longText,
   *   voice: 'English_expressive_narrator',
   * });
   * ```
   */
  async speechAsyncAndWait(
    request: AsyncSpeechRequest,
    options?: { pollIntervalMs?: number; maxWaitMs?: number }
  ): Promise<ArrayBuffer> {
    const pollInterval = options?.pollIntervalMs ?? 3000;
    const maxWait = options?.maxWaitMs ?? 300000; // 5 minutes default
    const startTime = Date.now();

    const task = await this.speechAsync(request);
    const taskId = task.task_id;

    while (Date.now() - startTime < maxWait) {
      await this.sleep(pollInterval);
      const status = await this.speechAsyncStatus(taskId);

      if (status.status === 'Success') {
        return this.speechAsyncDownload(taskId);
      }

      if (status.status === 'Failed') {
        throw new Error(`Async speech failed: ${status.error || 'Unknown error'}`);
      }
    }

    throw new Error(`Async speech timed out after ${maxWait}ms`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Speech-to-Text (Transcription)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Transcribe audio to text
   * 
   * @example
   * ```typescript
   * const result = await mql.audio.transcribe({
   *   file: audioFile,
   *   model: 'whisper-1',
   * });
   * console.log(result.text);
   * ```
   */
  async transcribe(request: TranscriptionRequest): Promise<TranscriptionResponse> {
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('model', request.model);

    if (request.language) formData.append('language', request.language);
    if (request.prompt) formData.append('prompt', request.prompt);
    if (request.response_format) formData.append('response_format', request.response_format);
    if (request.temperature !== undefined) formData.append('temperature', String(request.temperature));

    return this.client.postFormData<TranscriptionResponse>('/v1/audio/transcriptions', formData);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Voice Cloning
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Upload audio file for voice cloning
   * 
   * Requirements:
   * - Formats: mp3, m4a, wav
   * - Duration: 10 seconds to 5 minutes
   * - Size: Max 20 MB
   * 
   * @example
   * ```typescript
   * const upload = await mql.audio.uploadVoiceClone(audioFile);
   * console.log('File ID:', upload.file_id);
   * ```
   */
  async uploadVoiceClone(file: Blob | File): Promise<VoiceCloneUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.client.postFormData<VoiceCloneUploadResponse>('/v1/audio/voice-clone/upload', formData);
  }

  /**
   * Clone a voice from uploaded audio
   * 
   * @example
   * ```typescript
   * const voice = await mql.audio.cloneVoice({
   *   file_id: 123456789,
   *   voice_id: 'my_custom_voice',
   *   preview_text: 'Hello, this is my cloned voice.',
   *   model: 'speech-2.8-hd',
   * });
   * console.log('Voice ID:', voice.voice_id);
   * ```
   */
  async cloneVoice(request: CloneVoiceRequest): Promise<CloneVoiceResponse> {
    return this.client.post<CloneVoiceResponse>('/v1/audio/voice-clone', request);
  }

  /**
   * Upload and clone voice in one call
   * Convenience method that handles upload + clone
   * 
   * @example
   * ```typescript
   * const voice = await mql.audio.uploadAndCloneVoice(audioFile, 'my_voice', {
   *   preview_text: 'Hello!',
   *   model: 'speech-2.8-hd',
   * });
   * ```
   */
  async uploadAndCloneVoice(
    file: Blob | File,
    voiceId: string,
    options?: Partial<Omit<CloneVoiceRequest, 'file_id' | 'voice_id'>>
  ): Promise<CloneVoiceResponse> {
    const upload = await this.uploadVoiceClone(file);
    return this.cloneVoice({
      file_id: upload.file_id,
      voice_id: voiceId,
      ...options,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Prompt Audio (for voice enhancement)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Upload prompt audio for voice enhancement
   * 
   * Requirements:
   * - Formats: mp3, m4a, wav
   * - Duration: 3 seconds to 30 seconds
   * - Size: Max 5 MB
   * 
   * @example
   * ```typescript
   * const upload = await mql.audio.uploadPromptAudio(audioFile);
   * console.log('File ID:', upload.file_id);
   * ```
   */
  async uploadPromptAudio(file: Blob | File): Promise<PromptAudioUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.client.postFormData<PromptAudioUploadResponse>('/v1/audio/prompt-audio/upload', formData);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Voice Design
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Design a custom voice from a text prompt
   * 
   * Note: Preview audio generation is billed at $30/1M characters
   * 
   * @example
   * ```typescript
   * const voice = await mql.audio.designVoice({
   *   prompt: 'Young female, cheerful and energetic tone, slight British accent',
   *   preview_text: 'Hello! Welcome to our service.',
   * });
   * console.log('Voice ID:', voice.voice_id);
   * // voice.trial_audio contains hex-encoded preview audio
   * ```
   */
  async designVoice(request: DesignVoiceRequest): Promise<DesignVoiceResponse> {
    return this.client.post<DesignVoiceResponse>('/v1/audio/voice-design', request);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Voice Management
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * List available voices by category
   * 
   * Returns system voices, cloned voices, and generated voices.
   * Note: Cloned voices must be used at least once before they appear here.
   * 
   * @example
   * ```typescript
   * // Get all voices
   * const voices = await mql.audio.getVoices();
   * console.log('System voices:', voices.data.system_voices.length);
   * console.log('Cloned voices:', voices.data.cloned_voices.length);
   * 
   * // Get only system voices
   * const systemVoices = await mql.audio.getVoices({ voice_type: 'system' });
   * ```
   */
  async getVoices(request?: GetVoicesRequest): Promise<GetVoicesResponse> {
    return this.client.post<GetVoicesResponse>('/v1/audio/voices', {
      voice_type: request?.voice_type ?? 'all',
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Utilities
  // ─────────────────────────────────────────────────────────────────────────

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
