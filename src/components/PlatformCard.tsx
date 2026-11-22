import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  Maximize2,
  RefreshCw,
  Send,
  X,
  ZoomIn,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { handleLiquidPointerMove } from '../hooks/useLiquidPointer';
import { GlassSegmentedTrack } from './GlassSegmentedTrack';
import {
  ALL_ASPECT_RATIOS,
  ASPECT_RATIO_META,
  PLATFORM_SPECS,
  analyzePostMetrics,
  extractSourceHostname,
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
  onInspectVisual: () => void;
  onRefinePost: (instruction: string, mode: 'quick_edit' | 'analyze' | 'ground') => void;
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
    id: 'ground',
    label: 'Fact-Check Web',
    instruction:
      'Enrich and verify this post using up-to-date live Google Search facts while keeping the exact platform format and tone.',
    mode: 'ground' as const,
  },
  {
    id: 'analyze',
    label: 'Critique',
    instruction:
      'Critique this draft for platform fit, clarity, and audience resonance, then provide a refined version.',
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
  onInspectVisual,
  onRefinePost,
  onDismissAnalysis,
  onFocusPlatform,
}: PlatformCardProps) {
  const [copied, setCopied] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'preview' | 'edit'>(
    isFocused ? 'edit' : 'preview'
  );
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
  const isPortraitRatio = ratioMeta.height > ratioMeta.width;

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
    link.download = `kadrant-${post.platform}-${safeRatio}-${post.imageSize}.png`;
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
      {/* Full-Bleed Aspect-Ratio Visual Stage */}
      <div
        className={`relative overflow-hidden ${
          isFocused
            ? 'rounded-[18px] bg-slate-900/5 ring-1 ring-white/60'
            : isPortraitRatio
              ? 'bg-gradient-to-b from-white/40 via-blue-100/25 to-white/25 border-b liquid-divider py-3 px-4'
              : 'bg-slate-900/[0.04] border-b liquid-divider'
        } ${isPortraitRatio ? 'flex justify-center' : ''}`}
      >
        <div
          style={{ aspectRatio: ratioMeta.cssRatio }}
          className={`relative overflow-hidden bg-slate-200/50 group ${
            isPortraitRatio
              ? isFocused
                ? 'max-h-[540px] w-auto max-w-full rounded-[14px]'
                : 'max-h-[328px] w-auto max-w-full rounded-[14px] shadow-[0_12px_28px_-14px_rgba(15,23,42,0.35)] ring-1 ring-white/75'
              : 'w-full'
          }`}
        >
          {post.imageStatus === 'loading' || isGeneratingPost ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/45 backdrop-blur-sm animate-pulse p-4 text-center">
              <Loader2 className="w-5 h-5 text-blue-700 animate-spin" aria-hidden="true" />
              <span className="font-mono text-[11px] tabular-nums text-slate-700">
                Rendering {post.aspectRatio} · {post.imageSize}
              </span>
            </div>
          ) : post.imageUrl && !imageLoadFailed ? (
            <>
              <img
                src={post.imageUrl}
                alt={`${spec.name} campaign visual (${post.aspectRatio})`}
                referrerPolicy="no-referrer"
                onError={() => setImageLoadFailed(true)}
                className="w-full h-full object-cover block transition-transform duration-300 ease-out group-hover:scale-[1.015]"
              />
              <button
                type="button"
                onClick={onInspectVisual}
                aria-label={`Inspect ${spec.name} visual fullscreen`}
                className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/65 hover:bg-slate-950/85 backdrop-blur-md border border-white/25 text-white text-[11px] font-medium shadow-lg opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <ZoomIn className="w-3.5 h-3.5" aria-hidden="true" />
                Inspect
              </button>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-5 text-center bg-gradient-to-br from-white/70 via-blue-50/40 to-slate-200/50">
              <ImageIcon className="w-6 h-6 text-slate-500 mb-2" aria-hidden="true" />
              <p className="text-xs font-medium text-slate-800">
                {post.imageStatus === 'error'
                  ? 'Visual could not be generated'
                  : 'Visual ready to render'}
              </p>
              <p className="mt-1 font-mono text-[11px] tabular-nums text-slate-600">
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
          className={`${
            isFocused ? '' : 'mx-5'
          } rounded-[14px] border border-red-300/70 bg-red-50/80 backdrop-blur-sm px-3 py-2.5 text-xs text-red-900 flex items-start gap-2`}
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1 flex-1">
            <p className="leading-relaxed">{post.imageError}</p>
            <button
              type="button"
              onClick={onRegenerateImage}
              className="font-semibold text-red-800 hover:text-red-950 underline underline-offset-2 cursor-pointer"
            >
              Retry visual
            </button>
          </div>
        </div>
      )}

      {/* Clean Single-Row Liquid Glass Visual Control Strip */}
      <div
        className={`${
          isFocused ? '' : 'px-5'
        } flex items-center justify-between gap-1.5 text-xs`}
      >
        <div className="flex items-center gap-1.5 shrink-0">
          <label htmlFor={`card-ratio-${post.platform}`} className="sr-only">
            {spec.name} aspect ratio
          </label>
          <select
            id={`card-ratio-${post.platform}`}
            value={post.aspectRatio}
            onChange={(e) =>
              onChangeAspectRatio(e.target.value as AspectRatioOption)
            }
            className="liquid-glass-well rounded-full px-2.5 py-1 font-mono text-[11px] tabular-nums text-slate-900"
          >
            {ALL_ASPECT_RATIOS.map((ratio) => (
              <option key={ratio} value={ratio}>
                {ratio}
              </option>
            ))}
          </select>
          <span className="font-mono text-[11px] tabular-nums text-slate-500">
            {post.imageSize}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            aria-expanded={promptOpen}
            onClick={() => setPromptOpen((prev) => !prev)}
            className="inline-flex items-center gap-0.5 px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-950 rounded-full hover:bg-white/70 transition-colors whitespace-nowrap cursor-pointer"
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
            onPointerMove={handleLiquidPointerMove}
            disabled={post.imageStatus === 'loading' || isGeneratingPost}
            aria-label={`Regenerate ${spec.name} visual`}
            className="liquid-glass-btn inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-900 rounded-full disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
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
              onPointerMove={handleLiquidPointerMove}
              aria-label={`Download ${spec.name} image`}
              className="liquid-glass-btn p-1.5 text-slate-700 hover:text-slate-950 rounded-full cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Real-time visual grounding references if returned by image search */}
      {post.visualSources && post.visualSources.length > 0 && (
        <div
          className={`${
            isFocused ? '' : 'px-5'
          } text-[11px] text-slate-600 flex flex-wrap items-center gap-x-2.5 gap-y-1`}
        >
          <span className="font-semibold text-slate-700">Visual refs:</span>
          {post.visualSources.slice(0, 3).map((src) => (
            <a
              key={src.uri}
              href={src.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-blue-700 hover:text-blue-900 underline underline-offset-2 decoration-blue-300"
            >
              <ExternalLink className="w-2.5 h-2.5 shrink-0" aria-hidden="true" />
              <span>{extractSourceHostname(src.uri)}</span>
            </a>
          ))}
        </div>
      )}

      {/* Collapsible Art Direction Prompt Editor */}
      {promptOpen && (
        <div className={`${isFocused ? '' : 'px-5'} pt-2 border-t liquid-divider space-y-1.5`}>
          <label
            htmlFor={`image-prompt-${post.platform}`}
            className="block text-[11px] font-medium text-slate-700"
          >
            Visual art-direction prompt (edit and click Render)
          </label>
          <textarea
            id={`image-prompt-${post.platform}`}
            rows={3}
            value={post.imagePrompt}
            onChange={(e) => onUpdateImagePrompt(e.target.value)}
            className="liquid-glass-well w-full rounded-[12px] px-3 py-2 text-xs text-slate-900 leading-relaxed"
          />
        </div>
      )}
    </div>
  );

  const paragraphs = post.body
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const copySection = (
    <div className="flex flex-col flex-1 space-y-4">
      {/* Mode Switcher: Sliding Glass Capsule for Preview vs Edit */}
      <div className="flex items-center justify-between gap-2">
        <GlassSegmentedTrack
          ariaLabel={`${spec.name} view mode`}
          size="sm"
          options={[
            { id: 'preview', label: 'Preview' },
            { id: 'edit', label: 'Edit' },
          ]}
          value={editorMode}
          onChange={setEditorMode}
        />

        <span
          className={`font-mono text-[11px] tabular-nums ${
            metrics.isOverLimit
              ? 'text-red-700 font-semibold'
              : 'text-slate-600'
          }`}
        >
          {metrics.charCount} / {metrics.charLimit}
        </span>
      </div>

      {isGeneratingPost ? (
        <div className="space-y-3 py-2 animate-pulse" aria-busy="true">
          <div className="h-4 w-3/4 bg-slate-300/60 rounded-full" />
          <div className="h-3 w-full bg-slate-200/70 rounded-full" />
          <div className="h-3 w-11/12 bg-slate-200/70 rounded-full" />
          <div className="h-3 w-5/6 bg-slate-200/70 rounded-full" />
          <div className="h-3 w-2/3 bg-slate-200/70 rounded-full" />
        </div>
      ) : editorMode === 'preview' ? (
        <div className="space-y-3.5">
          {post.platform === 'linkedin' && post.headline && (
            <h3 className="font-display text-[15px] font-semibold text-slate-950 leading-snug">
              {post.headline}
            </h3>
          )}

          <div
            className={`space-y-2.5 ${
              post.platform === 'twitter'
                ? 'text-[15px] leading-[1.55] text-slate-950 font-normal'
                : 'text-[13.5px] leading-[1.65] text-slate-900'
            }`}
          >
            {paragraphs.map((para, i) => (
              <p key={i} className="whitespace-pre-line">
                {para}
              </p>
            ))}
          </div>

          {post.platform === 'twitter' && (
            <div className="space-y-1 pt-1">
              <div className="h-1.5 w-full rounded-full liquid-glass-track overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-150 ${
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
                <p className="text-xs font-semibold text-red-700">
                  Exceeds 280-character X limit by {metrics.charCount - metrics.charLimit} characters.
                </p>
              )}
            </div>
          )}

          {(post.platform === 'instagram' || post.platform === 'linkedin') &&
            post.hashtags.length > 0 && (
              <p className="pt-2.5 border-t liquid-divider text-xs font-medium text-blue-800 leading-relaxed">
                {post.hashtags.join(' ')}
              </p>
            )}
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            <label htmlFor={`post-body-${post.platform}`} className="sr-only">
              {spec.name} post copy
            </label>
            <textarea
              id={`post-body-${post.platform}`}
              rows={
                isFocused
                  ? post.platform === 'linkedin'
                    ? 14
                    : 8
                  : post.platform === 'linkedin'
                    ? 11
                    : post.platform === 'twitter'
                      ? 6
                      : 8
              }
              value={post.body}
              onChange={(e) => onUpdateBody(e.target.value)}
              className="liquid-glass-well w-full rounded-[14px] px-3 py-2.5 text-[13.5px] text-slate-950 leading-relaxed resize-y"
            />
          </div>

          {post.platform === 'twitter' && (
            <div className="space-y-1">
              <div className="h-1.5 w-full rounded-full liquid-glass-track overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-150 ${
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
                <p className="text-xs font-semibold text-red-700">
                  Exceeds 280-character X limit by {metrics.charCount - metrics.charLimit} characters.
                </p>
              )}
            </div>
          )}

          {(post.platform === 'instagram' || post.platform === 'linkedin') && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label
                  htmlFor={`hashtags-${post.platform}`}
                  className="text-[11px] font-medium text-slate-600"
                >
                  Hashtags
                </label>
                <span className="font-mono text-[11px] tabular-nums text-slate-500">
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
                className="liquid-glass-well w-full rounded-[12px] px-3 py-1.5 text-xs font-medium text-blue-900 placeholder:text-slate-500"
              />
            </div>
          )}
        </>
      )}

      {/* Gemini Editorial Note (when analyzed or fact-checked) */}
      {post.analysisNote && !isGeneratingPost && (
        <div className="liquid-glass-well rounded-[14px] px-3.5 py-2.5 text-xs text-slate-800 flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <span className="font-semibold text-slate-950">Editorial note</span>
            <p className="leading-relaxed">{post.analysisNote}</p>
          </div>
          <button
            type="button"
            onClick={onDismissAnalysis}
            aria-label={`Dismiss editorial note for ${spec.name}`}
            className="p-0.5 text-slate-500 hover:text-slate-900 cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Gemini Content Intelligence & Copy Footer */}
      <div className="mt-auto pt-3.5 border-t liquid-divider space-y-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {QUICK_REFINEMENTS.map((action) => (
            <button
              key={action.id}
              type="button"
              disabled={isRefining || isGeneratingPost}
              onClick={() => onRefinePost(action.instruction, action.mode)}
              onPointerMove={handleLiquidPointerMove}
              className="liquid-glass-btn px-2.5 py-1 text-[11px] font-medium text-slate-800 hover:text-slate-950 rounded-full disabled:opacity-50 whitespace-nowrap cursor-pointer disabled:cursor-not-allowed"
            >
              {action.label}
            </button>
          ))}
          {isRefining && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 ml-1">
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
            className="liquid-glass-well flex-1 min-w-0 rounded-full px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-500"
          />
          <button
            type="submit"
            disabled={!customInstruction.trim() || isRefining || isGeneratingPost}
            onPointerMove={handleLiquidPointerMove}
            aria-label={`Apply custom edit to ${spec.name}`}
            className="liquid-glass-btn p-2 rounded-full text-slate-800 hover:text-blue-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </form>

        <div className="flex items-center justify-between pt-1">
          <div className="text-[11px] text-slate-600 font-mono tabular-nums flex items-center gap-1.5">
            <span>{metrics.wordCount} words</span>
            <span aria-hidden="true">·</span>
            <span>~{metrics.readingSeconds}s read</span>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            onPointerMove={handleLiquidPointerMove}
            disabled={isGeneratingPost}
            className="liquid-glass-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 rounded-full whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
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
      onPointerMove={handleLiquidPointerMove}
      className="liquid-glass-card rounded-[24px] flex flex-col overflow-hidden"
    >
      {/* Card Header */}
      <div className="relative z-10 px-5 py-3.5 border-b liquid-divider flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-[15px] font-semibold text-slate-950 truncate">
            {spec.name}
          </h2>
          <p className="text-xs text-slate-600 flex items-center gap-1.5 truncate">
            <span>{spec.formatLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-[11px] tabular-nums">
              {post.aspectRatio}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!isFocused && onFocusPlatform && (
            <button
              type="button"
              onClick={onFocusPlatform}
              onPointerMove={handleLiquidPointerMove}
              aria-label={`Focus ${spec.name} editor`}
              className="liquid-glass-btn p-1.5 text-slate-600 hover:text-slate-950 rounded-full cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Card Body: 2-column split when focused, full-bleed editorial column in 3-up spread */}
      {isFocused ? (
        <div className="relative z-10 p-5 sm:p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-5">{visualSection}</div>
          <div className="xl:col-span-7 flex flex-col h-full">{copySection}</div>
        </div>
      ) : (
        <div className="relative z-10 flex-1 flex flex-col">
          <div className="pb-4 border-b liquid-divider">{visualSection}</div>
          <div className="p-5 flex-1 flex flex-col">{copySection}</div>
        </div>
      )}
    </article>
  );
}
