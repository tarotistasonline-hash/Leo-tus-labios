import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Copy,
  Check,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  Smile,
  ShieldCheck,
  Languages,
} from 'lucide-react';
import { LipReadingData, SubtitleTheme, SubtitleSize } from '../types';
import { TranslationDictionary } from '../i18n';
import { speakText, stopSpeaking } from '../utils/audioTts';

interface SubtitleBarProps {
  data: LipReadingData | null;
  isLoading: boolean;
  t: TranslationDictionary;
  targetLang: string;
  theme: SubtitleTheme;
  size: SubtitleSize;
}

export const SubtitleBar: React.FC<SubtitleBarProps> = ({
  data,
  isLoading,
  t,
  targetLang,
  theme,
  size,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Play aloud
  const handleSpeak = async () => {
    if (!data?.subtitles) return;
    if (isPlayingAudio) {
      stopSpeaking();
      setIsPlayingAudio(false);
      return;
    }

    setIsPlayingAudio(true);
    await speakText(data.subtitles, targetLang);
    setIsPlayingAudio(false);
  };

  // Copy text
  const handleCopy = () => {
    if (!data?.subtitles) return;
    navigator.clipboard.writeText(data.subtitles);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Styling based on selected theme
  const themeClasses: Record<SubtitleTheme, { container: string; text: string; badge: string }> = {
    classic: {
      container: 'bg-neutral-900 border-neutral-800 text-white shadow-xl',
      text: 'text-neutral-100',
      badge: 'bg-neutral-800 text-neutral-300 border-neutral-700',
    },
    neonYellow: {
      container: 'bg-neutral-950 border-yellow-500/40 text-yellow-300 shadow-yellow-950/30 shadow-2xl',
      text: 'text-yellow-300 font-bold drop-shadow-[0_2px_10px_rgba(234,179,8,0.3)]',
      badge: 'bg-yellow-950/60 text-yellow-400 border-yellow-700/60',
    },
    accessibilityHighContrast: {
      container: 'bg-black border-2 border-emerald-400 text-white shadow-2xl',
      text: 'text-emerald-300 font-extrabold tracking-wide',
      badge: 'bg-emerald-950 text-emerald-300 border-emerald-500',
    },
    minimalDark: {
      container: 'bg-neutral-950/90 backdrop-blur-md border-neutral-800 text-neutral-100 shadow-xl',
      text: 'text-white font-medium',
      badge: 'bg-neutral-800/80 text-neutral-300 border-neutral-700/80',
    },
  };

  const currentTheme = themeClasses[theme] || themeClasses.classic;

  const sizeClasses: Record<SubtitleSize, string> = {
    medium: 'text-lg sm:text-xl leading-relaxed',
    large: 'text-xl sm:text-2xl leading-relaxed font-semibold',
    xlarge: 'text-2xl sm:text-3xl leading-snug font-bold',
  };

  // Confidence color indicator
  const getConfidenceColor = (conf: number) => {
    if (conf >= 80) return 'text-emerald-400 bg-emerald-950/70 border-emerald-700/60';
    if (conf >= 55) return 'text-amber-400 bg-amber-950/70 border-amber-700/60';
    return 'text-rose-400 bg-rose-950/70 border-rose-700/60';
  };

  return (
    <div
      className={`w-full rounded-2xl border p-4 sm:p-5 transition-all duration-300 relative ${currentTheme.container}`}
    >
      {/* Top Header inside Subtitles Bar */}
      <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-white/10 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isLoading ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isLoading ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
          </span>
          <span className="font-semibold tracking-wider uppercase text-neutral-400">
            {t.subtitlesTitle}
          </span>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5">
          {data?.subtitles && (
            <>
              {/* Copy */}
              <button
                onClick={handleCopy}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title={t.copySubtitles}
              >
                {isCopied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              </button>

              {/* TTS Read Aloud */}
              <button
                onClick={handleSpeak}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium ${
                  isPlayingAudio
                    ? 'bg-emerald-500 text-neutral-950 font-bold'
                    : 'text-neutral-300 hover:text-white hover:bg-white/10'
                }`}
                title={t.speakSubtitles}
              >
                {isPlayingAudio ? <VolumeX size={16} /> : <Volume2 size={16} />}
                <span className="hidden sm:inline">{t.speakSubtitles}</span>
              </button>
            </>
          )}

          {/* Details toggle */}
          {data?.visemeAnalysis && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-0.5"
              title="Visemas & Detalles"
            >
              <Info size={16} />
              {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* Main Subtitle Text Area */}
      <div className="min-h-[72px] sm:min-h-[84px] flex flex-col justify-center py-1">
        {isLoading ? (
          <div className="flex items-center gap-3 text-neutral-400 py-2 animate-pulse">
            <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">{t.processing}</span>
          </div>
        ) : data?.subtitles ? (
          <div>
            {/* Translated Subtitles */}
            <p className={`${sizeClasses[size]} ${currentTheme.text} transition-all`}>
              "{data.subtitles}"
            </p>

            {/* Original Spoken Mouth Transcription (if distinct or translation occurred) */}
            {data.transcription && data.transcription !== data.subtitles && (
              <div className="mt-1 flex items-center gap-1.5 text-xs text-neutral-400">
                <Languages size={13} className="text-emerald-400/80" />
                <span className="italic">Original articulado: "{data.transcription}"</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-neutral-500 italic text-sm sm:text-base flex items-center gap-2">
            <Sparkles size={16} className="text-neutral-600" />
            <span>{t.waitingForSpeech}</span>
          </div>
        )}
      </div>

      {/* Badges Bar (Confidence, Tone, Language) */}
      {data && !isLoading && (
        <div className="mt-2 pt-2 border-t border-white/5 flex flex-wrap items-center gap-2">
          {/* Confidence Badge */}
          {typeof data.confidence === 'number' && (
            <div
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1 ${getConfidenceColor(
                data.confidence
              )}`}
            >
              <ShieldCheck size={12} />
              <span>
                {t.confidence}: {data.confidence}%
              </span>
            </div>
          )}

          {/* Emotional / Articulation Tone */}
          {data.emotionalTone && (
            <div className={`px-2.5 py-0.5 rounded-full text-xs border flex items-center gap-1 ${currentTheme.badge}`}>
              <Smile size={12} />
              <span>{data.emotionalTone}</span>
            </div>
          )}

          {/* Detected Language */}
          {data.detectedLanguage && (
            <div className={`px-2.5 py-0.5 rounded-full text-xs border flex items-center gap-1 ${currentTheme.badge}`}>
              <span>🗣️ {data.detectedLanguage}</span>
            </div>
          )}
        </div>
      )}

      {/* Expandable Viseme Telemetry & Homophones Details */}
      {showDetails && data && (
        <div className="mt-3 pt-3 border-t border-white/10 text-xs space-y-2 animate-fadeIn bg-black/40 rounded-xl p-3">
          {data.visemeAnalysis && (
            <div>
              <span className="font-semibold text-emerald-400 block mb-0.5">
                {t.visemesTitle}:
              </span>
              <p className="text-neutral-300 leading-relaxed">{data.visemeAnalysis}</p>
            </div>
          )}

          {data.alternatives && data.alternatives.length > 0 && (
            <div>
              <span className="font-semibold text-amber-400 block mb-0.5">
                {t.alternativesTitle} (Homófenos):
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {data.alternatives.map((alt, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded border border-neutral-700 text-[11px]"
                  >
                    "{alt}"
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
