import React, { useState, useEffect, useMemo } from 'react';
import { CheckoutItem, TutorialItem, ProductItem } from '../types';
import {
  COURSE_VIDEO_EDITING_FUNDAMENTALS_ID,
  VIDEO_EDITING_FUNDAMENTALS_THUMBNAIL_FALLBACK,
  ALL_FREE_TUTORIALS_CHANNEL_ID,
  ALL_FREE_TUTORIALS_CHANNEL_URL,
  ALL_FREE_TUTORIALS_AVATAR_URL,
} from '../data/content';
import {
  Play,
  Clock,
  ArrowRight,
  Video,
  ExternalLink,
  Maximize2,
  X,
  GraduationCap,
  Layers,
  BookOpen,
} from 'lucide-react';
import { useLanguage } from '../utils/i18n';

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

type LearningFilter = 'all' | 'courses' | 'tutorials';

export const CoursesAndTutorials: React.FC<CoursesAndTutorialsProps> = ({
  onEnrollCourse,
  onOpenCourseDetails,
  onSelectTutorial,
  courses = [],
  tutorials = [],
  enrolledCourseIds = [],
  loading = false,
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<LearningFilter>('all');
  const [inlinePlayingId, setInlinePlayingId] = useState<string | null>(null);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#free-tutorials') {
        setActiveTab('tutorials');
      } else if (hash === '#tutorials' || hash === '#tutorial') {
        setActiveTab('all');
      } else if (
        hash === '#courses' ||
        hash === '#course' ||
        hash === '#course-video-editing-fundamentals'
      ) {
        setActiveTab('courses');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const activeCourses = useMemo(() => {
    return courses
      .filter((c) => c.type === 'Course' && c.status !== 'draft' && c.status !== 'archived')
      .map((c) => ({
        kind: 'course' as const,
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

  const activeTutorials = useMemo(() => {
    return tutorials
      .filter((t) => t.type === 'Free Tutorial' && t.status !== 'draft' && t.status !== 'archived')
      .map((t) => {
        const tutorialItem: TutorialItem = {
          id: t.id,
          title: t.title,
          software: t.category || 'Tutorial',
          duration: t.duration || 'Video',
          description: t.description || '',
          videoUrl: t.protectedUrl || t.launchUrl || '',
          instructor: t.instructor || 'MirrorBook',
          thumbnailUrl: t.thumbnailUrl,
        };
        return {
          kind: 'tutorial' as const,
          id: t.id,
          tutorial: tutorialItem,
        };
      });
  }, [tutorials]);

  // Unified learning items grid: Courses and Free Tutorials rendered in one single grid
  const unifiedLearningItems = useMemo(() => {
    const seen = new Set<string>();
    const combined: Array<
      | (typeof activeCourses)[number]
      | (typeof activeTutorials)[number]
    > = [];

    if (activeTab === 'all' || activeTab === 'courses') {
      for (const c of activeCourses) {
        if (!seen.has(c.id)) {
          seen.add(c.id);
          combined.push(c);
        }
      }
    }
    if (activeTab === 'all' || activeTab === 'tutorials') {
      for (const t of activeTutorials) {
        if (!seen.has(t.id)) {
          seen.add(t.id);
          combined.push(t);
        }
      }
    }

    return combined;
  }, [activeCourses, activeTutorials, activeTab]);

  const totalCount = activeCourses.length + activeTutorials.length;

  return (
    <section
      id="courses"
      className="scroll-mt-20 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-[#0B0D0C] text-[#F5F7F2] bg-grid-subtle border-b border-white/[0.09] relative overflow-x-clip"
    >
      <div id="tutorials" className="scroll-mt-24 max-w-7xl mx-auto relative z-10">
        {/* Unified Header & Category Filter Navigation */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-10 pb-5 border-b border-white/[0.09]">
          <div className="min-w-0">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#B7F34A] tracking-tight uppercase">
              {t('COURSES & TUTORIALS', 'কোর্স ও টিউটোরিয়াল')}
            </h2>
          </div>

          <div
            role="tablist"
            aria-label="Courses and Tutorials Library Filter"
            className="glass-tab-bar flex items-center gap-1 self-start md:self-auto max-w-full overflow-x-auto no-scrollbar"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'all'}
              onClick={() => setActiveTab('all')}
              className={`min-h-[38px] px-3 sm:px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === 'all'
                  ? 'bg-[#B7F34A] text-[#0B0D0C] font-bold shadow-sm'
                  : 'text-[#A1AAA2] hover:text-[#F5F7F2]'
              }`}
            >
              <Layers size={13} />
              <span>{t('View All', 'সব দেখুন')}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold tabular-nums leading-none ${
                  activeTab === 'all'
                    ? 'bg-[#0B0D0C]/15 text-[#0B0D0C]'
                    : 'bg-white/10 text-[#A1AAA2]'
                }`}
              >
                {totalCount}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'courses'}
              onClick={() => setActiveTab('courses')}
              className={`min-h-[38px] px-3 sm:px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === 'courses'
                  ? 'bg-[#B7F34A] text-[#0B0D0C] font-bold shadow-sm'
                  : 'text-[#A1AAA2] hover:text-[#F5F7F2]'
              }`}
            >
              <BookOpen size={13} />
              <span>{t('Courses', 'কোর্সসমূহ')}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold tabular-nums leading-none ${
                  activeTab === 'courses'
                    ? 'bg-[#0B0D0C]/15 text-[#0B0D0C]'
                    : 'bg-white/10 text-[#A1AAA2]'
                }`}
              >
                {activeCourses.length}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'tutorials'}
              onClick={() => setActiveTab('tutorials')}
              className={`min-h-[38px] px-3 sm:px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === 'tutorials'
                  ? 'bg-[#B7F34A] text-[#0B0D0C] font-bold shadow-sm'
                  : 'text-[#A1AAA2] hover:text-[#F5F7F2]'
              }`}
            >
              <Play size={13} />
              <span>{t('Free Tutorials', 'ফ্রি টিউটোরিয়াল')}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold tabular-nums leading-none ${
                  activeTab === 'tutorials'
                    ? 'bg-[#0B0D0C]/15 text-[#0B0D0C]'
                    : 'bg-white/10 text-[#A1AAA2]'
                }`}
              >
                {activeTutorials.length}
              </span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="glossy-card p-5 space-y-4 animate-pulse">
                <div className="aspect-video w-full rounded-xl bg-white/[0.06]" />
                <div className="h-4 w-3/4 rounded bg-white/[0.08]" />
                <div className="h-8 w-full rounded bg-white/[0.06]" />
              </div>
            ))}
          </div>
        ) : unifiedLearningItems.length === 0 ? (
          <div className="glossy-card p-8 sm:p-12 text-center max-w-2xl mx-auto animate-in fade-in duration-200">
            <div className="w-11 h-11 rounded-xl bg-white/[0.05] border border-white/[0.09] flex items-center justify-center text-[#B7F34A] mx-auto mb-3">
              <Video size={20} />
            </div>
            <h3 className="font-display text-base sm:text-lg font-bold text-[#F5F7F2] mb-1">
              {activeTab === 'courses'
                ? t('No Courses Available Right Now', 'এই মুহূর্তে কোনো কোর্স নেই')
                : activeTab === 'tutorials'
                ? t('No Free Tutorials Published Yet', 'এখনো কোনো ফ্রি টিউটোরিয়াল প্রকাশিত হয়নি')
                : t('No Courses or Tutorials Available Right Now', 'এই মুহূর্তে কোনো কোর্স বা টিউটোরিয়াল নেই')}
            </h3>
            <p className="text-xs sm:text-sm text-[#A1AAA2]">
              {t(
                'Published courses and free tutorials will appear here automatically.',
                'প্রকাশিত কোর্স ও ফ্রি টিউটোরিয়ালগুলো এখানে স্বয়ংক্রিয়ভাবে দেখা যাবে।'
              )}
            </p>
          </div>
        ) : (
          <div
            key={activeTab}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 items-stretch animate-in fade-in duration-200"
          >
            {unifiedLearningItems.map((entry) => {
              if (entry.kind === 'course') {
                const isEnrolled = enrolledCourseIds.includes(entry.id);
                const hasDetailsCurriculum =
                  entry.id === COURSE_VIDEO_EDITING_FUNDAMENTALS_ID &&
                  Boolean(onOpenCourseDetails);

                return (
                  <div
                    key={entry.id}
                    className="glossy-card glossy-card-hover p-5 sm:p-6 min-w-0 flex flex-col justify-between h-full group border-[#B7F34A]/20"
                  >
                    <div className="min-w-0">
                      <div className="aspect-video w-full rounded-xl bg-[#121614] border border-white/[0.09] mb-4 overflow-hidden relative">
                        {entry.thumbnailUrl ? (
                          <img
                            src={entry.thumbnailUrl}
                            alt={`${entry.title} – MirrorBook Course`}
                            width={800}
                            height={450}
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
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-4">
                            <div className="w-11 h-11 rounded-xl bg-[#B7F34A]/15 border border-[#B7F34A]/30 text-[#B7F34A] flex items-center justify-center mb-2">
                              <GraduationCap size={20} />
                            </div>
                          </div>
                        )}

                        <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-md bg-[#0B0D0C]/90 border border-[#B7F34A]/45 text-[10px] font-bold uppercase tracking-wider text-[#B7F34A]">
                          COURSE
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-[#B7F34A] mb-1 truncate">
                        {entry.category}
                      </div>

                      <h3 className="font-display text-lg sm:text-xl font-bold text-[#F5F7F2] group-hover:text-[#B7F34A] transition-colors mb-2 leading-snug break-words">
                        {entry.title}
                      </h3>

                      {entry.description && (
                        <p className="text-xs sm:text-sm text-[#A1AAA2] leading-relaxed mb-5 line-clamp-3">
                          {entry.description}
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="pt-4 border-t border-white/[0.09] flex items-center justify-between gap-2 mb-4">
                        <span className="text-xs text-[#A1AAA2] font-medium">
                          {isEnrolled
                            ? t('Enrolled · Lifetime Access', 'এনরোল করা · লাইফটাইম অ্যাক্সেস')
                            : t('Lifetime Access', 'লাইফটাইম অ্যাক্সেস')}
                        </span>
                        <span className="font-display text-2xl font-bold text-[#F5F7F2] tabular-nums">
                          {entry.priceDisplay}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (hasDetailsCurriculum && onOpenCourseDetails) {
                            onOpenCourseDetails(entry.raw);
                          } else {
                            onEnrollCourse({
                              id: entry.id,
                              name: entry.title,
                              price: entry.priceDisplay,
                              category: 'Course Enrollment',
                            });
                          }
                        }}
                        className="w-full min-h-[44px] py-3 text-xs glossy-btn rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>
                          {isEnrolled
                            ? t('Open Course', 'কোর্স ওপেন করুন')
                            : t('Get Access', 'অ্যাক্সেস নিন')}
                        </span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              }

              // Unified Free Tutorial Card
              const tutorial = entry.tutorial;
              const isChannelCard =
                tutorial.id === ALL_FREE_TUTORIALS_CHANNEL_ID ||
                tutorial.videoUrl.includes('youtube.com/@');

              if (isChannelCard) {
                const targetUrl = tutorial.videoUrl || ALL_FREE_TUTORIALS_CHANNEL_URL;
                const avatarSrc = tutorial.thumbnailUrl || ALL_FREE_TUTORIALS_AVATAR_URL;
                return (
                  <a
                    key={tutorial.id}
                    href={targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glossy-card glossy-card-hover p-5 sm:p-6 min-w-0 flex flex-col justify-between h-full group border-[#B7F34A]/25 cursor-pointer"
                    aria-label="ALL FREE TUTORIALS — Open Khan Saheb Editz YouTube Channel"
                  >
                    <div className="min-w-0">
                      <div className="aspect-video rounded-xl bg-gradient-to-br from-[#0F1311] via-[#141916] to-[#0B0D0C] border border-white/[0.09] group-hover:border-[#B7F34A]/45 transition-colors mb-4 relative overflow-hidden flex items-center justify-center p-4">
                        <div className="relative h-full max-h-[144px] aspect-square rounded-full overflow-hidden border-2 border-[#B7F34A]/50 shadow-[0_10px_28px_rgba(0,0,0,0.65)] bg-[#121614] shrink-0">
                          <img
                            src={avatarSrc}
                            alt="ALL FREE TUTORIALS — Khan Saheb Editz YouTube Channel"
                            width={144}
                            height={144}
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>

                        <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-md bg-[#0B0D0C]/90 border border-[#B7F34A]/35 text-[10px] font-bold uppercase tracking-wider text-[#B7F34A] z-10">
                          FREE TUTORIAL
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-[#B7F34A] mb-1 truncate">
                        YouTube Channel · @khan_saheb_editz
                      </div>

                      <h3 className="font-display text-lg font-bold text-[#F5F7F2] group-hover:text-[#B7F34A] transition-colors mb-3 leading-snug break-words">
                        {tutorial.title}
                      </h3>
                    </div>

                    <div className="pt-4 border-t border-white/[0.09] flex items-center justify-between text-xs text-[#A1AAA2] gap-2">
                      <span className="text-xs font-medium text-[#A1AAA2]">
                        Khan Saheb Editz
                      </span>
                      <span className="min-h-[38px] glossy-btn text-xs inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg">
                        <span>{t('Visit Channel', 'চ্যানেল দেখুন')}</span>
                        <ExternalLink size={12} />
                      </span>
                    </div>
                  </a>
                );
              }

              const isPlaying = inlinePlayingId === tutorial.id;
              const ytId = extractYouTubeId(tutorial.videoUrl);

              return (
                <div
                  key={tutorial.id}
                  className="glossy-card glossy-card-hover p-5 sm:p-6 min-w-0 flex flex-col justify-between h-full group"
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
                            alt={`${tutorial.title} – Free ${tutorial.software} Tutorial`}
                            width={800}
                            height={450}
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

                        <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-md bg-[#0B0D0C]/90 border border-[#B7F34A]/35 text-[10px] font-bold uppercase tracking-wider text-[#B7F34A] z-10">
                          FREE TUTORIAL
                        </span>

                        <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-[#0B0D0C]/85 backdrop-blur-md rounded-md text-[11px] text-[#F5F7F2] font-medium border border-white/10 tabular-nums">
                          {tutorial.duration}
                        </div>
                      </div>
                    )}

                    <div className="text-xs font-semibold text-[#B7F34A] mb-1 truncate">
                      {tutorial.software}
                    </div>

                    <h3
                      onClick={() => onSelectTutorial(tutorial)}
                      className="font-display text-lg font-bold text-[#F5F7F2] hover:text-[#B7F34A] transition-colors mb-3 line-clamp-2 leading-snug cursor-pointer break-words"
                      title="Click to view tutorial in modal"
                    >
                      {tutorial.title}
                    </h3>
                  </div>

                  <div className="pt-4 border-t border-white/[0.09] flex flex-wrap items-center justify-between text-xs text-[#A1AAA2] gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-[#A1AAA2] tabular-nums">
                      <Clock size={12} className="text-[#B7F34A]" />
                      {tutorial.duration}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectTutorial(tutorial)}
                        className="min-h-[38px] text-[#A1AAA2] hover:text-[#F5F7F2] font-medium text-xs inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.09] transition-colors cursor-pointer"
                        title="Open in fullscreen modal player"
                      >
                        <Maximize2 size={12} className="text-[#B7F34A]" />
                        <span>{t('Modal', 'প্লেয়ার')}</span>
                      </button>
                      {tutorial.videoUrl && (
                        <a
                          href={tutorial.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="min-h-[38px] glossy-btn text-xs inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg cursor-pointer"
                          title="Watch directly on YouTube"
                        >
                          <span>{t('Stream Free', 'ফ্রি দেখুন')}</span>
                          <ExternalLink size={12} />
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
    </section>
  );
};
