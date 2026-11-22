export type PlatformId = 'linkedin' | 'twitter' | 'instagram';

export type ToneOption = 'professional' | 'witty' | 'urgent';

export type ImageSizeOption = '1K' | '2K' | '4K';

export type AspectRatioOption =
  | '1:1'
  | '2:3'
  | '3:2'
  | '3:4'
  | '4:3'
  | '9:16'
  | '16:9'
  | '21:9';

export type ImageModelOption =
  | 'gemini-3-pro-image-preview'
  | 'gemini-nano-banana-2.1';

export type WorkspaceView = 'all' | PlatformId;

export interface PlatformPost {
  platform: PlatformId;
  headline: string;
  body: string;
  hashtags: string[];
  imagePrompt: string;
  aspectRatio: AspectRatioOption;
  imageSize: ImageSizeOption;
  imageModel: ImageModelOption;
  imageUrl: string | null;
  imageStatus: 'idle' | 'loading' | 'ready' | 'error';
  imageError?: string;
  analysisNote?: string;
}

export interface CampaignDraft {
  id: string;
  title: string;
  idea: string;
  tone: ToneOption;
  imageSize: ImageSizeOption;
  imageModel: ImageModelOption;
  createdAt: string;
  isSample?: boolean;
  posts: Record<PlatformId, PlatformPost>;
}

export interface GeneratePostsResponse {
  title: string;
  posts: Record<
    PlatformId,
    {
      headline: string;
      body: string;
      hashtags: string[];
      imagePrompt: string;
    }
  >;
}

export interface RefinePostResponse {
  headline: string;
  body: string;
  hashtags: string[];
  analysisNote?: string;
}
