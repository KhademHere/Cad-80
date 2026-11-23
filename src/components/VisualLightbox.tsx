import { Download, ExternalLink, RefreshCw, X } from 'lucide-react';
import { useEffect } from 'react';
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
      className="fixed inset-0 z-50 bg-[#0E103D]/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-[#FAF2F8] border border-[#D3BCC0] rounded-2xl shadow-[var(--shadow-modal)] max-w-5xl w-full max-h-[90vh] overflow-hidden grid grid-cols-1 lg:grid-cols-12"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Visual Preview Canvas */}
        <div className="lg:col-span-7 bg-[#0E103D] flex items-center justify-center p-5 sm:p-6 min-h-[280px]">
          {post.imageUrl ? (
            <img
              src={post.imageUrl}
              alt={`${spec.name} high-resolution visual (${post.aspectRatio})`}
              referrerPolicy="no-referrer"
              style={{ aspectRatio: ratioMeta.cssRatio }}
              className="max-h-[72vh] w-auto max-w-full object-contain rounded-xl ring-1 ring-[#F2D7EE]/25 shadow-2xl"
            />
          ) : (
            <p className="text-sm text-[#F2D7EE]">No visual rendered yet.</p>
          )}
        </div>

        {/* Art Direction & Grounding Inspector */}
        <div className="lg:col-span-5 p-6 flex flex-col justify-between gap-6 overflow-y-auto">
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4 pb-4 border-b brand-divider">
              <div>
                <h3 className="font-display text-xl font-bold text-[#0E103D] leading-tight">
                  {spec.name} Visual
                </h3>
                <p className="mt-1 text-xs text-[#3A2A54] font-mono tabular-nums">
                  {ratioMeta.label} · {post.imageSize} ·{' '}
                  {post.imageModel === 'gemini-3-pro-image-preview'
                    ? 'Gemini 3 Pro'
                    : 'Nano Banana 2.1'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close visual inspector"
                title="Close visual inspector"
                className="btn-ghost min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl cursor-pointer shrink-0"
              >
                <X className="w-5 h-5 text-[#0E103D]" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="lightbox-art-prompt"
                className="block text-[13px] font-semibold text-[#0E103D]"
              >
                Art-direction prompt
              </label>
              <textarea
                id="lightbox-art-prompt"
                rows={5}
                value={post.imagePrompt}
                onChange={(e) => onUpdateImagePrompt(e.target.value)}
                className="brand-input w-full rounded-xl px-3.5 py-3 text-sm text-[#0E103D] leading-relaxed resize-y"
              />
              <p className="text-xs text-[#3A2A54] leading-relaxed">
                Adjust lighting, composition, or subject cues, then re-render this visual.
              </p>
            </div>

            {post.visualSources && post.visualSources.length > 0 && (
              <div className="space-y-2 pt-4 border-t brand-divider">
                <p className="text-[13px] font-semibold text-[#0E103D]">
                  Real-time visual references
                </p>
                <ul className="space-y-2">
                  {post.visualSources.map((src) => (
                    <li key={src.uri}>
                      <a
                        href={src.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#69306D] hover:text-[#0E103D] underline underline-offset-4 decoration-[#A5668B]"
                      >
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">{src.title}</span>
                        <span className="font-normal text-[#3A2A54] no-underline">
                          · {extractSourceHostname(src.uri)}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Predictable Modal Footer: Secondary Left, Primary CTA Right */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t brand-divider">
            {post.imageUrl && (
              <button
                type="button"
                onClick={handleDownload}
                className="btn-secondary min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#69306D]" aria-hidden="true" />
                <span>Download</span>
              </button>
            )}
            <button
              type="button"
              onClick={onRegenerate}
              disabled={post.imageStatus === 'loading'}
              className="btn-primary flex-1 sm:flex-initial min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <RefreshCw
                className={`w-4 h-4 ${post.imageStatus === 'loading' ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>Re-render Visual</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
