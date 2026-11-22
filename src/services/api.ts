import type {
  AspectRatioOption,
  GeneratePostsResponse,
  GroundingSource,
  ImageModelOption,
  ImageSizeOption,
  PlatformId,
  RefinePostResponse,
  ToneOption,
} from '../types/campaign';

export class ApiClientError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
  }
}

async function postJson<T>(url: string, payload: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      (data &&
      typeof data === 'object' &&
      'error' in data &&
      typeof (data as { error: unknown }).error === 'string'
        ? (data as { error: string }).error
        : null) || `Request failed with status ${response.status}.`;
    throw new ApiClientError(message, response.status);
  }

  return data as T;
}

export function requestGeneratePosts(params: {
  idea: string;
  tone: ToneOption;
  aspectRatios: Record<PlatformId, AspectRatioOption>;
  useRealTimeData: boolean;
}): Promise<GeneratePostsResponse> {
  return postJson<GeneratePostsResponse>('/api/generate-posts', params);
}

export function requestGenerateImage(params: {
  prompt: string;
  aspectRatio: AspectRatioOption;
  imageSize: ImageSizeOption;
  model: ImageModelOption;
  useRealTimeVisuals: boolean;
}): Promise<{
  imageUrl: string;
  model: ImageModelOption;
  aspectRatio: AspectRatioOption;
  imageSize: ImageSizeOption;
  visualSources: GroundingSource[];
  usedRealTimeVisuals: boolean;
}> {
  return postJson('/api/generate-image', params);
}

export function requestRefinePost(params: {
  platform: PlatformId;
  tone: ToneOption;
  idea: string;
  currentBody: string;
  currentHashtags: string[];
  instruction: string;
  mode: 'quick_edit' | 'analyze' | 'ground';
}): Promise<RefinePostResponse> {
  return postJson<RefinePostResponse>('/api/refine-post', params);
}
