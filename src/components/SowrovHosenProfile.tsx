import React, { useEffect } from 'react';
import { ExternalLink, Globe, Mail, MessageCircle } from 'lucide-react';

interface SowrovHosenProfileProps {
  onNavigateHome: () => void;
  onStartProject?: () => void;
  onNavigate?: (path: string) => void;
  onOpenEmailSheet?: (defaultSubject?: string) => void;
}

const WHATSAPP_DIRECT_URL = 'https://wa.me/8801767079837?text=' + encodeURIComponent('Hello');

const teamMembers = [
  {
    name: 'Sowrov Hosen',
    role: 'Founder & Creative Director',
    photoUrl: 'https://i.ibb.co.com/BHmVcvxW/Sowrov-Hosen.jpg',
    portfolio: 'https://sowrovhosenstudio.netlify.app',
  },
  {
    name: 'Walid Ahmed Shraban',
    role: 'Founder & Web Developer',
    photoUrl: 'https://i.ibb.co/BVtvZBg4/668652154-2513163962481178-6668835466422179627-n.jpg',
    portfolio: 'https://srabonx.netlify.app/',
  },
  {
    name: 'Musabbir Al Sayed',
    role: 'Team Member',
    photoUrl: 'https://i.ibb.co/67yR2bfy/Screenshot-2026-11-23-234418.png',
    portfolio: '',
  },
  {
    name: 'Mehedi Hasan',
    role: 'Team Member',
    photoUrl: 'https://i.ibb.co/FqNDq5v5/Mehedi-Hasan.jpg',
    portfolio: '',
  },
];

export const SowrovHosenProfile: React.FC<SowrovHosenProfileProps> = ({
  onNavigate,
  onOpenEmailSheet,
}) => {
  useEffect(() => {
    const profileSchema = {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      '@id': 'https://mirrorbook.site/sowrov-hosen#profilepage',
      url: 'https://mirrorbook.site/sowrov-hosen',
      name: 'MirrorBook | Team & Founder',
      description: 'Meet the founders and team behind MirrorBook, a creative agency in Bangladesh.',
      mainEntity: {
        '@type': 'Organization',
        name: 'MirrorBook',
        url: 'https://mirrorbook.site/',
        member: teamMembers.map((member) => ({
          '@type': 'Person',
          name: member.name,
          jobTitle: member.role,
          ...(member.photoUrl ? { image: member.photoUrl } : {}),
          ...(member.portfolio ? { sameAs: member.portfolio } : {}),
        })),
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
      document.getElementById('sowrov-hosen-schema')?.remove();
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#0B0D0C] text-[#F5F7F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <section aria-labelledby="founder-team-heading">
          <div className="mb-8">
            <h1
              id="founder-team-heading"
              className="font-display text-3xl sm:text-4xl font-semibold tracking-tight"
            >
              Team &amp; Founder
            </h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {teamMembers.map((member) => (
              <article
                key={member.name}
                className="min-w-0 overflow-hidden rounded-xl border border-white/[0.09] bg-[#121614]"
              >
                <div className="aspect-[4/5] bg-[#1B211D] overflow-hidden">
                  {member.photoUrl ? (
                    <img
                      src={member.photoUrl}
                      alt={member.name}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-semibold text-[#B7F34A]">
                      {member.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h2 className="text-base font-semibold">{member.name}</h2>
                  <p className="mt-1 text-sm text-[#A1AAA2]">{member.role}</p>
                  {member.portfolio && (
                    <a
                      href={member.portfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`View ${member.name}'s portfolio`}
                      className="mt-4 inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-lg border border-[#B7F34A]/40 bg-[#B7F34A]/[0.08] px-4 py-2 text-sm font-semibold text-[#B7F34A] transition-colors hover:bg-[#B7F34A] hover:text-[#0B0D0C]"
                    >
                      <Globe size={15} />
                      Portfolio
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-xl border border-white/[0.09] bg-[#121614] px-6 py-8 text-center sm:px-10" aria-labelledby="contact-mirrorbook-heading">
          <h2
            id="contact-mirrorbook-heading"
            className="font-display text-2xl sm:text-3xl font-semibold tracking-tight"
          >
            Contact MirrorBook
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm sm:text-base leading-relaxed text-[#A1AAA2]">
            Have a project or need a creative service? Get in touch with MirrorBook.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href={WHATSAPP_DIRECT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[#B7F34A] px-5 py-3 text-sm font-bold text-[#0B0D0C] transition-opacity hover:opacity-90"
            >
              <MessageCircle size={15} />
              Chat on WhatsApp
            </a>
            {onOpenEmailSheet ? (
              <button
                type="button"
                onClick={() => onOpenEmailSheet('Project Enquiry')}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-white/[0.14] bg-[#171C19] px-5 py-3 text-sm font-semibold text-[#F5F7F2] transition-colors hover:border-[#B7F34A]/50 hover:text-[#B7F34A] cursor-pointer"
              >
                <Mail size={15} />
                Send us an Email
              </button>
            ) : (
              <a
                href="mailto:mirrorbook.site@gmail.com?subject=Project%20Enquiry%20%7C%20MirrorBook"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-white/[0.14] bg-[#171C19] px-5 py-3 text-sm font-semibold text-[#F5F7F2] transition-colors hover:border-[#B7F34A]/50 hover:text-[#B7F34A]"
              >
                <Mail size={15} />
                Send us an Email
              </a>
            )}
            <a
              href="/contact"
              onClick={(e) => {
                if (onNavigate) {
                  e.preventDefault();
                  onNavigate('/contact');
                }
              }}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-white/[0.1] px-5 py-3 text-sm font-medium text-[#A1AAA2] transition-colors hover:border-white/25 hover:text-[#F5F7F2]"
            >
              Contact Us <ExternalLink size={14} />
            </a>
          </div>
        </section>
      </div>
    </main>
  );
};
