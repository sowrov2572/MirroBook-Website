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
    <section id="courses" className="py-28 px-6 bg-[#CCFF00] text-black bg-grid-lemon relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-6 border-b border-black/15">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-black/70 font-mono font-semibold block mb-2">
              Education
            </span>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-black tracking-tight">
              Courses &amp; Tutorials
            </h2>
          </div>

          {/* Tab Control */}
          <div className="flex items-center gap-1.5 p-1.5 bg-black/10 rounded-full mt-6 md:mt-0">
            <button
              onClick={() => setActiveTab('courses')}
              className={`px-5 py-2 text-xs font-mono font-semibold uppercase tracking-wider rounded-full transition-all cursor-pointer ${
                activeTab === 'courses'
                  ? 'bg-black text-[#CCFF00] shadow-md'
                  : 'text-black/70 hover:text-black'
              }`}
            >
              Courses
            </button>
            <button
              onClick={() => setActiveTab('tutorials')}
              className={`px-5 py-2 text-xs font-mono font-semibold uppercase tracking-wider rounded-full transition-all cursor-pointer ${
                activeTab === 'tutorials'
                  ? 'bg-black text-[#CCFF00] shadow-md'
                  : 'text-black/70 hover:text-black'
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
                className="matte-glass-lemon-card rounded-3xl p-8 flex flex-col justify-between group"
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
                      <div className="w-12 h-12 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-[#CCFF00] flex items-center justify-center mb-2">
                        <Video size={20} />
                      </div>
                      <span className="text-[11px] font-mono text-[#AAAAAA] uppercase tracking-wider">
                        Masterclass Video Feed
                      </span>
                    </div>
                  )}

                  {/* Title */}
                  <h3 className="font-display text-2xl font-bold text-white group-hover:text-[#CCFF00] transition-colors mb-2">
                    {course.title}
                  </h3>

                  {/* Subtitle */}
                  <p className="text-xs sm:text-sm text-[#999999] leading-relaxed mb-6 font-light">
                    {course.description}
                  </p>
                </div>

                <div>
                  <div className="pt-6 border-t border-white/10 flex items-center justify-between mb-6">
                    <span className="text-[11px] uppercase font-mono tracking-wider text-[#777777]">
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
                    className="w-full py-4 text-xs font-semibold uppercase tracking-wider bg-[#CCFF00] hover:bg-[#b8e600] text-black shadow-[0_0_20px_rgba(204,255,0,0.25)] rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
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
                className="matte-glass-lemon-card rounded-2xl p-5 flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  {/* Video Thumbnail */}
                  <div className="aspect-video rounded-xl bg-[#141414] border border-white/10 mb-4 flex items-center justify-center relative overflow-hidden group-hover:border-[#CCFF00]/50 transition-colors">
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
                      <div className="w-11 h-11 rounded-full bg-[#CCFF00] text-black flex items-center justify-center shadow-[0_0_20px_rgba(204,255,0,0.4)] group-hover:scale-110 active:scale-95 transition-all">
                        <Play size={16} className="ml-0.5 fill-black" />
                      </div>
                    </div>

                    <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-black/80 backdrop-blur-md rounded text-[10px] font-mono text-[#CCCCCC]">
                      {tutorial.duration}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-display text-base font-bold text-white group-hover:text-[#CCFF00] transition-colors mb-1.5 line-clamp-2">
                    {tutorial.title}
                  </h3>

                  {/* Subtitle */}
                  <p className="text-xs text-[#888888] line-clamp-2 leading-relaxed mb-4 font-light">
                    {tutorial.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-[#777777]">
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <Clock size={11} className="text-[#CCFF00]" />
                    {tutorial.duration}
                  </span>
                  <span className="text-white group-hover:text-[#CCFF00] font-medium text-[11px] underline">
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
