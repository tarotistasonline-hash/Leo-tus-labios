import React, { useState } from 'react';
import {
  History,
  Trash2,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Download,
  X,
  Languages,
} from 'lucide-react';
import { HistoryItem } from '../types';
import { TranslationDictionary } from '../i18n';
import { speakText, stopSpeaking } from '../utils/audioTts';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onClearHistory: () => void;
  t: TranslationDictionary;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onClearHistory,
  t,
}) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSpeak = async (item: HistoryItem) => {
    if (playingId === item.id) {
      stopSpeaking();
      setPlayingId(null);
      return;
    }

    setPlayingId(item.id);
    await speakText(item.subtitles, item.targetLang);
    setPlayingId(null);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportTxt = () => {
    if (history.length === 0) return;
    const content = history
      .map(
        (h) =>
          `[${h.timestamp}] (${h.confidence}% conf.)\nArticulado: ${h.originalText}\nSubtítulos: ${h.subtitles}\n`
      )
      .join('\n---\n\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leo-tus-labios-transcripcion-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-fadeIn">
      <div className="w-full max-w-md bg-neutral-900 border-l border-neutral-800 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-semibold">
            <History size={18} className="text-emerald-400" />
            <span>{t.history} ({history.length})</span>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <>
                <button
                  onClick={handleExportTxt}
                  title="Descargar TXT"
                  className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <Download size={16} />
                </button>
                <button
                  onClick={onClearHistory}
                  title={t.clearHistory}
                  className="p-1.5 text-neutral-400 hover:text-rose-400 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-neutral-500 p-6">
              <History size={36} className="text-neutral-700 mb-2" />
              <p className="text-sm font-medium">{t.noHistory}</p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="bg-neutral-950/70 border border-neutral-800/80 rounded-xl p-3.5 space-y-2 hover:border-neutral-700 transition-colors"
              >
                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <span className="font-mono">{item.timestamp}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-semibold">
                    {item.confidence}% {t.confidence}
                  </span>
                </div>

                <div className="text-white font-medium text-sm leading-snug">
                  "{item.subtitles}"
                </div>

                {item.originalText && item.originalText !== item.subtitles && (
                  <div className="text-xs text-neutral-400 flex items-center gap-1">
                    <Languages size={12} className="text-emerald-400" />
                    <span className="italic">"{item.originalText}"</span>
                  </div>
                )}

                {item.visemes && (
                  <p className="text-[11px] text-neutral-500 line-clamp-1">
                    {item.visemes}
                  </p>
                )}

                {/* Actions */}
                <div className="pt-2 border-t border-neutral-800/60 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleCopy(item.id, item.subtitles)}
                    className="p-1 text-neutral-400 hover:text-white rounded transition-colors cursor-pointer text-xs flex items-center gap-1"
                  >
                    {copiedId === item.id ? (
                      <Check size={13} className="text-emerald-400" />
                    ) : (
                      <Copy size={13} />
                    )}
                    <span>{copiedId === item.id ? t.copied : t.copySubtitles}</span>
                  </button>

                  <button
                    onClick={() => handleSpeak(item)}
                    className="p-1 text-neutral-400 hover:text-emerald-400 rounded transition-colors cursor-pointer text-xs flex items-center gap-1"
                  >
                    {playingId === item.id ? <VolumeX size={13} /> : <Volume2 size={13} />}
                    <span>{t.speakSubtitles}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
