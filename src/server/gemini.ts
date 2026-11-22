import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import type {
  AspectRatioOption,
  GeneratePostsResponse,
  ImageModelOption,
  ImageSizeOption,
  PlatformId,
  RefinePostResponse,
  ToneOption,
} from '../types/campaign';

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    const err = new Error(
      'Gemini API key is not configured. Please check or select an API key in the Settings > Secrets panel.'
    ) as Error & { statusCode?: number };
    err.statusCode = 403;
    throw err;
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function withRetry<T>(operation: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const errObj = error as { status?: number; statusCode?: number; message?: string };
      const status = errObj?.statusCode ?? errObj?.status;
      const msg = (errObj?.message ?? String(error ?? '')).toLowerCase();
      const isTransient =
        status === 503 ||
        status === 500 ||
        status === 502 ||
        status === 504 ||
        msg.includes('unavailable') ||
        msg.includes('overloaded') ||
        msg.includes('fetch failed') ||
        msg.includes('econnreset');

      if (!isTransient || attempt === maxAttempts) {
        throw error;
      }

      const delayMs = 600 * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

export interface ClassifiedApiError {
  status: number;
  message: string;
}

export function classifyGeminiError(error: unknown, context: 'text' | 'image'): ClassifiedApiError {
  const errObj = error as {
    status?: number;
    statusCode?: number;
    message?: string;
    code?: number | string;
  };
  const rawMessage = errObj?.message ?? String(error ?? 'Unknown Gemini API error');
  const lower = rawMessage.toLowerCase();
  const statusHint = errObj?.statusCode ?? errObj?.status ?? 500;

  if (
    statusHint === 403 ||
    lower.includes('permission_denied') ||
    lower.includes('api_key_invalid') ||
    lower.includes('api key not valid') ||
    lower.includes('not configured')
  ) {
    return {
      status: 403,
      message:
        'Your Gemini API key is missing or does not have permission for this model. Check your key in the Settings > Secrets panel.',
    };
  }

  if (
    statusHint === 429 ||
    lower.includes('resource_exhausted') ||
    lower.includes('quota') ||
    lower.includes('rate limit')
  ) {
    return {
      status: 429,
      message:
        context === 'image'
          ? 'Image generation reached its quota limit (high-resolution studio models require a billing-enabled API key). You can select a paid API key in the Settings > Secrets panel.'
          : 'API quota limit reached. Select a billing-enabled API key in the Settings > Secrets panel or retry in a moment.',
    };
  }

  if (statusHint === 404 || lower.includes('not_found') || lower.includes('is not found')) {
    return {
      status: 404,
      message:
        context === 'image'
          ? 'The selected image model is unavailable for this API key. Try switching between Gemini 3 Pro Image and Nano Banana 2.1, or verify your key in Settings > Secrets.'
          : 'The requested Gemini model is unavailable for this API key.',
    };
  }

  if (statusHint === 503 || lower.includes('unavailable') || lower.includes('overloaded')) {
    return {
      status: 503,
      message: 'Gemini is temporarily busy. Please try again in a few seconds.',
    };
  }

  return {
    status: typeof statusHint === 'number' && statusHint >= 400 && statusHint < 600 ? statusHint : 500,
    message: rawMessage.length > 260 ? `${rawMessage.slice(0, 260)}...` : rawMessage,
  };
}

const TONE_GUIDES: Record<ToneOption, string> = {
  professional:
    'Authoritative, executive, concrete, and editorial. Use clear structure, credible specifics, and restrained confidence. Avoid hype buzzwords.',
  witty:
    'Sharp, observant, conversational, and lightly irreverent without being cheesy. Lead with a clever hook and crisp cadence.',
  urgent:
    'High-stakes, immediate, direct, and action-oriented. Communicate why timing matters right now with concise sentences and a decisive call to action.',
};

export async function generateCrossPlatformPosts(params: {
  idea: string;
  tone: ToneOption;
  aspectRatios: Record<PlatformId, AspectRatioOption>;
}): Promise<GeneratePostsResponse> {
  const ai = getClient();
  const toneGuide = TONE_GUIDES[params.tone];

  const prompt = `Create a coordinated cross-platform social media campaign from this brief:

Brief: "${params.idea}"
Tone: ${params.tone} (${toneGuide})

Deliver distinct, native-feeling content for each platform:
1. LinkedIn (long-form): 140-220 words with a compelling opening line, clean paragraph breaks, 3 concrete takeaways or story beats, a thoughtful closing question, and 3-5 relevant hashtags.
2. Twitter / X (short & punchy): Strictly UNDER 265 characters total (never exceed 280 characters). Crisp hook + payoff. Do NOT include hashtags unless essential (leave hashtags array empty by default).
3. Instagram (visual-focused): 55-110 words written to complement a striking photograph, with warm sensory framing, a short CTA, and 6-8 curated hashtags.

For EACH platform, also write a tailored imagePrompt (no text/words/watermarks inside the image) optimized for that platform's framing:
- LinkedIn visual (${params.aspectRatios.linkedin}): editorial architectural/documentary scene or grounded industry visual.
- Twitter / X visual (${params.aspectRatios.twitter}): high-contrast, immediately legible single-subject focal frame that reads cleanly on a fast timeline.
- Instagram visual (${params.aspectRatios.instagram}): atmospheric, tactile lifestyle or composition-forward editorial photograph.`;

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction:
          'You are an editorial director at a premier digital publishing studio. Write authentic, publication-grade social copy tailored natively to LinkedIn, X/Twitter, and Instagram. Never use generic AI clichés like "delve", "game-changer", "unlock", or excessive emojis.',
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: 'Concise 3-7 word editorial title for this campaign.',
            },
            linkedin: {
              type: Type.OBJECT,
              properties: {
                headline: { type: Type.STRING },
                body: { type: Type.STRING },
                hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                imagePrompt: { type: Type.STRING },
              },
              required: ['headline', 'body', 'hashtags', 'imagePrompt'],
            },
            twitter: {
              type: Type.OBJECT,
              properties: {
                headline: { type: Type.STRING },
                body: { type: Type.STRING },
                hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                imagePrompt: { type: Type.STRING },
              },
              required: ['headline', 'body', 'hashtags', 'imagePrompt'],
            },
            instagram: {
              type: Type.OBJECT,
              properties: {
                headline: { type: Type.STRING },
                body: { type: Type.STRING },
                hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                imagePrompt: { type: Type.STRING },
              },
              required: ['headline', 'body', 'hashtags', 'imagePrompt'],
            },
          },
          required: ['title', 'linkedin', 'twitter', 'instagram'],
        },
      },
    })
  );

  const text = (response.text ?? '').trim();
  if (!text) {
    throw new Error('Gemini returned an empty response while drafting campaign posts.');
  }

  const parsed = JSON.parse(text) as {
    title: string;
    linkedin: { headline: string; body: string; hashtags: string[]; imagePrompt: string };
    twitter: { headline: string; body: string; hashtags: string[]; imagePrompt: string };
    instagram: { headline: string; body: string; hashtags: string[]; imagePrompt: string };
  };

  return {
    title: parsed.title || 'Untitled Campaign',
    posts: {
      linkedin: parsed.linkedin,
      twitter: parsed.twitter,
      instagram: parsed.instagram,
    },
  };
}

