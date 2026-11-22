import React from 'react';
import { SERVICES } from '../data/content';
import { ArrowUpRight } from 'lucide-react';
interface ServicesProps { onSelectService?: (title: string) => void; }
export const Services: React.FC<ServicesProps> = ({ onSelectService }) => (
<section id="services" className="scroll-mt-20 py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-[#171817] text-[#f2f2ed] border-b border-white/10">
<div className="max-w-7xl mx-auto"><div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-12"><div><p className="text-xs uppercase tracking-[.15em] text-[#b9ed62] mb-3">What we do</p><h2 className="font-display text-3xl sm:text-5xl font-semibold tracking-tight">Creative services</h2></div><p className="text-sm sm:text-base text-[#a5a7a1] max-w-xl leading-relaxed">A considered range of creative and digital services, shaped around your brand, audience and goals.</p></div>
<div className="divide-y divide-white/10 border-y border-white/10">{SERVICES.map((service,index)=><button type="button" key={service.id} onClick={()=>onSelectService?.(service.title)} className="w-full text-left grid grid-cols-[40px_1fr_auto] sm:grid-cols-[64px_1fr_auto] gap-4 items-center py-5 sm:py-7 group cursor-pointer"><span className="text-xs sm:text-sm text-[#b9ed62] tabular-nums">{String(index+1).padStart(2,'0')}</span><div><h3 className="text-lg sm:text-2xl font-semibold text-[#f2f2ed] group-hover:text-[#b9ed62] transition-colors">{service.title}</h3><p className="text-sm text-[#a5a7a1] mt-2 max-w-3xl leading-relaxed">{service.subtitle}</p></div><ArrowUpRight className="text-[#a5a7a1] group-hover:text-[#b9ed62] group-hover:-translate-y-1 group-hover:translate-x-1 transition-all" size={20}/></button>)}</div></div></section>
);
