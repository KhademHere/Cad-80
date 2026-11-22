import { handleLiquidPointerMove } from '../hooks/useLiquidPointer';
import type { WorkspaceView } from '../types/campaign';
import { GlassSegmentedTrack } from './GlassSegmentedTrack';

interface TopBarProps {
  activeView: WorkspaceView;
  onSelectView: (view: WorkspaceView) => void;
  onNewBrief: () => void;
}

const NAV_ITEMS: Array<{ id: WorkspaceView; label: string }> = [
  { id: 'all', label: 'All Platforms' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'twitter', label: 'X / Twitter' },
  { id: 'instagram', label: 'Instagram' },
];

export function TopBar({ activeView, onSelectView, onNewBrief }: TopBarProps) {
  return (
    <header className="sticky top-2.5 sm:top-3 z-30 px-3 sm:px-6 pointer-events-none">
      <div className="max-w-[1640px] mx-auto pointer-events-auto">
        <div className="liquid-glass-dock rounded-[24px] md:rounded-full px-4 sm:px-5 py-2">
          <span aria-hidden="true" className="liquid-refract-underlay" />

          <div className="relative z-10 flex items-center justify-between gap-4 sm:gap-8">
            {/* Zone 1: Single-element Brand Wordmark */}
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                onSelectView('all');
              }}
              className="font-display text-lg font-bold tracking-tight text-slate-950 whitespace-nowrap shrink-0 pl-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 rounded-md"
            >
              Kadrant
            </a>

            {/* Zone 2: Floating Liquid Glass Tab Dock with Spring Sliding Capsule */}
            <div className="hidden md:block">
              <GlassSegmentedTrack
                as="nav"
                ariaLabel="Platform views"
                options={NAV_ITEMS}
                value={activeView}
                onChange={onSelectView}
              />
            </div>

            {/* Zone 3: Glossy Obsidian Glass Droplet Primary Action */}
            <div className="flex items-center shrink-0">
              <button
                type="button"
                onClick={onNewBrief}
                onPointerMove={handleLiquidPointerMove}
                className="liquid-glass-btn-obsidian px-4 py-1.5 sm:py-2 text-xs sm:text-[13px] font-semibold text-white rounded-full whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-700"
              >
                New Brief
              </button>
            </div>
          </div>

          {/* Compact Mobile Glass Tab Strip */}
          <div className="relative z-10 md:hidden mt-2 pt-2 border-t liquid-divider overflow-x-auto">
            <GlassSegmentedTrack
              as="nav"
              ariaLabel="Mobile platform views"
              options={NAV_ITEMS}
              value={activeView}
              onChange={onSelectView}
              size="sm"
              className="w-max"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
