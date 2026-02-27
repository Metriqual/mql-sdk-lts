import { HttpClient } from '../client';

// ============================================================================
// Types
// ============================================================================

export interface VideoGenerationRequest {
  /** Model: "sora-1.0-turbo", "sora", "MiniMax-Hailuo-2.3", etc. */
  model: string;
  /** The text prompt describing the video to generate */
  prompt: string;
  /** Duration in seconds (optional, defaults vary by model) */
  duration?: number;
  /** Video resolution: "1080p", "720p", "480p" (optional) */
  resolution?: '1080p' | '720p' | '480p' | string;
  /** Aspect ratio: "16:9", "9:16", "1:1" (optional) */
  aspect_ratio?: '16:9' | '9:16' | '1:1' | string;
  /** Number of videos to generate (optional, default 1) */
  n?: number;
}

export interface VideoGenerationResponse {
  /** Unique ID for the video generation job (e.g., "video_abc123") */
  id: string;
  /** Object type ("video") */
  object: string;
  /** Creation timestamp (Unix epoch) */
  created_at: number;
  /** Status: "queued", "in_progress", "completed", "failed" */
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
  /** Model used */
  model: string;
  /** Download URL (populated when status=completed) */
  download_url?: string;
  /** Progress percentage (0-100) */
  progress?: number;
  /** Original prompt */
  prompt?: string;
  /** Video size (e.g., "1280x720") */
  size?: string;
  /** Duration in seconds */
  seconds?: number | string;
  /** Number of variants */
  n_variants?: number;
  /** Resolution (populated when completed) */
  resolution?: string;
  /** Error info (populated when status=failed) */
  error?: VideoError;
}

export interface VideoError {
  code?: string;
  message: string;
}

// MiniMax Video Query/Download Types
export interface VideoTaskStatusResponse {
  /** Unique ID for the response */
  id: string;
  /** Object type */
  object: string;
  /** MiniMax task ID */
  task_id: string;
  /** Task status: "Preparing", "Queueing", "Processing", "Success", "Fail" */
  status: 'Preparing' | 'Queueing' | 'Processing' | 'Success' | 'Fail';
  /** File ID (available when status is "Success") */
  file_id?: string;
  /** Video width in pixels (available when status is "Success") */
  video_width?: number;
  /** Video height in pixels (available when status is "Success") */
  video_height?: number;
  /** Download URL (if include_download_url=true was set) */
  download_url?: string;
  /** Error message (if status is "Fail") */
  error?: string;
}

export interface VideoDownloadResponse {
  /** Download URL for the video file (valid for 1 hour) */
  download_url: string;
  /** File ID */
  file_id: string;
  /** Expiry time in seconds */
  expires_in_seconds: number;
}

// ============================================================================
// Video API
// ============================================================================

/**
 * Video API
 * Video generation with OpenAI Sora and MiniMax Hailuo
 */
export class VideoAPI {
  constructor(private readonly client: HttpClient) {}

  /**
   * Create a video generation job
   * 
   * @example
   * ```typescript
   * const job = await mql.video.create({
   *   model: 'sora-1.0-turbo',
   *   prompt: 'A serene lake at sunset with mountains in the background',
   *   duration: 10,
   *   aspect_ratio: '16:9',
   * });
   * console.log('Job ID:', job.id);
   * ```
   */
  async create(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    return this.client.post<VideoGenerationResponse>('/v1/videos/generations', request);
  }

  /**
   * Get the status of a video generation job
   * 
   * @example
   * ```typescript
   * const status = await mql.video.getStatus('video_abc123');
   * console.log('Status:', status.status);
   * if (status.status === 'completed') {
   *   console.log('Download URL:', status.download_url);
   * }
   * ```
   */
  async getStatus(videoId: string): Promise<VideoGenerationResponse> {
    return this.client.get<VideoGenerationResponse>(`/v1/videos/generations/${videoId}`);
  }

  /**
   * Download video content
   * Returns raw video bytes
   * 
   * @example
   * ```typescript
   * const videoBuffer = await mql.video.download('video_abc123');
   * // Save to file
   * ```
   */
  async download(videoId: string): Promise<ArrayBuffer> {
    return this.client.getBinary(`/v1/videos/${videoId}/content`);
  }

  /**
   * Create a video and wait for completion
   * Convenience method that handles polling
   * 
   * @example
   * ```typescript
   * const video = await mql.video.createAndWait({
   *   model: 'sora-1.0-turbo',
   *   prompt: 'A cat playing piano',
   * });
   * console.log('Download URL:', video.download_url);
   * ```
   */
  async createAndWait(
    request: VideoGenerationRequest,
    options?: { pollIntervalMs?: number; maxWaitMs?: number }
  ): Promise<VideoGenerationResponse> {
    const pollInterval = options?.pollIntervalMs ?? 5000;
    const maxWait = options?.maxWaitMs ?? 600000; // 10 minutes default
    const startTime = Date.now();

    const job = await this.create(request);
    const videoId = job.id;

    while (Date.now() - startTime < maxWait) {
      await this.sleep(pollInterval);
      const status = await this.getStatus(videoId);

      if (status.status === 'completed') {
        return status;
      }

      if (status.status === 'failed') {
        throw new Error(`Video generation failed: ${status.error?.message || 'Unknown error'}`);
      }
    }

    throw new Error(`Video generation timed out after ${maxWait}ms`);
  }

