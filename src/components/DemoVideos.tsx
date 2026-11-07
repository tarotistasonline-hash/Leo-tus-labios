import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  RotateCcw,
  Upload,
  Sparkles,
  Film,
  CheckCircle2,
  FileVideo,
  X,
} from 'lucide-react';
import { DEMO_PRESETS, DemoItem, generateDemoFrames } from '../utils/demoData';
import { TranslationDictionary } from '../i18n';

interface DemoVideosProps {
  t: TranslationDictionary;
  onAnalyzeFrames: (frames: string[], spokenLang: string, phraseHint?: string) => void;
  isLoading: boolean;
}

export const DemoVideos: React.FC<DemoVideosProps> = ({
  t,
  onAnalyzeFrames,
  isLoading,
}) => {
  const [selectedDemo, setSelectedDemo] = useState<DemoItem>(DEMO_PRESETS[0]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [isPlayingDemo, setIsPlayingDemo] = useState<boolean>(false);
  const [generatedFrames, setGeneratedFrames] = useState<string[]>([]);
  const [uploadedVideoName, setUploadedVideoName] = useState<string | null>(null);
  const [isProcessingUpload, setIsProcessingUpload] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const playTimerRef = useRef<any>(null);

  // Generate frames for currently selected preset
  useEffect(() => {
    const frames = generateDemoFrames(selectedDemo);
    setGeneratedFrames(frames);
    setCurrentFrameIndex(0);
    setIsPlayingDemo(false);
  }, [selectedDemo]);

  // Handle animation playback
  useEffect(() => {
    if (isPlayingDemo && generatedFrames.length > 0) {
      playTimerRef.current = setInterval(() => {
        setCurrentFrameIndex((prev) => {
          if (prev >= generatedFrames.length - 1) {
            return 0;
          }
          return prev + 1;
        });
      }, 250);
    } else {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    }

    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlayingDemo, generatedFrames]);

  // Handle analyzing the current preset
  const handleTestPreset = () => {
    if (generatedFrames.length === 0) return;
    setIsPlayingDemo(true);
    onAnalyzeFrames(generatedFrames, selectedDemo.langCode, selectedDemo.phrase);
  };

  // Handle local video upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedVideoName(file.name);
    setIsProcessingUpload(true);

    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true;

    video.onloadeddata = async () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 360;
        canvas.height = 270;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const duration = Math.min(3.0, video.duration || 2.0);
        const frameCount = 7;
        const step = duration / frameCount;
        const extracted: string[] = [];

        for (let i = 0; i < frameCount; i++) {
          video.currentTime = i * step;
          await new Promise((r) => {
            video.onseeked = r;
          });
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          extracted.push(canvas.toDataURL('image/jpeg', 0.85));
        }

        setIsProcessingUpload(false);
        onAnalyzeFrames(extracted, 'auto', 'Video subido por usuario');
      } catch (err) {
        console.error('Error extracting video frames:', err);
        setIsProcessingUpload(false);
      }
    };
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5 text-neutral-100 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Film className="text-emerald-400" size={18} />
          <h3 className="font-semibold text-sm sm:text-base text-white">
            {t.practiceTitle}
          </h3>
        </div>
        <span className="text-xs text-neutral-400 bg-neutral-800 px-2.5 py-0.5 rounded-full border border-neutral-700">
          Sin necesidad de cámara
        </span>
      </div>

      <p className="text-xs text-neutral-400 leading-relaxed">
        {t.practiceDesc}
      </p>

      {/* Preset Clips Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {DEMO_PRESETS.map((demo) => {
          const isSelected = selectedDemo.id === demo.id;
          return (
            <button
              key={demo.id}
              onClick={() => setSelectedDemo(demo)}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-md'
                  : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 text-neutral-300'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
                <span>{demo.language}</span>
                <span className="text-[10px] bg-neutral-800 px-1.5 py-0.2 rounded">
                  {demo.category}
                </span>
              </div>
              <div className="font-medium text-xs sm:text-sm line-clamp-1 text-white">
                "{demo.phrase}"
              </div>
            </button>
          );
        })}
      </div>

      {/* Viseme Visualizer Preview Box */}
      <div className="bg-black/80 rounded-xl p-3 border border-neutral-800 flex flex-col sm:flex-row items-center gap-4">
        {/* Animated Mouth Frame Canvas */}
        <div className="relative w-48 h-36 bg-neutral-950 rounded-lg overflow-hidden border border-neutral-700/80 flex items-center justify-center shrink-0 shadow-inner">
          {generatedFrames.length > 0 && (
            <img
              src={generatedFrames[currentFrameIndex]}
              alt="Mouth Viseme"
              className="w-full h-full object-cover"
            />
          )}

          {/* Current Viseme Label */}
          <div className="absolute bottom-1 left-1 right-1 bg-black/75 backdrop-blur-xs text-[10px] text-center text-emerald-300 py-0.5 rounded px-1 truncate">
            {selectedDemo.visemeSteps[currentFrameIndex]?.label || 'Visema'}
          </div>

          {/* Play/Pause overlay */}
          <button
            onClick={() => setIsPlayingDemo(!isPlayingDemo)}
            className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-full transition-colors cursor-pointer"
            title={isPlayingDemo ? 'Pausar' : 'Reproducir movimiento'}
          >
            {isPlayingDemo ? <RotateCcw size={12} /> : <Play size={12} />}
          </button>
        </div>

        {/* Action and Details */}
        <div className="flex-1 space-y-2 text-left w-full">
          <div>
            <div className="text-xs text-neutral-400">Frase objetivo en el clip:</div>
            <div className="text-base font-bold text-white">"{selectedDemo.phrase}"</div>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              {selectedDemo.description}
            </div>
          </div>

          <div className="pt-1 flex flex-wrap items-center gap-2">
            <button
              onClick={handleTestPreset}
              disabled={isLoading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-950 cursor-pointer"
            >
              <Sparkles size={14} />
              <span>Probar lectura con IA</span>
            </button>

            {/* Frame scrubber */}
            <div className="flex items-center gap-1 text-[11px] text-neutral-400 ml-auto">
              <span>Cuadro {currentFrameIndex + 1}/{generatedFrames.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Video Upload Section */}
      <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="video/*"
          className="hidden"
        />
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <FileVideo size={16} className="text-neutral-500" />
          <span>¿Tienes un clip grabado?</span>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessingUpload || isLoading}
          className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg transition-colors border border-neutral-700 flex items-center gap-1.5 cursor-pointer"
        >
          <Upload size={13} />
          <span>{isProcessingUpload ? 'Extrayendo cuadros...' : t.uploadVideo}</span>
        </button>
      </div>

      {uploadedVideoName && (
        <div className="text-[11px] text-emerald-400 bg-emerald-950/40 p-2 rounded-lg border border-emerald-800/60 flex items-center justify-between">
          <span>Video cargado: {uploadedVideoName}</span>
          <button
            onClick={() => setUploadedVideoName(null)}
            className="text-neutral-400 hover:text-white"
          >
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
};
