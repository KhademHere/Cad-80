import { Loader2, RotateCcw, Trash2 } from 'lucide-react';
import type { RefObject } from 'react';
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
import { STARTER_BRIEFS } from '../data/samples';
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
      className="w-full lg:w-[348px] xl:w-[372px] shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col"
    >
      <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
        <div>
          <h1 className="font-display text-lg font-semibold tracking-tight text-slate-950 text-balance">
            Campaign Brief
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
            Draft LinkedIn, X, and Instagram simultaneously with aspect-matched visuals.
          </p>
        </div>

        {/* Idea Input */}
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <label
              htmlFor="campaign-idea"
              className="text-xs font-semibold text-slate-800"
            >
              Core idea or announcement
            </label>
            <span className="font-mono text-[11px] tabular-nums text-slate-400">
              {idea.trim().length} / 1500
            </span>
          </div>
          <textarea
            ref={textareaRef}
            id="campaign-idea"
            rows={3}
            value={idea}
            onChange={(e) => onIdeaChange(e.target.value)}
            placeholder="Describe your product launch, milestone, opinion, or event..."
            aria-invalid={briefError ? 'true' : 'false'}
            aria-describedby={briefError ? 'brief-error-msg' : undefined}
            className={`w-full rounded-lg border bg-slate-50/60 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 leading-relaxed resize-y transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700/20 ${
              briefError
                ? 'border-red-500 focus:border-red-600'
                : 'border-slate-200 focus:border-blue-700'
            }`}
          />
          {briefError && (
            <p
              id="brief-error-msg"
              role="alert"
              className="text-xs font-medium text-red-600"
            >
              {briefError}
            </p>
          )}

          {/* Starter briefs */}
          <div className="pt-0.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <span className="text-[11px] font-medium text-slate-500">
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
                className="text-xs font-medium text-blue-700 hover:text-blue-900 underline underline-offset-4 decoration-blue-200 hover:decoration-blue-700 transition-colors cursor-pointer"
              >
                {starter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tone Selector */}
        <div className="space-y-1.5 pt-2.5 border-t border-slate-100">
          <span className="block text-xs font-semibold text-slate-800">
            Voice & tone
          </span>
          <div
            role="group"
            aria-label="Desired tone"
            className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg"
          >
            {ALL_TONES.map((option) => {
              const isSelected = tone === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onToneChange(option.id)}
                  className={`py-1.5 px-2 text-xs font-medium rounded-md transition-all duration-150 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 ${
                    isSelected
                      ? 'bg-white text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            {activeToneInfo.summary}
          </p>
        </div>

        {/* Visual Studio Settings */}
        <div className="space-y-3 pt-2.5 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800">
              Visual studio
            </span>
            {hasCustomRatios && (
              <button
                type="button"
                onClick={onResetAspectRatios}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                Reset ratios
              </button>
            )}
          </div>

          {/* Image Size 1K / 2K / 4K */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Output resolution</span>
              <span className="font-mono text-[11px] tabular-nums text-slate-400">
                {imageSize} studio render
              </span>
            </div>
            <div
              role="group"
              aria-label="Image size"
              className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg"
            >
              {ALL_IMAGE_SIZES.map((size) => {
                const isSelected = imageSize === size;
                return (
                  <button
                    key={size}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => onImageSizeChange(size)}
                    className={`py-1.5 px-2 font-mono text-xs font-medium tabular-nums rounded-md transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 ${
                      isSelected
                        ? 'bg-white text-slate-950 shadow-xs'
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Image Model */}
          <div className="space-y-1">
            <label
              htmlFor="image-model-select"
              className="block text-xs text-slate-600"
            >
              Image model
            </label>
            <select
              id="image-model-select"
              value={imageModel}
              onChange={(e) => onImageModelChange(e.target.value as ImageModelOption)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20"
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
            <span className="block text-xs text-slate-600">
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
                      className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 font-mono text-xs tabular-nums text-slate-800 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20"
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

        {/* Dominant Primary CTA */}
        <button
          type="submit"
          disabled={isGenerating}
          className="w-full py-2.5 px-5 rounded-lg bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white text-sm font-semibold transition-colors duration-150 flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-700"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Drafting 3 platforms...
            </>
          ) : (
            'Generate Campaign'
          )}
        </button>
      </form>

      {/* Campaign History */}
      <div className="border-t border-slate-200 p-5 sm:p-6 flex-1">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-display text-sm font-semibold text-slate-900">
            Campaign Library
          </h2>
          <span className="font-mono text-[11px] tabular-nums text-slate-400">
            {campaigns.length} saved
          </span>
        </div>

        <ul className="divide-y divide-slate-100">
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
                  <p className="mt-0.5 text-[11px] text-slate-500 flex items-center gap-1.5 font-mono tabular-nums">
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
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
