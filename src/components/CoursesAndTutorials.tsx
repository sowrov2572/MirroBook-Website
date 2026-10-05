import React, { useState } from 'react';
import { COURSES, TUTORIALS } from '../data/content';
import { CheckoutItem, TutorialItem, ProductItem } from '../types';
import { Play, Clock, ArrowRight, Video } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'courses' | 'tutorials'>('courses');

  const displayCourses =
    courses && courses.length > 0
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

  const displayTutorials: TutorialItem[] =
    tutorials && tutorials.length > 0
      ? tutorials.map((t) => ({
          id: t.id,
          title: t.title,
          software: t.category,
          duration: t.duration || '15 min',
          description: t.description,
          videoUrl: t.protectedUrl || 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
          instructor: t.instructor || 'Lead Specialist',
          thumbnailUrl: t.thumbnailUrl,
        }))
      : TUTORIALS;

  return (
    <section id="courses" className="py-24 px-6 bg-[#71B913] text-black bg-grid-brand relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header: Strictly "Courses & Tutorials" */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-4 border-b border-black/20">
          <div>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-black tracking-tight">
              Courses &amp; Tutorials
            </h2>
          </div>

          {/* Tab Control */}
          <div className="flex items-center gap-1.5 p-1 bg-black/15 rounded-full mt-4 md:mt-0">
            <button
              onClick={() => setActiveTab('courses')}
              className={`px-5 py-2 text-xs font-bold uppercase tracking-normal rounded-full transition-all cursor-pointer ${
                activeTab === 'courses'
                  ? 'bg-black text-[#71B913] shadow-md'
                  : 'text-black/75 hover:text-black'
              }`}
            >
              Courses
            </button>
            <button
              onClick={() => setActiveTab('tutorials')}
              className={`px-5 py-2 text-xs font-bold uppercase tracking-normal rounded-full transition-all cursor-pointer ${
                activeTab === 'tutorials'
                  ? 'bg-black text-[#71B913] shadow-md'
                  : 'text-black/75 hover:text-black'
              }`}
            >
              Free Tutorials
            </button>
          </div>
        </div>

        {/* Tab 1: Courses */}
        {activeTab === 'courses' && (
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
                        alt={course.title}
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
        )}

        {/* Tab 2: Tutorials */}
        {activeTab === 'tutorials' && (
          <div id="tutorials" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayTutorials.map((tutorial) => (
              <div
                key={tutorial.id}
                onClick={() => onSelectTutorial(tutorial)}
                className="matte-glass-brand-card rounded-2xl p-5 flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  {/* Video Thumbnail */}
                  <div className="aspect-video rounded-xl bg-[#141414] border border-white/10 mb-4 flex items-center justify-center relative overflow-hidden group-hover:border-[#71B913]/50 transition-colors">
                    {tutorial.thumbnailUrl ? (
                      <img
                        src={tutorial.thumbnailUrl}
                        alt={tutorial.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-tr from-black via-[#161616] to-[#121A0F] group-hover:scale-105 transition-transform duration-500" />
                    )}

                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="w-11 h-11 rounded-full bg-[#71B913] text-black flex items-center justify-center shadow-[0_0_20px_rgba(113,185,19,0.4)] group-hover:scale-110 active:scale-95 transition-all">
                        <Play size={16} className="ml-0.5 fill-black" />
                      </div>
                    </div>

                    <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-black/80 backdrop-blur-md rounded text-[10px] text-[#CCCCCC] font-normal">
                      {tutorial.duration}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-display text-base font-bold text-white group-hover:text-[#71B913] transition-colors mb-1.5 line-clamp-2">
                    {tutorial.title}
                  </h3>

                  {/* Subtitle */}
                  <p className="text-xs text-[#AAAAAA] line-clamp-2 leading-relaxed mb-4 font-normal">
                    {tutorial.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-[#888888]">
                  <span className="flex items-center gap-1 text-[11px] font-medium">
                    <Clock size={11} className="text-[#71B913]" />
                    {tutorial.duration}
                  </span>
                  <span className="text-white group-hover:text-[#71B913] font-semibold text-[11px] underline">
                    Stream Free
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
