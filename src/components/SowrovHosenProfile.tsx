import React, { useEffect, useState } from 'react';
import {
  Film,
  Palette,
  Layers,
  FileText,
  Compass,
  ArrowLeft,
  ExternalLink,
  Mail,
  Share2,
  Check,
  MapPin
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
      highlights: 'Guiding projects from initial concept to final delivery.',
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
              I lead MirrorBook’s creative direction and work across graphic design, professional video editing, motion graphics, scriptwriting, and visual storytelling. My focus is to help brands communicate clearly through thoughtful creative work.
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
                <span>About Sowrov</span>
              </h2>
              <p>
                Sowrov Hosen is the founder and creative director of MirrorBook. He works across graphic design, video editing, motion graphics, scriptwriting, and creative production.
              </p>
              <p>
                At MirrorBook, the goal is simple: understand the brief, make considered creative decisions, and deliver work that reflects the client’s brand.
              </p>
            </div>
          </div>
        </section>

        {/* About MirrorBook */}
        <section className="mb-16 border-y border-white/[0.09] py-8 sm:py-10">
          <div className="max-w-3xl space-y-4">
            <p className="text-xs font-medium tracking-wide text-[#B7F34A]">About the Agency</p>

            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#F5F7F2] tracking-tight">
              Building MirrorBook
            </h2>

            <p className="text-sm sm:text-base text-[#A1AAA2] leading-relaxed">
              Sowrov Hosen founded <a href="https://mirrorbook.site/" className="text-[#B7F34A] hover:underline font-medium">MirrorBook Agency</a> (
              <a href="https://mirrorbook.site/" className="text-[#F5F7F2] hover:text-[#B7F34A] underline font-medium break-all">https://mirrorbook.site/</a>
              ) to establish a benchmark for high-caliber digital creative production in Bangladesh. The agency delivers comprehensive video editing, graphic branding, motion graphics, and tailored software tools for content creators and modern businesses worldwide.
            </p>

            <p className="text-sm text-[#A1AAA2] leading-relaxed">
              We also develop practical digital products, plugins, and learning resources that support creative workflows.
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <a
                href="https://mirrorbook.site/"
                className="glossy-btn-secondary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
              >
                <span>Visit MirrorBook</span>
                <ExternalLink size={13} className="text-[#B7F34A]" />
              </a>

            </div>
          </div>
        </section>


        {/* Founder & Team */}
        <section className="mb-16" aria-labelledby="founder-team-heading">
          <div className="mb-7 border-b border-white/[0.09] pb-5">
            <p className="text-xs font-medium text-[#B7F34A] mb-2">The People Behind MirrorBook</p>
            <h2 id="founder-team-heading" className="font-display text-2xl sm:text-3xl font-semibold text-[#F5F7F2] tracking-tight">
              Founders &amp; Team
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-[#A1AAA2] leading-relaxed">
              Meet the two founders and the team members behind MirrorBook.
            </p>
          </div>

          {/*
            Add each person's Imgbb image URL to photoUrl below when available.
            Keep the same image dimensions and card layout for all four profiles.
          */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
            {[
              {
                name: 'Sowrov Hosen',
                role: 'Founder',
                title: 'Creative Director',
                initials: 'SH',
                photoUrl: 'https://i.ibb.co.com/BHmVcvxW/Sowrov-Hosen.jpg',
                bio: 'Leads MirrorBook’s creative direction, visual storytelling, and creative production.',
                portfolio: 'https://sowrovhosenstudio.netlify.app',
              },
              {
                name: 'Walid Ahmed Shraban',
                role: 'Founder',
                title: 'Web Developer',
                initials: 'WS',
                photoUrl: '',
                bio: 'Builds and maintains MirrorBook’s websites and digital products, focusing on clear user experiences and reliable functionality.',
                portfolio: 'https://srabonx.netlify.app/',
              },
              {
                name: 'Musabbir Al Said',
                role: 'Team Member',
                title: 'Graphic Designer & Video Editor',
                initials: 'MA',
                photoUrl: '',
                bio: 'Creates brand-focused graphics, social media designs, and edited videos for digital campaigns and everyday content.',
                portfolio: '',
              },
              {
                name: 'Mehedi Hasan',
                role: 'Team Member',
                title: 'Visual Artist · Graphic Design & Video Editing',
                initials: 'MH',
                photoUrl: '',
                bio: 'Develops visual concepts and produces polished graphic designs and video content for brands and digital platforms.',
                portfolio: '',
              },
            ].map((member) => (
              <article key={member.name} className="rounded-xl border border-white/[0.09] bg-[#121614] p-4 sm:p-5 flex flex-col">
                <div className="w-full aspect-square rounded-xl overflow-hidden border border-white/[0.10] bg-[#1B211D] mb-4">
                  {member.photoUrl ? (
                    <img
                      src={member.photoUrl}
                      alt={`${member.name}, ${member.role} at MirrorBook`}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-semibold text-[#B7F34A]" aria-label={`Photo placeholder for ${member.name}`}>
                      {member.initials}
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-[#B7F34A] font-medium mb-1">{member.role}</p>
                <h3 className="text-base font-semibold text-[#F5F7F2]">{member.name}</h3>
                <p className="text-xs text-[#A1AAA2] mt-1">{member.title}</p>
                <p className="text-sm text-[#A1AAA2] leading-relaxed mt-3 flex-1">{member.bio}</p>
                {member.portfolio && (
                  <a
                    href={member.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glossy-btn mt-5 min-h-[42px] px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    View Portfolio <ExternalLink size={13} />
                  </a>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* Skills */}
        <section className="mb-16">
          <div className="mb-7 border-b border-white/[0.09] pb-5">
            <p className="text-xs font-medium text-[#B7F34A] mb-2">What We Do</p>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#F5F7F2] tracking-tight">
              Creative &amp; Technical Skills
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            {skillsList.map((skill) => {
              const IconComponent = skill.icon;
              return (
                <article key={skill.title} className="flex gap-4 border-b border-white/[0.09] py-5">
                  <div className="w-9 h-9 shrink-0 rounded-lg bg-[#171C19] border border-white/[0.08] flex items-center justify-center text-[#B7F34A]">
                    <IconComponent size={17} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-[#F5F7F2]">{skill.title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#A1AAA2]">{skill.description}</p>
                    <p className="mt-2 text-[11px] leading-relaxed text-[#707A72]">
                      Tools &amp; focus: {skill.toolset.join(' · ')}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Section 5: Direct Contact / Work With Sowrov CTA */}
        <section className="glossy-card rounded-2xl p-6 sm:p-8 text-center relative overflow-hidden">
          <div className="max-w-xl mx-auto space-y-4">
            <h2 className="font-display text-2xl font-bold text-[#F5F7F2]">
              Have a project in mind?
            </h2>
            <p className="text-xs sm:text-sm text-[#A1AAA2] leading-relaxed">
              Tell us what you are working on. We’d be glad to discuss how MirrorBook can help with design, video, motion graphics, or web development.
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
