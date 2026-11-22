import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  DEFAULT_PLATFORM_RATIOS,
  isValidAspectRatio,
  isValidImageModel,
  isValidImageSize,
  isValidTone,
  validateBrief,
} from './src/lib/campaign.ts';
import {
  classifyGeminiError,
  generateCrossPlatformPosts,
  generatePlatformImage,
  refinePlatformPost,
} from './src/server/gemini.ts';
import type { AspectRatioOption, PlatformId } from './src/types/campaign.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '4mb' }));

  app.post('/api/generate-posts', async (req, res) => {
    try {
      const { idea, tone, aspectRatios } = req.body ?? {};
      const validation = validateBrief(typeof idea === 'string' ? idea : '');
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }
      if (typeof tone !== 'string' || !isValidTone(tone)) {
        return res.status(400).json({ error: 'Invalid tone. Choose professional, witty, or urgent.' });
      }

      const safeRatios: Record<PlatformId, AspectRatioOption> = {
        linkedin:
          typeof aspectRatios?.linkedin === 'string' && isValidAspectRatio(aspectRatios.linkedin)
            ? aspectRatios.linkedin
            : DEFAULT_PLATFORM_RATIOS.linkedin,
        twitter:
          typeof aspectRatios?.twitter === 'string' && isValidAspectRatio(aspectRatios.twitter)
            ? aspectRatios.twitter
            : DEFAULT_PLATFORM_RATIOS.twitter,
        instagram:
          typeof aspectRatios?.instagram === 'string' && isValidAspectRatio(aspectRatios.instagram)
            ? aspectRatios.instagram
            : DEFAULT_PLATFORM_RATIOS.instagram,
      };

      const result = await generateCrossPlatformPosts({
        idea: idea.trim(),
        tone,
        aspectRatios: safeRatios,
      });

      return res.json(result);
    } catch (error) {
      const classified = classifyGeminiError(error, 'text');
      return res.status(classified.status).json({ error: classified.message });
    }
  });

  app.post('/api/generate-image', async (req, res) => {
    try {
      const { prompt, aspectRatio, imageSize, model } = req.body ?? {};
      if (typeof prompt !== 'string' || prompt.trim().length < 5) {
        return res.status(400).json({ error: 'Provide a descriptive visual prompt (at least 5 characters).' });
      }
      if (typeof aspectRatio !== 'string' || !isValidAspectRatio(aspectRatio)) {
        return res.status(400).json({ error: 'Unsupported aspect ratio.' });
      }
      if (typeof imageSize !== 'string' || !isValidImageSize(imageSize)) {
        return res.status(400).json({ error: 'Unsupported image size. Choose 1K, 2K, or 4K.' });
      }
      const resolvedModel =
        typeof model === 'string' && isValidImageModel(model)
          ? model
          : 'gemini-3-pro-image-preview';

      const result = await generatePlatformImage({
        prompt: prompt.trim(),
        aspectRatio,
        imageSize,
        model: resolvedModel,
      });

      return res.json({
        imageUrl: result.imageUrl,
        model: result.model,
        aspectRatio,
        imageSize,
      });
    } catch (error) {
      const classified = classifyGeminiError(error, 'image');
      return res.status(classified.status).json({ error: classified.message });
    }
  });

  app.post('/api/refine-post', async (req, res) => {
    try {
      const { platform, tone, idea, currentBody, currentHashtags, instruction, mode } = req.body ?? {};
      if (platform !== 'linkedin' && platform !== 'twitter' && platform !== 'instagram') {
        return res.status(400).json({ error: 'Invalid platform.' });
      }
      if (typeof tone !== 'string' || !isValidTone(tone)) {
        return res.status(400).json({ error: 'Invalid tone.' });
      }
      if (typeof currentBody !== 'string' || !currentBody.trim()) {
        return res.status(400).json({ error: 'Cannot refine an empty post.' });
      }
      if (typeof instruction !== 'string' || !instruction.trim()) {
        return res.status(400).json({ error: 'Provide a refinement instruction.' });
      }

      const result = await refinePlatformPost({
        platform,
        tone,
        idea: typeof idea === 'string' ? idea : '',
        currentBody,
        currentHashtags: Array.isArray(currentHashtags) ? currentHashtags : [],
        instruction: instruction.trim(),
        mode: mode === 'analyze' ? 'analyze' : 'quick_edit',
      });

      return res.json(result);
    } catch (error) {
      const classified = classifyGeminiError(error, 'text');
      return res.status(classified.status).json({ error: classified.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cadence server listening on http://localhost:${PORT}`);
  });
}

startServer();
