import { Camera, FileText, LayoutGrid, MessageSquare } from 'lucide-react';
import type { WorkspaceView } from '../types/campaign';

interface MobileBottomNavProps {
  activeView: WorkspaceView;
  onSelectView: (view: WorkspaceView) => void;
}

const MOBILE_TABS: Array<{
  id: WorkspaceView;
  label: string;
  fullLabel: string;
  Icon: typeof LayoutGrid;
}> = [
  { id: 'all', label: 'All', fullLabel: 'All Platforms', Icon: LayoutGrid },
  { id: 'linkedin', label: 'LinkedIn', fullLabel: 'LinkedIn', Icon: FileText },
  { id: 'twitter', label: 'X', fullLabel: 'X / Twitter', Icon: MessageSquare },
  { id: 'instagram', label: 'Instagram', fullLabel: 'Instagram', Icon: Camera },
];

export function MobileBottomNav({ activeView, onSelectView }: MobileBottomNavProps) {
  return (
    <nav
      aria-label="Mobile platform navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-30 h-[60px] bg-[#FAF2F8] border-t border-[#D3BCC0] shadow-[0_-4px_18px_-8px_rgba(14,16,61,0.16)]"
    >
      <div className="h-full max-w-lg mx-auto grid grid-cols-4 px-2">
        {MOBILE_TABS.map(({ id, label, fullLabel, Icon }) => {
          const isActive = activeView === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectView(id)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={fullLabel}
              className={`relative min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-xs whitespace-nowrap cursor-pointer transition-colors ${
                isActive
                  ? 'text-[#69306D] font-bold'
                  : 'text-[#3A2A54] font-medium hover:text-[#0E103D]'
              }`}
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute top-0 inset-x-4 h-[3px] rounded-b-full bg-[#69306D]"
                />
              )}
              <Icon
                className={`w-4 h-4 ${isActive ? 'text-[#69306D]' : 'text-[#3A2A54]'}`}
                aria-hidden="true"
              />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
