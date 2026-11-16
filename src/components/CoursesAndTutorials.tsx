import React, { useState, useEffect, useMemo } from 'react';
import { COURSES, TUTORIALS } from '../data/content';
import { CheckoutItem, TutorialItem, ProductItem } from '../types';
import { Play, Clock, ArrowRight, Video, ExternalLink, Maximize2, X } from 'lucide-react';

interface CoursesAndTutorialsProps {
  onEnrollCourse: (item: CheckoutItem) => void;
  onSelectTutorial: (tutorial: TutorialItem) => void;
  courses?: ProductItem[];
  tutorials?: ProductItem[];
}

function extractYouTubeId(url?: string): string {
  if (!url) return '';
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/))([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : '';
}

export const CoursesAndTutorials: React.FC<CoursesAndTutorialsProps> = ({
  onEnrollCourse,
  onSelectTutorial,
  courses,
  tutorials,
}) => {
  const [activeTab, setActiveTab] = useState<'tutorials' | 'courses' | 'all'>('tutorials');
  const [inlinePlayingId, setInlinePlayingId] = useState<string | null>(null);

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
    return TUTORIALS.map((canonical) => {
      const live = tutorials?.find((t) => t.id === canonical.id);
      return {
        id: canonical.id,
        title: live?.title || canonical.title,
        software: live?.category || canonical.software,
        duration: live?.duration || canonical.duration,
        description: '',
        videoUrl: canonical.videoUrl,
        instructor: canonical.instructor,
        thumbnailUrl: canonical.thumbnailUrl,
      };
    }).slice(0, 4);
  }, [tutorials]);

  return (
    <section
      id="courses"
      className="py-16 sm:py-20 px-5 sm:px-6 lg:px-8 bg-[#0B0D0C] text-[#F5F7F2] bg-grid-subtle border-b border-white/[0.09] relative overflow-hidden"
    >
      {/* Anchor for direct linking to #tutorials */}
      <div id="tutorials" className="relative -top-20" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-5 border-b border-white/[0.09]">
          <div>
            <span className="text-xs font-semibold text-[#B7F34A] block mb-2">
              Free Tutorials &amp; Masterclasses
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#F5F7F2] tracking-tight">
              Courses &amp; Tutorials
            </h2>
          </div>

          {/* Segmented Glass Tab Bar */}
          <div className="glass-tab-bar flex items-center gap-1 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('tutorials')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'tutorials'
                  ? 'bg-[#B7F34A] text-[#0B0D0C] font-bold shadow-sm'
                  : 'text-[#A1AAA2] hover:text-[#F5F7F2]'
              }`}
            >
              <span>Free Tutorials</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold tabular-nums leading-none ${
                  activeTab === 'tutorials'
                    ? 'bg-[#0B0D0C]/15 text-[#0B0D0C]'
                    : 'bg-white/10 text-[#A1AAA2]'
                }`}
              >
                {displayTutorials.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('courses')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'courses'
                  ? 'bg-[#B7F34A] text-[#0B0D0C] font-bold shadow-sm'
                  : 'text-[#A1AAA2] hover:text-[#F5F7F2]'
              }`}
            >
              <span>Courses</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold tabular-nums leading-none ${
                  activeTab === 'courses'
                    ? 'bg-[#0B0D0C]/15 text-[#0B0D0C]'
                    : 'bg-white/10 text-[#A1AAA2]'
                }`}
              >
                {displayCourses.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-[#B7F34A] text-[#0B0D0C] font-bold shadow-sm'
                  : 'text-[#A1AAA2] hover:text-[#F5F7F2]'
              }`}
            >
              View All
            </button>
          </div>
        </div>

        {/* Tab: Tutorials (Primary / Default) */}
        {(activeTab === 'tutorials' || activeTab === 'all') && (
          <div className={activeTab === 'all' ? 'mb-14' : ''}>
            {activeTab === 'all' && (
              <div className="mb-6 flex items-center gap-3">
                <h3 className="font-display text-xl sm:text-2xl font-bold text-[#F5F7F2]">
                  Free Masterclass Tutorials
                </h3>
                <span className="text-xs font-semibold text-[#B7F34A]">Free Stream</span>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
              {displayTutorials.map((tutorial) => {
                const isPlaying = inlinePlayingId === tutorial.id;
                const ytId = extractYouTubeId(tutorial.videoUrl);

                return (
                  <div
                    key={tutorial.id}
                    className="glossy-card glossy-card-hover p-5 flex flex-col justify-between h-full group"
                  >
                    <div>
                      {isPlaying ? (
                        <div className="aspect-video rounded-xl bg-[#0B0D0C] border border-[#B7F34A]/60 mb-4 overflow-hidden relative">
                          <iframe
                            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&playsinline=1&rel=0`}
                            title={tutorial.title}
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                          <button
                            type="button"
                            onClick={() => setInlinePlayingId(null)}
                            className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-[#0B0D0C]/85 hover:bg-[#0B0D0C] text-[#F5F7F2] flex items-center justify-center transition-colors cursor-pointer z-10 border border-white/15"
                            title="Close inline player"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => setInlinePlayingId(tutorial.id)}
                          className="aspect-video rounded-xl bg-[#121614] border border-white/[0.09] mb-4 flex items-center justify-center relative overflow-hidden group-hover:border-[#B7F34A]/40 transition-colors cursor-pointer"
                          title="Click to play video on website"
                        >
                          {tutorial.thumbnailUrl ? (
                            <img
                              src={tutorial.thumbnailUrl}
                              alt={`${tutorial.title} – Free ${tutorial.software} Masterclass Tutorial`}
                              loading="lazy"
                              decoding="async"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                if (ytId) {
                                  e.currentTarget.src = `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;
                                }
                              }}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-tr from-[#0B0D0C] via-[#121614] to-[#171C19]" />
                          )}

                          <div className="absolute inset-0 bg-[#0B0D0C]/35 flex items-center justify-center group-hover:bg-[#0B0D0C]/20 transition-colors">
                            <div className="w-11 h-11 rounded-xl bg-[#B7F34A] text-[#0B0D0C] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                              <Play size={17} className="ml-0.5 fill-[#0B0D0C]" />
                            </div>
                          </div>

                          <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-[#0B0D0C]/85 backdrop-blur-md rounded-md text-[11px] text-[#F5F7F2] font-medium border border-white/10 tabular-nums">
                            {tutorial.duration}
                          </div>
                        </div>
                      )}

                      <h3
                        onClick={() => onSelectTutorial(tutorial)}
                        className="font-display text-base font-bold text-[#F5F7F2] hover:text-[#B7F34A] transition-colors mb-3 line-clamp-2 leading-snug cursor-pointer"
                        title="Click to view tutorial in modal"
                      >
                        {tutorial.title}
                      </h3>
                    </div>

                    <div className="pt-3 border-t border-white/[0.09] flex items-center justify-between text-xs text-[#A1AAA2] gap-2">
                      <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#A1AAA2] tabular-nums">
                        <Clock size={12} className="text-[#B7F34A]" />
                        {tutorial.duration}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectTutorial(tutorial)}
                          className="text-[#A1AAA2] hover:text-[#F5F7F2] font-medium text-[11px] inline-flex items-center gap-1 py-1.5 px-2.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.09] transition-colors cursor-pointer"
                          title="Open in fullscreen modal player"
                        >
                          <Maximize2 size={11} className="text-[#B7F34A]" />
                          <span>Modal</span>
                        </button>
                        <a
                          href={tutorial.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="glossy-btn text-[11px] inline-flex items-center gap-1 py-1.5 px-2.5 rounded-lg cursor-pointer"
                          title="Watch directly on YouTube"
                        >
                          <span>Stream Free</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab: Courses */}
        {(activeTab === 'courses' || activeTab === 'all') && (
          <div>
            {activeTab === 'all' && (
              <div className="mb-6 pt-8 border-t border-white/[0.09] flex items-center gap-3">
                <h3 className="font-display text-xl sm:text-2xl font-bold text-[#F5F7F2]">
                  Professional Masterclass Courses
                </h3>
                <span className="text-xs font-semibold text-[#B7F34A]">Paid Enrollment</span>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {displayCourses.map((course) => (
                <div
                  key={course.id}
                  className="glossy-card glossy-card-hover p-6 sm:p-7 flex flex-col justify-between h-full group"
                >
                  <div>
                    {course.thumbnailUrl ? (
                      <div className="aspect-video w-full rounded-xl bg-[#121614] border border-white/[0.09] mb-5 overflow-hidden">
                        <img
                          src={course.thumbnailUrl}
                          alt={`${course.title} – Professional Course by MirrorBook`}
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video w-full rounded-xl bg-[#121614] border border-white/[0.09] mb-5 overflow-hidden flex flex-col items-center justify-center p-4">
                        <div className="w-11 h-11 rounded-xl bg-[#B7F34A]/15 border border-[#B7F34A]/30 text-[#B7F34A] flex items-center justify-center mb-2">
                          <Video size={20} />
                        </div>
                        <span className="text-xs text-[#A1AAA2] font-medium">
                          Masterclass Video Feed
                        </span>
                      </div>
                    )}

                    <h3 className="font-display text-xl font-bold text-[#F5F7F2] group-hover:text-[#B7F34A] transition-colors mb-2 leading-snug">
                      {course.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-[#A1AAA2] leading-relaxed mb-6">
                      {course.description}
                    </p>
                  </div>

                  <div>
                    <div className="pt-4 border-t border-white/[0.09] flex items-center justify-between mb-5">
                      <span className="text-xs text-[#A1AAA2] font-medium">
                        Lifetime Access
                      </span>
                      <span className="font-display text-2xl sm:text-3xl font-bold text-[#F5F7F2] tabular-nums">
                        {course.priceDisplay}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onEnrollCourse({
                          id: course.id,
                          name: course.title,
                          price: course.priceDisplay,
                          category: 'Course Enrollment',
                        })
                      }
                      className="w-full py-3.5 text-xs glossy-btn rounded-xl flex items-center justify-center gap-2 cursor-pointer"
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
