import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Globe,
  Loader2,
  RotateCcw,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import { useState, type RefObject } from 'react';
import { STARTER_BRIEFS } from '../data/samples';
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
  onLoadSampleBrief?: (label: string) => void;
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
  onLoadSampleBrief,
  textareaRef,
}: ComposerRailProps) {
  const [studioSettingsOpen, setStudioSettingsOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const activeToneInfo = ALL_TONES.find((t) => t.id === tone) ?? ALL_TONES[0];
  const hasCustomRatios = ALL_PLATFORMS.some(
    (p) => aspectRatios[p] !== DEFAULT_PLATFORM_RATIOS[p]
  );

  const shortModelName =
    imageModel === 'gemini-3-pro-image-preview'
      ? 'Gemini 3 Pro'
      : 'Nano Banana 2.1';

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate();
  };

  return (
    <aside
      aria-label="Campaign composer"
      className="w-full lg:w-[376px] xl:w-[396px] shrink-0 lg:self-start"
    >
      <div className="brand-card rounded-2xl flex flex-col overflow-hidden">
        <form onSubmit={handleFormSubmit} className="p-5 sm:p-6 space-y-6">
          {/* Header */}
          <div className="space-y-1">
            <h1 className="font-display text-xl font-bold tracking-tight text-[#0E103D] text-balance">
              Campaign Brief
            </h1>
            <p className="text-sm text-[#3A2A54] leading-relaxed">
              Enter one idea to draft tailored posts and aspect-matched visuals across LinkedIn, X, and Instagram.
            </p>
          </div>

          {/* Field 1: Core Idea Input */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <label
                htmlFor="campaign-idea"
                className="text-[13px] font-semibold text-[#0E103D]"
              >
                Core idea or announcement
              </label>
              <span className="font-mono text-xs tabular-nums text-[#3A2A54]">
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
              aria-describedby={briefError ? 'brief-error-msg' : 'brief-help-msg'}
              className={`brand-input w-full rounded-xl px-3.5 py-2.5 text-sm leading-[1.5] resize-y ${
                briefError ? 'brand-input-error' : ''
              }`}
            />

            {briefError ? (
              <div
                id="brief-error-msg"
                role="alert"
                className="rounded-xl bg-[#F2D7EE] border border-[#69306D] px-3.5 py-2.5 flex items-start gap-2 text-xs font-semibold text-[#0E103D]"
              >
                <AlertCircle
                  className="w-4 h-4 text-[#69306D] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span className="leading-snug">{briefError}</span>
              </div>
            ) : (
              <p id="brief-help-msg" className="sr-only">
                Provide at least 8 characters describing your campaign idea.
              </p>
            )}

            {/* Sample starter briefs */}
            <div className="pt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className="text-xs font-semibold text-[#3A2A54]">
                Try a sample:
              </span>
              {STARTER_BRIEFS.map((starter) => (
                <button
                  key={starter.id}
                  type="button"
                  onClick={() => {
                    onIdeaChange(starter.idea);
                    onToneChange(starter.tone);
                    onLoadSampleBrief?.(starter.label);
                  }}
                  className="text-xs font-semibold text-[#69306D] hover:text-[#0E103D] underline underline-offset-4 decoration-[#A5668B] hover:decoration-[#0E103D] py-1 cursor-pointer transition-colors"
                >
                  {starter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Field 2: Voice & Tone Selector */}
          <div className="space-y-2 pt-5 border-t brand-divider">
            <span
              id="voice-tone-label"
              className="block text-[13px] font-semibold text-[#0E103D]"
            >
              Voice & tone
            </span>
            <div
              role="group"
              aria-labelledby="voice-tone-label"
              className="brand-track grid grid-cols-3 gap-1.5 p-1 rounded-xl"
            >
              {ALL_TONES.map((option) => {
                const isSelected = tone === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => onToneChange(option.id)}
                    className={`min-h-[44px] sm:min-h-[40px] px-2.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                      isSelected ? 'brand-segment-active' : 'brand-segment-idle'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-[#3A2A54] leading-relaxed">
              {activeToneInfo.summary}
            </p>
          </div>

          {/* Field 3: Live Google Search Grounding Switch */}
          <div className="space-y-3 pt-5 border-t brand-divider">
            <div className="brand-subpanel rounded-xl px-4 py-3.5 flex items-center justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <Globe
                  className="w-4 h-4 mt-0.5 shrink-0 text-[#69306D]"
                  aria-hidden="true"
                />
                <div className="min-w-0 space-y-0.5">
                  <span
                    id="realtime-grounding-label"
                    className="block text-[13px] font-semibold text-[#0E103D] leading-snug"
                  >
                    Real-time Google Search data
                  </span>
                  <span className="block text-xs text-[#3A2A54] leading-snug">
                    Ground copy and visuals in live web results
                  </span>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={useRealTimeData}
                aria-labelledby="realtime-grounding-label"
                onClick={onToggleRealTimeData}
                className={`min-h-[40px] px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-2 shrink-0 cursor-pointer transition-colors border-[1.5px] ${
                  useRealTimeData
                    ? 'bg-[#69306D] text-[#FAF2F8] border-[#69306D] hover:bg-[#532357]'
                    : 'bg-[#FAF2F8] text-[#0E103D] border-[#A5668B] hover:bg-[#E9D3E3]'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`w-7 h-4 rounded-full p-0.5 flex items-center transition-colors ${
                    useRealTimeData
                      ? 'bg-[#F2D7EE]/35 justify-end'
                      : 'bg-[#D3BCC0] justify-start'
                  }`}
                >
                  <span
                    className={`w-3 h-3 rounded-full block ${
                      useRealTimeData ? 'bg-[#FAF2F8]' : 'bg-[#0E103D]'
                    }`}
                  />
                </span>
                <span>{useRealTimeData ? 'Live' : 'Off'}</span>
              </button>
            </div>

            {/* Progressive Disclosure: Visual Studio Settings */}
            <div className="brand-subpanel rounded-xl overflow-hidden">
              <button
                type="button"
                aria-expanded={studioSettingsOpen}
                aria-controls="visual-studio-settings-panel"
                onClick={() => setStudioSettingsOpen((prev) => !prev)}
                className="w-full min-h-[48px] px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-[#E9D3E3] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <SlidersHorizontal
                    className="w-4 h-4 text-[#69306D] shrink-0"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <span className="block text-[13px] font-semibold text-[#0E103D] leading-snug">
                      Visual studio settings
                    </span>
                    <span className="block text-xs font-mono tabular-nums text-[#3A2A54] truncate">
                      {imageSize} · {shortModelName} · {aspectRatios.linkedin} / {aspectRatios.twitter} / {aspectRatios.instagram}
                    </span>
                  </div>
                </div>
                {studioSettingsOpen ? (
                  <ChevronUp className="w-4 h-4 text-[#0E103D] shrink-0" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#0E103D] shrink-0" aria-hidden="true" />
                )}
              </button>

              {studioSettingsOpen && (
                <div
                  id="visual-studio-settings-panel"
                  className="px-4 pb-4 pt-3 border-t brand-divider space-y-4 bg-[#FAF2F8]"
                >
                  {/* Resolution */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span
                        id="output-resolution-label"
                        className="text-xs font-semibold text-[#0E103D]"
                      >
                        Output resolution
                      </span>
                      <span className="font-mono text-xs tabular-nums text-[#3A2A54]">
                        {imageSize} studio render
                      </span>
                    </div>
                    <div
                      role="group"
                      aria-labelledby="output-resolution-label"
                      className="brand-track grid grid-cols-3 gap-1.5 p-1 rounded-xl"
                    >
                      {ALL_IMAGE_SIZES.map((size) => {
                        const isSelected = imageSize === size;
                        return (
                          <button
                            key={size}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => onImageSizeChange(size)}
                            className={`min-h-[40px] rounded-lg font-mono text-xs font-semibold tabular-nums cursor-pointer transition-colors ${
                              isSelected ? 'brand-segment-active' : 'brand-segment-idle'
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Image Model */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="image-model-select"
                      className="block text-xs font-semibold text-[#0E103D]"
                    >
                      Image model
                    </label>
                    <select
                      id="image-model-select"
                      value={imageModel}
                      onChange={(e) => onImageModelChange(e.target.value as ImageModelOption)}
                      className="brand-input w-full min-h-[42px] rounded-xl px-3 py-2 text-xs font-medium text-[#0E103D]"
                    >
                      {IMAGE_MODELS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.label} ({m.note})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Per-Platform Aspect Ratios */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[#0E103D]">
                        Platform aspect ratios
                      </span>
                      {hasCustomRatios && (
                        <button
                          type="button"
                          onClick={onResetAspectRatios}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#69306D] hover:text-[#0E103D] underline underline-offset-4 decoration-[#A5668B] cursor-pointer py-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Reset defaults</span>
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2.5">
                      {ALL_PLATFORMS.map((platform) => {
                        const spec = PLATFORM_SPECS[platform];
                        return (
                          <div key={platform} className="space-y-1">
                            <label
                              htmlFor={`ratio-${platform}`}
                              className="block text-xs font-medium text-[#3A2A54] truncate"
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
                              className="brand-input w-full min-h-[40px] rounded-xl px-2.5 py-1.5 font-mono text-xs tabular-nums text-[#0E103D]"
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
              )}
            </div>
          </div>

          {/* Dominant Primary CTA — Single #69306D Solid Anchor */}
          <button
            type="submit"
            disabled={isGenerating}
            className="btn-primary w-full min-h-[48px] px-5 py-3 rounded-xl text-[15px] font-bold flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>
                  {useRealTimeData
                    ? 'Researching & drafting...'
                    : 'Drafting 3 platforms...'}
                </span>
              </>
            ) : (
              <span>Generate Campaign</span>
            )}
          </button>
        </form>

        {/* Campaign History with Destructive Confirmation Friction */}
        <div className="border-t brand-divider p-5 sm:p-6 bg-[#F6E9F4]">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="font-display text-sm font-bold text-[#0E103D]">
              Campaign Library
            </h2>
            <span className="font-mono text-xs tabular-nums text-[#3A2A54]">
              {campaigns.length} saved
            </span>
          </div>

          <ul className="divide-y divide-[#D3BCC0]">
            {campaigns.map((camp) => {
              const isActive = camp.id === activeCampaignId;
              const isConfirmingDelete = pendingDeleteId === camp.id;

              return (
                <li key={camp.id} className="py-3 first:pt-0 last:pb-0 space-y-2.5">
                  <div className="flex items-center justify-between gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setPendingDeleteId(null);
                        onSelectCampaign(camp.id);
                      }}
                      className="text-left flex-1 min-w-0 min-h-[44px] py-1 rounded-lg cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-sm truncate transition-colors ${
                            isActive
                              ? 'text-[#69306D] font-bold'
                              : 'text-[#0E103D] font-semibold group-hover:text-[#69306D]'
                          }`}
                        >
                          {camp.title}
                        </p>
                      </div>
                      <p className="mt-0.5 text-xs text-[#3A2A54] flex flex-wrap items-center gap-1.5 font-mono tabular-nums">
                        {isActive && (
                          <>
                            <span className="font-sans font-bold text-[#69306D]">
                              Active
                            </span>
                            <span aria-hidden="true">·</span>
                          </>
                        )}
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

                    {campaigns.length > 1 && !isConfirmingDelete && (
                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(camp.id)}
                        aria-label={`Delete campaign ${camp.title}`}
                        title={`Delete campaign ${camp.title}`}
                        className="btn-ghost min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-xl text-[#3A2A54] hover:text-[#0E103D] shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>

                  {/* Two-Step Destructive Confirmation */}
                  {isConfirmingDelete && (
                    <div
                      role="region"
                      aria-label={`Confirm deletion of ${camp.title}`}
                      className="rounded-xl bg-[#FAF2F8] border border-[#A5668B] p-3 flex flex-wrap items-center justify-between gap-2.5"
                    >
                      <span className="text-xs font-semibold text-[#0E103D]">
                        Delete this saved campaign?
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPendingDeleteId(null)}
                          className="btn-secondary min-h-[36px] px-3 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPendingDeleteId(null);
                            onDeleteCampaign(camp.id);
                          }}
                          className="btn-destructive min-h-[36px] px-3 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
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
