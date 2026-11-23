import {
  AlertCircle,
  AlertTriangle,
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
  onCopiedPost?: (platformName: string) => void;
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
  onCopiedPost,
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
      onCopiedPost?.(spec.name);
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
    <div className="space-y-3.5">
      {/* Aspect-Ratio Visual Stage */}
      <div
        className={`relative overflow-hidden ${
          isFocused
            ? 'rounded-xl bg-[#0E103D] border border-[#D3BCC0]'
            : isPortraitRatio
              ? 'bg-[#EDDDE9] border-b brand-divider py-3.5 px-4'
              : 'bg-[#EDDDE9] border-b brand-divider'
        } ${isPortraitRatio ? 'flex justify-center' : ''}`}
      >
        <div
          style={{ aspectRatio: ratioMeta.cssRatio }}
          className={`relative overflow-hidden bg-[#E3CDD9] group ${
            isPortraitRatio
              ? isFocused
                ? 'max-h-[540px] w-auto max-w-full rounded-lg'
                : 'max-h-[328px] w-auto max-w-full rounded-xl shadow-[0_10px_24px_-12px_rgba(14,16,61,0.3)] ring-1 ring-[#FAF2F8]'
              : 'w-full'
          }`}
        >
          {post.imageStatus === 'loading' || isGeneratingPost ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-[#FAF2F8]/90 animate-pulse p-5 text-center">
              <Loader2 className="w-5 h-5 text-[#69306D] animate-spin" aria-hidden="true" />
              <span className="font-mono text-xs tabular-nums font-medium text-[#0E103D]">
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
                title={`Inspect ${spec.name} visual fullscreen`}
                className="absolute bottom-3 right-3 min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0E103D]/88 hover:bg-[#69306D] border border-[#F2D7EE]/35 text-[#FAF2F8] text-xs font-semibold shadow-md transition-colors cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Inspect</span>
              </button>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#EDDDE9]">
              <ImageIcon className="w-6 h-6 text-[#69306D] mb-2" aria-hidden="true" />
              <p className="text-sm font-semibold text-[#0E103D]">
                {post.imageStatus === 'error'
                  ? 'Visual could not be generated'
                  : 'Visual ready to render'}
              </p>
              <p className="mt-1 font-mono text-xs tabular-nums text-[#3A2A54]">
                {ratioMeta.label} · {post.imageSize}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Inline Image Error */}
      {post.imageStatus === 'error' && post.imageError && (
        <div
          role="alert"
          className={`${
            isFocused ? '' : 'mx-5'
          } rounded-xl border border-[#69306D] bg-[#F2D7EE] px-4 py-3 text-xs text-[#0E103D] flex items-start gap-2.5`}
        >
          <AlertCircle className="w-4 h-4 text-[#69306D] shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1.5 flex-1">
            <p className="leading-relaxed font-medium">{post.imageError}</p>
            <button
              type="button"
              onClick={onRegenerateImage}
              className="font-bold text-[#69306D] hover:text-[#0E103D] underline underline-offset-4 cursor-pointer"
            >
              Retry visual
            </button>
          </div>
        </div>
      )}

      {/* Ergonomic Single-Row Visual Toolbar */}
      <div
        className={`${
          isFocused ? '' : 'px-4 sm:px-5'
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
            className="brand-input min-h-[40px] rounded-xl px-2 py-1.5 font-mono text-xs tabular-nums font-medium text-[#0E103D]"
          >
            {ALL_ASPECT_RATIOS.map((ratio) => (
              <option key={ratio} value={ratio}>
                {ratio}
              </option>
            ))}
          </select>
          {isFocused && (
            <span className="font-mono text-xs tabular-nums text-[#3A2A54]">
              {post.imageSize}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            aria-expanded={promptOpen}
            onClick={() => setPromptOpen((prev) => !prev)}
            className="btn-ghost min-h-[40px] inline-flex items-center gap-0.5 px-2 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap cursor-pointer"
          >
            <span>Prompt</span>
            {promptOpen ? (
              <ChevronUp className="w-3.5 h-3.5 text-[#69306D]" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-[#69306D]" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={onRegenerateImage}
            disabled={post.imageStatus === 'loading' || isGeneratingPost}
            aria-label={`Regenerate ${spec.name} visual`}
            title={`Regenerate ${spec.name} visual`}
            className="btn-secondary min-h-[40px] inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#69306D] ${post.imageStatus === 'loading' ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>Render</span>
          </button>

          {post.imageUrl && !imageLoadFailed && (
            <button
              type="button"
              onClick={handleDownloadImage}
              aria-label={`Download ${spec.name} image`}
              title={`Download ${spec.name} image`}
              className="btn-ghost min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-xl cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#0E103D]" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Real-time visual grounding references */}
      {post.visualSources && post.visualSources.length > 0 && (
        <div
          className={`${
            isFocused ? '' : 'px-5'
          } text-xs text-[#3A2A54] flex flex-wrap items-center gap-x-3 gap-y-1`}
        >
          <span className="font-semibold text-[#0E103D]">Visual refs:</span>
          {post.visualSources.slice(0, 3).map((src) => (
            <a
              key={src.uri}
              href={src.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-[#69306D] hover:text-[#0E103D] underline underline-offset-4 decoration-[#A5668B]"
            >
              <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
              <span>{extractSourceHostname(src.uri)}</span>
            </a>
          ))}
        </div>
      )}

      {/* Collapsible Art Direction Prompt Editor */}
      {promptOpen && (
        <div className={`${isFocused ? '' : 'px-5'} pt-3 border-t brand-divider space-y-2`}>
          <label
            htmlFor={`image-prompt-${post.platform}`}
            className="block text-xs font-semibold text-[#0E103D]"
          >
            Visual art-direction prompt (edit and select Render)
          </label>
          <textarea
            id={`image-prompt-${post.platform}`}
            rows={3}
            value={post.imagePrompt}
            onChange={(e) => onUpdateImagePrompt(e.target.value)}
            className="brand-input w-full rounded-xl px-3.5 py-2.5 text-xs text-[#0E103D] leading-relaxed"
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
    <div className="flex flex-col flex-1 space-y-5">
      {/* Mode Switcher & Character Counter */}
      <div className="flex items-center justify-between gap-3">
        <div
          role="group"
          aria-label={`${spec.name} view mode`}
          className="brand-track inline-flex items-center gap-1 p-1 rounded-xl"
        >
          {(
            [
              { id: 'preview', label: 'Preview' },
              { id: 'edit', label: 'Edit' },
            ] as const
          ).map((mode) => {
            const isSelected = editorMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setEditorMode(mode.id)}
                className={`min-h-[36px] px-3.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  isSelected ? 'brand-segment-active' : 'brand-segment-idle'
                }`}
              >
                {mode.label}
              </button>
            );
          })}
        </div>

        <div
          className={`font-mono text-xs tabular-nums inline-flex items-center gap-1.5 ${
            metrics.isOverLimit
              ? 'text-[#69306D] font-bold'
              : 'text-[#3A2A54] font-medium'
          }`}
        >
          {metrics.isOverLimit && (
            <AlertTriangle className="w-3.5 h-3.5 text-[#69306D]" aria-hidden="true" />
          )}
          <span>
            {metrics.charCount} / {metrics.charLimit}
          </span>
        </div>
      </div>

      {isGeneratingPost ? (
        <div className="space-y-3 py-2 animate-pulse" aria-busy="true">
          <div className="h-4 w-3/4 bg-[#D3BCC0] rounded-lg" />
          <div className="h-3.5 w-full bg-[#E3CDD9] rounded-lg" />
          <div className="h-3.5 w-11/12 bg-[#E3CDD9] rounded-lg" />
          <div className="h-3.5 w-5/6 bg-[#E3CDD9] rounded-lg" />
          <div className="h-3.5 w-2/3 bg-[#E3CDD9] rounded-lg" />
        </div>
      ) : editorMode === 'preview' ? (
        <div className="space-y-4 max-w-[65ch]">
          {post.platform === 'linkedin' && post.headline && (
            <h3 className="font-display text-base font-bold text-[#0E103D] leading-snug text-balance">
              {post.headline}
            </h3>
          )}

          <div
            className={`space-y-3 ${
              post.platform === 'twitter'
                ? 'text-[15.5px] leading-[1.6] text-[#0E103D] font-normal'
                : 'text-[14.5px] leading-[1.68] text-[#0E103D]'
            }`}
          >
            {paragraphs.map((para, i) => (
              <p key={i} className="whitespace-pre-line">
                {para}
              </p>
            ))}
          </div>

          {post.platform === 'twitter' && (
            <div className="space-y-2 pt-1">
              <div
                className="h-2 w-full rounded-full bg-[#E3CDD9] overflow-hidden"
                aria-hidden="true"
              >
                <div
                  className={`h-full rounded-full transition-all duration-150 ${
                    metrics.isOverLimit ? 'bg-[#0E103D]' : 'bg-[#69306D]'
                  }`}
                  style={{ width: `${metrics.utilizationPercent}%` }}
                />
              </div>
              {metrics.isOverLimit && (
                <p
                  role="alert"
                  className="text-xs font-semibold text-[#0E103D] flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-[#69306D] shrink-0" aria-hidden="true" />
                  <span>
                    Exceeds 280-character X limit by {metrics.charCount - metrics.charLimit} characters.
                  </span>
                </p>
              )}
            </div>
          )}

          {(post.platform === 'instagram' || post.platform === 'linkedin') &&
            post.hashtags.length > 0 && (
              <p className="pt-3 border-t brand-divider text-xs font-semibold text-[#69306D] leading-relaxed">
                {post.hashtags.join(' ')}
              </p>
            )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor={`post-body-${post.platform}`}
              className="block text-xs font-semibold text-[#0E103D]"
            >
              {spec.name} post copy
            </label>
            <textarea
              id={`post-body-${post.platform}`}
              rows={
                isFocused
                  ? post.platform === 'linkedin'
                    ? 13
                    : 8
                  : post.platform === 'linkedin'
                    ? 10
                    : post.platform === 'twitter'
                      ? 6
                      : 8
              }
              value={post.body}
              onChange={(e) => onUpdateBody(e.target.value)}
              className="brand-input w-full rounded-xl px-3.5 py-3 text-sm text-[#0E103D] leading-relaxed resize-y"
            />
          </div>

          {post.platform === 'twitter' && (
            <div className="space-y-2">
              <div
                className="h-2 w-full rounded-full bg-[#E3CDD9] overflow-hidden"
                aria-hidden="true"
              >
                <div
                  className={`h-full rounded-full transition-all duration-150 ${
                    metrics.isOverLimit ? 'bg-[#0E103D]' : 'bg-[#69306D]'
                  }`}
                  style={{ width: `${metrics.utilizationPercent}%` }}
                />
              </div>
              {metrics.isOverLimit && (
                <p
                  role="alert"
                  className="text-xs font-semibold text-[#0E103D] flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-[#69306D] shrink-0" aria-hidden="true" />
                  <span>
                    Exceeds 280-character X limit by {metrics.charCount - metrics.charLimit} characters.
                  </span>
                </p>
              )}
            </div>
          )}

          {(post.platform === 'instagram' || post.platform === 'linkedin') && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor={`hashtags-${post.platform}`}
                  className="text-xs font-semibold text-[#0E103D]"
                >
                  Hashtags
                </label>
                <span className="font-mono text-xs tabular-nums text-[#3A2A54]">
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
                className="brand-input w-full min-h-[42px] rounded-xl px-3.5 py-2 text-xs font-semibold text-[#69306D]"
              />
            </div>
          )}
        </div>
      )}

      {/* Editorial Note */}
      {post.analysisNote && !isGeneratingPost && (
        <div className="brand-subpanel rounded-xl px-4 py-3 text-xs text-[#0E103D] flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="font-bold text-[#69306D]">Editorial note</span>
            <p className="leading-relaxed text-[#0E103D]">{post.analysisNote}</p>
          </div>
          <button
            type="button"
            onClick={onDismissAnalysis}
            aria-label={`Dismiss editorial note for ${spec.name}`}
            title="Dismiss editorial note"
            className="btn-ghost min-w-[36px] min-h-[36px] inline-flex items-center justify-center rounded-lg shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4 text-[#0E103D]" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Refinement Actions & Copy Footer */}
      <div className="mt-auto pt-4 border-t brand-divider space-y-3.5">
        <div className="space-y-2">
          <span className="block text-xs font-semibold text-[#3A2A54]">
            Quick refinements
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {QUICK_REFINEMENTS.map((action) => (
              <button
                key={action.id}
                type="button"
                disabled={isRefining || isGeneratingPost}
                onClick={() => onRefinePost(action.instruction, action.mode)}
                className="btn-ghost min-h-[38px] px-3 py-1.5 text-xs font-semibold text-[#0E103D] border-[#D3BCC0] bg-[#F6E9F4] rounded-xl whitespace-nowrap cursor-pointer"
              >
                {action.label}
              </button>
            ))}
            {isRefining && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#69306D]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                <span>Refining...</span>
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleCustomRefineSubmit} className="space-y-1.5">
          <label
            htmlFor={`refine-input-${post.platform}`}
            className="block text-xs font-semibold text-[#0E103D]"
          >
            Custom edit instruction
          </label>
          <div className="flex items-center gap-2">
            <input
              id={`refine-input-${post.platform}`}
              type="text"
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              disabled={isRefining || isGeneratingPost}
              placeholder="e.g., Make the closing question more direct..."
              className="brand-input flex-1 min-w-0 min-h-[40px] rounded-xl px-3.5 py-2 text-xs text-[#0E103D]"
            />
            <button
              type="submit"
              disabled={!customInstruction.trim() || isRefining || isGeneratingPost}
              aria-label={`Apply custom edit to ${spec.name}`}
              title={`Apply custom edit to ${spec.name}`}
              className="btn-secondary min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-xl shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4 text-[#69306D]" aria-hidden="true" />
            </button>
          </div>
        </form>

        <div className="flex items-center justify-between gap-3 pt-2 border-t brand-divider">
          <div className="text-xs text-[#3A2A54] font-mono tabular-nums flex items-center gap-2">
            <span>{metrics.wordCount} words</span>
            <span aria-hidden="true">·</span>
            <span>~{metrics.readingSeconds}s read</span>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            disabled={isGeneratingPost}
            className="btn-secondary min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-[#69306D]" aria-hidden="true" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#69306D]" aria-hidden="true" />
                <span>Copy Post</span>
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
      className="brand-card rounded-2xl flex flex-col overflow-hidden"
    >
      {/* Card Header */}
      <div className="px-5 py-4 border-b brand-divider flex items-center justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <h2 className="font-display text-base font-bold text-[#0E103D] truncate">
            {spec.name}
          </h2>
          <p className="text-xs text-[#3A2A54] flex items-center gap-1.5 truncate">
            <span>{spec.formatLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{post.aspectRatio}</span>
          </p>
        </div>

        {!isFocused && onFocusPlatform && (
          <button
            type="button"
            onClick={onFocusPlatform}
            aria-label={`Focus ${spec.name} editor`}
            title={`Focus ${spec.name} editor`}
            className="btn-ghost min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-xl shrink-0 cursor-pointer"
          >
            <Maximize2 className="w-4 h-4 text-[#69306D]" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Card Body */}
      {isFocused ? (
        <div className="p-5 sm:p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 items-start">
          <div className="xl:col-span-5">{visualSection}</div>
          <div className="xl:col-span-7 flex flex-col h-full">{copySection}</div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="pb-4 border-b brand-divider">{visualSection}</div>
          <div className="p-5 flex-1 flex flex-col">{copySection}</div>
        </div>
      )}
    </article>
  );
}
