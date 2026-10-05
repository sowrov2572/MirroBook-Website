import React, { useState } from 'react';
import { X, Play, Pause, Clock, User, CheckCircle2, Volume2, VolumeX, Maximize2, Shield } from 'lucide-react';

export interface PlayableVideo {
  title: string;
  software?: string;
  duration?: string;
  description: string;
  instructor?: string;
  videoUrl?: string;
}

interface VideoPlayerModalProps {
  video: PlayableVideo | null;
  onClose: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ video, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(38);

  if (!video) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl glass-panel rounded-3xl border border-white/[0.15] overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.9)] my-6">
        {/* Top Glossy Status Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#CCFF00] shadow-[0_0_8px_#CCFF00] animate-pulse" />
            <span className="text-xs uppercase tracking-wider font-mono text-[#CCFF00]">
              {video.software || 'MirrorBook Media Player'}
            </span>
            <span className="text-xs text-white/20">/</span>
            <span className="text-xs text-[#888888] font-mono flex items-center gap-1.5">
              <Clock size={12} />
              {video.duration || '03:20'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full glass-pill hover:bg-white/10 text-[#888888] hover:text-white transition-colors flex items-center justify-center cursor-pointer"
            aria-label="Close video"
          >
            <X size={18} />
          </button>
        </div>

        {/* Video Player Display Canvas */}
        <div className="relative aspect-video bg-[#070707] flex items-center justify-center border-b border-white/[0.08] group overflow-hidden">
          {/* Subtle Ambient Refractive Grid */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(204,255,0,0.1),transparent_70%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:28px_28px]" />

          {/* Video Stream Header Overlay */}
          <div className="absolute top-4 left-6 right-6 flex items-center justify-between z-20 text-[11px] font-mono text-[#AAAAAA]">
            <div className="glass-pill px-3 py-1 rounded-full text-white/90">
              Master Stream // 4K 60FPS HDR
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-ping" />
              <span className="text-[#CCFF00]">Lossless Feed</span>
            </div>
          </div>

          {/* Interactive Play/Pause Trigger */}
          <div
            onClick={() => setIsPlaying(!isPlaying)}
            className="relative z-10 w-20 h-20 rounded-full bg-[#CCFF00] text-black flex items-center justify-center shadow-[0_0_50px_rgba(204,255,0,0.5)] hover:scale-110 active:scale-95 transition-all cursor-pointer"
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
                className="absolute top-0 left-0 bottom-0 bg-[#CCFF00] shadow-[0_0_10px_#CCFF00] transition-all duration-150"
              />
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-[#AAAAAA]">
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
                <span className="text-[10px] text-[#CCFF00] glass-pill px-2 py-0.5 rounded">
                  Spatial Stereo
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Video Info Footer */}
        <div className="p-7 bg-[#0C0C0C]/80">
          <h3 className="font-display text-2xl font-bold text-white mb-2">
            {video.title}
          </h3>
          <p className="text-sm text-[#999999] leading-relaxed mb-5 font-light">
            {video.description}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/[0.08] text-xs text-[#777777]">
            <div className="flex items-center gap-2">
              <User size={14} className="text-[#CCFF00]" />
              <span>Lead Specialist: <strong className="text-white font-medium">{video.instructor || 'MirrorBook Creative Director'}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-[#CCFF00] font-mono">
              <CheckCircle2 size={14} />
              <span>Full ProRes 422HQ Project Files &amp; LUTs Included</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
