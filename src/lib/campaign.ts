import type {
  AspectRatioOption,
  CampaignDraft,
  ImageModelOption,
  ImageSizeOption,
  PlatformId,
  PlatformPost,
  ToneOption,
} from '../types/campaign';

export const TWITTER_CHAR_LIMIT = 280;
export const LINKEDIN_CHAR_LIMIT = 3000;
export const INSTAGRAM_CHAR_LIMIT = 2200;

export const ALL_PLATFORMS: PlatformId[] = ['linkedin', 'twitter', 'instagram'];

export const ALL_TONES: Array<{
  id: ToneOption;
  label: string;
  summary: string;
}> = [
  {
    id: 'professional',
    label: 'Professional',
    summary: 'Measured authority, clear narrative structure, executive clarity.',
  },
  {
    id: 'witty',
    label: 'Witty',
    summary: 'Sharp observations, playful rhythm, memorable turns of phrase.',
  },
  {
    id: 'urgent',
    label: 'Urgent',
    summary: 'High-stakes framing, crisp pacing, immediate call to action.',
  },
];

export const ALL_IMAGE_SIZES: ImageSizeOption[] = ['1K', '2K', '4K'];

export const ALL_ASPECT_RATIOS: AspectRatioOption[] = [
  '1:1',
  '2:3',
  '3:2',
  '3:4',
  '4:3',
  '9:16',
  '16:9',
  '21:9',
];

export const IMAGE_MODELS: Array<{
  id: ImageModelOption;
  label: string;
  note: string;
}> = [
  {
    id: 'gemini-3-pro-image-preview',
    label: 'Gemini 3 Pro Image',
    note: 'Studio · Web Search',
  },
  {
    id: 'gemini-nano-banana-2.1',
    label: 'Nano Banana 2.1',
    note: 'Fast · Web + Image Search',
  },
];

export const DEFAULT_PLATFORM_RATIOS: Record<PlatformId, AspectRatioOption> = {
  linkedin: '16:9',
  twitter: '3:2',
  instagram: '3:4',
};

export const PLATFORM_SPECS: Record<
  PlatformId,
  {
    name: string;
    shortName: string;
    formatLabel: string;
    optimalRatioLabel: string;
    charLimit: number;
  }
> = {
  linkedin: {
    name: 'LinkedIn',
    shortName: 'LinkedIn',
    formatLabel: 'Long-form editorial',
    optimalRatioLabel: '16:9 landscape',
    charLimit: LINKEDIN_CHAR_LIMIT,
  },
  twitter: {
    name: 'X / Twitter',
    shortName: 'X',
    formatLabel: 'Short & punchy',
    optimalRatioLabel: '3:2 feed card',
    charLimit: TWITTER_CHAR_LIMIT,
  },
  instagram: {
    name: 'Instagram',
    shortName: 'Instagram',
    formatLabel: 'Visual & hashtags',
    optimalRatioLabel: '3:4 portrait',
    charLimit: INSTAGRAM_CHAR_LIMIT,
  },
};

export const ASPECT_RATIO_META: Record<
  AspectRatioOption,
  { label: string; cssRatio: string; width: number; height: number }
> = {
  '1:1': { label: '1:1 Square', cssRatio: '1 / 1', width: 1, height: 1 },
  '2:3': { label: '2:3 Classic Portrait', cssRatio: '2 / 3', width: 2, height: 3 },
  '3:2': { label: '3:2 Editorial Card', cssRatio: '3 / 2', width: 3, height: 2 },
  '3:4': { label: '3:4 Feed Portrait', cssRatio: '3 / 4', width: 3, height: 4 },
  '4:3': { label: '4:3 Classic Landscape', cssRatio: '4 / 3', width: 4, height: 3 },
  '9:16': { label: '9:16 Vertical Story', cssRatio: '9 / 16', width: 9, height: 16 },
  '16:9': { label: '16:9 Widescreen', cssRatio: '16 / 9', width: 16, height: 9 },
  '21:9': { label: '21:9 Ultrawide', cssRatio: '21 / 9', width: 21, height: 9 },
};

export interface BriefValidationResult {
  valid: boolean;
  error: string | null;
}

export function validateBrief(idea: string): BriefValidationResult {
  const trimmed = idea.trim();
  if (!trimmed) {
    return {
      valid: false,
      error: 'Describe your campaign idea before generating posts.',
    };
  }
  if (trimmed.length < 10) {
    return {
      valid: false,
      error: 'Add a bit more context (at least 10 characters) so each platform draft stays specific.',
    };
  }
  if (trimmed.length > 1500) {
    return {
      valid: false,
      error: 'Keep the brief under 1,500 characters for focused cross-platform messaging.',
    };
  }
  return { valid: true, error: null };
}

