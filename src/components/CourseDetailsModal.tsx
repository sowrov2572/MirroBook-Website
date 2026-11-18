import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Play,
  Lock,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Sparkles,
  Loader2,
  AlertCircle,
  User as UserIcon,
} from 'lucide-react';
import { AppUser, CheckoutItem, CourseLessonSlot, ProductItem } from '../types';
import {
  COURSE_VIDEO_EDITING_FUNDAMENTALS_ID,
  VIDEO_EDITING_FUNDAMENTALS_PUBLIC_SLOTS,
  VIDEO_EDITING_FUNDAMENTALS_THUMBNAIL_FALLBACK,
  VIDEO_EDITING_FUNDAMENTALS_WHAT_YOU_LEARN,
} from '../data/content';
import { auth } from '../utils/firebase';

interface CourseDetailsModalProps {
  course: ProductItem | null;
  isOpen: boolean;
  onClose: () => void;
  user: AppUser | null;
  isEnrolled: boolean;
  onEnrollCourse: (item: CheckoutItem) => void;
  onSignIn: () => void;
}

export const CourseDetailsModal: React.FC<CourseDetailsModalProps> = ({
  course,
  isOpen,
  onClose,
  user,
  isEnrolled,
  onEnrollCourse,
  onSignIn,
}) => {
  const [lessons, setLessons] = useState<CourseLessonSlot[]>(VIDEO_EDITING_FUNDAMENTALS_PUBLIC_SLOTS);
  const [serverEnrolled, setServerEnrolled] = useState<boolean>(false);
  const [loadingLessons, setLoadingLessons] = useState<boolean>(false);
  const [lessonsError, setLessonsError] = useState<string>('');
  const [activeLessonNumber, setActiveLessonNumber] = useState<number | null>(null);

  const courseId = course?.id || COURSE_VIDEO_EDITING_FUNDAMENTALS_ID;
  const priceDisplay = course?.priceDisplay || `৳${course?.price || 499}`;
  const whatYouLearn =
    Array.isArray(course?.features) && course.features.length > 0
      ? course.features
      : VIDEO_EDITING_FUNDAMENTALS_WHAT_YOU_LEARN;

  useEffect(() => {
    if (!isOpen) {
      setActiveLessonNumber(null);
      setLessonsError('');
      return;
    }

    let cancelled = false;

    const loadAuthorizedLessons = async () => {
      if (!user || !auth.currentUser) {
        setServerEnrolled(false);
        setLessons(VIDEO_EDITING_FUNDAMENTALS_PUBLIC_SLOTS);
        return;
      }

      if (!isEnrolled && user.role !== 'admin') {
        // Still allow a quick verified check in case enrollment was unlocked by verified email
        setLoadingLessons(true);
      } else {
        setLoadingLessons(true);
      }
      setLessonsError('');

      try {
        const idToken = await auth.currentUser.getIdToken();
        const res = await fetch(
          `/api/courses/lessons?courseId=${encodeURIComponent(courseId)}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          }
        );

        const data = await res.json().catch(() => null);
        if (cancelled) return;

        if (res.ok && data?.enrolled && Array.isArray(data.lessons)) {
          setServerEnrolled(true);
          setLessons(data.lessons);
          const firstAvailable = (data.lessons as CourseLessonSlot[]).find(
            (l) => l.status === 'Available' && (l.embedUrl || l.youtubeId)
          );
          if (firstAvailable && isEnrolled) {
            setActiveLessonNumber(firstAvailable.lessonNumber);
          }
        } else {
          setServerEnrolled(false);
          setLessons(VIDEO_EDITING_FUNDAMENTALS_PUBLIC_SLOTS);
          if (isEnrolled) {
            setLessonsError(
              data?.error || 'Could not verify course access right now. Please refresh or sign in again.'
            );
          }
        }
      } catch {
        if (!cancelled) {
          setServerEnrolled(false);
          setLessons(VIDEO_EDITING_FUNDAMENTALS_PUBLIC_SLOTS);
          if (isEnrolled) {
            setLessonsError('Network error while loading your unlocked lessons.');
          }
        }
      } finally {
        if (!cancelled) {
          setLoadingLessons(false);
        }
      }
    };

    loadAuthorizedLessons();
    return () => {
      cancelled = true;
    };
  }, [isOpen, user?.uid, isEnrolled, courseId]);

  const unlocked = Boolean(user && (serverEnrolled || (isEnrolled && lessons.some((l) => l.embedUrl || l.youtubeId))));

  const availableLessons = useMemo(
    () => lessons.filter((l) => l.status === 'Available' && (l.embedUrl || l.youtubeId)),
    [lessons]
  );

  const activeLesson = useMemo(
    () => availableLessons.find((l) => l.lessonNumber === activeLessonNumber) || null,
    [availableLessons, activeLessonNumber]
  );

  const activeIndex = activeLesson
    ? availableLessons.findIndex((l) => l.lessonNumber === activeLesson.lessonNumber)
    : -1;

  if (!isOpen || !course) return null;

  const handleEnrollClick = () => {
    onClose();
    onEnrollCourse({
      id: course.id,
      name: course.title,
      price: priceDisplay,
      category: 'Course Enrollment',
    });
  };

  return (
    <div
      className="fixed inset-0 z-[65] overflow-y-auto overscroll-contain bg-[#0B0D0C]/88 backdrop-blur-xl animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="course-details-modal-title"
    >
      <div className="min-h-full flex items-start sm:items-center justify-center p-3 sm:p-5 py-4 sm:py-6">
        <div
          className="relative w-full max-w-4xl max-h-[calc(100dvh-2rem)] sm:max-h-[92dvh] flex flex-col glossy-card bg-[#121614] border border-white/[0.12] rounded-2xl overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.95)] my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Sticky Header */}
          <div className="shrink-0 bg-[#171C19] px-5 sm:px-7 py-4 border-b border-white/[0.09] flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-md bg-[#B7F34A]/15 border border-[#B7F34A]/35 text-[10px] font-bold uppercase tracking-wider text-[#B7F34A]">
                  {unlocked ? 'Enrolled · Lifetime Access' : 'Premium Course'}
                </span>
                <span className="text-[11px] text-[#A1AAA2] truncate">
                  Adobe After Effects, Adobe Premiere Pro &amp; VFX
                </span>
              </div>
              <h2
                id="course-details-modal-title"
                className="font-display text-lg sm:text-2xl font-bold text-[#F5F7F2] truncate"
              >
                {course.title}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-[#A1AAA2] hover:text-[#F5F7F2] flex items-center justify-center transition-colors cursor-pointer shrink-0"
              aria-label="Close course details"
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-7 space-y-6 sm:space-y-7">
            {/* Description & Summary */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-[#0B0D0C]/80 border border-white/[0.09]">
              <div className="space-y-1.5 min-w-0">
                <p className="text-xs sm:text-sm text-[#F5F7F2] leading-relaxed">
                  {course.description ||
                    'Learn the fundamentals of professional video editing with After Effects, Premiere Pro, and VFX workflows.'}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#A1AAA2]">
                  <span>Software: Adobe After Effects, Premiere Pro &amp; VFX</span>
                  <span>•</span>
                  <span>4 Lessons (3 Available + 1 Coming Soon)</span>
                </div>
              </div>

              {!unlocked && (
                <div className="shrink-0 flex flex-col items-start md:items-end gap-2">
                  <div className="text-right">
                    <span className="text-[11px] text-[#A1AAA2] block">One-Time Payment · Lifetime Access</span>
                    <span className="font-display text-2xl font-bold text-[#B7F34A] tabular-nums">
                      {priceDisplay}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleEnrollClick}
                    className="w-full md:w-auto min-h-[44px] px-5 py-2.5 text-xs font-bold glossy-btn rounded-xl flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <Sparkles size={14} />
                    <span>Enroll Now – {priceDisplay}</span>
                  </button>
                </div>
              )}
            </div>

            {lessonsError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-200 flex items-start gap-2.5">
                <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
                <span>{lessonsError}</span>
              </div>
            )}

            {/* Embedded Minimal 16:9 YouTube Player (Only renders for verified enrolled user with server embed URL) */}
            {unlocked && activeLesson && (activeLesson.embedUrl || activeLesson.youtubeId) && (
              <div className="rounded-2xl bg-[#0B0D0C] border border-[#B7F34A]/40 overflow-hidden shadow-xl">
                <div className="aspect-video w-full bg-black">
                  <iframe
                    src={
                      activeLesson.embedUrl ||
                      `https://www.youtube.com/embed/${activeLesson.youtubeId}?rel=0&modestbranding=1&playsinline=1`
                    }
                    title={`${course.title} — ${activeLesson.title}`}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>

                {/* Minimal Player Controls Bar (Lesson Title + Previous / Next Lesson Navigation) */}
                <div className="px-4 sm:px-5 py-3.5 bg-[#171C19] border-t border-white/[0.09] flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[11px] font-mono text-[#B7F34A] block">
                      Lesson {String(activeLesson.lessonNumber).padStart(2, '0')}
                      {activeLesson.duration ? ` · ${activeLesson.duration}` : ''}
                    </span>
                    <h3 className="font-display text-sm sm:text-base font-bold text-[#F5F7F2] truncate">
                      {activeLesson.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={activeIndex <= 0}
                      onClick={() => {
                        if (activeIndex > 0) {
                          setActiveLessonNumber(availableLessons[activeIndex - 1].lessonNumber);
                        }
                      }}
                      className="min-h-[38px] px-3 py-1.5 rounded-xl glossy-btn-secondary text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={14} />
                      <span>Previous Lesson</span>
                    </button>
                    <button
                      type="button"
                      disabled={activeIndex < 0 || activeIndex >= availableLessons.length - 1}
                      onClick={() => {
                        if (activeIndex >= 0 && activeIndex < availableLessons.length - 1) {
                          setActiveLessonNumber(availableLessons[activeIndex + 1].lessonNumber);
                        }
                      }}
                      className="min-h-[38px] px-3 py-1.5 rounded-xl glossy-btn text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span>Next Lesson</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Course Curriculum / 4 Structured Lesson Cards */}
            <div className="space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-base sm:text-lg font-bold text-[#F5F7F2] flex items-center gap-2">
                  <GraduationCap size={18} className="text-[#B7F34A]" />
                  <span>Course Curriculum (4 Lessons)</span>
                </h3>
                {loadingLessons && (
                  <span className="text-xs text-[#B7F34A] flex items-center gap-1.5">
                    <Loader2 size={13} className="animate-spin" />
                    <span>Checking enrollment...</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lessons.map((lesson) => {
                  const isComingSoon = lesson.status === 'Coming Soon';
                  const isPlayable = unlocked && !isComingSoon && Boolean(lesson.embedUrl || lesson.youtubeId);
                  const isCurrentlyPlaying = isPlayable && activeLesson?.lessonNumber === lesson.lessonNumber;
                  const formattedNumber = String(lesson.lessonNumber).padStart(2, '0');

                  return (
                    <button
                      key={lesson.lessonNumber}
                      type="button"
                      disabled={isComingSoon}
                      onClick={() => {
                        if (isComingSoon) return;
                        if (isPlayable) {
                          setActiveLessonNumber(lesson.lessonNumber);
                        } else {
                          handleEnrollClick();
                        }
                      }}
                      className={`text-left rounded-2xl border p-3.5 transition-all flex items-center gap-3.5 min-w-0 ${
                        isComingSoon
                          ? 'bg-[#0B0D0C]/45 border-white/[0.06] opacity-70 cursor-not-allowed'
                          : isCurrentlyPlaying
                          ? 'bg-[#B7F34A]/10 border-[#B7F34A] cursor-pointer'
                          : 'bg-[#0B0D0C]/85 border-white/[0.1] hover:border-[#B7F34A]/50 cursor-pointer group'
                      }`}
                    >
                      {/* Thumbnail Slot */}
                      <div className="w-28 sm:w-32 aspect-video rounded-xl bg-[#171C19] border border-white/[0.08] overflow-hidden relative shrink-0 flex items-center justify-center">
                        {isComingSoon ? (
                          <div className="text-center px-2">
                            <Clock size={16} className="text-[#707A72] mx-auto mb-1" />
                            <span className="text-[10px] font-semibold text-[#707A72] block">
                              Coming Soon
                            </span>
                          </div>
                        ) : isPlayable && lesson.thumbnailUrl ? (
                          <>
                            <img
                              src={lesson.thumbnailUrl}
                              alt={`${lesson.title} thumbnail`}
                              loading="lazy"
                              decoding="async"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-[#0B0D0C]/35 flex items-center justify-center group-hover:bg-[#0B0D0C]/15 transition-colors">
                              <div className="w-8 h-8 rounded-lg bg-[#B7F34A] text-[#0B0D0C] flex items-center justify-center shadow">
                                <Play size={13} className="fill-[#0B0D0C] ml-0.5" />
                              </div>
                            </div>
                          </>
                        ) : lesson.thumbnailUrl ? (
                          <>
                            <img
                              src={lesson.thumbnailUrl}
                              alt={`${lesson.title} locked preview thumbnail`}
                              loading="lazy"
                              decoding="async"
                              onError={(e) => {
                                const target = e.currentTarget;
                                if (target.dataset.fallbackApplied) return;
                                target.dataset.fallbackApplied = '1';
                                target.src = VIDEO_EDITING_FUNDAMENTALS_THUMBNAIL_FALLBACK;
                              }}
                              className="w-full h-full object-cover opacity-70 group-hover:opacity-85 transition-opacity"
                            />
                            <div className="absolute inset-0 bg-[#0B0D0C]/45 flex flex-col items-center justify-center px-1.5">
                              <div className="w-7 h-7 rounded-lg bg-[#0B0D0C]/90 border border-[#B7F34A]/50 flex items-center justify-center mb-1 shadow">
                                <Lock size={13} className="text-[#B7F34A]" />
                              </div>
                              <span className="px-1.5 py-0.5 rounded bg-[#0B0D0C]/85 text-[9px] font-semibold text-[#F5F7F2] leading-none">
                                Locked Preview
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="text-center px-2">
                            <Lock size={15} className="text-[#B7F34A] mx-auto mb-1" />
                            <span className="text-[10px] font-semibold text-[#A1AAA2] block">
                              Locked Preview
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Lesson Metadata */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <span className="text-[11px] font-mono font-bold text-[#B7F34A]">
                            LESSON {formattedNumber}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              isComingSoon
                                ? 'bg-white/[0.06] text-[#A1AAA2]'
                                : unlocked
                                ? 'bg-[#B7F34A]/15 text-[#B7F34A]'
                                : 'bg-white/[0.06] text-[#D4DBD5]'
                            }`}
                          >
                            {isComingSoon ? 'Coming Soon' : 'Available'}
                          </span>
                        </div>

                        <h4 className="font-display text-sm font-bold text-[#F5F7F2] truncate">
                          {lesson.title}
                        </h4>

                        <p className="text-[11px] text-[#A1AAA2]">
                          {isComingSoon
                            ? 'Scheduled upcoming lesson module'
                            : isPlayable
                            ? isCurrentlyPlaying
                              ? 'Now playing above'
                              : lesson.duration
                              ? `Click to watch · ${lesson.duration}`
                              : 'Click to play lesson'
                            : 'Available upon enrollment'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* What You'll Learn Section */}
            <div className="p-5 rounded-2xl bg-[#0B0D0C]/75 border border-white/[0.09] space-y-3.5">
              <h3 className="font-display text-base font-bold text-[#F5F7F2]">
                What You&apos;ll Learn
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {whatYouLearn.map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-xs sm:text-sm text-[#D4DBD5]">
                    <CheckCircle2 size={15} className="text-[#B7F34A] shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bottom Enrollment Action for Non-Enrolled Visitors */}
            {!unlocked && (
              <div className="p-4 sm:p-5 rounded-2xl bg-[#171C19] border border-[#B7F34A]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-display text-base font-bold text-[#F5F7F2]">
                    Ready to Start Learning?
                  </div>
                  <p className="text-xs text-[#A1AAA2]">
                    One-time payment of {priceDisplay} BDT unlocks lifetime access to all current and upcoming lessons.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  {!user && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSignIn();
                      }}
                      className="min-h-[44px] px-4 py-2.5 rounded-xl glossy-btn-secondary text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <UserIcon size={13} className="text-[#B7F34A]" />
                      <span>Already Enrolled? Sign In</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleEnrollClick}
                    className="min-h-[44px] px-6 py-2.5 rounded-xl glossy-btn text-xs font-bold flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles size={14} />
                    <span>Enroll Now – {priceDisplay}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
