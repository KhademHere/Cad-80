import { AlertCircle, Check, Copy, RefreshCw, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ComposerRail } from './components/ComposerRail';
import { GroundingPanel } from './components/GroundingPanel';
import { MobileBottomNav } from './components/MobileBottomNav';
import { PlatformCard } from './components/PlatformCard';
import { ToastBanner, type ToastMessage } from './components/ToastBanner';
import { TopBar } from './components/TopBar';
import { VisualLightbox } from './components/VisualLightbox';
import { SAMPLE_CAMPAIGN } from './data/samples';
import {
  ALL_PLATFORMS,
  DEFAULT_PLATFORM_RATIOS,
  dedupeGroundingSources,
  deserializeCampaignsFromStorage,
  formatCampaignForClipboard,
  normalizeHashtags,
  serializeCampaignsForStorage,
  validateBrief,
} from './lib/campaign';
import {
  ApiClientError,
  requestGenerateImage,
  requestGeneratePosts,
  requestRefinePost,
} from './services/api';
import type {
  AspectRatioOption,
  CampaignDraft,
  ImageModelOption,
  ImageSizeOption,
  PlatformId,
  PlatformPost,
  ToneOption,
  WorkspaceView,
} from './types/campaign';

const STORAGE_KEY = 'kadrant_campaigns_v1';

function loadInitialCampaigns(): CampaignDraft[] {
  if (typeof window === 'undefined') return [SAMPLE_CAMPAIGN];
  const saved = deserializeCampaignsFromStorage(window.localStorage.getItem(STORAGE_KEY));
  if (saved.length > 0) return saved;
  return [SAMPLE_CAMPAIGN];
}

