/**
 * Demo Practice Clips and Synthetic Viseme Generator
 * Allows testing lip reading immediately with realistic mouth motion sequences
 */

export interface DemoItem {
  id: string;
  phrase: string;
  language: string;
  langCode: string;
  category: string;
  description: string;
  visemeSteps: {
    label: string;
    mouthOpen: number; // 0 (closed) to 1 (wide open)
    mouthWidth: number; // 0.8 (puckered /o, u/) to 1.3 (wide /i, e/)
    teethVisible: boolean;
    lipRounding: number; // 0 to 1
  }[];
}

export const DEMO_PRESETS: DemoItem[] = [
  {
    id: 'es_hola_como_estas',
    phrase: 'Hola, ¿cómo estás?',
    language: 'Español',
    langCode: 'es',
    category: 'Saludos',
    description: 'Frase común con vocales abiertas y redondeadas (o-a-o-e-a)',
    visemeSteps: [
      { label: 'Repos / Start', mouthOpen: 0.1, mouthWidth: 1.0, teethVisible: false, lipRounding: 0.1 },
      { label: 'Ho- (redondeo)', mouthOpen: 0.5, mouthWidth: 0.85, teethVisible: false, lipRounding: 0.7 },
      { label: '-la (apertura /a/)', mouthOpen: 0.8, mouthWidth: 1.1, teethVisible: true, lipRounding: 0.2 },
      { label: 'Có- (redondeo fuerte)', mouthOpen: 0.6, mouthWidth: 0.8, teethVisible: false, lipRounding: 0.85 },
      { label: '-mo (bilabial cierre /m/)', mouthOpen: 0.05, mouthWidth: 0.95, teethVisible: false, lipRounding: 0.6 },
      { label: 'es- (dental /s/)', mouthOpen: 0.3, mouthWidth: 1.25, teethVisible: true, lipRounding: 0.1 },
      { label: '-tás? (apertura final)', mouthOpen: 0.75, mouthWidth: 1.15, teethVisible: true, lipRounding: 0.2 },
    ],
  },
  {
    id: 'es_te_quiero',
    phrase: 'Te quiero mucho',
    language: 'Español',
    langCode: 'es',
    category: 'Afecto',
    description: 'Transición de sonrisa /e/ a pucker /u/ y bilabial /m/',
    visemeSteps: [
      { label: 'Te (sonrisa amplia)', mouthOpen: 0.35, mouthWidth: 1.25, teethVisible: true, lipRounding: 0.1 },
      { label: 'quie- (diptongo)', mouthOpen: 0.45, mouthWidth: 1.2, teethVisible: true, lipRounding: 0.2 },
      { label: '-ro (redondeo)', mouthOpen: 0.5, mouthWidth: 0.9, teethVisible: false, lipRounding: 0.6 },
      { label: 'mu- (cierre bilabial /m/)', mouthOpen: 0.0, mouthWidth: 0.95, teethVisible: false, lipRounding: 0.8 },
      { label: '-cho (protrusión labial)', mouthOpen: 0.4, mouthWidth: 0.8, teethVisible: false, lipRounding: 0.9 },
    ],
  },
  {
    id: 'en_i_love_you',
    phrase: 'I love you',
    language: 'English',
    langCode: 'en',
    category: 'Greetings',
    description: 'Dipthong /aɪ/, labiodental /v/ (teeth on lip), and rounded /uː/',
    visemeSteps: [
      { label: 'I (wide jaw opening)', mouthOpen: 0.75, mouthWidth: 1.1, teethVisible: true, lipRounding: 0.1 },
      { label: 'lo- (open vowel)', mouthOpen: 0.6, mouthWidth: 1.0, teethVisible: true, lipRounding: 0.3 },
      { label: '-ve (labiodental /v/)', mouthOpen: 0.2, mouthWidth: 1.15, teethVisible: true, lipRounding: 0.0 },
      { label: 'you (deep rounded pucker)', mouthOpen: 0.35, mouthWidth: 0.75, teethVisible: false, lipRounding: 0.95 },
    ],
  },
  {
    id: 'en_need_help',
    phrase: 'I need your help',
    language: 'English',
    langCode: 'en',
    category: 'Assistance',
    description: 'Bilabial release /p/, tongue tap /l/, wide vowel /iː/',
    visemeSteps: [
      { label: 'I', mouthOpen: 0.7, mouthWidth: 1.1, teethVisible: true, lipRounding: 0.1 },
      { label: 'need (teeth closed /iː/)', mouthOpen: 0.3, mouthWidth: 1.3, teethVisible: true, lipRounding: 0.0 },
      { label: 'your (rounded /ɔː/)', mouthOpen: 0.5, mouthWidth: 0.85, teethVisible: false, lipRounding: 0.7 },
      { label: 'help (wide /e/ to /p/ close)', mouthOpen: 0.65, mouthWidth: 1.15, teethVisible: true, lipRounding: 0.1 },
      { label: 'p (bilabial seal)', mouthOpen: 0.0, mouthWidth: 1.0, teethVisible: false, lipRounding: 0.3 },
    ],
  },
  {
    id: 'fr_merci_beaucoup',
    phrase: 'Merci beaucoup',
    language: 'Français',
    langCode: 'fr',
    category: 'Politesse',
    description: 'Bilabiale /m/, labiodentale /v/ et fermeture avec arrondi /u/',
    visemeSteps: [
      { label: 'Mer- (fermeture bilabiale)', mouthOpen: 0.0, mouthWidth: 1.0, teethVisible: false, lipRounding: 0.2 },
      { label: '-ci (étirement /i/)', mouthOpen: 0.3, mouthWidth: 1.3, teethVisible: true, lipRounding: 0.0 },
      { label: 'beau- (bilabiale /b/ + arrondi)', mouthOpen: 0.45, mouthWidth: 0.8, teethVisible: false, lipRounding: 0.8 },
      { label: '-coup (puckered /u/)', mouthOpen: 0.25, mouthWidth: 0.75, teethVisible: false, lipRounding: 0.95 },
    ],
  },
  {
    id: 'de_danke_schon',
    phrase: 'Dankeschön',
    language: 'Deutsch',
    langCode: 'de',
    category: 'Höflichkeit',
    description: 'Dentale /d/, offenes /a/ und gerundetes Umlaut /øː/',
    visemeSteps: [
      { label: 'Dan- (dental /d/ + /a/)', mouthOpen: 0.7, mouthWidth: 1.1, teethVisible: true, lipRounding: 0.2 },
      { label: '-ke (Halboffen)', mouthOpen: 0.4, mouthWidth: 1.15, teethVisible: true, lipRounding: 0.1 },
      { label: 'schön (Umlaut gerundet)', mouthOpen: 0.4, mouthWidth: 0.8, teethVisible: false, lipRounding: 0.85 },
    ],
  },
];

