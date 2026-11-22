import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Image as ImageIcon,
  Loader2,
  Maximize2,
  RefreshCw,
  Send,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  ALL_ASPECT_RATIOS,
  ASPECT_RATIO_META,
  PLATFORM_SPECS,
  analyzePostMetrics,
  formatPostForClipboard,
  parseHashtagInput,
} from '../lib/campaign';
import type { AspectRatioOption, PlatformPost } from '../types/campaign';

interface PlatformCardProps {
  post: PlatformPost;
  isFocused: boolean;
  isGeneratingPost: boolean;
  isRefining: boolean;
  onUpdateBody: (body: string) => void;
  onUpdateHashtags: (hashtags: string[]) => void;
  onUpdateImagePrompt: (prompt: string) => void;
  onChangeAspectRatio: (ratio: AspectRatioOption) => void;
  onRegenerateImage: () => void;
  onRefinePost: (instruction: string, mode: 'quick_edit' | 'analyze') => void;
  onDismissAnalysis: () => void;
  onFocusPlatform?: () => void;
}

const QUICK_REFINEMENTS = [
  {
    id: 'tighten',
    label: 'Tighten',
    instruction: 'Tighten the copy by ~20% for sharper rhythm while preserving the core message.',
    mode: 'quick_edit' as const,
  },
  {
    id: 'hook',
    label: 'Sharper Hook',
    instruction: 'Rewrite the opening line to hook readers immediately without clickbait.',
    mode: 'quick_edit' as const,
  },
  {
    id: 'analyze',
    label: 'Critique & Polish',
    instruction: 'Critique this draft for platform fit, clarity, and audience resonance, then provide a refined version.',
    mode: 'analyze' as const,
  },
];

