import React from 'react';
import { ExternalLink } from 'lucide-react';
export const PORTFOLIO_EXTERNAL_URL='https://sowrovhosenstudio.netlify.app/';
interface ShowcasesVaultProps { onNavigate?: (path:string)=>void; }
export const ShowcasesVault:React.FC<ShowcasesVaultProps>=()=> (
<section id="portfolio" className="scroll-mt-20 py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-[#101110] text-[#f2f2ed] border-b border-white/10"><div className="max-w-7xl mx-auto"><div className="grid md:grid-cols-[1fr_auto] gap-8 items-end"><div><p className="text-xs uppercase tracking-[.15em] text-[#b9ed62] mb-3">Selected work</p><h2 className="font-display text-3xl sm:text-5xl font-semibold tracking-tight">Portfolio</h2><p className="mt-4 text-sm sm:text-base text-[#a5a7a1] max-w-2xl leading-relaxed">A collection of visual work, commercial productions, motion design and digital projects.</p></div><a href={PORTFOLIO_EXTERNAL_URL} target="_blank" rel="noopener noreferrer" className="min-h-[48px] px-6 py-3 glossy-btn inline-flex items-center justify-center gap-2 text-sm">Explore projects <ExternalLink size={16}/></a></div><div className="mt-12 border-t border-white/10 pt-5 flex items-center justify-between text-xs text-[#a5a7a1]"><span>Design · Motion · Video · Digital</span><span className="text-[#b9ed62]">Open portfolio ↗</span></div></div></section>
);
