import { ChevronDown, ChevronUp, ExternalLink, Globe } from 'lucide-react';
import { useState } from 'react';
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
      className="brand-card rounded-2xl px-5 py-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-xl bg-[#F2D7EE] border border-[#D3BCC0] flex items-center justify-center shrink-0"
            aria-hidden="true"
          >
            <Globe className="w-4 h-4 text-[#69306D]" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <h3 className="font-display text-sm font-semibold text-[#0E103D] leading-snug">
              {isSample
                ? 'Real-Time Search & Visual Grounding Ready'
                : 'Grounded with Live Google Search'}
            </h3>
            <p className="text-xs text-[#3A2A54] leading-relaxed">
              {grounding.sources.length > 0
                ? `${grounding.sources.length} web ${grounding.sources.length === 1 ? 'source' : 'sources'} informed copy and visual art direction`
                : 'Live Search Grounding is active in your brief composer to pull current facts and visual references.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((prev) => !prev)}
          className="btn-secondary min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-center"
        >
          <span>{expanded ? 'Hide details' : 'Inspect sources'}</span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-[#69306D]" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#69306D]" aria-hidden="true" />
          )}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t brand-divider space-y-3.5">
          <p className="text-sm text-[#0E103D] leading-relaxed max-w-[68ch]">
            {grounding.summary}
          </p>

          {grounding.queries.length > 0 && (
            <div className="text-xs text-[#3A2A54] flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
              <span className="font-semibold text-[#0E103D]">Search queries:</span>
              {grounding.queries.map((q, idx) => (
                <span key={q} className="inline-flex items-center gap-2">
                  <span className="font-mono text-[#0E103D]">{q}</span>
                  {idx < grounding.queries.length - 1 && (
                    <span aria-hidden="true">·</span>
                  )}
                </span>
              ))}
            </div>
          )}

          {grounding.sources.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
              <span className="text-xs font-semibold text-[#0E103D]">
                Verified sources:
              </span>
              {grounding.sources.map((src) => (
                <a
                  key={src.uri}
                  href={src.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#69306D] hover:text-[#0E103D] underline underline-offset-4 decoration-[#A5668B] hover:decoration-[#0E103D] transition-colors py-1"
                >
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span className="max-w-[240px] truncate">{src.title}</span>
                  <span className="font-normal text-[#3A2A54] no-underline">
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
