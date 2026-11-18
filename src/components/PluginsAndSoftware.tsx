import React, { useState, useEffect, useMemo } from 'react';
import { AppUser, CheckoutItem, ProductItem } from '../types';
import {
  Layers,
  Monitor,
  Smartphone,
  Puzzle,
  ShieldCheck,
  ShoppingBag,
  ExternalLink,
  ArrowRight,
  Terminal,
} from 'lucide-react';

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

type UnifiedLibraryFilter = 'all' | 'software' | 'plugins';

export const PluginsAndSoftware: React.FC<PluginsAndSoftwareProps> = ({
  plugins,
  softwareList,
  loading = false,
  onBuyItem,
  onOpenMirrorPOS,
}) => {
  const [libraryFilter, setLibraryFilter] = useState<UnifiedLibraryFilter>('all');
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#software') {
        setLibraryFilter('software');
      } else if (hash === '#plugins') {
        setLibraryFilter('plugins');
      } else if (hash === '#plugins-software') {
        setLibraryFilter('all');
      }
    };
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  const activeSoftware = useMemo(
    () =>
      softwareList.filter(
        (s) => s.type === 'Software' && s.status !== 'draft' && s.status !== 'archived'
      ),
    [softwareList]
  );

  const activePlugins = useMemo(
    () =>
      plugins.filter(
        (p) => p.type === 'Plugin' && p.status !== 'draft' && p.status !== 'archived'
      ),
    [plugins]
  );

  // Unified items list: Software items ALWAYS placed first, Plugin items placed after.
  // Deduplicate by product ID to prevent any duplicate rendering.
  const unifiedItems = useMemo(() => {
    const seen = new Set<string>();
    const combined: ProductItem[] = [];

    const addUnique = (items: ProductItem[]) => {
      for (const item of items) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          combined.push(item);
        }
      }
    };

    if (libraryFilter === 'all' || libraryFilter === 'software') {
      addUnique(activeSoftware);
    }
    if (libraryFilter === 'all' || libraryFilter === 'plugins') {
      addUnique(activePlugins);
    }

    return combined;
  }, [activeSoftware, activePlugins, libraryFilter]);

  return (
    <section
      id="plugins-software"
      className="scroll-mt-20 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-[#0B0D0C] text-[#F5F7F2] bg-grid-subtle border-b border-white/[0.09] relative overflow-x-clip"
    >
      {/* Anchor targets so footer links (#software, #plugins) scroll cleanly to the unified hub */}
      <span id="software" className="scroll-mt-24 block h-0 w-0 overflow-hidden" aria-hidden="true" />
      <span id="plugins" className="scroll-mt-24 block h-0 w-0 overflow-hidden" aria-hidden="true" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Unified Section Header + Category Filter Navigation */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-10 pb-5 border-b border-white/[0.09]">
          <div className="min-w-0">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#B7F34A] tracking-tight uppercase">
              PLUGINS &amp; SOFTWARE
            </h2>
          </div>

          <div
            role="tablist"
            aria-label="Plugins and Software Library Filter"
            className="glass-tab-bar flex items-center gap-1 self-start md:self-auto max-w-full overflow-x-auto no-scrollbar"
          >
            <button
              type="button"
              role="tab"
              aria-selected={libraryFilter === 'all'}
              onClick={() => setLibraryFilter('all')}
              className={`min-h-[38px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                libraryFilter === 'all'
                  ? 'bg-[#B7F34A] text-[#0B0D0C] font-bold shadow-sm'
                  : 'text-[#A1AAA2] hover:text-[#F5F7F2]'
              }`}
            >
              <Layers size={13} />
              <span>All Library</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold tabular-nums leading-none ${
                  libraryFilter === 'all'
                    ? 'bg-[#0B0D0C]/15 text-[#0B0D0C]'
                    : 'bg-white/10 text-[#A1AAA2]'
                }`}
              >
                {activeSoftware.length + activePlugins.length}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={libraryFilter === 'software'}
              onClick={() => setLibraryFilter('software')}
              className={`min-h-[38px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                libraryFilter === 'software'
                  ? 'bg-[#B7F34A] text-[#0B0D0C] font-bold shadow-sm'
                  : 'text-[#A1AAA2] hover:text-[#F5F7F2]'
              }`}
            >
              <Monitor size={13} />
              <span>Software</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold tabular-nums leading-none ${
                  libraryFilter === 'software'
                    ? 'bg-[#0B0D0C]/15 text-[#0B0D0C]'
                    : 'bg-white/10 text-[#A1AAA2]'
                }`}
              >
                {activeSoftware.length}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={libraryFilter === 'plugins'}
              onClick={() => setLibraryFilter('plugins')}
              className={`min-h-[38px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                libraryFilter === 'plugins'
                  ? 'bg-[#B7F34A] text-[#0B0D0C] font-bold shadow-sm'
                  : 'text-[#A1AAA2] hover:text-[#F5F7F2]'
              }`}
            >
              <Puzzle size={13} />
              <span>Plugins</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold tabular-nums leading-none ${
                  libraryFilter === 'plugins'
                    ? 'bg-[#0B0D0C]/15 text-[#0B0D0C]'
                    : 'bg-white/10 text-[#A1AAA2]'
                }`}
              >
                {activePlugins.length}
              </span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 items-stretch">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="glossy-card p-5 space-y-4 animate-pulse">
                <div className="aspect-video w-full rounded-xl bg-white/[0.06]" />
                <div className="h-5 w-40 rounded bg-white/[0.08]" />
                <div className="h-4 w-full rounded bg-white/[0.06]" />
                <div className="h-11 w-full rounded-xl bg-white/[0.08]" />
              </div>
            ))}
          </div>
        ) : unifiedItems.length === 0 ? (
          <div className="glossy-card p-8 sm:p-12 text-center max-w-2xl mx-auto animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-xl bg-white/[0.05] border border-white/[0.09] flex items-center justify-center text-[#B7F34A] mx-auto mb-4">
              <Layers size={22} />
            </div>
            <h3 className="font-display text-lg sm:text-xl font-bold text-[#F5F7F2] mb-2">
              {libraryFilter === 'software'
                ? 'No Software Available Right Now'
                : libraryFilter === 'plugins'
                ? 'No Plugins Available Right Now'
                : 'No Software or Plugins Available Right Now'}
            </h3>
            <p className="text-xs sm:text-sm text-[#A1AAA2] leading-relaxed">
              Published software applications and creative editing plugins will appear here automatically.
            </p>
          </div>
        ) : (
          <div
            key={libraryFilter}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 items-stretch animate-in fade-in duration-200"
          >
            {unifiedItems.map((item) => {
              const isSoftware = item.type === 'Software';
              const isMirrorPOS =
                isSoftware &&
                (item.id === 'software-mirrorpos' ||
                  item.title.toLowerCase().includes('mirrorpos'));
              const isFreeProduct = item.isFree === true || Number(item.price) === 0;
              const priceLabel =
                item.priceDisplay || (isFreeProduct ? 'Free' : `৳${item.price.toLocaleString()}`);

              // MirrorPOS Product Card inside the Unified Grid
              if (isMirrorPOS) {
                return (
                  <div
                    key={item.id}
                    className="glossy-card glossy-card-hover p-5 sm:p-6 min-w-0 flex flex-col justify-between h-full group border-[#B7F34A]/25 relative"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-[#0B0D0C] border border-white/[0.12] p-2 flex items-center justify-center shrink-0 overflow-hidden">
                            <img
                              src={item.iconUrl || '/mirror-pos-icon.png'}
                              alt="MirrorPOS Logo"
                              width={48}
                              height={48}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[11px] font-semibold text-[#B7F34A] block">
                              MirrorBook
                            </span>
                            <h3 className="font-display text-xl font-bold text-[#F5F7F2] group-hover:text-[#B7F34A] transition-colors leading-tight truncate">
                              {item.title}
                            </h3>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 rounded-md bg-[#0B0D0C]/90 border border-[#B7F34A]/45 text-[10px] font-bold uppercase tracking-wider text-[#B7F34A] whitespace-nowrap shrink-0">
                          SOFTWARE
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-[#D4DBD5] leading-relaxed">
                        Smart POS Software for Modern Businesses.
                      </p>
                    </div>

                    <div className="pt-4 mt-5 border-t border-white/[0.09]">
                      <div className="flex items-center justify-between gap-2 text-[11px] text-[#A1AAA2] mb-3">
                        <span>Free via Email</span>
                        <span className="font-semibold text-[#F5F7F2] tabular-nums">
                          Premium: ৳9,999
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenMirrorPOS()}
                        className="w-full min-h-[44px] py-2.5 px-5 text-xs glossy-btn rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Get Access</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              }

              // General Software Item Card
              if (isSoftware) {
                const thumbUrl = item.thumbnailUrl || item.iconUrl || '';
                const showImg = Boolean(thumbUrl) && !brokenImages[item.id];
                const launchHref =
                  item.launchUrl ||
                  `/api/software/access?productId=${encodeURIComponent(item.id)}&mode=launch&go=1`;

                return (
                  <div
                    key={item.id}
                    className="glossy-card glossy-card-hover p-5 sm:p-6 min-w-0 flex flex-col justify-between h-full group relative"
                  >
                    <div className="min-w-0">
                      <div className="aspect-video w-full rounded-xl bg-[#0B0D0C] border border-white/[0.09] mb-4 overflow-hidden relative group-hover:border-[#B7F34A]/40 transition-colors flex flex-col justify-between p-3">
                        {showImg ? (
                          <img
                            src={thumbUrl}
                            alt={`${item.title} – ${item.category} Software by MirrorBook`}
                            width={800}
                            height={450}
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                            onError={() =>
                              setBrokenImages((prev) => ({ ...prev, [item.id]: true }))
                            }
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-[#121614]">
                            <Layers size={22} className="text-[#B7F34A]/70" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D0C]/85 via-transparent to-[#0B0D0C]/35 pointer-events-none" />

                        <div className="relative z-10 flex items-center justify-between gap-2 text-[11px]">
                          <span className="px-2 py-0.5 rounded-md bg-[#0B0D0C]/85 text-[#D4DBD5] font-medium border border-white/10 flex items-center gap-1 truncate max-w-[140px]">
                            {item.category.includes('PC') ? (
                              <Monitor size={10} className="text-[#B7F34A] shrink-0" />
                            ) : (
                              <Smartphone size={10} className="text-[#B7F34A] shrink-0" />
                            )}
                            <span className="truncate">{item.category}</span>
                          </span>
                          <span className="px-2.5 py-0.5 rounded-md bg-[#0B0D0C]/90 border border-[#B7F34A]/45 text-[10px] font-bold uppercase tracking-wider text-[#B7F34A] shrink-0">
                            SOFTWARE
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-[#B7F34A] font-semibold mb-1 truncate">
                        Developed by MirrorBook
                      </div>

                      <h3 className="font-display text-base sm:text-lg font-bold text-[#F5F7F2] group-hover:text-[#B7F34A] transition-colors mb-1.5 leading-snug break-words">
                        {item.title}
                      </h3>

                      {item.description && (
                        <p className="text-xs text-[#A1AAA2] line-clamp-3 leading-relaxed mb-4">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="pt-4 border-t border-white/[0.09] flex items-center justify-between gap-2 mb-4">
                        <div className="flex items-center gap-1.5 text-xs text-[#A1AAA2]">
                          <ShieldCheck size={13} className="text-[#B7F34A]" />
                          <span>{isFreeProduct ? 'Lifetime Access' : 'Protected License'}</span>
                        </div>
                        <span className="font-display text-xl font-bold text-[#F5F7F2] tabular-nums">
                          {isFreeProduct ? 'Free' : priceLabel}
                        </span>
                      </div>

                      {isFreeProduct ? (
                        <a
                          href={launchHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full min-h-[44px] py-3 text-xs glossy-btn rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <span>Get Access</span>
                          <ExternalLink size={14} />
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            onBuyItem({
                              id: item.id,
                              name: item.title,
                              price: priceLabel,
                              category: `Software (${item.category})`,
                            })
                          }
                          className="w-full min-h-[44px] py-3 text-xs glossy-btn rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <ShoppingBag size={14} />
                          <span>Get License</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              }

              // Plugin Item Card inside the Unified Grid
              const showPluginImg = Boolean(item.thumbnailUrl) && !brokenImages[item.id];
              const subCategory = item.category || 'Creative Plugin';

              return (
                <div
                  key={item.id}
                  className="glossy-card glossy-card-hover p-5 sm:p-6 min-w-0 flex flex-col justify-between h-full group relative"
                >
                  <div className="min-w-0">
                    <div className="aspect-video w-full rounded-xl bg-[#0B0D0C] border border-white/[0.09] mb-4 overflow-hidden relative group-hover:border-[#B7F34A]/40 transition-colors flex flex-col justify-between p-3">
                      {showPluginImg ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={`${item.title} – ${subCategory} Plugin by MirrorBook`}
                          width={800}
                          height={450}
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setBrokenImages((prev) => ({ ...prev, [item.id]: true }))
                          }
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col justify-between p-3 bg-[#0B0D0C]">
                          <div className="flex items-center text-[11px] text-[#A1AAA2]">
                            <span className="flex items-center gap-1 text-[#B7F34A] font-medium">
                              <Terminal size={11} /> EXT
                            </span>
                          </div>
                          <div className="w-9 h-9 rounded-lg bg-[#171C19] border border-white/[0.09] mx-auto flex items-center justify-center text-[#B7F34A]">
                            <Layers size={18} />
                          </div>
                          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="w-2/3 h-full bg-[#B7F34A]" />
                          </div>
                        </div>
                      )}

                      <div className="relative z-10 flex items-center justify-end w-full pointer-events-none">
                        <span className="px-2.5 py-0.5 rounded-md bg-[#0B0D0C]/90 border border-[#B7F34A]/45 text-[10px] font-bold uppercase tracking-wider text-[#B7F34A] shrink-0">
                          PLUGIN
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-[#B7F34A] font-semibold mb-1 truncate">
                      {subCategory}
                    </div>

                    <h3 className="font-display text-base sm:text-lg font-bold text-[#F5F7F2] group-hover:text-[#B7F34A] transition-colors mb-1.5 leading-snug break-words">
                      {item.title}
                    </h3>

                    {item.description && (
                      <p className="text-xs text-[#A1AAA2] line-clamp-2 leading-relaxed mb-4">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="pt-4 border-t border-white/[0.09] flex items-center justify-between gap-2 mb-4">
                      <span className="text-xs text-[#A1AAA2] font-medium">
                        Instant License
                      </span>
                      <span className="font-display text-xl font-bold text-[#F5F7F2] tabular-nums">
                        {priceLabel}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onBuyItem({
                          id: item.id,
                          name: item.title,
                          price: priceLabel,
                          category: `Plugin (${subCategory})`,
                        })
                      }
                      className="w-full min-h-[44px] py-3 text-xs glossy-btn rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShoppingBag size={14} />
                      <span>Buy Now</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
