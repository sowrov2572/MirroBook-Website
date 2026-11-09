import React, { useState, useEffect, useMemo } from 'react';
import { COURSES, TUTORIALS } from '../data/content';
import { CheckoutItem, TutorialItem, ProductItem } from '../types';
import { Play, Clock, ArrowRight, Video, ExternalLink, Sparkles, Maximize2, X } from 'lucide-react';

interface CoursesAndTutorialsProps {
  onEnrollCourse: (item: CheckoutItem) => void;
  onSelectTutorial: (tutorial: TutorialItem) => void;
  courses?: ProductItem[];
  tutorials?: ProductItem[];
}

function extractYouTubeId(url?: string): string {
  if (!url) return '';
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : '';
}

export const CoursesAndTutorials: React.FC<CoursesAndTutorialsProps> = ({
  onEnrollCourse,
  onSelectTutorial,
  courses,
  tutorials,
}) => {
  // Default to 'tutorials' so the 4 free YouTube video masterclasses are immediately visible!
  const [activeTab, setActiveTab] = useState<'tutorials' | 'courses' | 'all'>('tutorials');
  // Track which tutorial is currently playing inline directly inside its card
  const [inlinePlayingId, setInlinePlayingId] = useState<string | null>(null);

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
    // Strictly render the 4 official YouTube tutorials requested by the user
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
              {displayTutorials.map((tutorial) => {
                const isPlaying = inlinePlayingId === tutorial.id;
                const ytId = extractYouTubeId(tutorial.videoUrl);

                return (
                  <div
                    key={tutorial.id}
                    className="matte-glass-brand-card rounded-2xl p-5 flex flex-col justify-between group hover:scale-[1.01] transition-transform"
                  >
                    <div>
                      {/* Video Player Display: Inline YouTube or Interactive 4K Thumbnail */}
                      {isPlaying ? (
                        <div className="aspect-video rounded-xl bg-black border-2 border-[#71B913] mb-4 overflow-hidden relative shadow-[0_0_25px_rgba(113,185,19,0.4)]">
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
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/80 hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer z-10"
                            title="Close inline player"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => setInlinePlayingId(tutorial.id)}
                          className="aspect-video rounded-xl bg-[#141414] border border-white/10 mb-4 flex items-center justify-center relative overflow-hidden group-hover:border-[#71B913]/50 transition-colors cursor-pointer"
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
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-tr from-black via-[#161616] to-[#121A0F] group-hover:scale-105 transition-transform duration-500" />
                          )}

                          <div className="absolute inset-0 bg-black/35 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                            <div className="w-13 h-13 rounded-full bg-[#71B913] text-black flex items-center justify-center shadow-[0_0_25px_rgba(113,185,19,0.6)] group-hover:scale-115 active:scale-95 transition-all">
                              <Play size={18} className="ml-0.5 fill-black" />
                            </div>
                          </div>

                          <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-black/85 backdrop-blur-md rounded text-[10px] text-[#DDDDDD] font-medium border border-white/10">
                            {tutorial.duration}
                          </div>
                        </div>
                      )}

                      {/* Title */}
                      <h3
                        onClick={() => onSelectTutorial(tutorial)}
                        className="font-display text-base font-bold text-white hover:text-[#71B913] transition-colors mb-3 line-clamp-2 leading-snug cursor-pointer"
                        title="Click to view tutorial in modal"
                      >
                        {tutorial.title}
                      </h3>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-[#888888] gap-2">
                      <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#AAAAAA]">
                        <Clock size={12} className="text-[#71B913]" />
                        {tutorial.duration}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectTutorial(tutorial)}
                          className="text-[#AAAAAA] hover:text-white font-medium text-[11px] inline-flex items-center gap-1 py-1 px-2 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 transition-all cursor-pointer"
                          title="Open in fullscreen modal player"
                        >
                          <Maximize2 size={11} className="text-[#71B913]" />
                          <span>Modal</span>
                        </button>
                        <a
                          href={tutorial.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-black bg-[#71B913] hover:bg-[#81cf17] font-bold text-[11px] inline-flex items-center gap-1 py-1 px-2.5 rounded-lg transition-all cursor-pointer shadow-[0_0_12px_rgba(113,185,19,0.3)]"
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

