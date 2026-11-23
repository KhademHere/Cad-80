import { Plus } from 'lucide-react';
import type { WorkspaceView } from '../types/campaign';

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
    <header className="sticky top-0 z-30 h-14 md:h-16 bg-[#FAF2F8]/95 backdrop-blur-sm border-b border-[#D3BCC0]">
      <div className="h-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onSelectView('all');
          }}
          className="font-display text-xl font-bold tracking-tight text-[#0E103D] whitespace-nowrap shrink-0 rounded-md py-1"
        >
          Kadrant
        </a>

        {/* Zone 2: Clean Typography Navigation Links (Desktop) */}
        <nav
          aria-label="Platform views"
          className="hidden md:flex items-center gap-7 h-full"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectView(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative h-full min-h-[44px] inline-flex items-center px-1 text-sm whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  isActive
                    ? 'text-[#69306D] font-bold'
                    : 'text-[#3A2A54] font-medium hover:text-[#0E103D]'
                }`}
              >
                <span>{item.label}</span>
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 inset-x-0 h-[3px] rounded-t-full bg-[#69306D]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Header Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onNewBrief}
            className="btn-secondary min-h-[40px] px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#69306D]" aria-hidden="true" />
            <span>New Brief</span>
          </button>
        </div>
      </div>
    </header>
  );
}