  /**
   * Create a video, wait for completion, and download
   * 
   * @example
   * ```typescript
   * const videoBuffer = await mql.video.createAndDownload({
   *   model: 'sora-1.0-turbo',
   *   prompt: 'A sunrise over the ocean',
   * });
   * ```
   */
  async createAndDownload(
    request: VideoGenerationRequest,
    options?: { pollIntervalMs?: number; maxWaitMs?: number }
  ): Promise<ArrayBuffer> {
    const video = await this.createAndWait(request, options);
    return this.download(video.id);
  }

  // ============================================================================
  // MiniMax Video Query & Download
  // ============================================================================

  /**
   * Query MiniMax video generation task status
   * Use the task_id returned from MiniMax video generation to check progress
   * 
   * @param taskId - The MiniMax task ID (e.g., "176843862716480")
   * @param includeDownloadUrl - If true, includes download URL when task is complete
   * 
   * @example
   * ```typescript
   * const status = await mql.video.queryVideoStatus('176843862716480', true);
   * console.log('Status:', status.status);
   * 
   * if (status.status === 'Success') {
   *   console.log('Download URL:', status.download_url);
   *   console.log('Video dimensions:', status.video_width, 'x', status.video_height);
   * }
   * ```
   */
  async queryVideoStatus(
    taskId: string,
    includeDownloadUrl: boolean = false
  ): Promise<VideoTaskStatusResponse> {
    const params = new URLSearchParams();
    if (includeDownloadUrl) {
      params.append('include_download_url', 'true');
    }
    
    const url = `/v1/videos/query/${taskId}${params.toString() ? '?' + params.toString() : ''}`;
    return this.client.get<VideoTaskStatusResponse>(url);
  }

  /**
   * Download MiniMax generated video by file_id
   * Returns a download URL that expires in 1 hour
   * 
   * @param fileId - The MiniMax file ID (e.g., "176844028768320")
   * 
   * @example
   * ```typescript
   * const download = await mql.video.downloadVideo('176844028768320');
   * console.log('Download URL:', download.download_url);
   * console.log('Expires in:', download.expires_in_seconds, 'seconds');
   * 
   * // Use the URL to download the actual video file
   * const response = await fetch(download.download_url);
   * const videoBuffer = await response.arrayBuffer();
   * ```
   */
  async downloadVideo(fileId: string): Promise<VideoDownloadResponse> {
    return this.client.get<VideoDownloadResponse>(`/v1/videos/download/${fileId}`);
  }

  /**
   * Query video status and wait for completion (MiniMax)
   * Polls the task status until it reaches "Success" or "Fail"
   * 
   * @param taskId - The MiniMax task ID
   * @param options - Polling options
   * 
   * @example
   * ```typescript
   * const video = await mql.video.queryAndWait('176843862716480');
   * console.log('Video completed!');
   * console.log('Download URL:', video.download_url);
   * ```
   */
  async queryAndWait(
    taskId: string,
    options?: { pollIntervalMs?: number; maxWaitMs?: number }
  ): Promise<VideoTaskStatusResponse> {
    const pollInterval = options?.pollIntervalMs ?? 5000;
    const maxWait = options?.maxWaitMs ?? 600000; // 10 minutes default
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      const status = await this.queryVideoStatus(taskId, true);

      if (status.status === 'Success') {
        return status;
      }

      if (status.status === 'Fail') {
        throw new Error(`Video generation failed: ${status.error || 'Unknown error'}`);
      }

      // Still processing, wait and retry
      await this.sleep(pollInterval);
    }

    throw new Error(`Video generation timed out after ${maxWait}ms`);
  }

  /**
   * Query video status, wait for completion, and get download URL (MiniMax)
   * Convenience method that combines queryAndWait and downloadVideo
   * 
   * @param taskId - The MiniMax task ID
   * @param options - Polling options
   * 
   * @example
   * ```typescript
   * const download = await mql.video.queryAndDownload('176843862716480');
   * console.log('Download URL:', download.download_url);
   * 
   * // Fetch the actual video file
   * const response = await fetch(download.download_url);
   * const videoBuffer = await response.arrayBuffer();
   * fs.writeFileSync('video.mp4', Buffer.from(videoBuffer));
   * ```
   */
  async queryAndDownload(
    taskId: string,
    options?: { pollIntervalMs?: number; maxWaitMs?: number }
  ): Promise<VideoDownloadResponse> {
    const status = await this.queryAndWait(taskId, options);
    
    if (!status.file_id) {
      throw new Error('No file_id available for completed video');
    }

    return this.downloadVideo(status.file_id);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
