import React from 'react';
import {
  X,
  Sliders,
  Type,
  Palette,
  Lightbulb,
  Check,
  Sparkles,
  Ear,
  Shield,
  VolumeX,
} from 'lucide-react';
import { SubtitleTheme, SubtitleSize, HearingProfile } from '../types';
import { TranslationDictionary } from '../i18n';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: TranslationDictionary;
  theme: SubtitleTheme;
  setTheme: (theme: SubtitleTheme) => void;
  size: SubtitleSize;
  setSize: (size: SubtitleSize) => void;
  contextHint: string;
  setContextHint: (hint: string) => void;
  hearingProfile: HearingProfile;
  setHearingProfile: (profile: HearingProfile) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  t,
  theme,
  setTheme,
  size,
  setSize,
  contextHint,
  setContextHint,
  hearingProfile,
  setHearingProfile,
}) => {
  if (!isOpen) return null;

  const themes: { id: SubtitleTheme; name: string; preview: string }[] = [
    { id: 'classic', name: t.themeClassic, preview: 'bg-neutral-900 text-white' },
    { id: 'neonYellow', name: t.themeYellow, preview: 'bg-neutral-950 text-yellow-300 font-bold border-yellow-500/40' },
    { id: 'accessibilityHighContrast', name: t.themeHighContrast, preview: 'bg-black text-emerald-300 font-extrabold border-emerald-400' },
    { id: 'minimalDark', name: 'Minimal Glass', preview: 'bg-neutral-950/80 text-neutral-100 border-neutral-700' },
  ];

  const contexts = [
    { id: 'conversacion_general', label: 'Conversación General' },
    { id: 'saludos_cortesia', label: 'Saludos y Cortesía' },
    { id: 'cine_peliculas', label: 'Películas y Cine' },
    { id: 'emergencias_salud', label: 'Emergencias y Salud' },
    { id: 'restaurante_comida', label: 'Restaurante y Comida' },
    { id: 'numeros_fechas', label: 'Números y Fechas' },
  ];

  const handleSelectHearingProfile = (profile: HearingProfile) => {
    setHearingProfile(profile);
    if (profile === 'hipoacusia') {
      // Auto-adapt optimal accessibility settings for hearing loss
      setTheme('neonYellow');
      setSize('xlarge');
    } else if (profile === 'hiperacusia') {
      // Auto-adapt protective mode for sound sensitivity
      setTheme('classic');
      setSize('large');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 text-neutral-100 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2 font-bold text-white text-base">
            <Sliders size={18} className="text-emerald-400" />
            <span>{t.settings}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* 1. HEARING ACCESSIBILITY PROFILE (Hipoacusia / Hiperacusia) */}
        <div className="space-y-3 bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-800">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <Ear size={15} />
            <span>{t.hearingProfile}</span>
          </div>

          <div className="space-y-2">
            {/* Standard */}
            <button
              onClick={() => handleSelectHearingProfile('standard')}
              className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center justify-between ${
                hearingProfile === 'standard'
                  ? 'bg-neutral-800 border-emerald-500 text-white font-semibold'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
              }`}
            >
              <div>
                <div className="font-semibold">{t.profileStandard}</div>
                <div className="text-[11px] text-neutral-400">Modo general para todos los usuarios.</div>
              </div>
              {hearingProfile === 'standard' && <Check size={14} className="text-emerald-400" />}
            </button>

            {/* Hipoacusia */}
            <button
              onClick={() => handleSelectHearingProfile('hipoacusia')}
              className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center justify-between ${
                hearingProfile === 'hipoacusia'
                  ? 'bg-yellow-950/40 border-yellow-500 text-yellow-200 font-semibold'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
              }`}
            >
              <div>
                <div className="font-bold flex items-center gap-1.5 text-yellow-300">
                  <span>{t.profileHipoacusia}</span>
                </div>
                <div className="text-[11px] text-neutral-300 mt-0.5">
                  {t.profileHipoacusiaDesc}
                </div>
              </div>
              {hearingProfile === 'hipoacusia' && <Check size={14} className="text-yellow-400" />}
            </button>

            {/* Hiperacusia */}
            <button
              onClick={() => handleSelectHearingProfile('hiperacusia')}
              className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center justify-between ${
                hearingProfile === 'hiperacusia'
                  ? 'bg-amber-950/40 border-amber-500 text-amber-200 font-semibold'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
              }`}
            >
              <div>
                <div className="font-bold flex items-center gap-1.5 text-amber-300">
                  <Shield size={12} />
                  <span>{t.profileHiperacusia}</span>
                </div>
                <div className="text-[11px] text-neutral-300 mt-0.5">
                  {t.profileHiperacusiaDesc}
                </div>
              </div>
              {hearingProfile === 'hiperacusia' && <Check size={14} className="text-amber-400" />}
            </button>
          </div>
        </div>

        {/* 2. Subtitle Appearance */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            <Palette size={14} className="text-emerald-400" />
            <span>{t.subStyle}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {themes.map((th) => (
              <button
                key={th.id}
                onClick={() => setTheme(th.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${th.preview} ${
                  theme === th.id
                    ? 'ring-2 ring-emerald-400 shadow-lg'
                    : 'opacity-85 hover:opacity-100'
                }`}
              >
                <div className="text-xs font-semibold">{th.name}</div>
                <div className="text-sm mt-1 truncate">"Hola, ¿cómo estás?"</div>
                {theme === th.id && (
                  <Check
                    size={14}
                    className="absolute top-2 right-2 text-emerald-400"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Font Size */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            <Type size={14} className="text-emerald-400" />
            <span>{t.fontSize}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(['medium', 'large', 'xlarge'] as SubtitleSize[]).map((sz) => (
              <button
                key={sz}
                onClick={() => setSize(sz)}
                className={`py-2 px-3 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                  size === sz
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                }`}
              >
                {sz === 'medium' && 'Normal (18px)'}
                {sz === 'large' && 'Grande (22px)'}
                {sz === 'xlarge' && 'Extra Grande (28px)'}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Conversation Context Hint */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            <Sparkles size={14} className="text-emerald-400" />
            <span>Contexto Temático de Apoyo</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {contexts.map((ctx) => (
              <button
                key={ctx.id}
                onClick={() => setContextHint(ctx.id)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                  contextHint === ctx.id
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-semibold'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white'
                }`}
              >
                {ctx.label}
              </button>
            ))}
          </div>
        </div>

        {/* 5. Accuracy Tips */}
        <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
            <Lightbulb size={15} />
            <span>{t.tipsTitle}</span>
          </div>
          <ul className="text-xs text-neutral-300 space-y-1.5 list-disc pl-4">
            <li>{t.tip1}</li>
            <li>{t.tip2}</li>
            <li>{t.tip3}</li>
            <li>Para películas y series, usa la herramienta de Captura de Pantalla para sincronizar con cualquier reproductor.</li>
          </ul>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs rounded-xl transition-colors cursor-pointer"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};