export function PlatformCard({
  post,
  isFocused,
  isGeneratingPost,
  isRefining,
  onUpdateBody,
  onUpdateHashtags,
  onUpdateImagePrompt,
  onChangeAspectRatio,
  onRegenerateImage,
  onRefinePost,
  onDismissAnalysis,
  onFocusPlatform,
}: PlatformCardProps) {
  const [copied, setCopied] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [customInstruction, setCustomInstruction] = useState('');
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [hashtagText, setHashtagText] = useState(post.hashtags.join(' '));

  useEffect(() => {
    setImageLoadFailed(false);
  }, [post.imageUrl]);

  useEffect(() => {
    setHashtagText(post.hashtags.join(' '));
  }, [post.hashtags]);

  const spec = PLATFORM_SPECS[post.platform];
  const metrics = analyzePostMetrics(post);
  const ratioMeta = ASPECT_RATIO_META[post.aspectRatio];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatPostForClipboard(post));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API may be unavailable in restricted contexts
    }
  };

  const handleDownloadImage = () => {
    if (!post.imageUrl) return;
    const link = document.createElement('a');
    link.href = post.imageUrl;
    const safeRatio = post.aspectRatio.replace(':', 'x');
    link.download = `cadence-${post.platform}-${safeRatio}-${post.imageSize}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCustomRefineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customInstruction.trim();
    if (!trimmed || isRefining) return;
    onRefinePost(trimmed, 'quick_edit');
    setCustomInstruction('');
  };

  const visualSection = (
    <div className="space-y-3">
      {/* Aspect-Ratio Matched Visual Stage */}
      <div className="bg-slate-100/90 rounded-lg overflow-hidden flex items-center justify-center p-2 sm:p-3">
        <div
          style={{ aspectRatio: ratioMeta.cssRatio }}
          className={`relative w-full overflow-hidden rounded-md bg-slate-200/70 ${
            isFocused ? 'max-h-[540px]' : 'max-h-[320px]'
          } mx-auto`}
        >
          {post.imageStatus === 'loading' || isGeneratingPost ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-100 animate-pulse p-4 text-center">
              <Loader2 className="w-5 h-5 text-blue-700 animate-spin" aria-hidden="true" />
              <span className="font-mono text-[11px] tabular-nums text-slate-600">
                Rendering {post.aspectRatio} · {post.imageSize}
              </span>
            </div>
          ) : post.imageUrl && !imageLoadFailed ? (
            <img
              src={post.imageUrl}
              alt={`${spec.name} campaign visual (${post.aspectRatio})`}
              referrerPolicy="no-referrer"
              onError={() => setImageLoadFailed(true)}
              className="w-full h-full object-cover block"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-5 text-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200/60">
              <ImageIcon className="w-6 h-6 text-slate-400 mb-2" aria-hidden="true" />
              <p className="text-xs font-medium text-slate-700">
                {post.imageStatus === 'error'
                  ? 'Visual could not be generated'
                  : 'Visual ready to render'}
              </p>
              <p className="mt-1 font-mono text-[11px] tabular-nums text-slate-500">
                {ratioMeta.label} · {post.imageSize}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Inline image error if upstream API failed */}
      {post.imageStatus === 'error' && post.imageError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50/70 px-3 py-2.5 text-xs text-red-800 flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1 flex-1">
            <p className="leading-relaxed">{post.imageError}</p>
            <button
              type="button"
              onClick={onRegenerateImage}
              className="font-semibold text-red-700 hover:text-red-900 underline underline-offset-2 cursor-pointer"
            >
              Retry visual
            </button>
          </div>
        </div>
      )}

      {/* Clean Single-Row Visual Control Strip */}
      <div className="flex items-center justify-between gap-1.5 text-xs">
        <div className="flex items-center gap-1.5 shrink-0">
          <label
            htmlFor={`card-ratio-${post.platform}`}
            className="sr-only"
          >
            {spec.name} aspect ratio
          </label>
          <select
            id={`card-ratio-${post.platform}`}
            value={post.aspectRatio}
            onChange={(e) =>
              onChangeAspectRatio(e.target.value as AspectRatioOption)
            }
            className="rounded-md border border-slate-200 bg-white px-1.5 py-1 font-mono text-[11px] tabular-nums text-slate-700 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20"
          >
            {ALL_ASPECT_RATIOS.map((ratio) => (
              <option key={ratio} value={ratio}>
                {ratio}
              </option>
            ))}
          </select>
          <span className="font-mono text-[11px] tabular-nums text-slate-400">
            {post.imageSize}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            aria-expanded={promptOpen}
            onClick={() => setPromptOpen((prev) => !prev)}
            className="inline-flex items-center gap-0.5 px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-950 rounded-md hover:bg-slate-100 transition-colors whitespace-nowrap cursor-pointer"
          >
            Prompt
            {promptOpen ? (
              <ChevronUp className="w-3 h-3" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-3 h-3" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={onRegenerateImage}
            disabled={post.imageStatus === 'loading' || isGeneratingPost}
            aria-label={`Regenerate ${spec.name} visual`}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-700 hover:text-slate-950 border border-slate-200 hover:border-slate-300 bg-white rounded-md transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
          >
            <RefreshCw
              className={`w-3 h-3 ${post.imageStatus === 'loading' ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            Render
          </button>

          {post.imageUrl && !imageLoadFailed && (
            <button
              type="button"
              onClick={handleDownloadImage}
              aria-label={`Download ${spec.name} image`}
              className="p-1.5 text-slate-600 hover:text-slate-950 border border-slate-200 hover:border-slate-300 bg-white rounded-md transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Art Direction Prompt Editor */}
      {promptOpen && (
        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          <label
            htmlFor={`image-prompt-${post.platform}`}
            className="block text-[11px] font-medium text-slate-600"
          >
            Visual art-direction prompt (edit and click Render)
          </label>
          <textarea
            id={`image-prompt-${post.platform}`}
            rows={3}
            value={post.imagePrompt}
            onChange={(e) => onUpdateImagePrompt(e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-800 leading-relaxed focus:bg-white focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20"
          />
        </div>
      )}
    </div>
  );

  const copySection = (
    <div className="flex flex-col flex-1 space-y-4">
      {isGeneratingPost ? (
        <div className="space-y-3 py-2 animate-pulse" aria-busy="true">
          <div className="h-4 w-3/4 bg-slate-200 rounded" />
          <div className="h-3 w-full bg-slate-100 rounded" />
          <div className="h-3 w-11/12 bg-slate-100 rounded" />
          <div className="h-3 w-5/6 bg-slate-100 rounded" />
          <div className="h-3 w-2/3 bg-slate-100 rounded" />
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            <label
              htmlFor={`post-body-${post.platform}`}
              className="sr-only"
            >
              {spec.name} post copy
            </label>
            <textarea
              id={`post-body-${post.platform}`}
              rows={
                isFocused
                  ? post.platform === 'linkedin'
                    ? 15
                    : 8
                  : post.platform === 'linkedin'
                    ? 11
                    : post.platform === 'twitter'
                      ? 6
                      : 8
              }
              value={post.body}
              onChange={(e) => onUpdateBody(e.target.value)}
              className="w-full rounded-lg border border-slate-200/70 hover:border-slate-300 focus:border-blue-700 bg-slate-50/40 focus:bg-white px-3 py-2.5 text-[13.5px] text-slate-800 leading-relaxed resize-y transition-colors focus:outline-none focus:ring-2 focus:ring-blue-700/15"
            />
          </div>

          {/* X / Twitter character meter */}
          {post.platform === 'twitter' && (
            <div className="space-y-1">
              <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-150 ${
                    metrics.isOverLimit
                      ? 'bg-red-600'
                      : metrics.utilizationPercent > 85
                        ? 'bg-amber-600'
                        : 'bg-blue-700'
                  }`}
                  style={{ width: `${metrics.utilizationPercent}%` }}
                />
              </div>
              {metrics.isOverLimit && (
                <p className="text-xs font-medium text-red-600">
                  Exceeds 280-character X limit by {metrics.charCount - metrics.charLimit} characters.
                </p>
              )}
            </div>
          )}

          {/* Hashtags Editor (primary for Instagram, optional for LinkedIn) */}
          {(post.platform === 'instagram' || post.platform === 'linkedin') && (
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label
                  htmlFor={`hashtags-${post.platform}`}
                  className="text-[11px] font-medium text-slate-500"
                >
                  Hashtags
                </label>
                <span className="font-mono text-[11px] tabular-nums text-slate-400">
                  {metrics.hashtagCount} tags
                </span>
              </div>
              <input
                id={`hashtags-${post.platform}`}
                type="text"
                value={hashtagText}
                onChange={(e) => {
                  setHashtagText(e.target.value);
                  onUpdateHashtags(parseHashtagInput(e.target.value));
                }}
                placeholder="#Design #Launch #Editorial"
                className="w-full rounded-md border border-slate-200 bg-slate-50/70 focus:bg-white px-2.5 py-1.5 text-xs font-medium text-blue-800 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20"
              />
            </div>
          )}

          {/* Gemini Editorial Note (when analyzed or refined) */}
          {post.analysisNote && (
            <div className="rounded-lg bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs text-slate-700 flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-900">Editorial note</span>
                <p className="leading-relaxed">{post.analysisNote}</p>
              </div>
              <button
                type="button"
                onClick={onDismissAnalysis}
                aria-label={`Dismiss editorial note for ${spec.name}`}
                className="p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Gemini Content Intelligence & Copy Footer */}
      <div className="mt-auto pt-3 border-t border-slate-100 space-y-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {QUICK_REFINEMENTS.map((action) => (
            <button
              key={action.id}
              type="button"
              disabled={isRefining || isGeneratingPost}
              onClick={() => onRefinePost(action.instruction, action.mode)}
              className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-950 bg-slate-100/80 hover:bg-slate-200/70 rounded-md transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer disabled:cursor-not-allowed"
            >
              {action.label}
            </button>
          ))}
          {isRefining && (
            <span className="inline-flex items-center gap-1 text-xs text-blue-700 ml-1">
              <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
              Refining...
            </span>
          )}
        </div>

        <form onSubmit={handleCustomRefineSubmit} className="flex items-center gap-1.5">
          <label htmlFor={`refine-input-${post.platform}`} className="sr-only">
            Custom edit instruction for {spec.name}
          </label>
          <input
            id={`refine-input-${post.platform}`}
            type="text"
            value={customInstruction}
            onChange={(e) => setCustomInstruction(e.target.value)}
            disabled={isRefining || isGeneratingPost}
            placeholder="Ask Gemini to edit this draft..."
            className="flex-1 min-w-0 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20"
          />
          <button
            type="submit"
            disabled={!customInstruction.trim() || isRefining || isGeneratingPost}
            aria-label={`Apply custom edit to ${spec.name}`}
            className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-700 hover:text-blue-700 hover:border-blue-300 disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </form>

        <div className="flex items-center justify-between pt-1">
          <div className="text-[11px] text-slate-500 font-mono tabular-nums flex items-center gap-1.5">
            <span>{metrics.wordCount} words</span>
            <span aria-hidden="true">·</span>
            <span>~{metrics.readingSeconds}s read</span>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            disabled={isGeneratingPost}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                Copy Post
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <article
      data-testid={`platform-card-${post.platform}`}
      className="bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden"
    >
      {/* Card Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-base font-semibold text-slate-950 truncate">
            {spec.name}
          </h2>
          <p className="text-xs text-slate-500 flex items-center gap-1.5 truncate">
            <span>{spec.formatLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-[11px] tabular-nums">
              {post.aspectRatio}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`font-mono text-xs tabular-nums ${
              metrics.isOverLimit
                ? 'text-red-600 font-semibold'
                : 'text-slate-500'
            }`}
          >
            {metrics.charCount} / {metrics.charLimit}
          </span>
          {!isFocused && onFocusPlatform && (
            <button
              type="button"
              onClick={onFocusPlatform}
              aria-label={`Focus ${spec.name} editor`}
              className="p-1.5 text-slate-400 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Card Body: 2-column split when focused, stacked column in 3-up spread */}
      {isFocused ? (
        <div className="p-5 sm:p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-5">{visualSection}</div>
          <div className="xl:col-span-7 flex flex-col h-full">{copySection}</div>
        </div>
      ) : (
        <div className="p-5 flex-1 flex flex-col gap-5">
          {visualSection}
          <div className="border-t border-slate-100 pt-4 flex-1 flex flex-col">
            {copySection}
          </div>
        </div>
      )}
    </article>
  );
}
