export type SupportedLang = 'es' | 'en' | 'fr' | 'de' | 'it' | 'pt';

export interface LipReadingData {
  transcription: string;
  subtitles: string;
  confidence: number;
  detectedLanguage?: string;
  visemeAnalysis: string;
  alternatives: string[];
  emotionalTone?: string;
  isSilentOrStill?: boolean;
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  originalText: string;
  subtitles: string;
  targetLang: string;
  confidence: number;
  visemes?: string;
  emotionalTone?: string;
}

export interface DemoSample {
  id: string;
  title: string;
  language: string;
  expectedText: string;
  category: string;
  frames: string[]; // sequence of simulated SVG/Canvas frames or base64
}

export type SubtitleTheme = 'classic' | 'neonYellow' | 'accessibilityHighContrast' | 'minimalDark';
export type SubtitleSize = 'medium' | 'large' | 'xlarge';

export type HearingProfile = 'standard' | 'hipoacusia' | 'hiperacusia';

export interface MovieScenePreset {
  id: string;
  title: string;
  speaker: string;
  duration: string;
  language: string;
  langCode: string;
  description: string;
  videoUrl?: string; // or simulated sample generator
  expectedSubtitles: string;
  category: 'drama' | 'classic' | 'interview' | 'suspense';
}
