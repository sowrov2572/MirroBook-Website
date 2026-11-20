import React, { useEffect, useState } from 'react';
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
  Video,
  Globe,
  Award,
  CheckCircle2,
  Calendar,
  MapPin,
  Briefcase,
  Share2,
  Check
} from 'lucide-react';

interface SowrovHosenProfileProps {
  onNavigateHome: () => void;
  onStartProject?: () => void;
}

export const SowrovHosenProfile: React.FC<SowrovHosenProfileProps> = ({
  onNavigateHome,
  onStartProject,
}) => {
  const [copiedProfileLink, setCopiedProfileLink] = useState(false);

  // Inject Schema.org ProfilePage Structured Data
  useEffect(() => {
    const newDesc =
      'Sowrov Hosen is the Founder of MirrorBook, a creative agency in Bangladesh providing graphic design, video editing, motion graphics, web development, and modern software solutions.';

    const profileSchema = {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      '@id': 'https://mirrorbook.site/sowrov-hosen#profilepage',
      url: 'https://mirrorbook.site/sowrov-hosen',
      name: 'MirrorBook Founder & Team | Sowrov Hosen and Team',
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
          alternateName: 'Mirror Book',
          url: 'https://mirrorbook.site/',
          logo: 'https://mirrorbook.site/mirrorbook-logo.png',
          slogan: 'Reflecting Creativity',
        },
        knowsAbout: [
          'Video Editing',
          'Graphic Design',
          'Motion Graphics',
          'Web Development',
          'Creative Direction',
          'Software Solutions',
          'Digital Marketing Agency Bangladesh',
        ],
        sameAs: [
          'https://sowrovhosenstudio.netlify.app',
          'https://www.facebook.com/profile.php?id=61557704393608',
          'https://www.youtube.com/@MirrorBook_Offical',
          'https://www.linkedin.com/company/mirrorbook/',
          'https://www.instagram.com/mirror.book/',
          'https://www.tiktok.com/@mirror__book',
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
      try {
        await navigator.clipboard.writeText(url);
        setCopiedProfileLink(true);
        setTimeout(() => setCopiedProfileLink(false), 2500);
      } catch {
        // Ignore clipboard errors
      }
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
      handle: '@MirrorBook_Offical',
      url: 'https://www.youtube.com/@MirrorBook_Offical',
      icon: Youtube,
      status: 'Official Channel',
      isPrimary: false,
    },
    {
      name: 'Facebook',
      handle: 'MirrorBook Official',
      url: 'https://www.facebook.com/profile.php?id=61557704393608',
      icon: Facebook,
      status: 'Official Page',
      isPrimary: false,
    },
    {
      name: 'Instagram',
      handle: '@mirror.book',
      url: 'https://www.instagram.com/mirror.book/',
      icon: Instagram,
      status: 'Official Instagram',
      isPrimary: false,
    },
    {
      name: 'TikTok',
      handle: '@mirror__book',
      url: 'https://www.tiktok.com/@mirror__book',
      icon: Video,
      status: 'Short-Form Reels',
      isPrimary: false,
    },
    {
      name: 'LinkedIn',
      handle: 'company/mirrorbook',
      url: 'https://www.linkedin.com/company/mirrorbook/',
      icon: Linkedin,
      status: 'Company Profile',
      isPrimary: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B0D0C] text-[#F5F7F2] overflow-x-clip">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
        {/* Navigation Breadcrumb & Back Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8 sm:mb-10 pb-5 sm:pb-6 border-b border-white/[0.09]">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-[#707A72]">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onNavigateHome();
              }}
              className="hover:text-[#B7F34A] transition-colors flex items-center gap-1.5 min-h-[36px]"
            >
              <ArrowLeft size={14} />
              <span>MirrorBook Home</span>
            </a>
            <span>/</span>
            <span className="text-[#A1AAA2]">Leadership</span>
            <span>/</span>
            <span className="text-[#B7F34A] font-medium">Founder &amp; Team</span>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleShare}
              className="glossy-btn-secondary min-h-[40px] inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-[#F5F7F2] cursor-pointer"
              title="Share profile"
            >
              {copiedProfileLink ? (
                <>
                  <Check size={13} className="text-[#B7F34A]" />
                  <span className="text-[#B7F34A]">Link Copied</span>
                </>
              ) : (
                <>
                  <Share2 size={13} className="text-[#B7F34A]" />
                  <span>Share Profile</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Hero Section: Profile Photo Area & Key Identity */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-16">
          {/* Column 1: Profile Photo Area */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="w-full max-w-[340px] glossy-card rounded-2xl p-5 sm:p-6 text-center">
              {/* Professional Portrait HTML img Element */}
              <figure className="w-full flex flex-col items-center mb-4">
                <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden border border-white/[0.12]">
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
                  <figcaption className="text-[11px] text-[#A1AAA2] text-center font-medium mt-2">
                    Sowrov Hosen, Founder of MirrorBook
                  </figcaption>
                </figure>

                {/* Founder Name & Identity Lockup */}
                <div className="relative z-10 space-y-1">
                  <p className="text-xl font-bold text-[#F5F7F2] tracking-tight">Sowrov Hosen</p>
                  <p className="text-xs font-semibold text-[#B7F34A]">Founder of MirrorBook</p>
                  <p className="text-[11px] text-[#707A72] flex items-center justify-center gap-1 pt-1">
                    <MapPin size={11} className="text-[#B7F34A]" />
                    <span>Dhaka, Bangladesh</span>
                  </p>
                </div>

                {/* Verified Founder Badge */}
                <div className="relative z-10 mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#B7F34A]/15 border border-[#B7F34A]/30 text-[11px] font-semibold text-[#B7F34A]">
                  <CheckCircle2 size={12} className="text-[#B7F34A]" />
                  <span>Verified Founder</span>
                </div>
              </div>

            {/* Quick Metadata Pill list below photo */}
            <div className="w-full max-w-[340px] mt-4 space-y-2">
              <div className="p-3 rounded-xl bg-[#121614] border border-white/[0.09] flex items-center justify-between text-xs">
                <span className="text-[#A1AAA2] flex items-center gap-1.5">
                  <Briefcase size={13} className="text-[#B7F34A]" />
                  Agency
                </span>
                <span className="text-[#F5F7F2] font-medium">MirrorBook</span>
              </div>
              <div className="p-3 rounded-xl bg-[#121614] border border-white/[0.09] flex items-center justify-between text-xs">
                <span className="text-[#A1AAA2] flex items-center gap-1.5">
                  <Calendar size={13} className="text-[#B7F34A]" />
                  Experience
                </span>
                <span className="text-[#F5F7F2] font-medium">5+ Years Industry</span>
              </div>
              <div className="p-3 rounded-xl bg-[#121614] border border-white/[0.09] flex items-center justify-between text-xs">
                <span className="text-[#A1AAA2] flex items-center gap-1.5">
                  <Award size={13} className="text-[#B7F34A]" />
                  Specialty
                </span>
                <span className="text-[#F5F7F2] font-medium">Cinematic Post-Production</span>
              </div>
            </div>
          </div>

          {/* Column 2: Introduction & Vision */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <span className="text-xs font-semibold text-[#B7F34A] tracking-wide">
                Founder &amp; Creative Lead
              </span>
            </div>

            {/* Main H1 for SEO */}
            <h1 className="font-display text-3xl min-[375px]:text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#F5F7F2] leading-tight">
              Sowrov Hosen
            </h1>

            <p className="text-base sm:text-xl text-[#A1AAA2] font-normal leading-relaxed">
              Founder &amp; Creative Director of <span className="text-[#F5F7F2] font-semibold">MirrorBook</span>. A multi-disciplinary visual artist and post-production specialist based in Bangladesh, dedicated to elevating brands and creators through cinematic video editing, brand identity systems, and motion design.
            </p>

            {/* Action CTA Buttons */}
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 pt-2">
              <a
                href="https://sowrovhosenstudio.netlify.app"
                target="_blank"
                rel="noopener noreferrer"
                className="glossy-btn min-h-[44px] px-6 py-3 rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Visit Portfolio Studio</span>
                <ExternalLink size={14} />
              </a>

              {onStartProject && (
                <button
                  type="button"
                  onClick={onStartProject}
                  className="glossy-btn-secondary min-h-[44px] px-6 py-3 rounded-xl text-xs font-semibold tracking-wide flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Mail size={14} className="text-[#B7F34A]" />
                  <span>Start A Project</span>
                </button>
              )}

              <a
                href="https://mirrorbook.site/#services"
                className="min-h-[44px] px-6 py-3 rounded-xl bg-transparent hover:bg-white/[0.04] border border-white/[0.09] text-[#A1AAA2] hover:text-[#F5F7F2] text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Explore Agency Services →</span>
              </a>
            </div>

            {/* Section 1: Professional Introduction */}
            <div className="pt-6 space-y-4 text-sm text-[#A1AAA2] leading-relaxed border-t border-white/[0.09]">
              <h2 className="text-xl font-bold text-[#F5F7F2] tracking-tight flex items-center gap-2">
                <span>Professional Background</span>
              </h2>
              <p>
                Sowrov Hosen is a visionary digital creator and director with a deep focus on the psychology of visual pacing, sound design, and narrative retention. Having worked on hundreds of commercial projects, YouTube masterclasses, and corporate campaigns, he combines technical rigor with an unmistakable cinematic aesthetic.
              </p>
              <p>
                His work spans from fine-tuned timeline editing in Adobe Premiere Pro and DaVinci Resolve, to bespoke motion design in After Effects, to high-conversion visual marketing designs crafted in Photoshop. He advocates for the philosophy of <em className="text-[#F5F7F2]">&ldquo;Reflecting Creativity&rdquo;</em> — ensuring every frame produced by MirrorBook mirrors the authentic voice and ambitions of the client.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Founder of MirrorBook Agency */}
        <section className="mb-16 glossy-card rounded-2xl p-6 sm:p-8 md:p-10 relative overflow-hidden">
          <div className="max-w-3xl space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-[#B7F34A]">
              <Briefcase size={14} />
              <span>Agency Leadership</span>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#F5F7F2] tracking-tight">
              Founder of MirrorBook Agency
            </h2>

            <p className="text-sm sm:text-base text-[#A1AAA2] leading-relaxed">
              Sowrov Hosen founded <a href="https://mirrorbook.site/" className="text-[#B7F34A] hover:underline font-medium">MirrorBook Agency</a> (
              <a href="https://mirrorbook.site/" className="text-[#F5F7F2] hover:text-[#B7F34A] underline font-medium break-all">https://mirrorbook.site/</a>
              ) to establish a benchmark for high-caliber digital creative production in Bangladesh. The agency delivers comprehensive video editing, graphic branding, motion graphics, and tailored software tools for content creators and modern businesses worldwide.
            </p>

            <p className="text-sm text-[#A1AAA2] leading-relaxed">
              Under Sowrov&apos;s creative leadership, MirrorBook has expanded from a boutique post-production outfit into an integrated digital studio featuring workflow plugins, digital asset libraries, and educational tutorials for the next generation of editors.
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <a
                href="https://mirrorbook.site/"
                className="glossy-btn-secondary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
              >
                <span>Visit MirrorBook Agency Homepage</span>
                <ExternalLink size={13} className="text-[#B7F34A]" />
              </a>
              <span className="text-xs text-[#707A72]">Official Portal: mirrorbook.site</span>
            </div>
          </div>
        </section>


        {/* Section 3: Founder & Team */}
        <section className="mb-16" aria-labelledby="founder-team-heading">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-[#B7F34A] mb-2">
                <Briefcase size={14} />
                <span>The People Behind MirrorBook</span>
              </div>
              <h2 id="founder-team-heading" className="font-display text-2xl sm:text-3xl font-bold text-[#F5F7F2] tracking-tight">
                Founder &amp; Team
              </h2>
            </div>
            <p className="text-xs text-[#A1AAA2] max-w-sm">
              Meet the founders and creative team responsible for shaping, building and delivering MirrorBook projects.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 items-stretch">
            <article className="glossy-card rounded-2xl p-5 flex flex-col">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border border-[#B7F34A]/35 mb-4">
                <img src="https://i.pravatar.cc/160?img=12" alt="Sowrov Hosen portrait placeholder" loading="lazy" decoding="async" className="w-full h-full object-cover object-top" />
              </div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-[#B7F34A] mb-1">Founder</p>
              <h3 className="text-lg font-bold text-[#F5F7F2]">Sowrov Hosen</h3>
              <p className="text-xs text-[#B7F34A] font-medium mt-1">Creative Director</p>
              <p className="text-xs text-[#A1AAA2] leading-relaxed mt-3 flex-1">
                Leads MirrorBook's creative vision, client relationships and project strategy. Specializes in graphic design, professional video editing, motion graphics, scriptwriting, visual storytelling, brand communication and end-to-end creative production. Oversees creative quality and guides projects from concept to final delivery.
              </p>
              <a href="https://sowrovhosenstudio.netlify.app" target="_blank" rel="noopener noreferrer" className="glossy-btn min-h-[42px] px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 mt-5">
                <span>View Portfolio</span><ExternalLink size={13} />
              </a>
            </article>

            <article className="glossy-card rounded-2xl p-5 flex flex-col">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border border-[#B7F34A]/35 mb-4">
                <img src="https://i.pravatar.cc/160?img=13" alt="Walid Ahmed Shraban portrait placeholder" loading="lazy" decoding="async" className="w-full h-full object-cover object-top" />
              </div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-[#B7F34A] mb-1">Founder</p>
              <h3 className="text-lg font-bold text-[#F5F7F2]">Walid Ahmed Shraban</h3>
              <p className="text-xs text-[#B7F34A] font-medium mt-1">Web Developer</p>
              <p className="text-xs text-[#A1AAA2] leading-relaxed mt-3 flex-1">
                Leads the technical development of MirrorBook's digital products and web experiences. Focuses on planning website structure, translating requirements into responsive and user-friendly interfaces, implementing front-end and back-end functionality, connecting databases and third-party services, and building reliable web-based solutions. Also contributes to performance, usability, troubleshooting, ongoing improvements and the technical direction of the agency's website and software projects.
              </p>
              <a href="https://srabonx.netlify.app/" target="_blank" rel="noopener noreferrer" className="glossy-btn min-h-[42px] px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 mt-5">
                <span>View Portfolio</span><ExternalLink size={13} />
              </a>
            </article>

            <article className="glossy-card rounded-2xl p-5 flex flex-col">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border border-[#B7F34A]/35 mb-4">
                <img src="https://i.pravatar.cc/160?img=14" alt="Musabbir Al Said portrait placeholder" loading="lazy" decoding="async" className="w-full h-full object-cover object-top" />
              </div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-[#A1AAA2] mb-1">Team Member</p>
              <h3 className="text-lg font-bold text-[#F5F7F2]">Musabbir Al Said</h3>
              <p className="text-xs text-[#B7F34A] font-medium mt-1">Graphic Designer &amp; Video Editor</p>
              <p className="text-xs text-[#A1AAA2] leading-relaxed mt-3 flex-1">
                Creates engaging visual content for brands and digital platforms. Works across graphic design, social media creatives, visual layouts, promotional artwork and video editing for short-form and campaign content, helping turn creative ideas into clear and consistent brand visuals.
              </p>
              <button type="button" disabled aria-disabled="true" title="Portfolio link will be added when provided" className="w-full min-h-[42px] px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 mt-5 bg-white/[0.04] border border-white/[0.09] text-[#707A72] cursor-not-allowed">
                <span>View Portfolio</span><ExternalLink size={13} />
              </button>
            </article>

            <article className="glossy-card rounded-2xl p-5 flex flex-col">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border border-[#B7F34A]/35 mb-4">
                <img src="https://i.pravatar.cc/160?img=15" alt="Mehedi Hasan portrait placeholder" loading="lazy" decoding="async" className="w-full h-full object-cover object-top" />
              </div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-[#A1AAA2] mb-1">Team Member</p>
              <h3 className="text-lg font-bold text-[#F5F7F2]">Mehedi Hasan</h3>
              <p className="text-xs text-[#B7F34A] font-medium mt-1">Visual Artist</p>
              <p className="text-xs text-[#A1AAA2] leading-relaxed mt-3 flex-1">
                Develops visual concepts and polished creative assets for brands, campaigns and digital platforms. Combines visual artistry with graphic design, social media design, creative composition and video editing to deliver consistent, audience-focused content.
              </p>
              <button type="button" disabled aria-disabled="true" title="Portfolio link will be added when provided" className="w-full min-h-[42px] px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 mt-5 bg-white/[0.04] border border-white/[0.09] text-[#707A72] cursor-not-allowed">
                <span>View Portfolio</span><ExternalLink size={13} />
              </button>
            </article>
          </div>
        </section>

        {/* Section 4: Professional Skills */}
        <section className="mb-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-[#B7F34A] mb-2">
                <Sparkles size={14} />
                <span>Core Competencies</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#F5F7F2] tracking-tight">
                Professional Skills &amp; Creative Expertise
              </h2>
            </div>
            <p className="text-xs text-[#A1AAA2] max-w-sm">
              Hands-on mastery across modern post-production pipelines, digital brand architecture, and visual storytelling.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
            {skillsList.map((skill, index) => {
              const IconComponent = skill.icon;
              return (
                <div
                  key={skill.title}
                  className={`p-6 rounded-2xl glossy-card glossy-card-hover flex flex-col justify-between ${
                    index === 0 ? 'border-[#B7F34A]/35' : ''
                  }`}
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-[#121614] border border-white/[0.09] flex items-center justify-center text-[#B7F34A] mb-4">
                      <IconComponent size={20} />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <h3 className="text-base font-bold text-[#F5F7F2]">{skill.title}</h3>
                      <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#121614] border border-white/[0.09] text-[#A1AAA2]">
                        {skill.level}
                      </span>
                    </div>

                    <p className="text-xs text-[#A1AAA2] leading-relaxed mb-4">
                      {skill.description}
                    </p>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-white/[0.09] text-xs">
                    <div className="flex flex-wrap gap-1.5">
                      {skill.toolset.map((tool) => (
                        <span
                          key={tool}
                          className="px-2 py-0.5 rounded-md bg-[#121614] border border-white/[0.06] text-[11px] text-[#F5F7F2] font-mono"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                    <p className="text-[11px] text-[#B7F34A] font-medium pt-1">
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
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-[#B7F34A] mb-2">
              <Globe size={14} />
              <span>Connect &amp; Social Media</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#F5F7F2] tracking-tight">
              Social Media &amp; Verified Portfolios
            </h2>
            <p className="text-xs text-[#A1AAA2] mt-1">
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
                  className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-2 group min-w-0 ${
                    item.isPrimary
                      ? 'bg-[#B7F34A]/10 border-[#B7F34A]/35 hover:bg-[#B7F34A]/15'
                      : 'bg-[#171C19] border-white/[0.09] hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[#121614] border border-white/[0.09] flex items-center justify-center text-[#B7F34A] shrink-0">
                      <IconComp size={18} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-[#F5F7F2] group-hover:text-[#B7F34A] transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-[11px] text-[#707A72] font-mono truncate">{item.handle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-[#A1AAA2] font-medium hidden sm:inline">
                      {item.status}
                    </span>
                    <ExternalLink
                      size={13}
                      className="text-[#707A72] group-hover:text-[#F5F7F2] transition-colors"
                    />
                  </div>
                </a>
              );
            })}
          </div>
        </section>

        {/* Section 5: Direct Contact / Work With Sowrov CTA */}
        <section className="glossy-card rounded-2xl p-6 sm:p-8 text-center relative overflow-hidden">
          <div className="max-w-xl mx-auto space-y-4">
            <h2 className="font-display text-2xl font-bold text-[#F5F7F2]">
              Ready to collaborate with Sowrov Hosen?
            </h2>
            <p className="text-xs sm:text-sm text-[#A1AAA2] leading-relaxed">
              Whether you need high-end commercial video editing, a complete brand identity revamp, or custom motion graphics for your upcoming campaign, reach out directly.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3">
              <a
                href="mailto:mirrorbook.site@gmail.com"
                className="glossy-btn w-full sm:w-auto min-h-[44px] px-6 py-3 rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-2 cursor-pointer break-all"
              >
                <Mail size={14} className="shrink-0" />
                <span>Email: mirrorbook.site@gmail.com</span>
              </a>
              <button
                type="button"
                onClick={onNavigateHome}
                className="glossy-btn-secondary w-full sm:w-auto min-h-[44px] px-6 py-3 rounded-xl text-xs font-semibold tracking-wide cursor-pointer"
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
