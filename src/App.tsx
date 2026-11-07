import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  Play,
  Square,
  Sparkles,
  History,
  Sliders,
  Film,
  Volume2,
  VolumeX,
  Languages,
  ArrowRight,
  ShieldAlert,
  Ear,
  Monitor,
  Heart,
} from 'lucide-react';
import { CameraView } from './components/CameraView';
import { MoviePlayerView } from './components/MoviePlayerView';
import { SubtitleBar } from './components/SubtitleBar';
import { DemoVideos } from './components/DemoVideos';
import { HistoryDrawer } from './components/HistoryDrawer';
import { SettingsModal } from './components/SettingsModal';
import {
  SupportedLang,
  LipReadingData,
  HistoryItem,
  SubtitleTheme,
  SubtitleSize,
  HearingProfile,
} from './types';
import {
  translations,
  AVAILABLE_LANGUAGES,
  TARGET_SUBTITLE_LANGUAGES,
  SPOKEN_LANGUAGES,
} from './i18n';
import { speakText, stopSpeaking } from './utils/audioTts';

export default function App() {
  // App UI Language
  const [uiLang, setUiLang] = useState<SupportedLang>('es');
  const t = translations[uiLang] || translations.es;

  // Active Mode: Live Camera vs Movies & Videos
  const [activeTab, setActiveTab] = useState<'camera' | 'movies'>('camera');

  // Hearing Accessibility Profile (Standard / Hipoacusia / Hiperacusia)
  const [hearingProfile, setHearingProfile] = useState<HearingProfile>(() => {
    try {
      const saved = localStorage.getItem('leo_labios_profile');
      return (saved as HearingProfile) || 'standard';
    } catch {
      return 'standard';
    }
  });

  // Spoken and Subtitle Target Languages
  const [spokenLang, setSpokenLang] = useState<string>('auto');
  const [targetLang, setTargetLang] = useState<string>('es');

  // Camera & Capture state
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [contrastBoost, setContrastBoost] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [isLiveScanning, setIsLiveScanning] = useState<boolean>(false);
  const [lipMotionLevel, setLipMotionLevel] = useState<number>(0);

  // Subtitle data & UI state
  const [readingData, setReadingData] = useState<LipReadingData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(false);

  // History & Customization
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('leo_labios_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [showDemoSection, setShowDemoSection] = useState<boolean>(false);

  // Subtitle appearance preferences
  const [subTheme, setSubTheme] = useState<SubtitleTheme>(() =>
    hearingProfile === 'hipoacusia' ? 'neonYellow' : 'classic'
  );
  const [subSize, setSubSize] = useState<SubtitleSize>(() =>
    hearingProfile === 'hipoacusia' ? 'xlarge' : 'large'
  );
  const [contextHint, setContextHint] = useState<string>('conversacion_general');

  // Cooldown timer to prevent overlapping continuous requests
  const isRequestInFlight = useRef<boolean>(false);
  const continuousIntervalRef = useRef<any>(null);

  // Persist history & hearing profile
  useEffect(() => {
    try {
      localStorage.setItem('leo_labios_history', JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to save history to storage', e);
    }
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem('leo_labios_profile', hearingProfile);
    } catch (e) {
      console.warn('Failed to save profile to storage', e);
    }
  }, [hearingProfile]);

  // Adjust defaults when hearing profile changes
  const handleUpdateHearingProfile = (profile: HearingProfile) => {
    setHearingProfile(profile);
    if (profile === 'hipoacusia') {
      setSubTheme('neonYellow');
      setSubSize('xlarge');
    } else if (profile === 'hiperacusia') {
      setAutoSpeak(false);
      stopSpeaking();
    }
  };

  // Handle analyzing frames received from camera, movie player or demo
  const analyzeFrames = useCallback(
    async (
      frames: string[],
      customSpokenLang?: string,
      customHint?: string
    ) => {
      if (isRequestInFlight.current) return;
      isRequestInFlight.current = true;
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const res = await fetch('/api/read-lips', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            frames,
            spokenLanguage: customSpokenLang || spokenLang,
            targetLanguage: targetLang,
            context: customHint || contextHint,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || t.errorReading);
        }

        const json = await res.json();
        if (json.success && json.data) {
          const result: LipReadingData = json.data;

          // Ignore if completely silent/still with no transcription
          if (
            result.isSilentOrStill &&
            (!result.subtitles || result.subtitles.trim() === '')
          ) {
            setIsLoading(false);
            isRequestInFlight.current = false;
            return;
          }

          setReadingData(result);

          // Add to history if valid phrase detected
          if (result.subtitles && result.subtitles.trim() !== '') {
            const newItem: HistoryItem = {
              id: Date.now().toString(),
              timestamp: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              }),
              originalText: result.transcription || result.subtitles,
              subtitles: result.subtitles,
              targetLang: targetLang,
              confidence: result.confidence || 0,
              visemes: result.visemeAnalysis,
              emotionalTone: result.emotionalTone,
            };

            setHistory((prev) => [newItem, ...prev.slice(0, 49)]);

            // Auto-speak only if enabled AND not in Hyperacusis silent mode
            if (autoSpeak && hearingProfile !== 'hiperacusia') {
              speakText(result.subtitles, targetLang);
            }
          }
        }
      } catch (err: any) {
        console.error('Error analyzing lips:', err);
        setErrorMessage(err.message || t.errorReading);
      } finally {
        setIsLoading(false);
        setIsCapturing(false);
        isRequestInFlight.current = false;
      }
    },
    [spokenLang, targetLang, contextHint, autoSpeak, hearingProfile, t.errorReading]
  );

  // Trigger manual camera capture
  const handleTriggerCapture = () => {
    if (isLoading || isCapturing) return;
    setIsCapturing(true);
  };

  // Toggle Live Continuous Mode in Camera
  const toggleLiveScanning = () => {
    setIsLiveScanning(!isLiveScanning);
  };

  // Continuous Camera Heartbeat
  useEffect(() => {
    if (activeTab === 'camera' && isLiveScanning) {
      continuousIntervalRef.current = setInterval(() => {
        if (!isCapturing && !isLoading && !isRequestInFlight.current) {
          setIsCapturing(true);
        }
      }, 2600);
    } else {
      if (continuousIntervalRef.current) {
        clearInterval(continuousIntervalRef.current);
      }
    }

    return () => {
      if (continuousIntervalRef.current) {
        clearInterval(continuousIntervalRef.current);
      }
    };
  }, [activeTab, isLiveScanning, isCapturing, isLoading]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-between font-sans selection:bg-emerald-500 selection:text-black">
      {/* Top Application Header */}
      <header className="w-full border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-40 px-3 sm:px-6 py-2.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-[1px] shadow-lg shadow-emerald-950/60 flex items-center justify-center">
              <div className="w-full h-full bg-neutral-950 rounded-[11px] flex items-center justify-center">
                {/* Lip / Speech Icon */}
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5 text-emerald-400 fill-emerald-400/20 stroke-current stroke-2"
                >
                  <path d="M3 12 Q 7 6 12 10 Q 17 6 21 12 Q 17 18 12 14 Q 7 18 3 12 Z" />
                </svg>
              </div>
            </div>

            <div>
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>{t.appName}</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-mono font-medium">
                  {activeTab === 'movies' ? 'Cine & TV' : 'VSR AI'}
                </span>
              </h1>
              <p className="text-[10px] sm:text-[11px] text-neutral-400 hidden sm:block truncate max-w-xs">
                {t.tagline}
              </p>
            </div>
          </div>

          {/* Center Tabs: Cámara vs Cine/Películas */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 p-1 rounded-xl shadow-inner">
            <button
              onClick={() => {
                setActiveTab('camera');
                setIsLiveScanning(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'camera'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Camera size={14} />
              <span className="hidden xs:inline">{t.modeCamera}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('movies');
                setIsLiveScanning(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'movies'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Film size={14} />
              <span className="hidden xs:inline">{t.modeMovies}</span>
            </button>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Hearing Profile Quick Pill */}
            {hearingProfile !== 'standard' && (
              <button
                onClick={() => setIsSettingsOpen(true)}
                className={`hidden md:flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                  hearingProfile === 'hipoacusia'
                    ? 'bg-yellow-950/60 border-yellow-500/60 text-yellow-300'
                    : 'bg-amber-950/60 border-amber-500/60 text-amber-300'
                }`}
                title={t.hearingProfile}
              >
                <Ear size={12} />
                <span>
                  {hearingProfile === 'hipoacusia' ? 'Hipoacusia' : 'Hiperacusia'}
                </span>
              </button>
            )}

            {/* UI Language Dropdown */}
            <div className="relative">
              <select
                value={uiLang}
                onChange={(e) => setUiLang(e.target.value as SupportedLang)}
                className="bg-neutral-900 border border-neutral-700/80 text-neutral-200 text-xs rounded-xl px-2.5 py-1.5 pr-6 appearance-none hover:border-neutral-600 transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer"
                title={t.switchLang}
              >
                {AVAILABLE_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.code.toUpperCase()}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-neutral-400">
                <Languages size={12} />
              </div>
            </div>

            {/* History Button */}
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="p-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-xl border border-neutral-800 transition-colors relative cursor-pointer"
              title={t.history}
            >
              <History size={16} />
              {history.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-neutral-950 text-[10px] font-bold flex items-center justify-center">
                  {history.length > 9 ? '9+' : history.length}
                </span>
              )}
            </button>

            {/* Settings Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-xl border border-neutral-800 transition-colors cursor-pointer"
              title={t.settings}
            >
              <Sliders size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-2xl px-3 sm:px-6 py-4 flex-1 flex flex-col gap-4">
        {/* Language Translator Configuration Bar */}
        <div className="bg-neutral-900/90 border border-neutral-800/90 rounded-2xl p-2.5 sm:p-3 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          {/* Spoken Language (Source) */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-neutral-400 text-[11px] whitespace-nowrap">
              {t.spokenLang}
            </span>
            <select
              value={spokenLang}
              onChange={(e) => setSpokenLang(e.target.value)}
              className="bg-neutral-950 border border-neutral-700/80 text-white rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-emerald-400 cursor-pointer flex-1 sm:flex-none"
            >
              {SPOKEN_LANGUAGES.map((sl) => (
                <option key={sl.code} value={sl.code}>
                  {sl.flag} {sl.name}
                </option>
              ))}
            </select>
          </div>

          <ArrowRight size={14} className="text-neutral-600 hidden sm:block" />

          {/* Subtitle Target Language */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-neutral-400 text-[11px] whitespace-nowrap">
              {t.subtitleLang}
            </span>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="bg-neutral-950 border border-emerald-500/50 text-emerald-300 font-semibold rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-emerald-400 cursor-pointer flex-1 sm:flex-none"
            >
              {TARGET_SUBTITLE_LANGUAGES.map((tl) => (
                <option key={tl.code} value={tl.code}>
                  {tl.flag} {tl.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 1. PRIMARY VIEW: Camera or Movie/Video Player */}
        {activeTab === 'camera' ? (
          <div className="w-full">
            <CameraView
              t={t}
              isScanning={isLiveScanning}
              onFramesCaptured={analyzeFrames}
              isCapturing={isCapturing}
              facingMode={facingMode}
              onToggleFacingMode={() =>
                setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))
              }
              onMotionChange={setLipMotionLevel}
              contrastBoost={contrastBoost}
              onToggleContrastBoost={() => setContrastBoost(!contrastBoost)}
            />
          </div>
        ) : (
          <div className="w-full">
            <MoviePlayerView
              t={t}
              hearingProfile={hearingProfile}
              onAnalyzeFrames={analyzeFrames}
              isLoading={isLoading}
              isContinuous={isLiveScanning}
              onToggleContinuous={toggleLiveScanning}
            />
          </div>
        )}

        {/* Error notification if any */}
        {errorMessage && (
          <div className="p-3 bg-red-950/70 border border-red-800 text-red-200 text-xs rounded-xl flex items-center gap-2 animate-fadeIn">
            <ShieldAlert size={16} className="text-red-400 shrink-0" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {/* 2. SUBTITLES DISPLAY DIRECTLY UNDER THE IMAGE/VIDEO (Core requirement) */}
        <div className="w-full">
          <SubtitleBar
            data={readingData}
            isLoading={isLoading}
            t={t}
            targetLang={targetLang}
            theme={subTheme}
            size={subSize}
          />
        </div>

        {/* 3. Primary Trigger Controls & Mode Selector (Only shown in camera tab) */}
        {activeTab === 'camera' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 sm:p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Mode Switcher */}
            <div className="flex items-center gap-1 p-1 bg-neutral-950 rounded-xl border border-neutral-800 w-full sm:w-auto justify-center">
              <button
                onClick={() => {
                  if (isLiveScanning) toggleLiveScanning();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  !isLiveScanning
                    ? 'bg-neutral-800 text-white shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {t.phraseMode}
              </button>

              <button
                onClick={toggleLiveScanning}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isLiveScanning
                    ? 'bg-emerald-500 text-neutral-950 font-bold shadow-lg shadow-emerald-950'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isLiveScanning ? 'bg-neutral-950 animate-ping' : 'bg-emerald-500'
                  }`}
                />
                <span>{t.continuousMode}</span>
              </button>
            </div>

            {/* Action Button: Capture Phrase */}
            {!isLiveScanning ? (
              <button
                onClick={handleTriggerCapture}
                disabled={isLoading || isCapturing}
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                {isCapturing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{t.capturing}</span>
                  </>
                ) : isLoading ? (
                  <>
                    <Sparkles size={16} className="animate-spin text-amber-300" />
                    <span>{t.processing}</span>
                  </>
                ) : (
                  <>
                    <Camera size={16} />
                    <span>{t.capturePhrase}</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={toggleLiveScanning}
                className="w-full sm:w-auto px-6 py-2.5 bg-rose-600/90 hover:bg-rose-500 text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Square size={16} />
                <span>Detener En Vivo</span>
              </button>
            )}

            {/* Auto-TTS Toggle (Disabled in hyperacusis mode to protect hearing) */}
            <button
              onClick={() => {
                if (hearingProfile === 'hiperacusia') {
                  return;
                }
                setAutoSpeak(!autoSpeak);
              }}
              disabled={hearingProfile === 'hiperacusia'}
              className={`p-2 rounded-xl border transition-colors cursor-pointer flex items-center gap-1.5 text-xs ${
                hearingProfile === 'hiperacusia'
                  ? 'bg-neutral-950 border-neutral-900 text-neutral-600 cursor-not-allowed'
                  : autoSpeak
                  ? 'bg-emerald-950 border-emerald-500/60 text-emerald-300 font-medium'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
              title={
                hearingProfile === 'hiperacusia'
                  ? 'Silencio activo para Hiperacusia'
                  : 'Auto-lectura por voz de los subtítulos'
              }
            >
              {autoSpeak && hearingProfile !== 'hiperacusia' ? (
                <Volume2 size={16} />
              ) : (
                <VolumeX size={16} />
              )}
              <span className="hidden sm:inline">
                {hearingProfile === 'hiperacusia' ? 'Silencio' : 'Voz Auto'}
              </span>
            </button>
          </div>
        )}

        {/* Practice Clips & Demo Section (collapsible) */}
        {activeTab === 'camera' && (
          <div className="w-full">
            <button
              onClick={() => setShowDemoSection(!showDemoSection)}
              className="w-full py-2.5 px-4 bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 rounded-xl text-xs font-medium text-neutral-300 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Film size={15} className="text-emerald-400" />
                <span>{t.demoPractice}</span>
              </div>
              <span className="text-neutral-500 text-[11px]">
                {showDemoSection ? 'Ocultar' : 'Ver simulador y clips'}
              </span>
            </button>

            {showDemoSection && (
              <div className="mt-3 animate-fadeIn">
                <DemoVideos
                  t={t}
                  onAnalyzeFrames={analyzeFrames}
                  isLoading={isLoading}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-neutral-900 py-3 text-center text-[11px] text-neutral-500 px-4">
        <p>
          Leo tus Labios • Lectura Labial en Vivo, Películas y Videos • Apoyo para
          Hipoacusia e Hiperacusia
        </p>
      </footer>

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onClearHistory={() => setHistory([])}
        t={t}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        t={t}
        theme={subTheme}
        setTheme={setSubTheme}
        size={subSize}
        setSize={setSubSize}
        contextHint={contextHint}
        setContextHint={setContextHint}
        hearingProfile={hearingProfile}
        setHearingProfile={handleUpdateHearingProfile}
      />
    </div>
  );
}