export function normalizeHashtags(rawTags: string[]): string[] {
  const seen = new Set<string>();
  const cleaned: string[] = [];

  for (const tag of rawTags) {
    const stripped = tag
      .trim()
      .replace(/^#+/, '')
      .replace(/[^a-zA-Z0-9_]/g, '');
    if (!stripped) continue;
    const key = stripped.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push(`#${stripped}`);
  }

  return cleaned;
}

export function parseHashtagInput(input: string): string[] {
  if (!input.trim()) return [];
  const tokens = input.split(/[\s,]+/);
  return normalizeHashtags(tokens);
}

export function formatPostForClipboard(post: PlatformPost): string {
  const body = post.body.trim();
  const hashtags = normalizeHashtags(post.hashtags);
  if (post.platform === 'instagram' && hashtags.length > 0) {
    return `${body}\n\n${hashtags.join(' ')}`;
  }
  if (post.platform === 'linkedin' && hashtags.length > 0) {
    return `${body}\n\n${hashtags.join(' ')}`;
  }
  return body;
}

export function formatCampaignForClipboard(campaign: CampaignDraft): string {
  const sections = ALL_PLATFORMS.map((platform) => {
    const post = campaign.posts[platform];
    const spec = PLATFORM_SPECS[platform];
    return [
      `${spec.name} (${spec.formatLabel} · ${post.aspectRatio} · ${post.imageSize})`,
      formatPostForClipboard(post),
    ].join('\n');
  });

  return `${campaign.title}\nTone: ${campaign.tone}\n\n${sections.join('\n\n---\n\n')}`;
}

export interface PostMetrics {
  charCount: number;
  wordCount: number;
  hashtagCount: number;
  charLimit: number;
  isOverLimit: boolean;
  utilizationPercent: number;
  readingSeconds: number;
}

export function analyzePostMetrics(post: PlatformPost): PostMetrics {
  const fullText = formatPostForClipboard(post);
  const charCount = fullText.length;
  const words = post.body
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const wordCount = words.length;
  const hashtagCount = normalizeHashtags(post.hashtags).length;
  const charLimit = PLATFORM_SPECS[post.platform].charLimit;
  const isOverLimit = charCount > charLimit;
  const utilizationPercent = Math.min(100, Math.round((charCount / charLimit) * 100));
  const readingSeconds = Math.max(3, Math.ceil((wordCount / 220) * 60));

  return {
    charCount,
    wordCount,
    hashtagCount,
    charLimit,
    isOverLimit,
    utilizationPercent,
    readingSeconds,
  };
}

export function isValidAspectRatio(value: string): value is AspectRatioOption {
  return (ALL_ASPECT_RATIOS as string[]).includes(value);
}

export function isValidImageSize(value: string): value is ImageSizeOption {
  return (ALL_IMAGE_SIZES as string[]).includes(value);
}

export function isValidTone(value: string): value is ToneOption {
  return value === 'professional' || value === 'witty' || value === 'urgent';
}

export function isValidImageModel(value: string): value is ImageModelOption {
  return (
    value === 'gemini-3-pro-image-preview' ||
    value === 'gemini-nano-banana-2.1'
  );
}

const MAX_DATA_URL_STORAGE_BYTES = 180_000;

export function serializeCampaignsForStorage(campaigns: CampaignDraft[]): string {
  const sanitized = campaigns.slice(0, 12).map((campaign) => {
    const posts = {} as Record<PlatformId, PlatformPost>;
    for (const platform of ALL_PLATFORMS) {
      const post = campaign.posts[platform];
      const keepImage =
        post.imageUrl !== null &&
        (!post.imageUrl.startsWith('data:') ||
          post.imageUrl.length <= MAX_DATA_URL_STORAGE_BYTES);

      posts[platform] = {
        ...post,
        imageUrl: keepImage ? post.imageUrl : null,
        imageStatus: keepImage && post.imageUrl ? 'ready' : 'idle',
        imageError: undefined,
      };
    }

    return {
      ...campaign,
      posts,
    };
  });

  return JSON.stringify(sanitized);
}

export function deserializeCampaignsFromStorage(raw: string | null): CampaignDraft[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is CampaignDraft => {
        if (!item || typeof item !== 'object') return false;
        if (typeof item.id !== 'string' || typeof item.idea !== 'string') return false;
        if (!item.posts || typeof item.posts !== 'object') return false;
        return ALL_PLATFORMS.every((p) => Boolean(item.posts[p]));
      })
      .map((item) => ({
        ...item,
        useRealTimeData:
          typeof item.useRealTimeData === 'boolean' ? item.useRealTimeData : true,
      }));
  } catch {
    return [];
  }
}

export function dedupeGroundingSources(
  raw: Array<{ title?: string; uri?: string }>
): Array<{ title: string; uri: string }> {
  const seen = new Set<string>();
  const result: Array<{ title: string; uri: string }> = [];

  for (const item of raw) {
    const uri = item.uri?.trim();
    if (!uri || !/^https?:\/\//i.test(uri)) continue;
    if (seen.has(uri)) continue;
    seen.add(uri);
    const title = item.title?.trim() || extractSourceHostname(uri);
    result.push({ title, uri });
  }

  return result;
}

export function extractSourceHostname(uri: string): string {
  try {
    const host = new URL(uri).hostname;
    return host.replace(/^www\./i, '');
  } catch {
    return uri;
  }
}

export function formatRelativeTimestamp(isoDate: string, nowMs = Date.now()): string {
  const parsed = Date.parse(isoDate);
  if (Number.isNaN(parsed)) return 'Just now';
  const diffSec = Math.max(0, Math.floor((nowMs - parsed) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}