/**
 * Renders a stylized, realistic human mouth viseme frame on a 320x240 canvas
 * and returns it as a base64 JPEG image URL.
 */
export function renderVisemeFrame(
  mouthOpen: number,
  mouthWidth: number,
  teethVisible: boolean,
  lipRounding: number,
  skinTone: string = '#e0ac69'
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 240;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const cx = 160;
  const cy = 120;

  // Background skin
  const skinGrad = ctx.createRadialGradient(cx, cy, 30, cx, cy, 150);
  skinGrad.addColorStop(0, '#f1c27d');
  skinGrad.addColorStop(0.5, '#e0ac69');
  skinGrad.addColorStop(1, '#c68642');
  ctx.fillStyle = skinGrad;
  ctx.fillRect(0, 0, 320, 240);

  // Philtrum shadow (above upper lip)
  ctx.fillStyle = 'rgba(140, 75, 40, 0.15)';
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy - 45);
  ctx.lineTo(cx - 6, cy - 22);
  ctx.lineTo(cx + 6, cy - 22);
  ctx.lineTo(cx + 8, cy - 45);
  ctx.fill();

  // Chin crease (below lower lip)
  ctx.strokeStyle = 'rgba(140, 75, 40, 0.2)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy + 42, 28, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();

  // Mouth dimensions based on viseme parameters
  const baseW = 60 * mouthWidth * (1 - lipRounding * 0.25);
  const baseH = Math.max(2, 35 * mouthOpen);

  // Oral cavity (inside mouth)
  if (mouthOpen > 0.12) {
    ctx.fillStyle = '#2c0b0e';
    ctx.beginPath();
    ctx.ellipse(cx, cy, baseW * 0.9, baseH, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tongue
    ctx.fillStyle = '#b33939';
    ctx.beginPath();
    ctx.ellipse(cx, cy + baseH * 0.4, baseW * 0.65, baseH * 0.5, 0, 0, Math.PI);
    ctx.fill();

    // Teeth (Upper)
    if (teethVisible) {
      ctx.fillStyle = '#faf8f5';
      ctx.beginPath();
      ctx.ellipse(cx, cy - baseH * 0.35, baseW * 0.7, 7, 0, 0, Math.PI);
      ctx.fill();

      // Tooth separation lines
      ctx.strokeStyle = 'rgba(180, 160, 150, 0.4)';
      ctx.lineWidth = 1;
      for (let tx = -20; tx <= 20; tx += 8) {
        ctx.beginPath();
        ctx.moveTo(cx + tx, cy - baseH * 0.35);
        ctx.lineTo(cx + tx, cy - baseH * 0.35 + 7);
        ctx.stroke();
      }
    }
  }

  // Lips colors
  const upperLipColor = '#c0392b';
  const lowerLipColor = '#d63031';
  const lipHighlight = 'rgba(255, 230, 230, 0.4)';

  // Upper Lip
  ctx.fillStyle = upperLipColor;
  ctx.beginPath();
  // Left corner
  ctx.moveTo(cx - baseW, cy);
  // Cupid's bow
  ctx.bezierCurveTo(
    cx - baseW * 0.6,
    cy - 18 - lipRounding * 6,
    cx - 10,
    cy - 20 - lipRounding * 6,
    cx,
    cy - 12 - lipRounding * 4
  );
  ctx.bezierCurveTo(
    cx + 10,
    cy - 20 - lipRounding * 6,
    cx + baseW * 0.6,
    cy - 18 - lipRounding * 6,
    cx + baseW,
    cy
  );
  // Inner upper line
  ctx.bezierCurveTo(
    cx + baseW * 0.5,
    cy - (baseH * 0.6),
    cx - baseW * 0.5,
    cy - (baseH * 0.6),
    cx - baseW,
    cy
  );
  ctx.fill();

  // Lower Lip
  ctx.fillStyle = lowerLipColor;
  ctx.beginPath();
  ctx.moveTo(cx - baseW, cy);
  // Inner lower line
  ctx.bezierCurveTo(
    cx - baseW * 0.5,
    cy + (baseH * 0.6),
    cx + baseW * 0.5,
    cy + (baseH * 0.6),
    cx + baseW,
    cy
  );
  // Outer bottom curve
  ctx.bezierCurveTo(
    cx + baseW * 0.6,
    cy + 22 + lipRounding * 8,
    cx - baseW * 0.6,
    cy + 22 + lipRounding * 8,
    cx - baseW,
    cy
  );
  ctx.fill();

  // Subtle gloss highlight on lower lip
  ctx.fillStyle = lipHighlight;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 12 + lipRounding * 4, baseW * 0.35, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Corner shadows
  ctx.fillStyle = 'rgba(50, 10, 10, 0.4)';
  ctx.beginPath();
  ctx.arc(cx - baseW, cy, 3, 0, Math.PI * 2);
  ctx.arc(cx + baseW, cy, 3, 0, Math.PI * 2);
  ctx.fill();

  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * Generates an array of JPEG frame data URLs for a given demo item
 */
export function generateDemoFrames(demo: DemoItem): string[] {
  return demo.visemeSteps.map((step) =>
    renderVisemeFrame(
      step.mouthOpen,
      step.mouthWidth,
      step.teethVisible,
      step.lipRounding
    )
  );
}
