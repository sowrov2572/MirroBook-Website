import React, { useState, useEffect } from 'react';
import { AppUser, CheckoutItem, ProductItem } from '../types';
import { PluginStore } from './PluginStore';
import { SoftwareStore } from './SoftwareStore';
import { Layers, Monitor, Puzzle } from 'lucide-react';

interface PluginsAndSoftwareProps {
  plugins: ProductItem[];
  softwareList: ProductItem[];
  loading?: boolean;
  onBuyItem: (item: CheckoutItem) => void;
  onOpenMirrorPOS: () => void;
  user?: AppUser | null;
  onOpenSignIn?: () => void;
  onNotify?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const PluginsAndSoftware: React.FC<PluginsAndSoftwareProps> = ({
  plugins,
  softwareList,
  loading = false,
  onBuyItem,
  onOpenMirrorPOS,
  user = null,
  onOpenSignIn,
  onNotify,
}) => {
  const [libraryView, setLibraryView] = useState<'both' | 'plugins' | 'software'>('both');

  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#software') {
        setLibraryView('both');
      } else if (hash === '#plugins') {
        setLibraryView('both');
      } else if (hash === '#plugins-software') {
        setLibraryView('both');
      }
    };
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  return (
    <section
      id="plugins-software"
      className="scroll-mt-20 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-[#0B0D0C] text-[#F5F7F2] bg-grid-subtle border-b border-white/[0.09] relative overflow-x-clip"
    >
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Unified Top Header + Easy Library Switcher */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 sm:mb-12 pb-6 border-b border-white/[0.09]">
          <div className="min-w-0">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#B7F34A] tracking-tight uppercase">
              PLUGINS &amp; SOFTWARE
            </h2>
            <p className="text-xs sm:text-sm text-[#A1AAA2] mt-2 max-w-2xl leading-relaxed">
              Dedicated libraries for creative editing extensions and standalone MirrorBook business &amp; creator software.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Library View Switcher"
            className="glass-tab-bar flex items-center gap-1 self-start md:self-auto max-w-full overflow-x-auto no-scrollbar"
          >
            <button
              type="button"
              role="tab"
              aria-selected={libraryView === 'both'}
              onClick={() => setLibraryView('both')}
              className={`min-h-[38px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                libraryView === 'both'
                  ? 'bg-[#B7F34A] text-[#0B0D0C] font-bold shadow-sm'
                  : 'text-[#A1AAA2] hover:text-[#F5F7F2]'
              }`}
            >
              <Layers size={13} />
              <span>All Libraries</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={libraryView === 'plugins'}
              onClick={() => setLibraryView('plugins')}
              className={`min-h-[38px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                libraryView === 'plugins'
                  ? 'bg-[#B7F34A] text-[#0B0D0C] font-bold shadow-sm'
                  : 'text-[#A1AAA2] hover:text-[#F5F7F2]'
              }`}
            >
              <Puzzle size={13} />
              <span>Plugin Library</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={libraryView === 'software'}
              onClick={() => setLibraryView('software')}
              className={`min-h-[38px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                libraryView === 'software'
                  ? 'bg-[#B7F34A] text-[#0B0D0C] font-bold shadow-sm'
                  : 'text-[#A1AAA2] hover:text-[#F5F7F2]'
              }`}
            >
              <Monitor size={13} />
              <span>Software Library</span>
            </button>
          </div>
        </div>

        {/* Separated Subsections: Never Mix Plugins and Software in the Same Grid */}
        <div className="space-y-14 sm:space-y-16">
          {(libraryView === 'both' || libraryView === 'plugins') && (
            <PluginStore
              embedded
              plugins={plugins}
              loading={loading}
              onBuyItem={onBuyItem}
            />
          )}

          {libraryView === 'both' && (
            <div className="border-t border-white/[0.09]" aria-hidden="true" />
          )}

          {(libraryView === 'both' || libraryView === 'software') && (
            <SoftwareStore
              embedded
              softwareList={softwareList}
              loading={loading}
              onBuyItem={onBuyItem}
              onOpenMirrorPOS={onOpenMirrorPOS}
              user={user}
              onOpenSignIn={onOpenSignIn}
              onNotify={onNotify}
            />
          )}
        </div>
      </div>
    </section>
  );
};
