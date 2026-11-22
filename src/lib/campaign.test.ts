import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_ASPECT_RATIOS,
  ALL_IMAGE_SIZES,
  DEFAULT_PLATFORM_RATIOS,
  TWITTER_CHAR_LIMIT,
  analyzePostMetrics,
  dedupeGroundingSources,
  deserializeCampaignsFromStorage,
  extractSourceHostname,
  formatCampaignForClipboard,
  formatPostForClipboard,
  formatRelativeTimestamp,
  normalizeHashtags,
  parseHashtagInput,
  serializeCampaignsForStorage,
  validateBrief,
} from './campaign';
import type { CampaignDraft, PlatformPost } from '../types/campaign';

const sampleTwitterPost: PlatformPost = {
  platform: 'twitter',
  headline: 'Grid independence without the noise',
  body: 'Blackouts used to mean generators and guesswork. Our neighborhood microgrid switches in 12ms—quiet enough you only notice when the streetlights go dark.',
  hashtags: [],
  imagePrompt: 'Minimalist slate battery unit on concrete wall',
  aspectRatio: '3:2',
  imageSize: '2K',
  imageModel: 'gemini-3-pro-image-preview',
  imageUrl: '/src/assets/images/test.jpg',
  imageStatus: 'ready',
};

const sampleInstagramPost: PlatformPost = {
  platform: 'instagram',
  headline: 'Dusk across the block',
  body: 'Warm lamps on, zero grid draw. Sunlight stored at noon powers the whole evening.',
  hashtags: ['CleanEnergy', '#microgrid', 'cleanenergy', 'NeighborhoodSolar'],
  imagePrompt: 'Warm living room at dusk',
  aspectRatio: '3:4',
  imageSize: '2K',
  imageModel: 'gemini-3-pro-image-preview',
  imageUrl: '/src/assets/images/ig.jpg',
  imageStatus: 'ready',
};

const sampleLinkedInPost: PlatformPost = {
  platform: 'linkedin',
  headline: 'Why neighborhood storage outperforms isolated home backups',
  body: 'Over the past 18 months we tested shared solar storage across 42 homes.\n\nPooling capacity cut peak curtailment by 61% and kept critical circuits online through three winter storms.',
  hashtags: ['#EnergyTransition', '#GridResilience'],
  imagePrompt: 'Architectural solar pavilion at golden hour',
  aspectRatio: '16:9',
  imageSize: '2K',
  imageModel: 'gemini-3-pro-image-preview',
  imageUrl: '/src/assets/images/li.jpg',
  imageStatus: 'ready',
};

test('validateBrief rejects empty, too-short, and overly long briefs', () => {
  assert.equal(validateBrief('').valid, false);
  assert.equal(validateBrief('   ').valid, false);
  assert.equal(validateBrief('Too short').valid, false);
  assert.equal(validateBrief('a'.repeat(1501)).valid, false);
  assert.equal(
    validateBrief('Launch our autonomous neighborhood solar microgrid battery this spring.').valid,
    true
  );
});

test('all required image sizes and aspect ratios are supported', () => {
  assert.deepEqual(ALL_IMAGE_SIZES, ['1K', '2K', '4K']);
  assert.deepEqual(ALL_ASPECT_RATIOS, [
    '1:1',
    '2:3',
    '3:2',
    '3:4',
    '4:3',
    '9:16',
    '16:9',
    '21:9',
  ]);
  assert.equal(DEFAULT_PLATFORM_RATIOS.linkedin, '16:9');
  assert.equal(DEFAULT_PLATFORM_RATIOS.twitter, '3:2');
  assert.equal(DEFAULT_PLATFORM_RATIOS.instagram, '3:4');
});

test('normalizeHashtags deduplicates case-insensitively and strips invalid symbols', () => {
  assert.deepEqual(
    normalizeHashtags(['CleanEnergy', '#microgrid', 'cleanenergy', '  #Solar-Power! ']),
    ['#CleanEnergy', '#microgrid', '#SolarPower']
  );
  assert.deepEqual(
    parseHashtagInput('Design, #ProductLaunch  studio_life'),
    ['#Design', '#ProductLaunch', '#studio_life']
  );
});

