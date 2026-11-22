import type { CampaignDraft, ToneOption } from '../types/campaign';

export const SAMPLE_CAMPAIGN: CampaignDraft = {
  id: 'sample-solgrid-launch',
  title: 'HelioBlock Neighborhood Microgrid Launch',
  idea: 'Announcing HelioBlock, our shared neighborhood solar battery pavilion that lets 40 homes pool rooftop solar and ride through grid outages silently with 12ms automatic switchover.',
  tone: 'professional',
  imageSize: '2K',
  imageModel: 'gemini-3-pro-image-preview',
  useRealTimeData: true,
  createdAt: '2026-11-21T20:15:00.000Z',
  isSample: true,
  grounding: {
    summary:
      'Sample showcase campaign illustrating how Kadrant pairs platform-native copy with live Google Search facts and real-time visual context. Generate a new campaign to pull live web and visual references for your brief.',
    queries: [
      'community solar microgrid battery storage trends 2026',
      'modern architectural timber solar pavilion lighting',
    ],
    sources: [],
    groundedAt: '2026-11-21T20:15:00.000Z',
  },
  posts: {
    linkedin: {
      platform: 'linkedin',
      headline: 'Why neighborhood-scale storage outperforms isolated home backups',
      body: `Most residential energy resilience still happens behind individual garage doors. Every house buys its own inverter, oversizes its own battery, and leaves 40% of its capacity idle on mild afternoons.

Today we are opening HelioBlock to municipal partners and residential developers: a shared neighborhood solar microgrid designed for 40-home blocks.

Across our 18-month pilot in three coastal districts, pooling rooftop generation into one architectural courtyard pavilion delivered three measurable shifts:
1. 61% reduction in afternoon solar curtailment during shoulder seasons.
2. Sub-12ms automatic islanding during winter feeder outages—without diesel noise or manual transfer switches.
3. 34% lower per-household capital cost compared to standalone garage installations.

Resilient infrastructure works best when it strengthens the block, not just the individual parcel.

If you are planning community developments or municipal grid-edge upgrades for 2027, we just published the full engineering brief and pilot telemetry. What is the biggest permitting hurdle your team faces on shared storage?`,
      hashtags: ['#EnergyTransition', '#GridResilience', '#CleanTech', '#UrbanInfrastructure'],
      imagePrompt:
        'Cinematic wide-angle architectural editorial photograph of a sleek modern neighborhood solar microgrid pavilion made of brushed dark aluminum, glass, and warm cedar slats at golden hour, sunlit courtyard with subtle greenery, Leica 35mm documentary style.',
      aspectRatio: '16:9',
      imageSize: '2K',
      imageModel: 'gemini-3-pro-image-preview',
      imageUrl: '/src/assets/images/sample_linkedin_microgrid_1795323842864.jpg',
      imageStatus: 'ready',
      usedRealTimeVisuals: true,
    },
    twitter: {
      platform: 'twitter',
      headline: 'Silent 12ms neighborhood backup',
      body: 'Home batteries sit half-idle while the house next door loses power. HelioBlock pools 40 rooftops into one shared microgrid with 12ms switchover—so quiet you only realize the grid dropped when the streetlights go dark.',
      hashtags: [],
      imagePrompt:
        'Crisp editorial studio industrial design photograph of a minimalist matte slate-gray home energy battery unit mounted on a smooth architectural concrete wall, soft angled morning window light casting a sharp diagonal shadow.',
      aspectRatio: '3:2',
      imageSize: '2K',
      imageModel: 'gemini-3-pro-image-preview',
      imageUrl: '/src/assets/images/sample_twitter_module_1795323841808.jpg',
      imageStatus: 'ready',
      usedRealTimeVisuals: true,
    },
    instagram: {
      platform: 'instagram',
      headline: 'Sunlight stored at noon, calm lamps at dusk',
      body: `Blue hour hits differently when the whole block runs on sunlight banked at noon.

Meet HelioBlock—shared neighborhood storage that keeps the reading lamps warm, the espresso machine humming, and the evening completely quiet when storms roll through.

Swipe through our architectural pavilion build and see how 40 households share one clean local grid.`,
      hashtags: [
        '#CleanEnergy',
        '#ModernArchitecture',
        '#SolarLiving',
        '#NeighborhoodMicrogrid',
        '#SustainableDesign',
        '#GridIndependence',
      ],
      imagePrompt:
        'Vertical 3:4 editorial lifestyle photograph of a calm modern minimalist living room at blue hour dusk, warm amber architectural floor lamp illuminating an oak table and linen sofa, large floor-to-ceiling windows overlooking twilight rooftops.',
      aspectRatio: '3:4',
      imageSize: '2K',
      imageModel: 'gemini-3-pro-image-preview',
      imageUrl: '/src/assets/images/sample_instagram_dusk_1795323842512.jpg',
      imageStatus: 'ready',
      usedRealTimeVisuals: true,
    },
  },
};

export interface StarterBrief {
  id: string;
  label: string;
  tone: ToneOption;
  idea: string;
}

export const STARTER_BRIEFS: StarterBrief[] = [
  {
    id: 'brief-tokyo-transit',
    label: 'Live weather & city event',
    tone: 'witty',
    idea: 'Announcing our weekend pop-up espresso bar in Shibuya, Tokyo with a visual matching today’s current Tokyo weather and seasonal street atmosphere.',
  },
  {
    id: 'brief-ai-benchmarks',
    label: 'Current industry trend',
    tone: 'professional',
    idea: 'Sharing our engineering team’s analysis of the latest global renewable energy capacity milestones in 2026 and what utility-scale battery storage means for data centers.',
  },
  {
    id: 'brief-security',
    label: 'Zero-trust patch alert',
    tone: 'urgent',
    idea: 'Critical 48-hour upgrade window for our open-source API gateway v4.2 fixing a high-severity OAuth token replay edge case, with zero-downtime migration scripts ready now.',
  },
];
