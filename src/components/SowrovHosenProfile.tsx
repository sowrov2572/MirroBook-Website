import React, { useEffect } from 'react';
import {
  Film,
  Sparkles,
  Palette,
  Layers,
  FileText,
  Compass,
  ArrowLeft,
  ExternalLink,
  Mail,
  Youtube,
  Linkedin,
  Facebook,
  Instagram,
  Twitter,
  Globe,
  Award,
  CheckCircle2,
  Calendar,
  MapPin,
  Briefcase,
  Share2
} from 'lucide-react';

interface SowrovHosenProfileProps {
  onNavigateHome: () => void;
  onStartProject?: () => void;
}

export const SowrovHosenProfile: React.FC<SowrovHosenProfileProps> = ({
  onNavigateHome,
  onStartProject,
}) => {
  // Update document title and SEO metadata on mount
  useEffect(() => {
    const originalTitle = document.title;
    document.title = 'Sowrov Hosen | Founder of MirrorBook';

    // Update Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    const originalDesc = metaDesc?.getAttribute('content') || '';
    const newDesc =
      'Sowrov Hosen is the Founder of MirrorBook, a creative agency in Bangladesh providing graphic design, video editing, motion graphics, and digital content creation.';
    if (metaDesc) {
      metaDesc.setAttribute('content', newDesc);
    } else {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      metaDesc.setAttribute('content', newDesc);
      document.head.appendChild(metaDesc);
    }

    // Update Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    const originalCanonical = canonical?.getAttribute('href') || 'https://mirrorbook.site/';
    if (canonical) {
      canonical.setAttribute('href', 'https://mirrorbook.site/sowrov-hosen');
    } else {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      canonical.setAttribute('href', 'https://mirrorbook.site/sowrov-hosen');
      document.head.appendChild(canonical);
    }

    // Update OpenGraph Title, Description, Image, and URL
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', 'Sowrov Hosen | Founder of MirrorBook');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', newDesc);
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', 'https://mirrorbook.site/sowrov-hosen');
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) ogImage.setAttribute('content', 'https://i.ibb.co.com/BHmVcvxW/Sowrov-Hosen.jpg');
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', 'Sowrov Hosen | Founder of MirrorBook');
    const twitterDesc = document.querySelector('meta[name="twitter:description"]');
    if (twitterDesc) twitterDesc.setAttribute('content', newDesc);
    const twitterImage = document.querySelector('meta[name="twitter:image"]');
    if (twitterImage) twitterImage.setAttribute('content', 'https://i.ibb.co.com/BHmVcvxW/Sowrov-Hosen.jpg');

    // Inject Schema.org ProfilePage Structured Data
    const profileSchema = {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      '@id': 'https://mirrorbook.site/sowrov-hosen#profilepage',
      url: 'https://mirrorbook.site/sowrov-hosen',
      name: 'Sowrov Hosen | Founder of MirrorBook',
      description: newDesc,
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://mirrorbook.site/',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Sowrov Hosen',
            item: 'https://mirrorbook.site/sowrov-hosen',
          },
        ],
      },
      mainEntity: {
        '@type': 'Person',
        '@id': 'https://mirrorbook.site/sowrov-hosen#person',
        name: 'Sowrov Hosen',
        jobTitle: 'Founder of MirrorBook',
        image: 'https://i.ibb.co.com/BHmVcvxW/Sowrov-Hosen.jpg',
        description: newDesc,
        worksFor: {
          '@type': 'Organization',
          '@id': 'https://mirrorbook.site/#organization',
          name: 'MirrorBook',
          alternateName: 'MirrorBook Creative Agency',
          url: 'https://mirrorbook.site/',
          logo: 'https://i.ibb.co.com/DfSsjc5Z/mirorrbook-logo-png.png',
          slogan: 'Reflecting Creativity',
        },
        knowsAbout: [
          'Video Editing',
          'Graphic Design',
          'Motion Graphics',
          'Script Writing',
          'Creative Direction',
          'Post Production',
          'Cinematic Visuals',
          'Digital Marketing Agency Bangladesh',
        ],
        sameAs: [
          'https://sowrovhosenstudio.netlify.app',
        ],
      },
    };

    let scriptTag = document.getElementById('sowrov-hosen-schema') as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'sowrov-hosen-schema';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(profileSchema, null, 2);

    window.scrollTo({ top: 0, behavior: 'instant' });

    return () => {
      document.title = originalTitle;
      if (metaDesc) metaDesc.setAttribute('content', originalDesc);
      if (canonical) canonical.setAttribute('href', originalCanonical);
      const scriptToRemove = document.getElementById('sowrov-hosen-schema');
      if (scriptToRemove) scriptToRemove.remove();
    };
  }, []);

  const handleShare = async () => {
    const url = 'https://mirrorbook.site/sowrov-hosen';
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Sowrov Hosen | Founder of MirrorBook Agency',
          text: 'Sowrov Hosen is the founder of MirrorBook Agency, a creative professional specializing in video editing, graphic design, motion graphics and digital content creation.',
          url,
        });
      } catch {
        // User cancelled share
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      alert('Profile link copied to clipboard: ' + url);
    }
  };

  const skillsList = [
    {
      title: 'Video Editing',
      icon: Film,
      level: 'Expert / Masterclass',
      description:
        'Cinematic cuts, high-retention pacing, multi-layer sound design, dynamic speed ramping, and broadcast-grade color grading.',
      toolset: ['Premiere Pro', 'DaVinci Resolve', 'CapCut Pro'],
      highlights: 'Long-form documentaries, commercial reels, podcasts, and high-CTR social ads.',
    },
    {
      title: 'Graphic Design',
      icon: Palette,
      level: 'Senior Specialist',
      description:
        'High-converting thumbnail art, bespoke brand identity design, editorial typography, social media campaign posters, and marketing collateral.',
      toolset: ['Adobe Photoshop', 'Adobe Illustrator', 'Figma'],
      highlights: 'Visual identity kits, high-impact YouTube covers, and corporate pitch decks.',
    },
    {
      title: 'Motion Graphics',
      icon: Layers,
      level: 'Advanced',
      description:
        'Kinetic typography, animated brand logos, VFX compositing, custom HUD elements, 2D visual effects, and dynamic lower-thirds.',
      toolset: ['After Effects', 'Cinema 4D / 3D Element', 'Mocha Pro'],
      highlights: 'Explainer sequences, title sequences, logo reveals, and custom UI transitions.',
    },
    {
      title: 'Script Writing',
      icon: FileText,
      level: 'Strategic Creative',
      description:
        'Engaging narrative arcs, YouTube hook engineering, viewer retention structuring, commercial copywriting, and scene-by-scene storyboarding.',
      toolset: ['Narrative Flow', 'Audience Psychology', 'Hook Crafting'],
      highlights: 'Compelling scripts designed to maximize watch time and emotional impact.',
    },
    {
      title: 'Creative Direction',
      icon: Compass,
      level: 'Executive Leadership',
      description:
        'Comprehensive creative vision, art direction, production pipeline orchestration, brand tone governance, and quality management.',
      toolset: ['Aesthetic Coherence', 'Team Mentorship', 'Client Strategy'],
      highlights: 'Guiding projects from initial raw concept to award-worthy final delivery.',
    },
  ];

  const socialLinks = [
    {
      name: 'Portfolio Studio',
      handle: 'sowrovhosenstudio.netlify.app',
      url: 'https://sowrovhosenstudio.netlify.app',
      icon: Globe,
      status: 'Live & Active',
      isPrimary: true,
    },
    {
      name: 'YouTube',
      handle: '@MirrorBookStudio',
      url: 'https://youtube.com',
      icon: Youtube,
      status: 'Creator Channel',
      isPrimary: false,
    },
    {
      name: 'Facebook',
      handle: 'MirrorBook Agency',
      url: 'https://facebook.com',
      icon: Facebook,
      status: 'Official Page',
      isPrimary: false,
    },
    {
      name: 'LinkedIn',
      handle: 'Sowrov Hosen',
      url: 'https://linkedin.com',
      icon: Linkedin,
      status: 'Professional Network',
      isPrimary: false,
    },
    {
      name: 'Instagram',
      handle: '@sowrovhosen',
      url: 'https://instagram.com',
      icon: Instagram,
      status: 'Visual Journal',
      isPrimary: false,
    },
    {
      name: 'X (Twitter)',
      handle: '@MirrorBookTech',
      url: 'https://twitter.com',
      icon: Twitter,
      status: 'Updates & Tech',
      isPrimary: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#070707] text-white">
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 md:py-16">
        {/* Navigation Breadcrumb & Back Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10 pb-6 border-b border-white/[0.08]">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#888888]">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onNavigateHome();
              }}
              className="hover:text-[#71B913] transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft size={14} />
              <span>MirrorBook Home</span>
            </a>
            <span>/</span>
            <span className="text-[#AAAAAA]">Leadership</span>
            <span>/</span>
            <span className="text-[#71B913] font-medium">Sowrov Hosen</span>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-medium text-[#CCCCCC] hover:text-white transition-all cursor-pointer"
              title="Share profile"
            >
              <Share2 size={13} className="text-[#71B913]" />
              <span>Share Profile</span>
            </button>
          </div>
        </div>

        {/* Hero Section: Profile Photo Area & Key Identity */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-16">
          {/* Column 1: Profile Photo Area */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="w-full max-w-[340px] rounded-3xl border border-white/10 overflow-hidden bg-[#0E0E0E] p-6 text-center">
              {/* Professional Portrait HTML img Element */}
              <figure className="w-full flex flex-col items-center mb-4">
                <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden border border-white/15">
                  <img
                      src="https://i.ibb.co.com/BHmVcvxW/Sowrov-Hosen.jpg"
                      alt="Sowrov Hosen, Founder of MirrorBook"
                      title="Sowrov Hosen – Founder of MirrorBook"
                      width={224}
                      height={224}
                      loading="eager"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.src.includes('BHmVcvxW')) {
                          target.src = 'https://i.ibb.co.com/BHmVcvxW/Sowrov-Hosen.jpg';
                        }
                      }}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <figcaption className="text-[11px] text-[#AAAAAA] text-center font-medium mt-2">
                    Sowrov Hosen, Founder of MirrorBook
                  </figcaption>
                </figure>

                {/* Founder Name & Identity Lockup */}
                <div className="relative z-10 space-y-1">
                  <h2 className="text-xl font-bold text-white tracking-tight">Sowrov Hosen</h2>
                  <p className="text-xs font-semibold text-[#71B913]">Founder of MirrorBook</p>
                  <p className="text-[11px] text-[#888888] flex items-center justify-center gap-1 pt-1">
                    <MapPin size={11} className="text-[#71B913]" />
                    <span>Dhaka, Bangladesh</span>
                  </p>
                </div>

                {/* Verified Founder Badge */}
                <div className="relative z-10 mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#71B913]/15 border border-[#71B913]/30 text-[11px] font-semibold text-[#8FD82A]">
                  <CheckCircle2 size={12} className="text-[#71B913]" />
                  <span>Verified Founder</span>
                </div>
              </div>

            {/* Quick Metadata Pill list below photo */}
            <div className="w-full max-w-[320px] mt-4 space-y-2">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between text-xs">
                <span className="text-[#888888] flex items-center gap-1.5">
                  <Briefcase size={13} className="text-[#71B913]" />
                  Agency
                </span>
                <span className="text-white font-medium">MirrorBook</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between text-xs">
                <span className="text-[#888888] flex items-center gap-1.5">
                  <Calendar size={13} className="text-[#71B913]" />
                  Experience
                </span>
                <span className="text-white font-medium">5+ Years Industry</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between text-xs">
                <span className="text-[#888888] flex items-center gap-1.5">
                  <Award size={13} className="text-[#71B913]" />
                  Specialty
                </span>
                <span className="text-white font-medium">Cinematic Post-Production</span>
              </div>
            </div>
          </div>

          {/* Column 2: Introduction & Vision */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#71B913]" />
              <span className="text-xs font-semibold text-[#71B913] uppercase tracking-wider">
                Founder &amp; Creative Lead
              </span>
            </div>

            {/* Main H1 for SEO */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
              Sowrov Hosen
            </h1>

            <p className="text-lg sm:text-xl text-[#CCCCCC] font-normal leading-relaxed">
              Founder &amp; Creative Director of <span className="text-white font-semibold">MirrorBook</span>. A multi-disciplinary visual artist and post-production specialist based in Bangladesh, dedicated to elevating brands and creators through cinematic video editing, brand identity systems, and motion design.
            </p>

            {/* Action CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="https://sowrovhosenstudio.netlify.app"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-xl bg-[#71B913] hover:bg-[#82d119] text-black text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer font-medium"
              >
                <span>Visit Portfolio Studio</span>
                <ExternalLink size={14} />
              </a>

              {onStartProject && (
                <button
                  type="button"
                  onClick={onStartProject}
                  className="px-6 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Mail size={14} className="text-[#71B913]" />
                  <span>Start A Project</span>
                </button>
              )}

              <a
                href="https://mirrorbook.site/#services"
                className="px-6 py-3 rounded-xl bg-transparent hover:bg-white/[0.04] border border-white/10 text-[#AAAAAA] hover:text-white text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Explore Agency Services →</span>
              </a>
            </div>

            {/* Section 1: Professional Introduction */}
            <div className="pt-6 space-y-4 text-sm text-[#AAAAAA] leading-relaxed border-t border-white/[0.08]">
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Professional Background</span>
              </h2>
              <p>
                Sowrov Hosen is a visionary digital creator and director with a deep focus on the psychology of visual pacing, sound design, and narrative retention. Having worked on hundreds of commercial projects, YouTube masterclasses, and corporate campaigns, he combines technical rigor with an unmistakable cinematic aesthetic.
              </p>
              <p>
                His work spans from fine-tuned timeline editing in Adobe Premiere Pro and DaVinci Resolve, to bespoke motion design in After Effects, to high-conversion visual marketing designs crafted in Photoshop. He advocates for the philosophy of <em>"Reflecting Creativity"</em> — ensuring every frame produced by MirrorBook mirrors the authentic voice and ambitions of the client.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Founder of MirrorBook Agency */}
        <section className="mb-16 bg-[#0C0C0C] border border-white/[0.08] rounded-3xl p-8 md:p-10 relative overflow-hidden">
          <div className="max-w-3xl space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#71B913]">
              <Briefcase size={14} />
              <span>Agency Leadership</span>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Founder of MirrorBook Agency
            </h2>

            <p className="text-sm sm:text-base text-[#AAAAAA] leading-relaxed">
              Sowrov Hosen founded <a href="https://mirrorbook.site/" className="text-[#71B913] hover:underline font-medium">MirrorBook Agency</a> (
              <a href="https://mirrorbook.site/" className="text-white hover:text-[#71B913] underline font-medium">https://mirrorbook.site/</a>
              ) to establish a benchmark for high-caliber digital creative production in Bangladesh. The agency delivers comprehensive video editing, graphic branding, motion graphics, and tailored software tools for content creators and modern businesses worldwide.
            </p>

            <p className="text-sm text-[#888888] leading-relaxed">
              Under Sowrov&apos;s creative leadership, MirrorBook has expanded from a boutique post-production outfit into an integrated digital studio featuring workflow plugins, digital asset libraries, and educational tutorials for the next generation of editors.
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <a
                href="https://mirrorbook.site/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-xs font-bold text-white transition-all cursor-pointer"
              >
                <span>Visit MirrorBook Agency Homepage</span>
                <ExternalLink size={13} className="text-[#71B913]" />
              </a>
              <span className="text-xs text-[#666666]">Official Portal: mirrorbook.site</span>
            </div>
          </div>
        </section>

        {/* Section 3: Professional Skills */}
        <section className="mb-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#71B913] mb-2">
                <Sparkles size={14} />
                <span>Core Competencies</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Professional Skills &amp; Creative Expertise
              </h2>
            </div>
            <p className="text-xs text-[#888888] max-w-sm">
              Hands-on mastery across modern post-production pipelines, digital brand architecture, and visual storytelling.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {skillsList.map((skill, index) => {
              const IconComponent = skill.icon;
              return (
                <div
                  key={skill.title}
                  className={`p-6 rounded-2xl bg-[#0C0C0C] border transition-all hover:-translate-y-1 ${
                    index === 0
                      ? 'border-[#71B913]/40 shadow-[0_0_25px_rgba(113,185,19,0.12)]'
                      : 'border-white/[0.08] hover:border-white/20'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-[#71B913] mb-4">
                    <IconComponent size={20} />
                  </div>

                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="text-base font-bold text-white">{skill.title}</h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.06] text-[#AAAAAA]">
                      {skill.level}
                    </span>
                  </div>

                  <p className="text-xs text-[#888888] leading-relaxed mb-4">
                    {skill.description}
                  </p>

                  <div className="space-y-2 pt-3 border-t border-white/[0.06] text-xs">
                    <div className="flex flex-wrap gap-1.5">
                      {skill.toolset.map((tool) => (
                        <span
                          key={tool}
                          className="px-2 py-0.5 rounded-md bg-white/[0.04] text-[11px] text-[#CCCCCC] font-mono"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                    <p className="text-[11px] text-[#71B913] font-medium pt-1">
                      {skill.highlights}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 4: Social Media Profile Links */}
        <section className="mb-16">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#71B913] mb-2">
              <Globe size={14} />
              <span>Connect &amp; Social Media</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Social Media &amp; Verified Portfolios
            </h2>
            <p className="text-xs text-[#888888] mt-1">
              Explore official profiles, studio showcases, and community channels.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {socialLinks.map((item) => {
              const IconComp = item.icon;
              return (
                <a
                  key={item.name}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-4 rounded-xl border transition-all flex items-center justify-between group ${
                    item.isPrimary
                      ? 'bg-[#71B913]/10 border-[#71B913]/40 hover:bg-[#71B913]/20 shadow-[0_0_20px_rgba(113,185,19,0.15)]'
                      : 'bg-[#0B0B0B] border-white/[0.08] hover:border-white/20 hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center text-[#71B913] group-hover:scale-110 transition-transform">
                      <IconComp size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-[#71B913] transition-colors">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-[#777777] font-mono">{item.handle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#888888] font-medium hidden sm:inline">
                      {item.status}
                    </span>
                    <ExternalLink
                      size={13}
                      className="text-[#666666] group-hover:text-white transition-colors"
                    />
                  </div>
                </a>
              );
            })}
          </div>
        </section>

        {/* Section 5: Direct Contact / Work With Sowrov CTA */}
        <section className="bg-[#0B0B0B] border border-white/[0.08] rounded-3xl p-8 text-center relative overflow-hidden">
          <div className="max-w-xl mx-auto space-y-4">
            <h3 className="font-display text-2xl font-bold text-white">
              Ready to collaborate with Sowrov Hosen?
            </h3>
            <p className="text-xs sm:text-sm text-[#888888] leading-relaxed">
              Whether you need high-end commercial video editing, a complete brand identity revamp, or custom motion graphics for your upcoming campaign, reach out directly.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <a
                href="mailto:miirorbook.tech@gmail.com"
                className="px-6 py-3 rounded-xl bg-[#71B913] hover:bg-[#82d119] text-black text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(113,185,19,0.3)]"
              >
                <Mail size={14} />
                <span>Email: miirorbook.tech@gmail.com</span>
              </a>
              <button
                type="button"
                onClick={onNavigateHome}
                className="px-6 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                <span>Back To MirrorBook</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
