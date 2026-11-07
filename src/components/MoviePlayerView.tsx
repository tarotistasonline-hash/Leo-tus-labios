import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Film,
  Play,
  Pause,
  Upload,
  Monitor,
  Volume2,
  VolumeX,
  Target,
  Sparkles,
  RotateCcw,
  FastForward,
  Rewind,
  Ear,
  Maximize2,
  Minimize2,
  Link as LinkIcon,
  FolderOpen,
  Repeat,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  MOVIE_SCENE_PRESETS,
  generateCinematicSceneFrames,
} from '../utils/moviePresets';
import { MovieScenePreset, HearingProfile } from '../types';
import { TranslationDictionary } from '../i18n';

interface MoviePlayerViewProps {
  t: TranslationDictionary;
  hearingProfile: HearingProfile;
  onAnalyzeFrames: (frames: string[], spokenLang: string, contextHint?: string) => void;
  isLoading: boolean;
  isContinuous: boolean;
  onToggleContinuous: () => void;
}

export const MoviePlayerView: React.FC<MoviePlayerViewProps> = ({
  t,
  hearingProfile,
  onAnalyzeFrames,
  isLoading,
  isContinuous,
  onToggleContinuous,
}) => {
  // Video source state (user file, URL, screen share, or preset)
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState<string>('');
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);

  // Fallback preset demo if user wants an example
  const [selectedPreset, setSelectedPreset] = useState<MovieScenePreset | null>(null);
  const [showPresetsDrawer, setShowPresetsDrawer] = useState<boolean>(false);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(hearingProfile === 'hiperacusia');
  const [isLoopingSegment, setIsLoopingSegment] = useState<boolean>(false);
  const loopStartRef = useRef<number>(0);

  // Floating Reticle Coordinates (% of video container)
  const [reticlePos, setReticlePos] = useState<{ x: number; y: number }>({
    x: 50,
    y: 55,
  });
  const [reticleSize, setReticleSize] = useState<'sm' | 'md' | 'lg'>('md');

  // Drag and drop state
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  // Simulated frames state for presets
  const [simulatedFrames, setSimulatedFrames] = useState<string[]>([]);
  const [simFrameIndex, setSimFrameIndex] = useState<number>(0);
  const simTimerRef = useRef<any>(null);

  // Element Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const captureIntervalRef = useRef<any>(null);

  // Auto-mute for Hyperacusis
  useEffect(() => {
    if (hearingProfile === 'hiperacusia') {
      setIsMuted(true);
      if (videoRef.current) {
        videoRef.current.muted = true;
      }
    }
  }, [hearingProfile]);

  // Load preset animation if selected
  useEffect(() => {
    if (selectedPreset && !videoSrc && !isScreenSharing) {
      const frames = generateCinematicSceneFrames(selectedPreset);
      setSimulatedFrames(frames);
      setSimFrameIndex(0);
      setIsPlaying(true);
    }
  }, [selectedPreset, videoSrc, isScreenSharing]);

  // Playback loop for preset animation
  useEffect(() => {
    if (!videoSrc && !isScreenSharing && isPlaying && simulatedFrames.length > 0) {
      simTimerRef.current = setInterval(() => {
        setSimFrameIndex((prev) => (prev >= simulatedFrames.length - 1 ? 0 : prev + 1));
      }, Math.round(300 / playbackSpeed));
    } else {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    }
    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, [isPlaying, simulatedFrames, playbackSpeed, videoSrc, isScreenSharing]);

  // Handle local video file (Mobile gallery or PC file)
  const handleFileChosen = (file: File) => {
    handleStopScreenShare();
    setSelectedPreset(null);
    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    setVideoFileName(file.name);
    setIsPlaying(true);

    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = url;
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  };

  // Drag and drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
      handleFileChosen(file);
    }
  };

  // Handle video URL load
  const handleLoadUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    handleStopScreenShare();
    setSelectedPreset(null);
    setVideoSrc(urlInput.trim());
    setVideoFileName(urlInput.split('/').pop() || 'Video en línea');
    setIsPlaying(true);
    setShowUrlInput(false);

    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = urlInput.trim();
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  };

  // Handle Screen / Window / Tab Share (for Netflix, YouTube, etc.)
  const handleStartScreenShare = async () => {
    try {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' } as any,
        audio: false,
      });

      screenStreamRef.current = stream;
      setVideoSrc(null);
      setSelectedPreset(null);
      setVideoFileName('Transmisión de Pantalla');
      setIsScreenSharing(true);
      setIsPlaying(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      stream.getVideoTracks()[0].onended = () => {
        handleStopScreenShare();
      };
    } catch (e) {
      console.warn('Screen share cancelled or not supported:', e);
    }
  };

  const handleStopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);
  };

  // Video Time Updates & Segment Looping
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    setCurrentTime(current);

    // If looping a 4-second phrase
    if (isLoopingSegment) {
      if (current >= loopStartRef.current + 4 || current >= videoRef.current.duration) {
        videoRef.current.currentTime = loopStartRef.current;
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration || 0);
  };

  // Seek timeline
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
    if (isLoopingSegment) {
      loopStartRef.current = time;
    }
  };

  const seekRelative = (seconds: number) => {
    if (!videoRef.current) return;
    const newTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleLoopSegment = () => {
    if (!isLoopingSegment) {
      loopStartRef.current = currentTime;
      setIsLoopingSegment(true);
    } else {
      setIsLoopingSegment(false);
    }
  };

  // Move Reticle on container click or drag
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    setReticlePos({
      x: Math.max(12, Math.min(88, Math.round(clickX))),
      y: Math.max(12, Math.min(88, Math.round(clickY))),
    });
  };

  // Capture frames from the targeted lip reticle
  const captureMovieBurst = useCallback(() => {
    // Case 1: Video is active (file, URL, or screen share)
    if ((videoSrc || isScreenSharing) && videoRef.current) {
      const v = videoRef.current;
      if (v.readyState < 2) return;

      const vw = v.videoWidth || 640;
      const vh = v.videoHeight || 480;

      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const boxSizeW = reticleSize === 'sm' ? 0.22 : reticleSize === 'lg' ? 0.38 : 0.30;
      const boxSizeH = boxSizeW * 0.75;

      const cropW = Math.round(vw * boxSizeW);
      const cropH = Math.round(vh * boxSizeH);
      const centerX = (reticlePos.x / 100) * vw;
      const centerY = (reticlePos.y / 100) * vh;
      const cropX = Math.max(0, Math.min(vw - cropW, Math.round(centerX - cropW / 2)));
      const cropY = Math.max(0, Math.min(vh - cropH, Math.round(centerY - cropH / 2)));

      const burst: string[] = [];
      const total = 7;
      let count = 0;

      const timer = setInterval(() => {
        if (!videoRef.current) {
          clearInterval(timer);
          return;
        }

        ctx.drawImage(v, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);
        burst.push(canvas.toDataURL('image/jpeg', 0.85));
        count++;

        if (count >= total) {
          clearInterval(timer);
          onAnalyzeFrames(
            burst,
            'auto',
            videoFileName ? `Video: ${videoFileName}` : 'Video cargado por el usuario'
          );
        }
      }, 200);
      return;
    }

    // Case 2: Preset demo scene
    if (selectedPreset && simulatedFrames.length > 0) {
      onAnalyzeFrames(
        simulatedFrames,
        selectedPreset.langCode,
        `Película: ${selectedPreset.title} - ${selectedPreset.speaker}`
      );
    }
  }, [
    videoSrc,
    isScreenSharing,
    reticlePos,
    reticleSize,
    selectedPreset,
    simulatedFrames,
    videoFileName,
    onAnalyzeFrames,
  ]);

  // Continuous movie scanning heartbeat
  useEffect(() => {
    if (isContinuous && isPlaying) {
      captureIntervalRef.current = setInterval(() => {
        if (!isLoading) {
          captureMovieBurst();
        }
      }, 2800);
    } else {
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
      }
    }

    return () => {
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
      }
    };
  }, [isContinuous, isPlaying, isLoading, captureMovieBurst]);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = Math.floor(secs % 60);
    return `${mins}:${remSecs < 10 ? '0' : ''}${remSecs}`;
  };

  const reticleDimensions = {
    sm: 'w-24 h-16 sm:w-32 sm:h-20',
    md: 'w-36 h-24 sm:w-48 sm:h-32',
    lg: 'w-48 h-32 sm:w-64 sm:h-44',
  };

  const hasVideoLoaded = Boolean(videoSrc || isScreenSharing || selectedPreset);

  return (
    <div className="w-full space-y-3">
      {/* Hidden file input for Mobile & PC */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileChosen(file);
        }}
        accept="video/*"
        className="hidden"
      />

      {/* Hearing Assistance Badge */}
      {hearingProfile !== 'standard' && (
        <div
          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs animate-fadeIn ${
            hearingProfile === 'hiperacusia'
              ? 'bg-amber-950/40 border-amber-600/50 text-amber-200'
              : 'bg-emerald-950/40 border-emerald-600/50 text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Ear size={15} className="shrink-0" />
            <span className="font-semibold">
              {hearingProfile === 'hiperacusia'
                ? 'Protección Auditiva (Hiperacusia): Audio silenciado para evitar ruidos dolorosos'
                : 'Modo Hipoacusia: Subtítulos optimizados en tamaño y contraste'}
            </span>
          </div>
          {hearingProfile === 'hiperacusia' && (
            <span className="px-2 py-0.5 rounded-full bg-amber-900/60 border border-amber-500/40 text-[10px] font-bold">
              Silencio Activo
            </span>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. PRIMARY UNIVERSAL VIDEO PICKER (IF NO VIDEO LOADED YET) */}
      {/* ========================================================= */}
      {!hasVideoLoaded ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`w-full aspect-[16/10] sm:aspect-[16/9] bg-neutral-900 border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all ${
            isDraggingOver
              ? 'border-emerald-400 bg-emerald-950/20 scale-[1.01]'
              : 'border-neutral-700 hover:border-emerald-500/60 bg-neutral-900/90'
          }`}
        >
          {/* Main Action Icon */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-[1px] shadow-xl shadow-emerald-950/60 flex items-center justify-center mb-3">
            <div className="w-full h-full bg-neutral-950 rounded-[15px] flex items-center justify-center">
              <FolderOpen size={30} className="text-emerald-400" />
            </div>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-white mb-1">
            Elige cualquier video de tu Móvil o PC
          </h3>
          <p className="text-xs text-neutral-400 max-w-md mb-5 leading-relaxed">
            Selecciona una película, serie, video de WhatsApp, archivo descargado o grabación personal para leer los labios en pantalla.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 w-full max-w-md">
            {/* Big file picker button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl shadow-xl shadow-emerald-950 transition-all flex items-center gap-2 cursor-pointer active:scale-95 flex-1 justify-center min-w-[200px]"
            >
              <Upload size={17} />
              <span>Abrir Archivo / Galería</span>
            </button>

            {/* Screen share button for Netflix/YouTube */}
            <button
              onClick={handleStartScreenShare}
              className="px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white font-semibold text-xs rounded-xl border border-neutral-700 transition-colors flex items-center gap-2 cursor-pointer justify-center"
              title="Transmite una pestaña de YouTube, Netflix o videollamada"
            >
              <Monitor size={16} className="text-emerald-400" />
              <span>Transmitir Pantalla</span>
            </button>
          </div>

          {/* Secondary: URL Link Input */}
          <div className="mt-4 pt-4 border-t border-neutral-800 w-full max-w-md flex flex-col items-center">
            {!showUrlInput ? (
              <button
                onClick={() => setShowUrlInput(true)}
                className="text-xs text-neutral-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <LinkIcon size={13} />
                <span>O pegar enlace directo de video (URL)</span>
              </button>
            ) : (
              <form onSubmit={handleLoadUrl} className="w-full flex items-center gap-2">
                <input
                  type="url"
                  placeholder="https://ejemplo.com/pelicula.mp4"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cargar
                </button>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(false)}
                  className="p-1.5 text-neutral-400 hover:text-white"
                >
                  <X size={15} />
                </button>
              </form>
            )}

            {/* Link to demo presets */}
            <button
              onClick={() => {
                setSelectedPreset(MOVIE_SCENE_PRESETS[0]);
              }}
              className="mt-3 text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer flex items-center gap-1"
            >
              <Film size={12} />
              <span>¿No tienes video a mano? Probar con una escena de ejemplo</span>
            </button>
          </div>
        </div>
      ) : (
        /* ========================================================= */
        /* 2. ACTIVE VIDEO PLAYER WITH LIP TARGETING OVERLAY */
        /* ========================================================= */
        <div className="space-y-2">
          {/* Top Bar above player: Current video info & "Cambiar video" button */}
          <div className="flex items-center justify-between text-xs bg-neutral-900 border border-neutral-800 px-3 py-2 rounded-xl">
            <div className="flex items-center gap-2 truncate max-w-[70%]">
              <Film size={14} className="text-emerald-400 shrink-0" />
              <span className="font-semibold text-white truncate">
                {videoFileName || selectedPreset?.title || 'Video en reproducción'}
              </span>
              {selectedPreset && (
                <span className="text-[10px] bg-neutral-800 text-neutral-400 px-1.5 py-0.2 rounded shrink-0">
                  Ejemplo
                </span>
              )}
            </div>

            {/* Change video button */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs rounded-lg border border-neutral-700 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Upload size={12} />
                <span>Cambiar video</span>
              </button>

              <button
                onClick={() => {
                  setVideoSrc(null);
                  setVideoFileName(null);
                  setSelectedPreset(null);
                  handleStopScreenShare();
                }}
                className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
                title="Cerrar video"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Interactive Player Screen */}
          <div
            ref={containerRef}
            onClick={handleContainerClick}
            className="relative w-full aspect-[16/9] max-h-[55vh] bg-black rounded-2xl overflow-hidden shadow-2xl border border-neutral-800 select-none group cursor-crosshair flex items-center justify-center"
          >
            {/* User video / screen share stream */}
            {videoSrc || isScreenSharing ? (
              <video
                ref={videoRef}
                src={videoSrc || undefined}
                playsInline
                muted={isMuted}
                autoPlay
                className="w-full h-full object-contain pointer-events-none"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
              />
            ) : (
              /* Simulated preset demo */
              <div className="w-full h-full relative pointer-events-none flex items-center justify-center bg-neutral-950">
                {simulatedFrames.length > 0 && (
                  <img
                    src={simulatedFrames[simFrameIndex]}
                    alt="Escena de Cine"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            )}

            {/* Floating Lip Reticle on Actor */}
            <div
              style={{
                left: `${reticlePos.x}%`,
                top: `${reticlePos.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className={`absolute pointer-events-none ${reticleDimensions[reticleSize]} border-2 border-emerald-400/90 rounded-[50%/35%] shadow-[0_0_25px_rgba(52,211,153,0.45)] flex items-center justify-center transition-all duration-150 z-20`}
            >
              <div className="absolute inset-0 rounded-[50%/35%] bg-emerald-500/15 animate-pulse" />
              <div className="absolute w-4 h-[1.5px] bg-emerald-400 -left-3" />
              <div className="absolute w-4 h-[1.5px] bg-emerald-400 -right-3" />
              <div className="absolute h-4 w-[1.5px] bg-emerald-400 -top-3" />
              <div className="absolute h-4 w-[1.5px] bg-emerald-400 -bottom-3" />

              {/* Actor mouth indicator badge */}
              <div className="absolute -top-7 px-2.5 py-0.5 rounded-full bg-black/90 backdrop-blur-md border border-emerald-500/60 text-[10px] font-semibold text-emerald-300 shadow whitespace-nowrap flex items-center gap-1">
                <Target size={10} />
                <span>{t.actorFocus}</span>
              </div>
            </div>

            {/* Click/tap hint overlay */}
            <div className="absolute bottom-2 left-3 pointer-events-none text-[10px] text-neutral-400/90 bg-black/70 backdrop-blur-xs px-2 py-0.5 rounded-md">
              Toca o haz clic sobre la boca del actor para enfocar la lectura
            </div>

            {/* Top-Right Reticle Size Selector */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 pointer-events-auto z-30">
              <div className="flex items-center bg-black/80 backdrop-blur-md border border-neutral-700 rounded-full p-0.5 text-[10px] font-semibold text-neutral-300">
                {(['sm', 'md', 'lg'] as const).map((sz) => (
                  <button
                    key={sz}
                    onClick={(e) => {
                      e.stopPropagation();
                      setReticleSize(sz);
                    }}
                    className={`px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                      reticleSize === sz ? 'bg-emerald-500 text-black font-bold' : 'hover:text-white'
                    }`}
                  >
                    {sz.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline Scrubber Bar for Video Navigation */}
          {duration > 0 && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 flex items-center gap-3 text-xs">
              <span className="font-mono text-[11px] text-neutral-400 min-w-[36px]">
                {formatTime(currentTime)}
              </span>

              {/* Slider */}
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />

              <span className="font-mono text-[11px] text-neutral-500 min-w-[36px]">
                {formatTime(duration)}
              </span>
            </div>
          )}

          {/* Controls Bar: Play, Seek -5s/+5s, Loop, Mute, Read Lips */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Playback & Seek */}
            <div className="flex items-center gap-1.5">
              {/* Play / Pause */}
              <button
                onClick={() => {
                  if (videoRef.current && (videoSrc || isScreenSharing)) {
                    if (isPlaying) videoRef.current.pause();
                    else videoRef.current.play();
                  }
                  setIsPlaying(!isPlaying);
                }}
                className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl transition-colors cursor-pointer"
                title={isPlaying ? 'Pausar' : 'Reproducir'}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>

              {/* Rewind -5s */}
              <button
                onClick={() => seekRelative(-5)}
                className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Retroceder 5 segundos"
              >
                <Rewind size={16} />
              </button>

              {/* Forward +5s */}
              <button
                onClick={() => seekRelative(5)}
                className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Avanzar 5 segundos"
              >
                <FastForward size={16} />
              </button>

              {/* Loop Segment (Repeat phrase) */}
              <button
                onClick={toggleLoopSegment}
                className={`p-2 rounded-xl border transition-colors cursor-pointer flex items-center gap-1 ${
                  isLoopingSegment
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                }`}
                title="Repetir los últimos 4 segundos en bucle para re-leer labios"
              >
                <Repeat size={14} />
                <span className="hidden sm:inline">Bucle 4s</span>
              </button>

              {/* Mute (Hyperacusis safe) */}
              <button
                onClick={() => {
                  const newMute = !isMuted;
                  setIsMuted(newMute);
                  if (videoRef.current) videoRef.current.muted = newMute;
                }}
                className={`p-2 rounded-xl border transition-colors cursor-pointer flex items-center gap-1 ${
                  isMuted
                    ? 'bg-amber-950/60 border-amber-600/50 text-amber-300'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white'
                }`}
                title={isMuted ? 'Silencio activo' : 'Silenciar'}
              >
                {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>

              {/* Speed */}
              <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-xl px-1.5 py-1">
                {[0.75, 1.0, 1.25].map((sp) => (
                  <button
                    key={sp}
                    onClick={() => {
                      setPlaybackSpeed(sp);
                      if (videoRef.current) videoRef.current.playbackRate = sp;
                    }}
                    className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                      playbackSpeed === sp
                        ? 'bg-emerald-500 text-black font-bold'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {sp}x
                  </button>
                ))}
              </div>
            </div>

            {/* Read Lips Trigger Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {/* Single Phrase Capture */}
              <button
                onClick={captureMovieBurst}
                disabled={isLoading}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-emerald-950 transition-all flex items-center gap-1.5 cursor-pointer text-xs active:scale-95"
              >
                {isLoading ? (
                  <>
                    <Sparkles size={14} className="animate-spin text-amber-300" />
                    <span>Leyendo labios...</span>
                  </>
                ) : (
                  <>
                    <Target size={14} />
                    <span>Leer Labios en Escena</span>
                  </>
                )}
              </button>

              {/* Continuous Movie Subtitling */}
              <button
                onClick={onToggleContinuous}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isContinuous
                    ? 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-lg'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isContinuous ? 'bg-rose-400 animate-ping' : 'bg-neutral-500'
                  }`}
                />
                <span>{isContinuous ? 'En Vivo ON' : 'En Vivo'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. COLLAPSIBLE PRESET DEMO EXAMPLES (SECONDARY) */}
      {/* ========================================================= */}
      <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900/60">
        <button
          onClick={() => setShowPresetsDrawer(!showPresetsDrawer)}
          className="w-full px-3 py-2.5 flex items-center justify-between text-xs text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Film size={14} className="text-emerald-400" />
            <span className="font-medium">
              Escenas de ejemplo predefinidas (para pruebas rápidas)
            </span>
          </div>
          {showPresetsDrawer ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {showPresetsDrawer && (
          <div className="p-3 border-t border-neutral-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 animate-fadeIn">
            {MOVIE_SCENE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  handleStopScreenShare();
                  setVideoSrc(null);
                  setVideoFileName(null);
                  setSelectedPreset(preset);
                  setIsPlaying(true);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedPreset?.id === preset.id && !videoSrc && !isScreenSharing
                    ? 'bg-emerald-950/60 border-emerald-500 text-white shadow'
                    : 'bg-neutral-950/60 border-neutral-800/80 hover:border-neutral-700 text-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-0.5">
                  <span className="font-semibold text-emerald-400">
                    {preset.speaker}
                  </span>
                  <span className="bg-neutral-800 px-1.5 py-0.2 rounded">
                    {preset.category}
                  </span>
                </div>
                <div className="font-bold text-xs truncate text-white">
                  {preset.title}
                </div>
                <div className="text-[11px] text-neutral-400 truncate mt-0.5">
                  "{preset.expectedSubtitles}"
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
