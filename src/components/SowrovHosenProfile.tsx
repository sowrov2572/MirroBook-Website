import React, { useEffect } from 'react';
import { ExternalLink } from 'lucide-react';

interface SowrovHosenProfileProps {
  onNavigateHome: () => void;
  onStartProject?: () => void;
}

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
    photoUrl: '',
    portfolio: 'https://srabonx.netlify.app/',
  },
  {
    name: 'Musabbir Al Said',
    role: 'Team Member',
    photoUrl: '',
    portfolio: '',
  },
  {
    name: 'Mehedi Hasan',
    role: 'Team Member',
    photoUrl: '',
    portfolio: '',
  },
];

export const SowrovHosenProfile: React.FC<SowrovHosenProfileProps> = ({
  onNavigateHome,
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
                      className="mt-4 inline-flex min-h-[40px] items-center gap-2 text-sm font-medium text-[#B7F34A] hover:underline"
                    >
                      Portfolio <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16 border-t border-white/[0.09] pt-8" aria-labelledby="about-mirrorbook-heading">
          <h2
            id="about-mirrorbook-heading"
            className="font-display text-2xl sm:text-3xl font-semibold tracking-tight"
          >
            MirrorBook
          </h2>
          <p className="mt-3 max-w-3xl text-sm sm:text-base leading-relaxed text-[#A1AAA2]">
            MirrorBook is a creative agency and digital studio offering graphic design, video editing, motion graphics, branding, and web development.
          </p>
          <a
            href="https://mirrorbook.site/"
            onClick={(event) => {
              event.preventDefault();
              onNavigateHome();
            }}
            className="mt-5 inline-flex min-h-[40px] items-center gap-2 text-sm font-medium text-[#B7F34A] hover:underline"
          >
            Visit MirrorBook <ExternalLink size={14} />
          </a>
        </section>
      </div>
    </main>
  );
};
