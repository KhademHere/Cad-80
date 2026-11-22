import { AlertCircle, Check, Copy, RefreshCw, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ComposerRail } from './components/ComposerRail';
import { PlatformCard } from './components/PlatformCard';
import { TopBar } from './components/TopBar';
import { SAMPLE_CAMPAIGN } from './data/samples';
import {
  ALL_PLATFORMS,
  DEFAULT_PLATFORM_RATIOS,
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

const STORAGE_KEY = 'cadence_campaigns_v1';

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

  const activeCampaign =
    campaigns.find((c) => c.id === activeCampaignId) ?? campaigns[0];

  const [idea, setIdea] = useState<string>(activeCampaign.idea);
  const [tone, setTone] = useState<ToneOption>(activeCampaign.tone);
  const [imageSize, setImageSize] = useState<ImageSizeOption>(activeCampaign.imageSize);
  const [imageModel, setImageModel] = useState<ImageModelOption>(activeCampaign.imageModel);
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

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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
      const result = await requestGenerateImage(params);
      updatePlatformPost(campaignId, platform, (post) => ({
        ...post,
        imageUrl: result.imageUrl,
        imageModel: result.model,
        aspectRatio: result.aspectRatio,
        imageSize: result.imageSize,
        imageStatus: 'ready',
        imageError: undefined,
      }));
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Failed to generate image for this platform.';
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
      setBriefError(validation.error);
      textareaRef.current?.focus();
      return;
    }

    setBriefError(null);
    setWorkspaceError(null);
    setIsGeneratingPosts(true);

    const newId = `camp-${Date.now()}`;
    const trimmedIdea = idea.trim();

    const placeholderPosts = {} as Record<PlatformId, PlatformPost>;
    for (const platform of ALL_PLATFORMS) {
      placeholderPosts[platform] = {
        platform,
        headline: '',
        body: '',
        hashtags: [],
        imagePrompt: '',
        aspectRatio: aspectRatios[platform],
        imageSize,
        imageModel,
        imageUrl: null,
        imageStatus: 'loading',
      };
    }

    const pendingCampaign: CampaignDraft = {
      id: newId,
      title: 'Drafting campaign...',
      idea: trimmedIdea,
      tone,
      imageSize,
      imageModel,
      createdAt: new Date().toISOString(),
      posts: placeholderPosts,
    };

    const previousId = activeCampaign.id;
    setCampaigns((prev) => [pendingCampaign, ...prev]);
    setActiveCampaignId(newId);

    try {
      const generated = await requestGeneratePosts({
        idea: trimmedIdea,
        tone,
        aspectRatios,
      });

      const hydratedPosts = {} as Record<PlatformId, PlatformPost>;
      for (const platform of ALL_PLATFORMS) {
        const draftPost = generated.posts[platform];
        hydratedPosts[platform] = {
          platform,
          headline: draftPost.headline,
          body: draftPost.body,
          hashtags: normalizeHashtags(draftPost.hashtags ?? []),
          imagePrompt: draftPost.imagePrompt,
          aspectRatio: aspectRatios[platform],
          imageSize,
          imageModel,
          imageUrl: null,
          imageStatus: 'loading',
        };
      }

      updateCampaign(newId, (camp) => ({
        ...camp,
        title: generated.title,
        posts: hydratedPosts,
      }));

      setIsGeneratingPosts(false);

      await Promise.allSettled(
        ALL_PLATFORMS.map((platform) =>
          triggerSingleImageRender(newId, platform, {
            prompt: hydratedPosts[platform].imagePrompt,
            aspectRatio: aspectRatios[platform],
            imageSize,
            model: imageModel,
          })
        )
      );
    } catch (error) {
      setIsGeneratingPosts(false);
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Unable to draft campaign posts right now. Please try again.';
      setWorkspaceError(message);
      setCampaigns((prev) => prev.filter((c) => c.id !== newId));
      setActiveCampaignId(previousId);
    }
  };

  const handleSelectCampaign = (id: string) => {
    const found = campaigns.find((c) => c.id === id);
    if (!found) return;
    setActiveCampaignId(found.id);
    setIdea(found.idea);
    setTone(found.tone);
    setImageSize(found.imageSize);
    setImageModel(found.imageModel);
    setAspectRatios({
      linkedin: found.posts.linkedin.aspectRatio,
      twitter: found.posts.twitter.aspectRatio,
      instagram: found.posts.instagram.aspectRatio,
    });
    setBriefError(null);
    setWorkspaceError(null);
  };

  const handleDeleteCampaign = (id: string) => {
    setCampaigns((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((c) => c.id !== id);
      if (id === activeCampaignId && next.length > 0) {
        setActiveCampaignId(next[0].id);
        setIdea(next[0].idea);
        setTone(next[0].tone);
      }
      return next;
    });
  };

  const handleNewBrief = () => {
    setIdea('');
    setBriefError(null);
    setWorkspaceError(null);
    textareaRef.current?.focus();
  };

  const handleRefinePost = async (
    platform: PlatformId,
    instruction: string,
    mode: 'quick_edit' | 'analyze'
  ) => {
    const post = activeCampaign.posts[platform];
    setRefiningPlatform(platform);
    setWorkspaceError(null);

    try {
      const refined = await requestRefinePost({
        platform,
        tone: activeCampaign.tone,
        idea: activeCampaign.idea,
        currentBody: post.body,
        currentHashtags: post.hashtags,
        instruction,
        mode,
      });

      updatePlatformPost(activeCampaign.id, platform, (prev) => ({
        ...prev,
        headline: refined.headline || prev.headline,
        body: refined.body || prev.body,
        hashtags: normalizeHashtags(refined.hashtags ?? prev.hashtags),
        analysisNote: refined.analysisNote,
      }));
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Could not refine this draft right now.';
      setWorkspaceError(message);
    } finally {
      setRefiningPlatform(null);
    }
  };

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(formatCampaignForClipboard(activeCampaign));
      setCopiedAll(true);
      window.setTimeout(() => setCopiedAll(false), 1800);
    } catch {
      // Ignore clipboard unavailability
    }
  };

  const handleRenderAllVisuals = () => {
    for (const platform of ALL_PLATFORMS) {
      const post = activeCampaign.posts[platform];
      void triggerSingleImageRender(activeCampaign.id, platform, {
        prompt: post.imagePrompt,
        aspectRatio: post.aspectRatio,
        imageSize,
        model: imageModel,
      });
    }
  };

  const visiblePlatforms: PlatformId[] =
    activeView === 'all' ? ALL_PLATFORMS : [activeView];

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#F8F9FB] text-slate-900">
      <TopBar
        activeView={activeView}
        onSelectView={setActiveView}
        onNewBrief={handleNewBrief}
      />

      <div className="flex-1 max-w-[1600px] w-full mx-auto flex flex-col lg:flex-row">
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
          }}
          briefError={briefError}
          isGenerating={isGeneratingPosts}
          onGenerate={handleGenerateCampaign}
          campaigns={campaigns}
          activeCampaignId={activeCampaign.id}
          onSelectCampaign={handleSelectCampaign}
          onDeleteCampaign={handleDeleteCampaign}
          textareaRef={textareaRef}
        />

        <main className="flex-1 min-w-0 p-5 sm:p-6 lg:p-8 space-y-6">
          {/* Active Campaign Editorial Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-200">
            <div className="min-w-0 space-y-1">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-950 text-balance">
                {activeCampaign.title}
              </h2>
              <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>
                  <span className="capitalize">{activeCampaign.tone}</span> tone
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{imageSize} resolution</span>
                <span aria-hidden="true">·</span>
                <span>
                  {imageModel === 'gemini-3-pro-image-preview'
                    ? 'Gemini 3 Pro Image'
                    : 'Nano Banana 2.1'}
                </span>
                {activeCampaign.isSample && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>Sample campaign</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleRenderAllVisuals}
                disabled={isGeneratingPosts}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                Render All Visuals
              </button>
              <button
                type="button"
                onClick={handleCopyAll}
                disabled={isGeneratingPosts}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
              >
                {copiedAll ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                    Copied All
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                    Copy All
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Workspace Error Alert */}
          {workspaceError && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-900 flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle
                  className="w-4 h-4 text-red-600 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <p className="text-xs sm:text-sm leading-relaxed">{workspaceError}</p>
              </div>
              <button
                type="button"
                onClick={() => setWorkspaceError(null)}
                aria-label="Dismiss error message"
                className="p-1 text-red-500 hover:text-red-800 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" aria-hidden="true" />
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
                  onUpdateImagePrompt={(imagePrompt) =>
                    updatePlatformPost(activeCampaign.id, platform, (prev) => ({
                      ...prev,
                      imagePrompt,
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
                    void triggerSingleImageRender(activeCampaign.id, platform, {
                      prompt: post.imagePrompt,
                      aspectRatio: post.aspectRatio,
                      imageSize,
                      model: imageModel,
                    })
                  }
                  onRefinePost={(instruction, mode) =>
                    void handleRefinePost(platform, instruction, mode)
                  }
                  onDismissAnalysis={() =>
                    updatePlatformPost(activeCampaign.id, platform, (prev) => ({
                      ...prev,
                      analysisNote: undefined,
                    }))
                  }
                  onFocusPlatform={
                    activeView === 'all'
                      ? () => setActiveView(platform)
                      : undefined
                  }
                />
              );
            })}
          </section>
        </main>
      </div>
    </div>
  );
}
