import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  RotateCcw,
  ZoomIn,
  Zap,
  ZapOff,
  SunMedium,
  Target,
  Maximize2,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { LipMotionDetector } from '../utils/lipMotionDetector';
import { TranslationDictionary } from '../i18n';

interface CameraViewProps {
  t: TranslationDictionary;
  isScanning: boolean;
  onFramesCaptured: (frames: string[]) => void;
  isCapturing: boolean;
  facingMode: 'user' | 'environment';
  onToggleFacingMode: () => void;
  onMotionChange?: (motionLevel: number) => void;
  contrastBoost: boolean;
  onToggleContrastBoost: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({
  t,
  isScanning,
  onFramesCaptured,
  isCapturing,
  facingMode,
  onToggleFacingMode,
  onMotionChange,
  contrastBoost,
  onToggleContrastBoost,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const motionDetectorRef = useRef<LipMotionDetector>(new LipMotionDetector());
  const animFrameRef = useRef<number | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [motionLevel, setMotionLevel] = useState<number>(0);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<'normal' | 'tall'>('normal');

  // Start Camera Stream
  const startCamera = useCallback(async () => {
    // Stop any existing tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    try {
      setErrorMessage(null);
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setHasPermission(true);

      // Check for torch capability on mobile back camera
      const videoTrack = stream.getVideoTracks()[0];
      const capabilities: any = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {};
      if (capabilities.torch) {
        setHasTorch(true);
      } else {
        setHasTorch(false);
        setTorchOn(false);
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setHasPermission(false);
      setErrorMessage(err.message || t.cameraAccessDenied);
    }
  }, [facingMode, t.cameraAccessDenied]);

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [startCamera]);

  // Toggle Torch if available
  const toggleTorch = async () => {
    if (!streamRef.current || !hasTorch) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      const newTorch = !torchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: newTorch }],
      });
      setTorchOn(newTorch);
    } catch (e) {
      console.warn('Torch constraint error:', e);
    }
  };

  // Real-time Lip Motion Detection Loop
  useEffect(() => {
    const checkMotion = () => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        const v = videoRef.current;
        const vw = v.videoWidth || 640;
        const vh = v.videoHeight || 480;

        // Crop center 40% where mouth reticle resides
        const cropW = Math.round(vw * 0.4);
        const cropH = Math.round(vh * 0.35);
        const cropX = Math.round((vw - cropW) / 2);
        const cropY = Math.round((vh - cropH) / 2);

        const motion = motionDetectorRef.current.detectMotion(v, cropX, cropY, cropW, cropH);
        setMotionLevel(motion);
        if (onMotionChange) {
          onMotionChange(motion);
        }
      }
      animFrameRef.current = requestAnimationFrame(checkMotion);
    };

    animFrameRef.current = requestAnimationFrame(checkMotion);
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [onMotionChange]);

  // Capture Frame Burst (6 to 8 frames across ~1.6 seconds)
  const captureBurst = useCallback(() => {
    if (!videoRef.current || videoRef.current.readyState < 2) return;

    const v = videoRef.current;
    const vw = v.videoWidth || 640;
    const vh = v.videoHeight || 480;

    // Use a temporary canvas to capture high-resolution frame crops
    const canvas = document.createElement('canvas');
    // Focused mouth aspect ratio: 400x300
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const capturedFrames: string[] = [];
    const totalFrames = 7;
    const frameIntervalMs = 220; // 7 frames * 220ms = ~1.54s burst

    let frameCount = 0;
    const intervalId = setInterval(() => {
      if (!videoRef.current) {
        clearInterval(intervalId);
        return;
      }

      // Calculate mouth crop region centered on video
      // When zoomed in, crop even closer to the center
      const zoomFactor = zoomLevel;
      const cropW = (vw * 0.45) / zoomFactor;
      const cropH = (vh * 0.38) / zoomFactor;
      const cropX = Math.max(0, (vw - cropW) / 2);
      const cropY = Math.max(0, (vh - cropH) / 2);

      // Draw cropped mouth with optional contrast filter
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (contrastBoost) {
        ctx.filter = 'contrast(1.3) brightness(1.08) saturate(1.2)';
      } else {
        ctx.filter = 'none';
      }

      ctx.drawImage(v, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);
      const frameData = canvas.toDataURL('image/jpeg', 0.85);
      capturedFrames.push(frameData);

      frameCount++;
      if (frameCount >= totalFrames) {
        clearInterval(intervalId);
        onFramesCaptured(capturedFrames);
      }
    }, frameIntervalMs);
  }, [zoomLevel, contrastBoost, onFramesCaptured]);

  // Trigger burst when isCapturing transitions to true
  useEffect(() => {
    if (isCapturing) {
      captureBurst();
    }
  }, [isCapturing, captureBurst]);

  return (
    <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] max-h-[58vh] bg-neutral-950 rounded-2xl overflow-hidden shadow-2xl border border-neutral-800 flex flex-col justify-center items-center select-none group">
      {/* Video Feed */}
      {hasPermission ? (
        <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transition-transform duration-200 ${
              facingMode === 'user' ? 'scale-x-[-1]' : ''
            } ${contrastBoost ? 'contrast-125 brightness-105' : ''}`}
            style={{
              transform: `${facingMode === 'user' ? 'scaleX(-1)' : ''} scale(${zoomLevel})`,
              transformOrigin: 'center center',
            }}
          />

          {/* Precision Lip Targeting HUD Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Darkened vignette surround to focus eye on the mouth */}
            <div className="absolute inset-0 bg-black/25 backdrop-blur-[0.5px]" />

            {/* Central Mouth Reticle */}
            <div className="relative w-56 h-36 sm:w-72 sm:h-44 border-2 border-emerald-400/80 rounded-[50%/35%] shadow-[0_0_25px_rgba(52,211,153,0.35)] flex items-center justify-center overflow-visible transition-all duration-300">
              {/* Subtle pulsing grid inside reticle */}
              <div
                className={`absolute inset-0 rounded-[50%/35%] transition-opacity duration-300 ${
                  motionLevel > 20
                    ? 'bg-emerald-500/15 border-2 border-emerald-400 animate-pulse'
                    : 'bg-emerald-500/5'
                }`}
              />

              {/* Crosshair guide lines */}
              <div className="absolute w-6 h-[1.5px] bg-emerald-400/80 -left-4" />
              <div className="absolute w-6 h-[1.5px] bg-emerald-400/80 -right-4" />
              <div className="absolute h-5 w-[1.5px] bg-emerald-400/80 -top-3" />
              <div className="absolute h-5 w-[1.5px] bg-emerald-400/80 -bottom-3" />

              {/* Corner brackets */}
              <div className="absolute -top-3 -left-3 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
              <div className="absolute -top-3 -right-3 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
              <div className="absolute -bottom-3 -left-3 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
              <div className="absolute -bottom-3 -right-3 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />

              {/* Stylized Lip Silhouette Outline (Faint Guide) */}
              <svg
                viewBox="0 0 100 60"
                className="w-32 h-20 text-emerald-300/40 opacity-70 stroke-current fill-none stroke-[1.2]"
              >
                <path d="M 10,30 Q 30,12 50,22 Q 70,12 90,30 Q 70,48 50,44 Q 30,48 10,30 Z" />
                <path d="M 20,30 Q 35,26 50,28 Q 65,26 80,30 Q 65,36 50,34 Q 35,36 20,30 Z" />
              </svg>

              {/* Motion Activity Indicator pill directly above reticle */}
              <div className="absolute -top-9 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-neutral-700/80 flex items-center gap-2 shadow-lg">
                <span
                  className={`w-2 h-2 rounded-full ${
                    motionLevel > 25
                      ? 'bg-emerald-400 animate-ping'
                      : motionLevel > 10
                      ? 'bg-emerald-400'
                      : 'bg-neutral-500'
                  }`}
                />
                <span className="text-[11px] font-medium tracking-wide text-neutral-200">
                  {motionLevel > 20 ? t.motionDetected : t.targetMouthHere}
                </span>

                {/* Real-time mini audio-wave-like motion bars */}
                <div className="flex items-center gap-0.5 ml-1">
                  {[1, 2, 3, 4].map((bar) => {
                    const active = motionLevel > bar * 15;
                    return (
                      <span
                        key={bar}
                        className={`w-1 rounded-full transition-all duration-150 ${
                          active ? 'bg-emerald-400 h-3' : 'bg-neutral-600 h-1.5'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : hasPermission === false ? (
        <div className="p-6 text-center max-w-sm flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-red-950/60 border border-red-800 text-red-400 flex items-center justify-center">
            <AlertCircle size={28} />
          </div>
          <p className="text-sm text-neutral-300 font-medium">
            {errorMessage || t.cameraAccessDenied}
          </p>
          <button
            onClick={startCamera}
            className="mt-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-xl transition-colors shadow-lg shadow-emerald-950/50 flex items-center gap-2 cursor-pointer"
          >
            <Camera size={16} />
            {t.enableCamera}
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-neutral-400">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">{t.capturing}</span>
        </div>
      )}

      {/* Top Floating Controls Bar */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto z-20">
        {/* Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900/85 backdrop-blur-md border border-neutral-700/60 rounded-full shadow-lg">
          <div
            className={`w-2 h-2 rounded-full ${
              isCapturing
                ? 'bg-red-500 animate-ping'
                : isScanning
                ? 'bg-emerald-400 animate-pulse'
                : 'bg-neutral-400'
            }`}
          />
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-200">
            {isCapturing ? t.capturing : isScanning ? t.continuousMode : 'Listo'}
          </span>
        </div>

        {/* Quick Toolbar */}
        <div className="flex items-center gap-1.5 bg-neutral-900/85 backdrop-blur-md border border-neutral-700/60 p-1 rounded-full shadow-lg">
          {/* Contrast Booster */}
          <button
            onClick={onToggleContrastBoost}
            title={t.highContrast}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              contrastBoost
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <SunMedium size={16} />
          </button>

          {/* Torch (if supported) */}
          {hasTorch && (
            <button
              onClick={toggleTorch}
              title={t.torch}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                torchOn
                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              {torchOn ? <Zap size={16} /> : <ZapOff size={16} />}
            </button>
          )}

          {/* Flip Camera */}
          <button
            onClick={onToggleFacingMode}
            title={t.flipCamera}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition-colors cursor-pointer"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Bottom Floating Zoom Controls */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-neutral-900/90 backdrop-blur-md border border-neutral-700/80 px-2 py-1 rounded-full shadow-xl pointer-events-auto z-20">
        <span className="text-[11px] font-bold text-neutral-400 pl-1">ZOOM</span>
        {[1.0, 1.5, 2.0, 2.5].map((z) => (
          <button
            key={z}
            onClick={() => setZoomLevel(z)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
              zoomLevel === z
                ? 'bg-emerald-500 text-neutral-950 font-bold shadow'
                : 'text-neutral-300 hover:bg-neutral-800'
            }`}
          >
            {z}x
          </button>
        ))}
      </div>
    </div>
  );
};
