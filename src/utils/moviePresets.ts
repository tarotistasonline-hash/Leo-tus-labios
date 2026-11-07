import { MovieScenePreset } from '../types';

export const MOVIE_SCENE_PRESETS: MovieScenePreset[] = [
  {
    id: 'cinema_padrino',
    title: 'El Padrino (Diálogo Clásico)',
    speaker: 'Don Corleone',
    duration: '0:03',
    language: 'Español / Italiano',
    langCode: 'es',
    description: 'Articulación lenta y solemne con marcado cierre bilabial.',
    expectedSubtitles: 'Algún día, y puede que ese día nunca llegue, te pediré un favor.',
    category: 'drama',
  },
  {
    id: 'cinema_casablanca',
    title: 'Casablanca (Escena de despedida)',
    speaker: 'Rick Blaine',
    duration: '0:02',
    language: 'Español / Inglés',
    langCode: 'es',
    description: 'Articulación clara frente a cámara con visemas abiertos y alargados.',
    expectedSubtitles: 'Siempre nos quedará París.',
    category: 'classic',
  },
  {
    id: 'cinema_starwars',
    title: 'Star Wars (Despedida en el hangar)',
    speaker: 'Maestro Jedi',
    duration: '0:02',
    language: 'Español / Inglés',
    langCode: 'es',
    description: 'Movimiento labial suave y enfocado con visemas bilabiales y dentales.',
    expectedSubtitles: 'Que la fuerza te acompañe, siempre.',
    category: 'classic',
  },
  {
    id: 'cinema_noticias',
    title: 'Entrevista de Noticias en Directo',
    speaker: 'Presentadora',
    duration: '0:03',
    language: 'Español',
    langCode: 'es',
    description: 'Locución profesional, dicción frontal perfecta y visemas muy nítidos.',
    expectedSubtitles: 'Buenas noches, comenzamos la transmisión especial de hoy.',
    category: 'interview',
  },
  {
    id: 'cinema_medico',
    title: 'Drama Hospitalario (Susurro)',
    speaker: 'Doctora',
    duration: '0:02',
    language: 'Español',
    langCode: 'es',
    description: 'Tono bajo y susurrado, ideal para probar la lectura labial sin sonido.',
    expectedSubtitles: 'Tranquilo, la operación fue un éxito total.',
    category: 'drama',
  },
];

/**
 * Generates an animated cinematic video sequence for a movie preset
 * on an HTML5 canvas and converts to frame burst.
 */
export function generateCinematicSceneFrames(preset: MovieScenePreset): string[] {
  const frames: string[] = [];
  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];

  // Generate 8 sequential frames showing actor's face & lips moving
  const totalFrames = 8;
  for (let i = 0; i < totalFrames; i++) {
    // Cinematic widescreen dark background
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, 480, 320);

    // Warm cinematic key light
    const grad = ctx.createRadialGradient(240, 160, 40, 240, 160, 220);
    grad.addColorStop(0, '#2d221e');
    grad.addColorStop(0.7, '#151214');
    grad.addColorStop(1, '#08080a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 480, 320);

    // Actor Face Silhouette
    ctx.fillStyle = '#dca877';
    ctx.beginPath();
    ctx.ellipse(240, 150, 75, 105, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cinematic side shadow (Chiaroscuro lighting)
    ctx.fillStyle = 'rgba(20, 10, 15, 0.45)';
    ctx.beginPath();
    ctx.ellipse(275, 150, 50, 105, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#2c1e19';
    ctx.beginPath();
    ctx.ellipse(215, 125, 7, 4, 0, 0, Math.PI * 2);
    ctx.ellipse(265, 125, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nose bridge
    ctx.strokeStyle = 'rgba(120, 70, 40, 0.4)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(240, 125);
    ctx.lineTo(237, 165);
    ctx.lineTo(245, 168);
    ctx.stroke();

    // Mouth Viseme Cycle based on frame index
    const progress = i / (totalFrames - 1);
    // Oscillate mouth open / close to mimic speech words
    const mouthCycle = Math.sin(progress * Math.PI * 3);
    const mouthOpen = Math.max(0.05, Math.abs(mouthCycle) * 0.85);
    const mouthWidth = 0.9 + Math.cos(progress * Math.PI * 2) * 0.25;

    const mx = 240;
    const my = 195;
    const mw = 32 * mouthWidth;
    const mh = Math.max(2, 18 * mouthOpen);

    // Mouth cavity
    if (mouthOpen > 0.15) {
      ctx.fillStyle = '#250608';
      ctx.beginPath();
      ctx.ellipse(mx, my, mw * 0.9, mh, 0, 0, Math.PI * 2);
      ctx.fill();

      // Teeth
      ctx.fillStyle = '#f8f4ee';
      ctx.beginPath();
      ctx.ellipse(mx, my - mh * 0.35, mw * 0.7, 4, 0, 0, Math.PI);
      ctx.fill();
    }

    // Lips
    ctx.fillStyle = '#b33939';
    // Upper lip
    ctx.beginPath();
    ctx.moveTo(mx - mw, my);
    ctx.bezierCurveTo(mx - mw * 0.5, my - 7, mx - 5, my - 8, mx, my - 5);
    ctx.bezierCurveTo(mx + 5, my - 8, mx + mw * 0.5, my - 7, mx + mw, my);
    ctx.bezierCurveTo(mx, my - (mh * 0.5), mx, my - (mh * 0.5), mx - mw, my);
    ctx.fill();

    // Lower lip
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.moveTo(mx - mw, my);
    ctx.bezierCurveTo(mx, my + (mh * 0.5), mx, my + (mh * 0.5), mx + mw, my);
    ctx.bezierCurveTo(mx + mw * 0.5, my + 10, mx - mw * 0.5, my + 10, mx - mw, my);
    ctx.fill();

    // Film grain & Cinema Bars
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 480, 26);
    ctx.fillRect(0, 294, 480, 26);

    // Scene label watermark
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '10px monospace';
    ctx.fillText(`${preset.speaker.toUpperCase()} • CUADRO ${i + 1}/${totalFrames}`, 15, 20);

    frames.push(canvas.toDataURL('image/jpeg', 0.85));
  }

  return frames;
}
