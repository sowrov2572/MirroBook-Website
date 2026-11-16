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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0D0C]/90 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl glossy-card bg-[#121614] rounded-2xl border border-white/[0.09] overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.95)] my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Status Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.09] bg-[#171C19]">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-normal font-semibold text-[#B7F34A]">
              {video.software || 'Tutorial'}
            </span>
            <span className="text-xs text-white/20">/</span>
            <span className="text-xs text-[#A1AAA2] flex items-center gap-1.5 font-medium">
              <Clock size={12} className="text-[#B7F34A]" />
              {video.duration || 'YouTube Video'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold glossy-btn rounded-xl cursor-pointer"
              title="Open video on YouTube"
            >
              <span>Watch on YouTube</span>
              <ExternalLink size={12} />
            </a>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-[#A1AAA2] hover:text-[#F5F7F2] transition-colors flex items-center justify-center cursor-pointer"
              aria-label="Close video"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Video Player Display Canvas - Pure YouTube Embed without fake overlay clutter */}
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
            <div className="flex flex-col items-center justify-center p-8 text-center text-[#F5F7F2]">
              <p className="text-base font-semibold mb-4">{video.title}</p>
              <a
                href={watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 glossy-btn font-bold rounded-xl flex items-center gap-2"
              >
                <span>Play on YouTube</span>
                <ExternalLink size={16} />
              </a>
            </div>
          )}
        </div>

        {/* Clean Minimal Video Info Footer (No fake streams, no ProRes/LUTs clutter) */}
        <div className="p-6 md:p-7 bg-[#121614]">
          <h3 className="font-display text-xl sm:text-2xl font-bold text-[#F5F7F2] mb-2 leading-snug">
            {video.title}
          </h3>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/[0.09] text-xs text-[#A1AAA2]">
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
              <span>Duration: <strong className="text-[#F5F7F2] font-medium">{video.duration}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
