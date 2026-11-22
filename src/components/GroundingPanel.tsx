import { ChevronDown, ChevronUp, ExternalLink, Globe } from 'lucide-react';
import { useState } from 'react';
import { handleLiquidPointerMove } from '../hooks/useLiquidPointer';
import { extractSourceHostname } from '../lib/campaign';
import type { CampaignGrounding } from '../types/campaign';

interface GroundingPanelProps {
  grounding: CampaignGrounding;
  isSample?: boolean;
}

export function GroundingPanel({ grounding, isSample }: GroundingPanelProps) {
  const [expanded, setExpanded] = useState(grounding.sources.length > 0);

  return (
    <section
      aria-label="Real-time Google Search grounding"
      className="liquid-glass-panel rounded-[22px] px-4 sm:px-5 py-3.5"
    >
      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Globe className="w-4 h-4 text-blue-700 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-950 truncate">
              {isSample
                ? 'Real-Time Search & Visual Grounding Ready'
                : 'Grounded with Live Google Search'}
            </p>
            <p className="text-[11px] text-slate-600 truncate">
              {grounding.sources.length > 0
                ? `${grounding.sources.length} web ${grounding.sources.length === 1 ? 'source' : 'sources'} informed copy and visual art direction`
                : 'Enable Live Search Grounding in the composer to pull current facts and visual references'}
            </p>
          </div>
        </div>

        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((prev) => !prev)}
          onPointerMove={handleLiquidPointerMove}
          className="liquid-glass-btn inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-800 hover:text-slate-950 rounded-full whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
        >
          {expanded ? 'Hide brief' : 'Inspect sources'}
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
          )}
        </button>
      </div>

      {expanded && (
        <div className="relative z-10 mt-3 pt-3 border-t liquid-divider space-y-3">
          <p className="text-xs text-slate-800 leading-relaxed max-w-4xl">
            {grounding.summary}
          </p>

          {grounding.queries.length > 0 && (
            <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-semibold text-slate-700">Queries:</span>
              {grounding.queries.map((q, idx) => (
                <span key={q} className="inline-flex items-center gap-2">
                  <span className="font-mono text-slate-800">{q}</span>
                  {idx < grounding.queries.length - 1 && (
                    <span aria-hidden="true">·</span>
                  )}
                </span>
              ))}
            </div>
          )}

          {grounding.sources.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-700">
                Sources:
              </span>
              {grounding.sources.map((src) => (
                <a
                  key={src.uri}
                  href={src.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-900 underline underline-offset-4 decoration-blue-300/80 hover:decoration-blue-700 transition-colors"
                >
                  <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
                  <span className="max-w-[240px] truncate">{src.title}</span>
                  <span className="text-[11px] text-slate-500 no-underline">
                    ({extractSourceHostname(src.uri)})
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
