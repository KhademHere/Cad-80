import { Globe, Loader2, RotateCcw, Trash2 } from 'lucide-react';
import type { RefObject } from 'react';
import { STARTER_BRIEFS } from '../data/samples';
import { handleLiquidPointerMove } from '../hooks/useLiquidPointer';
import { GlassSegmentedTrack } from './GlassSegmentedTrack';
import {
  ALL_ASPECT_RATIOS,
  ALL_IMAGE_SIZES,
  ALL_PLATFORMS,
  ALL_TONES,
  DEFAULT_PLATFORM_RATIOS,
  IMAGE_MODELS,
  PLATFORM_SPECS,
  formatRelativeTimestamp,
} from '../lib/campaign';
import type {
  AspectRatioOption,
  CampaignDraft,
  ImageModelOption,
  ImageSizeOption,
  PlatformId,
  ToneOption,
} from '../types/campaign';

interface ComposerRailProps {
  idea: string;
  onIdeaChange: (value: string) => void;
  tone: ToneOption;
  onToneChange: (tone: ToneOption) => void;
  imageSize: ImageSizeOption;
  onImageSizeChange: (size: ImageSizeOption) => void;
  imageModel: ImageModelOption;
  onImageModelChange: (model: ImageModelOption) => void;
  useRealTimeData: boolean;
  onToggleRealTimeData: () => void;
  aspectRatios: Record<PlatformId, AspectRatioOption>;
  onAspectRatioChange: (platform: PlatformId, ratio: AspectRatioOption) => void;
  onResetAspectRatios: () => void;
  briefError: string | null;
  isGenerating: boolean;
  onGenerate: () => void;
  campaigns: CampaignDraft[];
  activeCampaignId: string;
  onSelectCampaign: (id: string) => void;
  onDeleteCampaign: (id: string) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}


