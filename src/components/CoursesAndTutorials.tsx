import React, { useState, useEffect, useMemo } from 'react';
import { CheckoutItem, TutorialItem, ProductItem } from '../types';
import {
  COURSE_VIDEO_EDITING_FUNDAMENTALS_ID,
  VIDEO_EDITING_FUNDAMENTALS_THUMBNAIL_FALLBACK,
} from '../data/content';
import { Play, Clock, ArrowRight, Video, ExternalLink, Maximize2, X, GraduationCap } from 'lucide-react';

interface CoursesAndTutorialsProps {
  onEnrollCourse: (item: CheckoutItem) => void;
  onOpenCourseDetails?: (course: ProductItem) => void;
  onSelectTutorial: (tutorial: TutorialItem) => void;
  courses?: ProductItem[];
  tutorials?: ProductItem[];
  enrolledCourseIds?: string[];
  loading?: boolean;
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
  onOpenCourseDetails,
  onSelectTutorial,
  courses = [],
  tutorials = [],
  enrolledCourseIds = [],
  loading = false,
}) => {
  const [activeTab, setActiveTab] = useState<'tutorials' | 'courses' | 'all'>('all');
  const [inlinePlayingId, setInlinePlayingId] = useState<string | null>(null);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#tutorials' || hash === '#tutorial') {
        setActiveTab('all');
      } else if (hash === '#courses' || hash === '#course' || hash === '#course-video-editing-fundamentals') {
        setActiveTab('courses');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const displayCourses = useMemo(() => {
    return courses
      .filter((c) => c.status !== 'draft' && c.status !== 'archived')
      .map((c) => ({
        raw: c,
        id: c.id,
        title: c.title,
        price: c.price,
        priceDisplay: c.priceDisplay || `৳${c.price.toLocaleString()}`,
        description: c.description,
        thumbnailUrl: c.thumbnailUrl,
        category: c.category || 'Adobe After Effects & Adobe Premiere Pro',
      }));
  }, [courses]);

  const displayTutorials: TutorialItem[] = useMemo(() => {
    return tutorials
      .filter((t) => t.status !== 'draft' && t.status !== 'archived')
      .map((t) => ({
        id: t.id,
        title: t.title,
        software: t.category || 'Tutorial',
        duration: t.duration || 'Video',
        description: t.description || '',
        videoUrl: t.protectedUrl || t.launchUrl || '',
        instructor: t.instructor || 'MirrorBook',
        thumbnailUrl: t.thumbnailUrl,
      }));
  }, [tutorials]);

  return (
    <section
      id="courses"
      className="scroll-mt-20 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-[#0B0D0C] text-[#F5F7F2] bg-grid-subtle border-b border-white/[0.09] relative overflow-x-clip"
    >
      <div id="tutorials" className="scroll-mt-24 max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-10 pb-5 border-b border-white/[0.09]">
          <div className="min-w-0">
            <span className="text-xs font-semibold text-[#B7F34A] block mb-2">
              Free Tutorials &amp; Masterclasses
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#F5F7F2] tracking-tight">
              Courses &amp; Tutorials
            </h2>
          </div>

          {/* Segmented Glass Tab Bar */}
          <div className="glass-tab-bar flex items-center gap-1 self-start md:self-auto max-w-full overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`min-h-[36px] px-3 sm:px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'all'
                  ? 'bg-[#B7F34A] text-[#0B0D0C] font-bold shadow-sm'
                  : 'text-[#A1AAA2] hover:text-[#F5F7F2]'
              }`}
            >
              View All
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('courses')}
              className={`min-h-[36px] px-3 sm:px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
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
              onClick={() => setActiveTab('tutorials')}
              className={`min-h-[36px] px-3 sm:px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
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
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {[1, 2, 3, 4].map((idx) => (
              <div key={idx} className="glossy-card p-5 space-y-4 animate-pulse">
                <div className="aspect-video w-full rounded-xl bg-white/[0.06]" />
                <div className="h-4 w-3/4 rounded bg-white/[0.08]" />
                <div className="h-8 w-full rounded bg-white/[0.06]" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Paid Premium Courses */}
            {(activeTab === 'courses' || activeTab === 'all') && (
              <div className={activeTab === 'all' ? 'mb-12 sm:mb-14' : ''}>
                {activeTab === 'all' && (
                  <div className="mb-6 flex items-center gap-3">
                    <h3 className="font-display text-xl sm:text-2xl font-bold text-[#F5F7F2]">
                      Premium Courses
                    </h3>
                    <span className="text-xs font-semibold text-[#B7F34A]">Lifetime Access</span>
                  </div>
                )}

                {displayCourses.length === 0 ? (
                  <div className="glossy-card p-8 sm:p-12 text-center max-w-2xl mx-auto">
                    <div className="w-11 h-11 rounded-xl bg-white/[0.05] border border-white/[0.09] flex items-center justify-center text-[#B7F34A] mx-auto mb-3">
                      <Video size={20} />
                    </div>
                    <h3 className="font-display text-base sm:text-lg font-bold text-[#F5F7F2] mb-1">
                      No Courses Available Right Now
                    </h3>
                    <p className="text-xs sm:text-sm text-[#A1AAA2]">
                      Paid courses published in the Studio Catalog will appear here automatically.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 items-stretch">
                    {displayCourses.map((course) => {
                      const isEnrolled = enrolledCourseIds.includes(course.id);
                      const hasDetailsCurriculum =
                        course.id === COURSE_VIDEO_EDITING_FUNDAMENTALS_ID && Boolean(onOpenCourseDetails);

                      return (
                        <div
                          key={course.id}
                          className="glossy-card glossy-card-hover p-5 sm:p-6 min-w-0 flex flex-col justify-between h-full group border-[#B7F34A]/20"
                        >
                          <div className="min-w-0">
                            {course.thumbnailUrl ? (
                              <div className="aspect-video w-full rounded-xl bg-[#121614] border border-white/[0.09] mb-4 overflow-hidden relative">
                                <img
                                  src={course.thumbnailUrl}
                                  alt={`${course.title} – MirrorBook Course`}
                                  loading="lazy"
                                  decoding="async"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    const target = e.currentTarget;
                                    if (target.dataset.fallbackApplied) return;
                                    target.dataset.fallbackApplied = '1';
                                    target.src = VIDEO_EDITING_FUNDAMENTALS_THUMBNAIL_FALLBACK;
                                  }}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-[#0B0D0C]/90 border border-[#B7F34A]/40 text-[10px] font-bold uppercase tracking-wider text-[#B7F34A]">
                                  {course.id === COURSE_VIDEO_EDITING_FUNDAMENTALS_ID
                                    ? 'Video Editing Fundamental'
                                    : 'Premium Course'}
                                </span>
                              </div>
                            ) : (
                              <div className="aspect-video w-full rounded-xl bg-[#121614] border border-white/[0.09] mb-4 overflow-hidden flex flex-col items-center justify-center p-4">
                                <div className="w-11 h-11 rounded-xl bg-[#B7F34A]/15 border border-[#B7F34A]/30 text-[#B7F34A] flex items-center justify-center mb-2">
                                  <GraduationCap size={20} />
                                </div>
                                <span className="text-xs text-[#B7F34A] font-semibold">
                                  Premium Course
                                </span>
                              </div>
                            )}

                            <div className="text-xs font-semibold text-[#B7F34A] mb-1 truncate">
                              {course.category}
                            </div>

                            <h3 className="font-display text-lg sm:text-xl font-bold text-[#F5F7F2] group-hover:text-[#B7F34A] transition-colors mb-2 leading-snug break-words">
                              {course.title}
                            </h3>

                            <p className="text-xs sm:text-sm text-[#A1AAA2] leading-relaxed mb-5 line-clamp-3">
                              {course.description}
                            </p>
                          </div>

                          <div>
                            <div className="pt-4 border-t border-white/[0.09] flex items-center justify-between gap-2 mb-4">
                              <span className="text-xs text-[#A1AAA2] font-medium">
                                {isEnrolled ? 'Enrolled · Lifetime Access' : 'Lifetime Access'}
                              </span>
                              <span className="font-display text-2xl font-bold text-[#F5F7F2] tabular-nums">
                                {course.priceDisplay}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                if (hasDetailsCurriculum && onOpenCourseDetails) {
                                  onOpenCourseDetails(course.raw);
                                } else {
                                  onEnrollCourse({
                                    id: course.id,
                                    name: course.title,
                                    price: course.priceDisplay,
                                    category: 'Course Enrollment',
                                  });
                                }
                              }}
                              className="w-full min-h-[44px] py-3 text-xs glossy-btn rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <span>{isEnrolled ? 'Open Course' : 'Get Access'}</span>
                              <ArrowRight size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Free Masterclass Tutorials */}
            {(activeTab === 'tutorials' || activeTab === 'all') && (
              <div>
                {activeTab === 'all' && (
                  <div className="mb-6 pt-8 border-t border-white/[0.09] flex items-center gap-3">
                    <h3 className="font-display text-xl sm:text-2xl font-bold text-[#F5F7F2]">
                      Free Masterclass Tutorials
                    </h3>
                    <span className="text-xs font-semibold text-[#B7F34A]">Free Stream</span>
                  </div>
                )}

                {displayTutorials.length === 0 ? (
                  <div className="glossy-card p-8 sm:p-12 text-center max-w-2xl mx-auto">
                    <div className="w-11 h-11 rounded-xl bg-white/[0.05] border border-white/[0.09] flex items-center justify-center text-[#B7F34A] mx-auto mb-3">
                      <Video size={20} />
                    </div>
                    <h3 className="font-display text-base sm:text-lg font-bold text-[#F5F7F2] mb-1">
                      No Tutorials Published Yet
                    </h3>
                    <p className="text-xs sm:text-sm text-[#A1AAA2]">
                      Tutorials added in the Studio Catalog will appear here immediately.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 items-stretch">
                    {displayTutorials.map((tutorial) => {
                      const isPlaying = inlinePlayingId === tutorial.id;
                      const ytId = extractYouTubeId(tutorial.videoUrl);

                      return (
                        <div
                          key={tutorial.id}
                          className="glossy-card glossy-card-hover p-4 sm:p-5 min-w-0 flex flex-col justify-between h-full group"
                        >
                          <div className="min-w-0">
                            {isPlaying && ytId ? (
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
                                  className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-[#0B0D0C]/85 hover:bg-[#0B0D0C] text-[#F5F7F2] flex items-center justify-center transition-colors cursor-pointer z-10 border border-white/15"
                                  title="Close inline player"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <div
                                onClick={() => {
                                  if (ytId) {
                                    setInlinePlayingId(tutorial.id);
                                  } else {
                                    onSelectTutorial(tutorial);
                                  }
                                }}
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
                              className="font-display text-base font-bold text-[#F5F7F2] hover:text-[#B7F34A] transition-colors mb-3 line-clamp-2 leading-snug cursor-pointer break-words"
                              title="Click to view tutorial in modal"
                            >
                              {tutorial.title}
                            </h3>
                          </div>

                          <div className="pt-3 border-t border-white/[0.09] flex flex-wrap items-center justify-between text-xs text-[#A1AAA2] gap-2">
                            <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#A1AAA2] tabular-nums">
                              <Clock size={12} className="text-[#B7F34A]" />
                              {tutorial.duration}
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => onSelectTutorial(tutorial)}
                                className="min-h-[36px] sm:min-h-0 text-[#A1AAA2] hover:text-[#F5F7F2] font-medium text-[11px] inline-flex items-center gap-1 py-1.5 px-2.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.09] transition-colors cursor-pointer"
                                title="Open in fullscreen modal player"
                              >
                                <Maximize2 size={11} className="text-[#B7F34A]" />
                                <span>Modal</span>
                              </button>
                              {tutorial.videoUrl && (
                                <a
                                  href={tutorial.videoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="min-h-[36px] sm:min-h-0 glossy-btn text-[11px] inline-flex items-center gap-1 py-1.5 px-2.5 rounded-lg cursor-pointer"
                                  title="Watch directly on YouTube"
                                >
                                  <span>Stream Free</span>
                                  <ExternalLink size={11} />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};
