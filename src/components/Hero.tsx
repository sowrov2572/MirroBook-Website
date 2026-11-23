import React from 'react';
import { ArrowDownRight, ArrowRight, Play } from 'lucide-react';

interface HeroProps { onViewPackages: () => void; onBrowseStore: () => void; onPlayShowreel: () => void; }
export const Hero: React.FC<HeroProps> = ({ onViewPackages, onBrowseStore, onPlayShowreel }) => (
  <section className="relative min-h-[78vh] flex flex-col justify-center py-16 sm:py-20 px-4 sm:px-6 lg:px-8 overflow-x-clip bg-[#101110] border-b border-white/10">
    <div className="absolute inset-0 pointer-events-none">
      <img src="https://i.ibb.co/dsxmjMSP/mirrorbook.jpg" alt="MirrorBook creative production" width={1920} height={1080} loading="eager" fetchPriority="high" decoding="async" referrerPolicy="no-referrer" onError={(e)=>{if(!e.currentTarget.src.includes('WNjVG5Qk')) e.currentTarget.src='https://i.ibb.co/WNjVG5Qk/mirrorbook.jpg';}} className="h-full w-full object-cover object-center opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#101110] via-[#101110]/90 to-[#101110]/55" />
    </div>
    <div className="max-w-7xl w-full mx-auto relative z-10">
      <div className="max-w-4xl space-y-7">
        <p className="text-xs sm:text-sm tracking-[.16em] uppercase text-[#b9ed62] font-semibold">Independent creative studio · Bangladesh & worldwide</p>
        <h1 className="font-display text-5xl min-[375px]:text-6xl sm:text-7xl lg:text-[6.5rem] font-semibold tracking-[-.055em] leading-[.95] text-[#f2f2ed]">MirrorBook<span className="text-[#b9ed62]">.</span></h1>
        <p className="text-[#b9ed62] text-lg sm:text-xl font-medium">Reflecting Creativity</p>
        <p className="max-w-2xl text-base sm:text-lg text-[#b5b6b0] leading-relaxed">We help brands communicate through thoughtful design, engaging video, compelling content and practical digital solutions, from the first idea to final delivery.</p>
        <div className="flex flex-col min-[420px]:flex-row flex-wrap items-stretch min-[420px]:items-center gap-3 pt-2">
          <button type="button" onClick={onViewPackages} className="min-h-[48px] px-6 py-3 text-sm glossy-btn flex items-center justify-center gap-2 cursor-pointer"><span>View Packages</span><ArrowDownRight size={16}/></button>
          <button type="button" onClick={onBrowseStore} className="min-h-[48px] px-6 py-3 text-sm font-semibold glossy-btn-secondary flex items-center justify-center gap-2 cursor-pointer"><span>Browse Plugins</span><ArrowRight size={16}/></button>
          <button type="button" onClick={onPlayShowreel} className="min-h-[48px] px-5 py-3 text-sm font-semibold glossy-btn-secondary flex items-center justify-center gap-2 cursor-pointer"><Play size={15}/><span>Show Reel</span></button>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-16 max-w-5xl">
        {[['01','Remote collaboration','A creative team for businesses, wherever they work.'],['02','Design & video','Graphic design, social content and motion.'],['03','Flexible projects','One-off work or ongoing creative support.'],['04','Clear process','Scope, brief and deliverables agreed upfront.']].map(([n,t,d])=><div key={n} className="border-t border-white/20 pt-4"><span className="text-xs text-[#b9ed62] tracking-widest">{n}</span><h2 className="mt-3 text-sm sm:text-base font-semibold text-[#f2f2ed]">{t}</h2><p className="mt-2 text-xs sm:text-sm text-[#a5a7a1] leading-relaxed">{d}</p></div>)}
      </div>
    </div>
  </section>
);