export function ComposerRail({
  idea,
  onIdeaChange,
  tone,
  onToneChange,
  imageSize,
  onImageSizeChange,
  imageModel,
  onImageModelChange,
  useRealTimeData,
  onToggleRealTimeData,
  aspectRatios,
  onAspectRatioChange,
  onResetAspectRatios,
  briefError,
  isGenerating,
  onGenerate,
  campaigns,
  activeCampaignId,
  onSelectCampaign,
  onDeleteCampaign,
  textareaRef,
}: ComposerRailProps) {
  const activeToneInfo = ALL_TONES.find((t) => t.id === tone) ?? ALL_TONES[0];
  const hasCustomRatios = ALL_PLATFORMS.some(
    (p) => aspectRatios[p] !== DEFAULT_PLATFORM_RATIOS[p]
  );

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate();
  };

  return (
    <aside
      aria-label="Campaign composer"
      className="w-full lg:w-[356px] xl:w-[380px] shrink-0 lg:self-start"
    >
      <div className="liquid-glass-panel rounded-[26px] flex flex-col overflow-hidden">
        <form onSubmit={handleFormSubmit} className="relative z-10 p-5 space-y-3.5">
          <div>
            <h1 className="font-display text-lg font-semibold tracking-tight text-slate-950 text-balance">
              Campaign Brief
            </h1>
            <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">
              One idea tailored for LinkedIn, X, and Instagram with real-time grounded visuals.
            </p>
          </div>

          {/* Idea Input Well */}
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <label
                htmlFor="campaign-idea"
                className="text-xs font-semibold text-slate-900"
              >
                Core idea or announcement
              </label>
              <span className="font-mono text-[11px] tabular-nums text-slate-500">
                {idea.trim().length} / 1500
              </span>
            </div>
            <textarea
              ref={textareaRef}
              id="campaign-idea"
              rows={4}
              value={idea}
              onChange={(e) => onIdeaChange(e.target.value)}
              placeholder="Describe your product launch, event, city pop-up, or industry take..."
              aria-invalid={briefError ? 'true' : 'false'}
              aria-describedby={briefError ? 'brief-error-msg' : undefined}
              className={`liquid-glass-well w-full rounded-[14px] px-3 py-2 text-[13px] text-slate-950 placeholder:text-slate-500 leading-[1.45] resize-y ${
                briefError ? 'liquid-glass-well-error' : ''
              }`}
            />
            {briefError && (
              <p
                id="brief-error-msg"
                role="alert"
                className="text-xs font-semibold text-red-700"
              >
                {briefError}
              </p>
            )}

            {/* Starter briefs */}
            <div className="pt-0.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <span className="text-[11px] font-medium text-slate-600">
                Samples:
              </span>
              {STARTER_BRIEFS.map((starter) => (
                <button
                  key={starter.id}
                  type="button"
                  onClick={() => {
                    onIdeaChange(starter.idea);
                    onToneChange(starter.tone);
                  }}
                  className="text-xs font-medium text-blue-700 hover:text-blue-900 underline underline-offset-4 decoration-blue-300 hover:decoration-blue-700 transition-colors cursor-pointer"
                >
                  {starter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tone Selector with Sliding Glass Capsule */}
          <div className="space-y-1.5 pt-2.5 border-t liquid-divider">
            <span className="block text-xs font-semibold text-slate-900">
              Voice & tone
            </span>
            <GlassSegmentedTrack
              ariaLabel="Desired tone"
              layout="grid-3"
              options={ALL_TONES.map((option) => ({
                id: option.id,
                label: option.label,
              }))}
              value={tone}
              onChange={onToneChange}
            />
            <p className="text-[11px] text-slate-600 leading-snug">
              {activeToneInfo.summary}
            </p>
          </div>

          {/* Real-Time Data & Visual Studio Settings */}
          <div className="space-y-2.5 pt-2.5 border-t liquid-divider">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900">
                Visual studio & live data
              </span>
              {hasCustomRatios && (
                <button
                  type="button"
                  onClick={onResetAspectRatios}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-950 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" aria-hidden="true" />
                  Reset ratios
                </button>
              )}
            </div>

            {/* Live Google Search & Visual Grounding Glass Well */}
            <div className="liquid-glass-well rounded-[14px] px-3 py-2 flex items-center justify-between gap-3">
              <div className="flex items-start gap-2 min-w-0">
                <Globe
                  className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                    useRealTimeData ? 'text-blue-700' : 'text-slate-500'
                  }`}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <span
                    id="realtime-grounding-label"
                    className="block text-xs font-semibold text-slate-950 leading-tight"
                  >
                    Real-time Google Search data
                  </span>
                  <span className="block text-[11px] text-slate-600 leading-snug">
                    Ground copy & visuals in live web results
                  </span>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={useRealTimeData}
                aria-labelledby="realtime-grounding-label"
                onClick={onToggleRealTimeData}
                onPointerMove={handleLiquidPointerMove}
                className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 ${
                  useRealTimeData
                    ? 'liquid-glass-btn-primary text-white'
                    : 'liquid-glass-btn text-slate-700'
                }`}
              >
                {useRealTimeData ? 'Live' : 'Off'}
              </button>
            </div>

            {/* Image Size 1K / 2K / 4K with Sliding Glass Capsule */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-700">
                  Output resolution
                </span>
                <span className="font-mono text-[11px] tabular-nums text-slate-500">
                  {imageSize} studio render
                </span>
              </div>
              <GlassSegmentedTrack
                ariaLabel="Image size"
                layout="grid-3"
                mono
                options={ALL_IMAGE_SIZES.map((size) => ({
                  id: size,
                  label: size,
                }))}
                value={imageSize}
                onChange={onImageSizeChange}
              />
            </div>

            {/* Image Model */}
            <div className="space-y-1">
              <label
                htmlFor="image-model-select"
                className="block text-xs font-medium text-slate-700"
              >
                Image model
              </label>
              <select
                id="image-model-select"
                value={imageModel}
                onChange={(e) => onImageModelChange(e.target.value as ImageModelOption)}
                className="liquid-glass-well w-full rounded-[12px] px-2.5 py-1.5 text-xs font-medium text-slate-900"
              >
                {IMAGE_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label} ({m.note})
                  </option>
                ))}
              </select>
            </div>

            {/* Per-platform aspect ratios in a crisp 3-column row */}
            <div className="space-y-1.5">
              <span className="block text-xs font-medium text-slate-700">
                Platform aspect ratios
              </span>
              <div className="grid grid-cols-3 gap-2">
                {ALL_PLATFORMS.map((platform) => {
                  const spec = PLATFORM_SPECS[platform];
                  return (
                    <div key={platform} className="space-y-1">
                      <label
                        htmlFor={`ratio-${platform}`}
                        className="block text-[11px] font-medium text-slate-700 truncate"
                      >
                        {spec.name}
                      </label>
                      <select
                        id={`ratio-${platform}`}
                        value={aspectRatios[platform]}
                        onChange={(e) =>
                          onAspectRatioChange(
                            platform,
                            e.target.value as AspectRatioOption
                          )
                        }
                        className="liquid-glass-well w-full rounded-[10px] px-2 py-1.5 font-mono text-xs tabular-nums text-slate-900"
                      >
                        {ALL_ASPECT_RATIOS.map((ratio) => (
                          <option key={ratio} value={ratio}>
                            {ratio}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Dominant Glossy Cobalt Liquid Glass Primary CTA */}
          <button
            type="submit"
            disabled={isGenerating}
            onPointerMove={handleLiquidPointerMove}
            className="liquid-glass-btn-primary w-full py-2.5 px-5 rounded-full text-white text-sm font-semibold flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                {useRealTimeData
                  ? 'Researching & drafting...'
                  : 'Drafting 3 platforms...'}
              </>
            ) : (
              'Generate Campaign'
            )}
          </button>
        </form>

        {/* Campaign History */}
        <div className="relative z-10 border-t liquid-divider p-5">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="font-display text-sm font-semibold text-slate-950">
              Campaign Library
            </h2>
            <span className="font-mono text-[11px] tabular-nums text-slate-500">
              {campaigns.length} saved
            </span>
          </div>

          <ul className="divide-y divide-slate-300/35">
            {campaigns.map((camp) => {
              const isActive = camp.id === activeCampaignId;
              return (
                <li
                  key={camp.id}
                  className="py-2.5 first:pt-0 last:pb-0 flex items-start justify-between gap-2"
                >
                  <button
                    type="button"
                    onClick={() => onSelectCampaign(camp.id)}
                    className="text-left flex-1 min-w-0 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded-sm"
                  >
                    <p
                      className={`text-xs font-medium truncate transition-colors ${
                        isActive
                          ? 'text-blue-700 font-semibold'
                          : 'text-slate-800 group-hover:text-slate-950'
                      }`}
                    >
                      {camp.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-600 flex items-center gap-1.5 font-mono tabular-nums">
                      <span className="capitalize font-sans">{camp.tone}</span>
                      <span aria-hidden="true">·</span>
                      <span>{camp.imageSize}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-sans">
                        {camp.isSample
                          ? 'Sample'
                          : formatRelativeTimestamp(camp.createdAt)}
                      </span>
                    </p>
                  </button>
                  {campaigns.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteCampaign(camp.id)}
                      aria-label={`Delete campaign ${camp.title}`}
                      className="p-1.5 text-slate-500 hover:text-red-700 rounded-full hover:bg-white/60 transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </aside>
  );
}
