import React, { useState, useEffect, useMemo } from 'react';
import { COURSES, TUTORIALS } from '../data/content';
import { CheckoutItem, TutorialItem, ProductItem } from '../types';
import { Play, Clock, ArrowRight, Video, ExternalLink, Sparkles } from 'lucide-react';

interface CoursesAndTutorialsProps {
  onEnrollCourse: (item: CheckoutItem) => void;
  onSelectTutorial: (tutorial: TutorialItem) => void;
  courses?: ProductItem[];
  tutorials?: ProductItem[];
}

export const CoursesAndTutorials: React.FC<CoursesAndTutorialsProps> = ({
  onEnrollCourse,
  onSelectTutorial,
  courses,
  tutorials,
}) => {
  // Default to 'tutorials' so the 4 free YouTube video masterclasses are immediately visible!
  const [activeTab, setActiveTab] = useState<'tutorials' | 'courses' | 'all'>('tutorials');

  // Sync tab with URL hash if visited directly via #tutorials or #courses
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#tutorials' || hash === '#tutorial') {
        setActiveTab('tutorials');
      } else if (hash === '#courses' || hash === '#course') {
        setActiveTab('courses');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const displayCourses = useMemo(() => {
    return courses && courses.length > 0
      ? courses.map((c) => ({
          id: c.id,
          title: c.title,
          price: c.price,
          priceDisplay: c.priceDisplay || `৳${c.price.toLocaleString()}`,
          description: c.description,
          thumbnailUrl: c.thumbnailUrl,
          category: c.category,
        }))
      : COURSES;
  }, [courses]);

  const displayTutorials: TutorialItem[] = useMemo(() => {
    const rawList =
      tutorials && tutorials.length > 0
        ? tutorials.map((t) => {
            const canonical =
              TUTORIALS.find((item) => item.id === t.id || item.title === t.title) || TUTORIALS[0];
            return {
              id: t.id,
              title: t.title || canonical.title,
              software: t.category || canonical.software || 'After Effects',
              duration: t.duration || canonical.duration || '08:00',
              description: t.description || '',
              videoUrl: t.protectedUrl || canonical.videoUrl,
              instructor: t.instructor || canonical.instructor || 'Khan Saheb Editz',
              thumbnailUrl: t.thumbnailUrl || canonical.thumbnailUrl,
            };
          })
        : TUTORIALS;

    // Deduplicate by videoUrl so exactly 4 distinct YouTube tutorials are shown
    const seen = new Set<string>();
    const deduplicated: TutorialItem[] = [];
    for (const item of rawList) {
      const key = item.videoUrl || item.title;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(item);
      }
    }
    return deduplicated.length > 0 ? deduplicated : TUTORIALS;
  }, [tutorials]);

  return (
    <section id="courses" className="py-24 px-6 bg-[#71B913] text-black bg-grid-brand relative overflow-hidden">
      {/* Anchor for direct linking to #tutorials */}
      <div id="tutorials" className="relative -top-24" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-4 border-b border-black/20 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/10 text-black text-xs font-semibold mb-3">
              <Sparkles size={13} className="text-black" />
              <span>Free Tutorials &amp; Masterclasses</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-black tracking-tight">
              Courses &amp; Tutorials
            </h2>
          </div>

          {/* Tab Control */}
          <div className="flex items-center gap-1.5 p-1 bg-black/15 rounded-full">
            <button
              onClick={() => setActiveTab('tutorials')}
              className={`px-4 sm:px-5 py-2 text-xs font-bold uppercase tracking-normal rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'tutorials'
                  ? 'bg-black text-[#71B913] shadow-md'
                  : 'text-black/75 hover:text-black'
              }`}
            >
              <span>Free Tutorials</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'tutorials' ? 'bg-[#71B913] text-black' : 'bg-black/20 text-black'}`}>
                {displayTutorials.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('courses')}
              className={`px-4 sm:px-5 py-2 text-xs font-bold uppercase tracking-normal rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'courses'
                  ? 'bg-black text-[#71B913] shadow-md'
                  : 'text-black/75 hover:text-black'
              }`}
            >
              <span>Courses</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'courses' ? 'bg-[#71B913] text-black' : 'bg-black/20 text-black'}`}>
                {displayCourses.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 sm:px-4 py-2 text-xs font-bold uppercase tracking-normal rounded-full transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-black text-[#71B913] shadow-md'
                  : 'text-black/75 hover:text-black'
              }`}
            >
              View All
            </button>
          </div>
        </div>

        {/* Tab: Tutorials (Primary / Default) */}
        {(activeTab === 'tutorials' || activeTab === 'all') && (
          <div className="mb-14">
            {activeTab === 'all' && (
              <div className="mb-6">
                <h3 className="font-display text-2xl font-bold text-black flex items-center gap-2">
                  <span>Free Masterclass Tutorials</span>
                  <span className="text-xs bg-black text-[#71B913] px-2.5 py-0.5 rounded-full font-sans uppercase">
                    Free Stream
                  </span>
                </h3>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayTutorials.map((tutorial) => (
                <div
                  key={tutorial.id}
                  onClick={() => onSelectTutorial(tutorial)}
                  className="matte-glass-brand-card rounded-2xl p-5 flex flex-col justify-between cursor-pointer group hover:scale-[1.02] transition-transform"
                >
                  <div>
                    {/* Video Thumbnail with YouTube 4K Preview */}
                    <div className="aspect-video rounded-xl bg-[#141414] border border-white/10 mb-4 flex items-center justify-center relative overflow-hidden group-hover:border-[#71B913]/50 transition-colors">
                      {tutorial.thumbnailUrl ? (
                        <img
                          src={tutorial.thumbnailUrl}
                          alt={`${tutorial.title} – Free ${tutorial.software} Masterclass Tutorial`}
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const ytMatch = tutorial.videoUrl?.match(/(?:youtu\.be\/|[?&]v=)([a-zA-Z0-9_-]+)/);
                            if (ytMatch && ytMatch[1]) {
                              e.currentTarget.src = `https://i.ytimg.com/vi/${ytMatch[1]}/hqdefault.jpg`;
                            }
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-tr from-black via-[#161616] to-[#121A0F] group-hover:scale-105 transition-transform duration-500" />
                      )}

                      <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-[#71B913] text-black flex items-center justify-center shadow-[0_0_25px_rgba(113,185,19,0.5)] group-hover:scale-115 active:scale-95 transition-all">
                          <Play size={18} className="ml-0.5 fill-black" />
                        </div>
                      </div>

                      <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-black/85 backdrop-blur-md rounded text-[10px] text-[#DDDDDD] font-medium border border-white/10">
                        {tutorial.duration}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-display text-base font-bold text-white group-hover:text-[#71B913] transition-colors mb-3 line-clamp-2 leading-snug">
                      {tutorial.title}
                    </h3>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-[#888888]">
                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#AAAAAA]">
                      <Clock size={12} className="text-[#71B913]" />
                      {tutorial.duration}
                    </span>
                    <a
                      href={tutorial.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-white hover:text-[#71B913] font-semibold text-[11px] inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-black/50 hover:bg-black/90 border border-white/15 hover:border-[#71B913]/50 transition-all cursor-pointer shadow-sm"
                      title="Watch directly on YouTube"
                    >
                      <span>Stream Free</span>
                      <ExternalLink size={11} className="text-[#71B913]" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Courses */}
        {(activeTab === 'courses' || activeTab === 'all') && (
          <div>
            {activeTab === 'all' && (
              <div className="mb-6 pt-6 border-t border-black/20">
                <h3 className="font-display text-2xl font-bold text-black flex items-center gap-2">
                  <span>Professional Masterclass Courses</span>
                  <span className="text-xs bg-black text-[#71B913] px-2.5 py-0.5 rounded-full font-sans uppercase">
                    Paid Enrollment
                  </span>
                </h3>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {displayCourses.map((course) => (
                <div
                  key={course.id}
                  className="matte-glass-brand-card rounded-3xl p-8 flex flex-col justify-between group"
                >
                  <div>
                    {course.thumbnailUrl ? (
                      <div className="aspect-video w-full rounded-2xl bg-[#141414] border border-white/10 mb-5 overflow-hidden">
                        <img
                          src={course.thumbnailUrl}
                          alt={`${course.title} – Professional Course by MirrorBook`}
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video w-full rounded-2xl bg-[#141414] border border-white/10 mb-5 overflow-hidden flex flex-col items-center justify-center p-4">
                        <div className="w-12 h-12 rounded-full bg-[#71B913]/15 border border-[#71B913]/30 text-[#71B913] flex items-center justify-center mb-2">
                          <Video size={20} />
                        </div>
                        <span className="text-[11px] text-[#AAAAAA] uppercase tracking-normal font-medium">
                          Masterclass Video Feed
                        </span>
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="font-display text-2xl font-bold text-white group-hover:text-[#71B913] transition-colors mb-2">
                      {course.title}
                    </h3>

                    {/* Subtitle */}
                    <p className="text-xs sm:text-sm text-[#AAAAAA] leading-relaxed mb-6 font-normal">
                      {course.description}
                    </p>
                  </div>

                  <div>
                    <div className="pt-6 border-t border-white/10 flex items-center justify-between mb-6">
                      <span className="text-[11px] uppercase tracking-normal text-[#888888] font-medium">
                        Lifetime Access
                      </span>
                      <span className="font-display text-3xl font-bold text-white tabular-nums">
                        {course.priceDisplay}
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        onEnrollCourse({
                          id: course.id,
                          name: course.title,
                          price: course.priceDisplay,
                          category: 'Course Enrollment',
                        })
                      }
                      className="w-full py-4 text-xs font-bold uppercase tracking-normal bg-[#71B913] hover:bg-[#81cf17] text-black shadow-[0_0_20px_rgba(113,185,19,0.3)] rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <span>Enroll Now</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

