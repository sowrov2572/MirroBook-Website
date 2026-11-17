import React from 'react';
import { X, Clock, User, ExternalLink } from 'lucide-react';
import { TUTORIALS } from '../data/content';

export interface PlayableVideo {
  title: string;
  software?: string;
  duration?: string;
  description?: string;
  instructor?: string;
  videoUrl?: string;
}

interface VideoPlayerModalProps {
  video: PlayableVideo | null;
  onClose: () => void;
}

export function extractYouTubeId(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/))([a-zA-Z0-9_-]{11})/);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

export function getYouTubeEmbedUrl(url?: string, title?: string): string | null {
  let id = extractYouTubeId(url);
  if (!id && title) {
    const found = TUTORIALS.find((t) => t.title.toLowerCase().trim() === title.toLowerCase().trim());
    if (found) {
      id = extractYouTubeId(found.videoUrl);
    }
  }
  if (id) {
    return `https://www.youtube.com/embed/${id}?autoplay=1&playsinline=1&rel=0`;
  }
  return null;
}

export function getYouTubeWatchUrl(url?: string, title?: string): string {
  let id = extractYouTubeId(url);
  if (!id && title) {
    const found = TUTORIALS.find((t) => t.title.toLowerCase().trim() === title.toLowerCase().trim());
    if (found) {
      id = extractYouTubeId(found.videoUrl);
    }
  }
  if (id) {
    return `https://www.youtube.com/watch?v=${id}`;
  }
  return url || 'https://www.youtube.com';
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ video, onClose }) => {
  if (!video) return null;

  const embedUrl = getYouTubeEmbedUrl(video.videoUrl, video.title);
  const watchUrl = getYouTubeWatchUrl(video.videoUrl, video.title);

  return (
    <div
      className="fixed inset-0 z-[70] overflow-y-auto overscroll-contain bg-[#0B0D0C]/90 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="min-h-full flex items-start sm:items-center justify-center p-3 sm:p-4 py-4 sm:py-6">
        <div
          className="relative w-full max-w-4xl max-h-[calc(100dvh-2rem)] sm:max-h-[90dvh] flex flex-col glossy-card bg-[#121614] rounded-2xl border border-white/[0.09] overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.95)] my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Status Bar */}
          <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-white/[0.09] bg-[#171C19]">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
              <span className="text-xs uppercase tracking-normal font-semibold text-[#B7F34A]">
                {video.software || 'Tutorial'}
              </span>
              <span className="text-xs text-white/20">/</span>
              <span className="text-xs text-[#A1AAA2] flex items-center gap-1.5 font-medium">
                <Clock size={12} className="text-[#B7F34A]" />
                {video.duration || 'YouTube Video'}
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <a
                href={watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold glossy-btn rounded-xl cursor-pointer whitespace-nowrap"
                title="Open video on YouTube"
              >
                <span>Watch on YouTube</span>
                <ExternalLink size={12} />
              </a>
              <button
                type="button"
                onClick={onClose}
                className="min-w-[40px] min-h-[40px] rounded-xl bg-white/10 hover:bg-white/20 text-[#A1AAA2] hover:text-[#F5F7F2] transition-colors flex items-center justify-center cursor-pointer shrink-0"
                aria-label="Close video"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain">
            {/* Video Player Display Canvas */}
            <div className="relative aspect-video w-full bg-[#0B0D0C] flex items-center justify-center border-b border-white/[0.09]">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  title={video.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-6 sm:p-8 text-center text-[#F5F7F2]">
                  <p className="text-sm sm:text-base font-semibold mb-4">{video.title}</p>
                  <a
                    href={watchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] px-6 py-3 glossy-btn font-bold rounded-xl flex items-center gap-2"
                  >
                    <span>Play on YouTube</span>
                    <ExternalLink size={16} />
                  </a>
                </div>
              )}
            </div>

            {/* Clean Minimal Video Info Footer */}
            <div className="p-4 sm:p-6 md:p-7 bg-[#121614]">
              <h3 className="font-display text-lg sm:text-2xl font-bold text-[#F5F7F2] mb-2 leading-snug break-words">
                {video.title}
              </h3>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/[0.09] text-xs text-[#A1AAA2]">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-[#B7F34A]" />
                  <span>
                    Instructor:{' '}
                    <strong className="text-[#F5F7F2] font-medium">
                      {video.instructor || 'Khan Saheb Editz'}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[#A1AAA2]">
                  <Clock size={14} className="text-[#B7F34A]" />
                  <span>
                    Duration: <strong className="text-[#F5F7F2] font-medium">{video.duration}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
