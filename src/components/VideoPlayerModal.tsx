import React, { useState } from 'react';
import { X, Play, Pause, Clock, User, CheckCircle2, Volume2, VolumeX, ExternalLink } from 'lucide-react';

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

function getYouTubeEmbedUrl(url?: string): string | null {
  if (!url) return null;
  try {
    // Check youtu.be/ID
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}?autoplay=1&rel=0`;

    // Check youtube.com/watch?v=ID
    const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}?autoplay=1&rel=0`;

    // Check youtube.com/embed/ID
    const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
    if (embedMatch) return `https://www.youtube.com/embed/${embedMatch[1]}?autoplay=1&rel=0`;

    // Check youtube-nocookie.com/embed/ID
    const noCookieMatch = url.match(/youtube-nocookie\.com\/embed\/([a-zA-Z0-9_-]+)/);
    if (noCookieMatch) return `https://www.youtube-nocookie.com/embed/${noCookieMatch[1]}?autoplay=1&rel=0`;

    if (url.startsWith('http')) return url;
  } catch {
    // fallback
  }
  return null;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ video, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(38);

  if (!video) return null;

  const embedUrl = getYouTubeEmbedUrl(video.videoUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl glass-panel rounded-3xl border border-white/[0.15] overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.9)] my-6">
        {/* Top Status Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#71B913] shadow-[0_0_8px_#71B913] animate-pulse" />
            <span className="text-xs uppercase tracking-normal font-semibold text-[#71B913]">
              {video.software || 'MirrorBook Masterclass'}
            </span>
            <span className="text-xs text-white/20">/</span>
            <span className="text-xs text-[#888888] flex items-center gap-1.5">
              <Clock size={12} />
              {video.duration || '03:20'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {video.videoUrl && (
              <a
                href={video.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold text-[#AAAAAA] hover:text-white glass-pill hover:bg-white/10 rounded-full transition-all"
                title="Open on YouTube"
              >
                <span>Watch on YouTube</span>
                <ExternalLink size={11} className="text-[#71B913]" />
              </a>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full glass-pill hover:bg-white/10 text-[#888888] hover:text-white transition-colors flex items-center justify-center cursor-pointer"
              aria-label="Close video"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Video Player Display Canvas */}
        <div className="relative aspect-video bg-[#070707] flex items-center justify-center border-b border-white/[0.08] group overflow-hidden">
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
            <>
              {/* Ambient Refractive Grid */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(113,185,19,0.12),transparent_70%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:28px_28px]" />

              {/* Video Stream Header Overlay */}
              <div className="absolute top-4 left-6 right-6 flex items-center justify-between z-20 text-[11px] text-[#AAAAAA]">
                <div className="glass-pill px-3 py-1 rounded-full text-white/90 font-medium">
                  Master Stream // 4K 60FPS HDR
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#71B913] animate-ping" />
                  <span className="text-[#71B913] font-semibold">Lossless Feed</span>
                </div>
              </div>

              {/* Interactive Play/Pause Trigger */}
              <div
                onClick={() => setIsPlaying(!isPlaying)}
                className="relative z-10 w-20 h-20 rounded-full bg-[#71B913] text-black flex items-center justify-center shadow-[0_0_50px_rgba(113,185,19,0.5)] hover:scale-110 active:scale-95 transition-all cursor-pointer"
              >
                {isPlaying ? (
                  <Pause size={30} className="fill-black" />
                ) : (
                  <Play size={30} className="fill-black ml-1" />
                )}
              </div>

              {/* Dynamic Video Scrubbing & Control Bar */}
              <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black via-black/80 to-transparent z-20 space-y-3">
                {/* Interactive Progress Track */}
                <div
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const newPct = Math.round((clickX / rect.width) * 100);
                    setProgress(Math.max(0, Math.min(100, newPct)));
                  }}
                  className="w-full h-1.5 bg-white/10 hover:h-2 rounded-full relative cursor-pointer overflow-hidden transition-all"
                >
                  <div
                    style={{ width: `${progress}%` }}
                    className="absolute top-0 left-0 bottom-0 bg-[#71B913] shadow-[0_0_10px_#71B913] transition-all duration-150"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-[#AAAAAA]">
                  <div className="flex items-center gap-3">
                    <span className="text-white font-medium">01:42</span>
                    <span>/</span>
                    <span>{video.duration || '03:20'}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-1 text-[#888888] hover:text-white transition-colors"
                    >
                      {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                    </button>
                    <span className="text-[10px] text-[#71B913] glass-pill px-2 py-0.5 rounded font-semibold">
                      Spatial Stereo
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Video Info Footer */}
        <div className="p-6 md:p-7 bg-[#0C0C0C]/90">
          <h3 className="font-display text-xl sm:text-2xl font-bold text-white mb-2 leading-snug">
            {video.title}
          </h3>
          {video.description ? (
            <p className="text-sm text-[#999999] leading-relaxed mb-4 font-normal">
              {video.description}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/[0.08] text-xs text-[#777777]">
            <div className="flex items-center gap-2">
              <User size={14} className="text-[#71B913]" />
              <span>Instructor: <strong className="text-white font-medium">{video.instructor || 'Khan Saheb Editz'}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-[#71B913] font-semibold">
              <CheckCircle2 size={14} />
              <span>Full Video Masterclass // HD 60FPS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