export async function generatePlatformImage(params: {
  prompt: string;
  aspectRatio: AspectRatioOption;
  imageSize: ImageSizeOption;
  model: ImageModelOption;
}): Promise<{ imageUrl: string; model: ImageModelOption }> {
  const ai = getClient();

  const fullPrompt = `${params.prompt.trim()}. Clean editorial photography, refined lighting, natural textures, no embedded text, no watermarks, no UI overlays.`;

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: params.model,
      contents: {
        parts: [{ text: fullPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: params.aspectRatio,
          imageSize: params.imageSize,
        },
      },
    })
  );

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      const mimeType = part.inlineData.mimeType || 'image/png';
      return {
        imageUrl: `data:${mimeType};base64,${part.inlineData.data}`,
        model: params.model,
      };
    }
  }

  throw new Error('The image model completed without returning an image payload. Try refining the visual prompt.');
}

export async function refinePlatformPost(params: {
  platform: PlatformId;
  tone: ToneOption;
  idea: string;
  currentBody: string;
  currentHashtags: string[];
  instruction: string;
  mode: 'quick_edit' | 'analyze';
}): Promise<RefinePostResponse> {
  const ai = getClient();
  const model = params.mode === 'analyze' ? 'gemini-4-hydrogen' : 'gemini-3.1-flash-lite';

  const platformConstraint =
    params.platform === 'twitter'
      ? 'Twitter / X: MUST stay strictly under 265 characters total (never exceed 280 characters). Punchy and concise.'
      : params.platform === 'linkedin'
        ? 'LinkedIn: Long-form editorial structure with crisp paragraphs, concrete value, and 3-5 hashtags.'
        : 'Instagram: Visual-first caption paired with 6-8 cohesive hashtags.';

  const prompt = `Original campaign brief: "${params.idea}"
Platform: ${params.platform} (${platformConstraint})
Target tone: ${params.tone}

Current post copy:
"""
${params.currentBody}
"""
Current hashtags: ${params.currentHashtags.join(' ') || '(none)'}

Requested action: ${params.instruction}

Return the updated headline, body, hashtags, and a concise 1-2 sentence editorial note explaining the improvement or strategic observation.`;

  const config: {
    systemInstruction: string;
    responseMimeType: string;
    responseSchema: Record<string, unknown>;
    thinkingConfig?: { thinkingLevel: ThinkingLevel };
  } = {
    systemInstruction:
      'You are a sharp social media editor. Preserve factual intent from the brief while elevating clarity, voice, and platform fit. Avoid AI buzzwords.',
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        headline: { type: Type.STRING },
        body: { type: Type.STRING },
        hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
        analysisNote: {
          type: Type.STRING,
          description: '1-2 concise sentences of editorial reasoning or content critique.',
        },
      },
      required: ['headline', 'body', 'hashtags', 'analysisNote'],
    },
  };

  if (model === 'gemini-4-hydrogen') {
    config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
  }

  const response = await withRetry(() =>
    ai.models.generateContent({
      model,
      contents: prompt,
      config,
    })
  );

  const text = (response.text ?? '').trim();
  if (!text) {
    throw new Error('Gemini returned an empty response while refining this post.');
  }

  return JSON.parse(text) as RefinePostResponse;
}