test('analyzePostMetrics accurately computes character limits and flags X overflow', () => {
  const withinLimit = analyzePostMetrics(sampleTwitterPost);
  assert.equal(withinLimit.isOverLimit, false);
  assert.equal(withinLimit.charLimit, TWITTER_CHAR_LIMIT);
  assert.ok(withinLimit.wordCount > 15);

  const overflowing: PlatformPost = {
    ...sampleTwitterPost,
    body: 'x'.repeat(295),
  };
  const overMetrics = analyzePostMetrics(overflowing);
  assert.equal(overMetrics.isOverLimit, true);
  assert.equal(overMetrics.utilizationPercent, 100);
});

test('formatPostForClipboard appends deduplicated hashtags for Instagram and LinkedIn', () => {
  const igFormatted = formatPostForClipboard(sampleInstagramPost);
  assert.ok(igFormatted.includes('#CleanEnergy #microgrid #NeighborhoodSolar'));

  const xFormatted = formatPostForClipboard(sampleTwitterPost);
  assert.equal(xFormatted, sampleTwitterPost.body);
});

test('formatCampaignForClipboard compiles all three platforms cleanly', () => {
  const draft: CampaignDraft = {
    id: 'camp-1',
    title: 'Neighborhood Solar Launch',
    idea: 'Shared neighborhood solar microgrid battery',
    tone: 'professional',
    imageSize: '2K',
    imageModel: 'gemini-3-pro-image-preview',
    useRealTimeData: true,
    createdAt: '2026-11-21T20:00:00.000Z',
    posts: {
      linkedin: sampleLinkedInPost,
      twitter: sampleTwitterPost,
      instagram: sampleInstagramPost,
    },
  };

  const exported = formatCampaignForClipboard(draft);
  assert.ok(exported.includes('LinkedIn (Long-form editorial · 16:9 · 2K)'));
  assert.ok(exported.includes('X / Twitter (Short & punchy · 3:2 · 2K)'));
  assert.ok(exported.includes('Instagram (Visual & hashtags · 3:4 · 2K)'));
});

test('serializeCampaignsForStorage strips oversized base64 data URLs while keeping static URLs', () => {
  const hugeDataUrl = `data:image/png;base64,${'A'.repeat(250_000)}`;
  const draft: CampaignDraft = {
    id: 'camp-2',
    title: 'Storage Safety',
    idea: 'Testing localStorage persistence',
    tone: 'witty',
    imageSize: '4K',
    imageModel: 'gemini-3-pro-image-preview',
    useRealTimeData: true,
    createdAt: '2026-11-21T20:00:00.000Z',
    posts: {
      linkedin: { ...sampleLinkedInPost, imageUrl: hugeDataUrl },
      twitter: sampleTwitterPost,
      instagram: sampleInstagramPost,
    },
  };

  const serialized = serializeCampaignsForStorage([draft]);
  const restored = deserializeCampaignsFromStorage(serialized);
  assert.equal(restored.length, 1);
  assert.equal(restored[0].posts.linkedin.imageUrl, null);
  assert.equal(restored[0].posts.linkedin.imageStatus, 'idle');
  assert.equal(restored[0].posts.twitter.imageUrl, '/src/assets/images/test.jpg');
});

test('dedupeGroundingSources filters invalid URLs, deduplicates, and extracts hostnames', () => {
  const cleaned = dedupeGroundingSources([
    { title: 'IEA Report', uri: 'https://www.iea.org/reports/renewables' },
    { title: 'Duplicate IEA', uri: 'https://www.iea.org/reports/renewables' },
    { title: 'Bad protocol', uri: 'javascript:alert(1)' },
    { uri: 'https://example.com/news' },
  ]);
  assert.equal(cleaned.length, 2);
  assert.equal(cleaned[0].title, 'IEA Report');
  assert.equal(cleaned[1].title, 'example.com');
  assert.equal(extractSourceHostname('https://www.iea.org/reports/renewables'), 'iea.org');
});

test('formatRelativeTimestamp returns human-readable elapsed labels', () => {
  const now = Date.parse('2026-11-21T21:00:00.000Z');
  assert.equal(formatRelativeTimestamp('2026-11-21T20:59:30.000Z', now), 'Just now');
  assert.equal(formatRelativeTimestamp('2026-11-21T20:45:00.000Z', now), '15m ago');
  assert.equal(formatRelativeTimestamp('2026-11-21T18:00:00.000Z', now), '3h ago');
  assert.equal(formatRelativeTimestamp('2026-11-19T21:00:00.000Z', now), '2d ago');
});