export default function App() {
  const [campaigns, setCampaigns] = useState<CampaignDraft[]>(loadInitialCampaigns);
  const [activeCampaignId, setActiveCampaignId] = useState<string>(
    () => loadInitialCampaigns()[0].id
  );
  const [activeView, setActiveView] = useState<WorkspaceView>('all');
  const [lightboxPlatform, setLightboxPlatform] = useState<PlatformId | null>(null);

  const activeCampaign =
    campaigns.find((c) => c.id === activeCampaignId) ?? campaigns[0];

  const [idea, setIdea] = useState<string>(activeCampaign.idea);
  const [tone, setTone] = useState<ToneOption>(activeCampaign.tone);
  const [imageSize, setImageSize] = useState<ImageSizeOption>(activeCampaign.imageSize);
  const [imageModel, setImageModel] = useState<ImageModelOption>(activeCampaign.imageModel);
  const [useRealTimeData, setUseRealTimeData] = useState<boolean>(
    activeCampaign.useRealTimeData !== false
  );
  const [aspectRatios, setAspectRatios] = useState<Record<PlatformId, AspectRatioOption>>({
    linkedin: activeCampaign.posts.linkedin.aspectRatio,
    twitter: activeCampaign.posts.twitter.aspectRatio,
    instagram: activeCampaign.posts.instagram.aspectRatio,
  });

  const [briefError, setBriefError] = useState<string | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [isGeneratingPosts, setIsGeneratingPosts] = useState(false);
  const [refiningPlatform, setRefiningPlatform] = useState<PlatformId | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((text: string, toneMode: 'success' | 'info' = 'success') => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToast({ id: Date.now(), text, tone: toneMode });
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 3200);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        serializeCampaignsForStorage(campaigns)
      );
    } catch {
      // Ignore storage quota issues in constrained environments
    }
  }, [campaigns]);

  const updateCampaign = (
    campaignId: string,
    updater: (draft: CampaignDraft) => CampaignDraft
  ) => {
    setCampaigns((prev) =>
      prev.map((item) => (item.id === campaignId ? updater(item) : item))
    );
  };

  const updatePlatformPost = (
    campaignId: string,
    platform: PlatformId,
    updater: (post: PlatformPost) => PlatformPost
  ) => {
    updateCampaign(campaignId, (draft) => ({
      ...draft,
      posts: {
        ...draft.posts,
        [platform]: updater(draft.posts[platform]),
      },
    }));
  };

  const triggerSingleImageRender = async (
    campaignId: string,
    platform: PlatformId,
    params: {
      prompt: string;
      aspectRatio: AspectRatioOption;
      imageSize: ImageSizeOption;
      model: ImageModelOption;
      useRealTimeVisuals: boolean;
    }
  ) => {
    updatePlatformPost(campaignId, platform, (post) => ({
      ...post,
      aspectRatio: params.aspectRatio,
      imageSize: params.imageSize,
      imageModel: params.model,
      imageStatus: 'loading',
      imageError: undefined,
    }));

    try {
      const result = await requestGenerateImage({
        prompt: params.prompt,
        aspectRatio: params.aspectRatio,
        imageSize: params.imageSize,
        model: params.model,
        useRealTimeVisuals: params.useRealTimeVisuals,
      });

      updatePlatformPost(campaignId, platform, (post) => ({
        ...post,
        imageUrl: result.imageUrl,
        imageModel: result.model,
        visualSources: result.visualSources,
        imageStatus: 'ready',
        imageError: undefined,
      }));
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Failed to generate image. Please try again.';
      updatePlatformPost(campaignId, platform, (post) => ({
        ...post,
        imageStatus: 'error',
        imageError: message,
      }));
    }
  };

  const handleGenerateCampaign = async () => {
    const validation = validateBrief(idea);
    if (!validation.valid) {
      setBriefError(validation.error ?? 'Please enter a valid campaign brief.');
      textareaRef.current?.focus();
      return;
    }

    setBriefError(null);
    setWorkspaceError(null);
    setIsGeneratingPosts(true);

    try {
      const response = await requestGeneratePosts({
        idea: idea.trim(),
        tone,
        aspectRatios,
        useRealTimeData,
      });

      const newId = `campaign-${Date.now()}`;
      const newCampaign: CampaignDraft = {
        id: newId,
        title: response.title,
        idea: idea.trim(),
        tone,
        imageSize,
        imageModel,
        useRealTimeData,
        grounding: response.grounding,
        createdAt: new Date().toISOString(),
        posts: {
          linkedin: {
            platform: 'linkedin',
            headline: response.posts.linkedin.headline,
            body: response.posts.linkedin.body,
            hashtags: normalizeHashtags(response.posts.linkedin.hashtags),
            imagePrompt: response.posts.linkedin.imagePrompt,
            aspectRatio: aspectRatios.linkedin,
            imageSize,
            imageModel,
            imageUrl: null,
            imageStatus: 'loading',
          },
          twitter: {
            platform: 'twitter',
            headline: response.posts.twitter.headline,
            body: response.posts.twitter.body,
            hashtags: normalizeHashtags(response.posts.twitter.hashtags),
            imagePrompt: response.posts.twitter.imagePrompt,
            aspectRatio: aspectRatios.twitter,
            imageSize,
            imageModel,
            imageUrl: null,
            imageStatus: 'loading',
          },
          instagram: {
            platform: 'instagram',
            headline: response.posts.instagram.headline,
            body: response.posts.instagram.body,
            hashtags: normalizeHashtags(response.posts.instagram.hashtags),
            imagePrompt: response.posts.instagram.imagePrompt,
            aspectRatio: aspectRatios.instagram,
            imageSize,
            imageModel,
            imageUrl: null,
            imageStatus: 'loading',
          },
        },
      };

      setCampaigns((prev) => [newCampaign, ...prev].slice(0, 12));
      setActiveCampaignId(newId);
      setIsGeneratingPosts(false);
      showToast('Drafted LinkedIn, X, and Instagram posts. Rendering visuals...', 'info');

      await Promise.all(
        ALL_PLATFORMS.map((platform) =>
          triggerSingleImageRender(newId, platform, {
            prompt: newCampaign.posts[platform].imagePrompt,
            aspectRatio: newCampaign.posts[platform].aspectRatio,
            imageSize,
            model: imageModel,
            useRealTimeVisuals: useRealTimeData,
          })
        )
      );
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Could not generate campaign drafts. Please retry.';
      setWorkspaceError(message);
      setIsGeneratingPosts(false);
    }
  };

  const handleRenderAllVisuals = async () => {
    setWorkspaceError(null);
    showToast('Rendering updated visuals for all 3 platforms...', 'info');
    await Promise.all(
      ALL_PLATFORMS.map((platform) => {
        const post = activeCampaign.posts[platform];
        return triggerSingleImageRender(activeCampaign.id, platform, {
          prompt: post.imagePrompt,
          aspectRatio: post.aspectRatio,
          imageSize,
          model: imageModel,
          useRealTimeVisuals: useRealTimeData,
        });
      })
    );
  };

  const handleRefinePlatform = async (
    platform: PlatformId,
    instruction: string,
    mode: 'quick_edit' | 'analyze' | 'ground'
  ) => {
    const targetPost = activeCampaign.posts[platform];
    setRefiningPlatform(platform);
    setWorkspaceError(null);

    try {
      const result = await requestRefinePost({
        platform,
        tone: activeCampaign.tone,
        idea: activeCampaign.idea,
        currentBody: targetPost.body,
        currentHashtags: targetPost.hashtags,
        instruction,
        mode,
      });

      updateCampaign(activeCampaign.id, (camp) => {
        const mergedSources =
          result.sources && result.sources.length > 0
            ? dedupeGroundingSources([
                ...(camp.grounding?.sources ?? []),
                ...result.sources,
              ])
            : camp.grounding?.sources ?? [];

        return {
          ...camp,
          grounding:
            result.sources && result.sources.length > 0
              ? {
                  summary:
                    camp.grounding?.summary ??
                    'Fact-checked with live Google Search.',
                  queries: camp.grounding?.queries ?? [],
                  sources: mergedSources,
                  groundedAt: new Date().toISOString(),
                }
              : camp.grounding,
          posts: {
            ...camp.posts,
            [platform]: {
              ...camp.posts[platform],
              headline: result.headline || camp.posts[platform].headline,
              body: result.body,
              hashtags: normalizeHashtags(result.hashtags),
              analysisNote: result.analysisNote,
            },
          },
        };
      });
      showToast('Updated draft with editorial refinement.');
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Refinement failed. Please try again.';
      setWorkspaceError(message);
    } finally {
      setRefiningPlatform(null);
    }
  };

  const handleSelectCampaign = (id: string) => {
    const selected = campaigns.find((c) => c.id === id);
    if (!selected) return;
    setActiveCampaignId(selected.id);
    setIdea(selected.idea);
    setTone(selected.tone);
    setImageSize(selected.imageSize);
    setImageModel(selected.imageModel);
    setUseRealTimeData(selected.useRealTimeData !== false);
    setAspectRatios({
      linkedin: selected.posts.linkedin.aspectRatio,
      twitter: selected.posts.twitter.aspectRatio,
      instagram: selected.posts.instagram.aspectRatio,
    });
    setBriefError(null);
    setWorkspaceError(null);
    showToast(`Loaded "${selected.title}"`, 'info');
  };

  const handleDeleteCampaign = (id: string) => {
    if (campaigns.length <= 1) return;
    const removed = campaigns.find((c) => c.id === id);
    const remaining = campaigns.filter((c) => c.id !== id);
    setCampaigns(remaining);
    if (activeCampaignId === id && remaining.length > 0) {
      const next = remaining[0];
      setActiveCampaignId(next.id);
      setIdea(next.idea);
      setTone(next.tone);
      setImageSize(next.imageSize);
      setImageModel(next.imageModel);
      setUseRealTimeData(next.useRealTimeData !== false);
      setAspectRatios({
        linkedin: next.posts.linkedin.aspectRatio,
        twitter: next.posts.twitter.aspectRatio,
        instagram: next.posts.instagram.aspectRatio,
      });
    }
    if (removed) {
      showToast(`Deleted "${removed.title}"`, 'info');
    }
  };

  const handleNewBrief = () => {
    setIdea('');
    setBriefError(null);
    setWorkspaceError(null);
    setActiveView('all');
    textareaRef.current?.focus();
    textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    showToast('Ready for a new campaign brief.', 'info');
  };

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(formatCampaignForClipboard(activeCampaign));
      setCopiedAll(true);
      showToast('Copied all 3 platform drafts to clipboard.');
      window.setTimeout(() => setCopiedAll(false), 1800);
    } catch {
      // Ignore clipboard failures in restricted frames
    }
  };

  const visiblePlatforms: PlatformId[] =
    activeView === 'all' ? ALL_PLATFORMS : [activeView];

  const lightboxPost = lightboxPlatform
    ? activeCampaign.posts[lightboxPlatform]
    : null;

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#F2D7EE] text-[#0E103D] pb-20 md:pb-0">
      <a
        href="#main-workspace"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2.5 focus:rounded-xl focus:bg-[#0E103D] focus:text-[#F2D7EE] focus:text-sm focus:font-semibold"
      >
        Skip to campaign drafts
      </a>

      <TopBar
        activeView={activeView}
        onSelectView={setActiveView}
        onNewBrief={handleNewBrief}
      />

      <div className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex flex-col lg:flex-row gap-6 lg:gap-8">
        <ComposerRail
          idea={idea}
          onIdeaChange={(val) => {
            setIdea(val);
            if (briefError) setBriefError(null);
          }}
          tone={tone}
          onToneChange={setTone}
          imageSize={imageSize}
          onImageSizeChange={(size) => {
            setImageSize(size);
            updateCampaign(activeCampaign.id, (camp) => ({
              ...camp,
              imageSize: size,
              posts: {
                linkedin: { ...camp.posts.linkedin, imageSize: size },
                twitter: { ...camp.posts.twitter, imageSize: size },
                instagram: { ...camp.posts.instagram, imageSize: size },
              },
            }));
          }}
          imageModel={imageModel}
          onImageModelChange={(model) => {
            setImageModel(model);
            updateCampaign(activeCampaign.id, (camp) => ({
              ...camp,
              imageModel: model,
              posts: {
                linkedin: { ...camp.posts.linkedin, imageModel: model },
                twitter: { ...camp.posts.twitter, imageModel: model },
                instagram: { ...camp.posts.instagram, imageModel: model },
              },
            }));
          }}
          useRealTimeData={useRealTimeData}
          onToggleRealTimeData={() => setUseRealTimeData((prev) => !prev)}
          aspectRatios={aspectRatios}
          onAspectRatioChange={(platform, ratio) => {
            setAspectRatios((prev) => ({ ...prev, [platform]: ratio }));
            updatePlatformPost(activeCampaign.id, platform, (post) => ({
              ...post,
              aspectRatio: ratio,
            }));
          }}
          onResetAspectRatios={() => {
            setAspectRatios({ ...DEFAULT_PLATFORM_RATIOS });
            updateCampaign(activeCampaign.id, (camp) => ({
              ...camp,
              posts: {
                linkedin: {
                  ...camp.posts.linkedin,
                  aspectRatio: DEFAULT_PLATFORM_RATIOS.linkedin,
                },
                twitter: {
                  ...camp.posts.twitter,
                  aspectRatio: DEFAULT_PLATFORM_RATIOS.twitter,
                },
                instagram: {
                  ...camp.posts.instagram,
                  aspectRatio: DEFAULT_PLATFORM_RATIOS.instagram,
                },
              },
            }));
            showToast('Aspect ratios reset to platform defaults.', 'info');
          }}
          briefError={briefError}
          isGenerating={isGeneratingPosts}
          onGenerate={handleGenerateCampaign}
          campaigns={campaigns}
          activeCampaignId={activeCampaign.id}
          onSelectCampaign={handleSelectCampaign}
          onDeleteCampaign={handleDeleteCampaign}
          onLoadSampleBrief={(label) => showToast(`Loaded "${label}" sample brief.`, 'info')}
          textareaRef={textareaRef}
        />

        <main id="main-workspace" className="flex-1 min-w-0 space-y-6">
          {/* Active Campaign Editorial Header */}
          <div className="brand-card rounded-2xl px-5 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0 space-y-1.5">
              <h2 className="font-display text-2xl sm:text-[26px] font-bold tracking-tight text-[#0E103D] leading-[1.2] text-balance">
                {activeCampaign.title}
              </h2>
              <div className="text-xs text-[#3A2A54] flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>
                  <span className="capitalize font-medium">{activeCampaign.tone}</span> tone
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{imageSize} resolution</span>
                <span aria-hidden="true">·</span>
                <span>
                  {imageModel === 'gemini-3-pro-image-preview'
                    ? 'Gemini 3 Pro Image'
                    : 'Nano Banana 2.1'}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {useRealTimeData ? 'Live Search grounding' : 'Offline brief only'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleRenderAllVisuals}
                disabled={isGeneratingPosts}
                className="btn-secondary min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#69306D]" aria-hidden="true" />
                <span>Render All Visuals</span>
              </button>
              <button
                type="button"
                onClick={handleCopyAll}
                disabled={isGeneratingPosts}
                className="btn-secondary min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap cursor-pointer"
              >
                {copiedAll ? (
                  <>
                    <Check className="w-4 h-4 text-[#69306D]" aria-hidden="true" />
                    <span>Copied All</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#69306D]" aria-hidden="true" />
                    <span>Copy All</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Live Google Search Grounding Sources Strip */}
          {activeCampaign.grounding && !isGeneratingPosts && (
            <GroundingPanel
              grounding={activeCampaign.grounding}
              isSample={activeCampaign.isSample}
            />
          )}

          {/* Workspace Error Alert */}
          {workspaceError && (
            <div
              role="alert"
              className="rounded-2xl border-[1.5px] border-[#69306D] bg-[#FAF2F8] px-5 py-4 text-sm text-[#0E103D] shadow-sm flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <AlertCircle
                  className="w-5 h-5 text-[#69306D] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <p className="text-sm font-medium leading-relaxed">{workspaceError}</p>
              </div>
              <button
                type="button"
                onClick={() => setWorkspaceError(null)}
                aria-label="Dismiss error message"
                title="Dismiss error message"
                className="btn-ghost min-w-[36px] min-h-[36px] inline-flex items-center justify-center rounded-lg shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4 text-[#0E103D]" aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Cross-Platform Editorial Spread */}
          <section
            aria-label="Generated social media drafts"
            className={
              activeView === 'all'
                ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start'
                : 'max-w-5xl'
            }
          >
            {visiblePlatforms.map((platform) => {
              const post = activeCampaign.posts[platform];
              return (
                <PlatformCard
                  key={`${activeCampaign.id}-${platform}`}
                  post={post}
                  isFocused={activeView !== 'all'}
                  isGeneratingPost={isGeneratingPosts}
                  isRefining={refiningPlatform === platform}
                  onUpdateBody={(body) =>
                    updatePlatformPost(activeCampaign.id, platform, (prev) => ({
                      ...prev,
                      body,
                    }))
                  }
                  onUpdateHashtags={(hashtags) =>
                    updatePlatformPost(activeCampaign.id, platform, (prev) => ({
                      ...prev,
                      hashtags,
                    }))
                  }
                  onUpdateImagePrompt={(prompt) =>
                    updatePlatformPost(activeCampaign.id, platform, (prev) => ({
                      ...prev,
                      imagePrompt: prompt,
                    }))
                  }
                  onChangeAspectRatio={(ratio) => {
                    setAspectRatios((prev) => ({ ...prev, [platform]: ratio }));
                    updatePlatformPost(activeCampaign.id, platform, (prev) => ({
                      ...prev,
                      aspectRatio: ratio,
                    }));
                  }}
                  onRegenerateImage={() =>
                    triggerSingleImageRender(activeCampaign.id, platform, {
                      prompt: post.imagePrompt,
                      aspectRatio: post.aspectRatio,
                      imageSize,
                      model: imageModel,
                      useRealTimeVisuals: useRealTimeData,
                    })
                  }
                  onInspectVisual={() => setLightboxPlatform(platform)}
                  onRefinePost={(instruction, mode) =>
                    handleRefinePlatform(platform, instruction, mode)
                  }
                  onDismissAnalysis={() =>
                    updatePlatformPost(activeCampaign.id, platform, (prev) => ({
                      ...prev,
                      analysisNote: undefined,
                    }))
                  }
                  onFocusPlatform={
                    activeView === 'all' ? () => setActiveView(platform) : undefined
                  }
                  onCopiedPost={(name) => showToast(`Copied ${name} post to clipboard.`)}
                />
              );
            })}
          </section>
        </main>
      </div>

      {/* Ergonomic Mobile Thumb-Zone Bottom Navigation */}
      <MobileBottomNav activeView={activeView} onSelectView={setActiveView} />

      {/* Non-Blocking Feedback Toast */}
      <ToastBanner toast={toast} onDismiss={() => setToast(null)} />

      {/* High-Resolution Visual Inspector Modal */}
      <VisualLightbox
        post={lightboxPost}
        onClose={() => setLightboxPlatform(null)}
        onUpdateImagePrompt={(prompt) => {
          if (!lightboxPlatform) return;
          updatePlatformPost(activeCampaign.id, lightboxPlatform, (prev) => ({
            ...prev,
            imagePrompt: prompt,
          }));
        }}
        onRegenerate={() => {
          if (!lightboxPlatform || !lightboxPost) return;
          triggerSingleImageRender(activeCampaign.id, lightboxPlatform, {
            prompt: lightboxPost.imagePrompt,
            aspectRatio: lightboxPost.aspectRatio,
            imageSize,
            model: imageModel,
            useRealTimeVisuals: useRealTimeData,
          });
        }}
      />
    </div>
  );
}
