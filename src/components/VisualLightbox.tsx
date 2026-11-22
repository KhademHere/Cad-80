import { Download, ExternalLink, RefreshCw, X } from 'lucide-react';
import { useEffect } from 'react';
import { handleLiquidPointerMove } from '../hooks/useLiquidPointer';
import {
  ASPECT_RATIO_META,
  PLATFORM_SPECS,
  extractSourceHostname,
} from '../lib/campaign';
import type { PlatformPost } from '../types/campaign';

interface VisualLightboxProps {
  post: PlatformPost | null;
  onClose: () => void;
  onUpdateImagePrompt: (prompt: string) => void;
  onRegenerate: () => void;
}

export function VisualLightbox({
  post,
  onClose,
  onUpdateImagePrompt,
  onRegenerate,
}: VisualLightboxProps) {
  useEffect(() => {
    if (!post) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [post, onClose]);

  if (!post) return null;

  const spec = PLATFORM_SPECS[post.platform];
  const ratioMeta = ASPECT_RATIO_META[post.aspectRatio];

  const handleDownload = () => {
    if (!post.imageUrl) return;
    const link = document.createElement('a');
    link.href = post.imageUrl;
    const safeRatio = post.aspectRatio.replace(':', 'x');
    link.download = `kadrant-${post.platform}-${safeRatio}-${post.imageSize}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${spec.name} visual inspector`}
      className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="liquid-glass-modal rounded-[28px] max-w-5xl w-full max-h-[90vh] overflow-hidden grid grid-cols-1 lg:grid-cols-12"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Visual Preview Canvas */}
        <div className="lg:col-span-7 bg-slate-950/92 flex items-center justify-center p-4 sm:p-6 min-h-[280px]">
          {post.imageUrl ? (
            <img
              src={post.imageUrl}
              alt={`${spec.name} high-resolution visual (${post.aspectRatio})`}
              referrerPolicy="no-referrer"
              style={{ aspectRatio: ratioMeta.cssRatio }}
              className="max-h-[72vh] w-auto max-w-full object-contain rounded-[18px] shadow-2xl ring-1 ring-white/15"
            />
          ) : (
            <p className="text-xs text-slate-400">No visual rendered yet.</p>
          )}
        </div>

        {/* Art Direction & Grounding Inspector */}
        <div className="relative z-10 lg:col-span-5 p-5 sm:p-6 flex flex-col justify-between gap-5 overflow-y-auto">
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-3 pb-4 border-b liquid-divider">
              <div>
                <h3 className="font-display text-lg font-semibold text-slate-950">
                  {spec.name} Visual
                </h3>
                <p className="mt-0.5 text-xs text-slate-600 font-mono tabular-nums">
                  {ratioMeta.label} · {post.imageSize} ·{' '}
                  {post.imageModel === 'gemini-3-pro-image-preview'
                    ? 'Gemini 3 Pro'
                    : 'Nano Banana 2.1'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                onPointerMove={handleLiquidPointerMove}
                aria-label="Close visual inspector"
                className="liquid-glass-btn p-2 text-slate-600 hover:text-slate-950 rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="lightbox-art-prompt"
                className="block text-xs font-semibold text-slate-900"
              >
                Art-direction prompt
              </label>
              <textarea
                id="lightbox-art-prompt"
                rows={5}
                value={post.imagePrompt}
                onChange={(e) => onUpdateImagePrompt(e.target.value)}
                className="liquid-glass-well w-full rounded-[14px] px-3.5 py-2.5 text-xs text-slate-900 leading-relaxed"
              />
            </div>

            {post.visualSources && post.visualSources.length > 0 && (
              <div className="space-y-2 pt-3 border-t liquid-divider">
                <p className="text-xs font-semibold text-slate-900">
                  Real-time visual references
                </p>
                <ul className="space-y-1.5">
                  {post.visualSources.map((src) => (
                    <li key={src.uri}>
                      <a
                        href={src.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-900 underline underline-offset-4 decoration-blue-300"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
                        <span className="truncate">{src.title}</span>
                        <span className="text-slate-500 no-underline">
                          · {extractSourceHostname(src.uri)}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 pt-4 border-t liquid-divider">
            <button
              type="button"
              onClick={onRegenerate}
              onPointerMove={handleLiquidPointerMove}
              disabled={post.imageStatus === 'loading'}
              className="liquid-glass-btn-primary flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white rounded-full cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${post.imageStatus === 'loading' ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              Re-render Visual
            </button>
            {post.imageUrl && (
              <button
                type="button"
                onClick={handleDownload}
                onPointerMove={handleLiquidPointerMove}
                className="liquid-glass-btn inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-900 rounded-full cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                Download
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
