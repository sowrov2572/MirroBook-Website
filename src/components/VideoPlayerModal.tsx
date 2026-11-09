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
    return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl glass-panel rounded-3xl border border-white/[0.15] overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.95)] my-6 bg-[#080808]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Status Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#71B913] shadow-[0_0_10px_#71B913]" />
            <span className="text-xs uppercase tracking-normal font-semibold text-[#71B913]">
              {video.software || 'Tutorial'}
            </span>
            <span className="text-xs text-white/20">/</span>
            <span className="text-xs text-[#AAAAAA] flex items-center gap-1.5 font-medium">
              <Clock size={12} className="text-[#71B913]" />
              {video.duration || 'YouTube Video'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-black bg-[#71B913] hover:bg-[#81cf17] rounded-full transition-all cursor-pointer shadow-[0_0_15px_rgba(113,185,19,0.35)]"
              title="Open video on YouTube"
            >
              <span>Watch on YouTube</span>
              <ExternalLink size={12} />
            </a>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-[#CCCCCC] hover:text-white transition-colors flex items-center justify-center cursor-pointer"
              aria-label="Close video"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Video Player Display Canvas - Pure YouTube Embed without fake overlay clutter */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center border-b border-white/[0.08]">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={video.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center text-white/80">
              <p className="text-base font-semibold mb-4">{video.title}</p>
              <a
                href={watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-[#71B913] text-black font-bold rounded-xl flex items-center gap-2"
              >
                <span>Play on YouTube</span>
                <ExternalLink size={16} />
              </a>
            </div>
          )}
        </div>

        {/* Clean Minimal Video Info Footer (No fake streams, no ProRes/LUTs clutter) */}
        <div className="p-6 md:p-7 bg-[#0C0C0C]">
          <h3 className="font-display text-xl sm:text-2xl font-bold text-white mb-2 leading-snug">
            {video.title}
          </h3>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/[0.08] text-xs text-[#AAAAAA]">
            <div className="flex items-center gap-2">
              <User size={14} className="text-[#71B913]" />
              <span>
                Instructor:{' '}
                <strong className="text-white font-medium">
                  {video.instructor || 'Khan Saheb Editz'}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[#AAAAAA]">
              <Clock size={14} className="text-[#71B913]" />
              <span>Duration: <strong className="text-white font-medium">{video.duration}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
