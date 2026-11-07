import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '35mb' }));

// Initialize Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Endpoint: Read Lips from image burst
app.post('/api/read-lips', async (req, res) => {
  try {
    const {
      frames,
      spokenLanguage = 'es',
      targetLanguage = 'es',
      context = 'conversacion_general',
      confidenceThreshold = 40,
    } = req.body;

    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return res.status(400).json({ error: 'No se recibieron fotogramas de los labios' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Falta la clave API de Gemini en el entorno del servidor',
      });
    }

    // Prepare multimodal parts: a sequence of frames focused on mouth/lips
    const contentParts: any[] = [];

    // Add each frame as an inlineData image
    frames.slice(0, 12).forEach((frameData: string, idx: number) => {
      // Clean base64 header if present (e.g., "data:image/jpeg;base64,...")
      let cleanBase64 = frameData;
      let mimeType = 'image/jpeg';
      if (frameData.includes(',')) {
        const matches = frameData.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          cleanBase64 = matches[2];
        } else {
          cleanBase64 = frameData.split(',')[1];
        }
      }

      contentParts.push({
        inlineData: {
          mimeType,
          data: cleanBase64,
        },
      });
    });

    const languageNames: Record<string, string> = {
      es: 'Español',
      en: 'Inglés (English)',
      fr: 'Francés (Français)',
      de: 'Alemán (Deutsch)',
      it: 'Italiano',
      pt: 'Portugués (Português)',
      zh: 'Chino Mandarín (Chinese)',
      ja: 'Japonés (Japanese)',
      auto: 'Auto-detectar idioma hablado',
    };

    const targetLangName = languageNames[targetLanguage] || targetLanguage;
    const spokenLangName = languageNames[spokenLanguage] || spokenLanguage;

    const systemPrompt = `Eres un sistema experto de Inteligencia Artificial especializado en Lectura Labial Forense y Reconocimiento Visual del Habla (Visual Speech Recognition / Automated Lip Reading / VSR).
Tu tarea es analizar la secuencia cronológica de fotogramas centrados en los labios/boca de una persona y descifrar con la máxima precisión qué palabras o frase está articulando.

Pautas de análisis labial:
1. Analiza minuciosamente los visemas:
   - Bilabiales (/p, b, m/): cierre completo de labios y apertura explosiva o suave.
   - Labiodentales (/f, v/): labio inferior contacta dientes incisivos superiores.
   - Dentales e interdentales (/t, d, s, z, th/): posición de lengua visible tras los dientes.
   - Vocales redondeadas (/o, u/): protrusión y redondeo labial evidente.
   - Vocales abiertas (/a/): apertura vertical mandibular amplia.
   - Vocales extendidas (/e, i/): comisuras estiradas horizontalmente.
2. Considera homofenos: muchas palabras tienen visemas similares (ejemplo: "mapa" / "mama" / "papa"). Usa coherencia contextual lingüística para seleccionar la interpretación más natural.
3. Contexto temático proporcionado por el usuario: "${context}".
4. Idioma articulado por el hablante: ${spokenLangName === 'Auto-detectar idioma hablado' ? 'Detecta el idioma que parece pronunciar de forma natural' : spokenLangName}.
5. Idioma de salida para los subtítulos traducidos: ${targetLangName}.
6. Si la persona apenas mueve la boca o solo sonríe o está en reposo sin articular palabras, indica claramente una transcripción vacía ("") y marca confianza baja (0-15) indicando "Sin movimiento labial significativo" o similar.
7. Genera una transcripción limpia, subtítulos en el idioma de destino (${targetLangName}), porcentaje de confianza (0-100), visemas detectados, alternativas posibles y tono gestual.`;

    contentParts.push({
      text: `Analiza esta secuencia cronológica de fotogramas de labios (${frames.length} cuadros consecutivos capturados en un intervalo de 1.5 a 2.5 segundos).
Descifra la frase pronunciada en ${spokenLangName} y tradúcela a ${targetLangName} para los subtítulos.`,
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: contentParts },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcription: {
              type: Type.STRING,
              description: 'Texto exacto o más probable articulado por los labios en el idioma original',
            },
            subtitles: {
              type: Type.STRING,
              description: `Subtítulos traducidos al idioma de destino (${targetLangName}) listos para mostrar en pantalla`,
            },
            confidence: {
              type: Type.INTEGER,
              description: 'Nivel de confianza en la deducción visual de 0 a 100',
            },
            detectedLanguage: {
              type: Type.STRING,
              description: 'Idioma identificado en los labios (ej. Español, English, etc.)',
            },
            visemeAnalysis: {
              type: Type.STRING,
              description: 'Resumen técnico de los movimientos labiales y visemas observados',
            },
            alternatives: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Otras posibles palabras o frases según visemas homófenos',
            },
            emotionalTone: {
              type: Type.STRING,
              description: 'Tono gestual percibido en la boca: Neutro, Alegre, Serio, Susurrando, Sorpresa, etc.',
            },
            isSilentOrStill: {
              type: Type.BOOLEAN,
              description: 'Verdadero si no hubo movimiento articulatorio claro',
            },
          },
          required: ['transcription', 'subtitles', 'confidence', 'visemeAnalysis'],
        },
      },
    });

    const resultText = response.text?.trim() || '{}';
    let parsedResult;
    try {
      parsedResult = JSON.parse(resultText);
    } catch (e) {
      parsedResult = {
        transcription: 'Lectura no concluyente',
        subtitles: 'Lectura no concluyente',
        confidence: 25,
        visemeAnalysis: 'Visemas ambiguos o baja iluminación',
        alternatives: [],
        emotionalTone: 'Neutro',
        isSilentOrStill: true,
      };
    }

    return res.json({
      success: true,
      data: parsedResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error al procesar lectura de labios:', error);
    return res.status(500).json({
      error: error?.message || 'Error interno al procesar los fotogramas labiales con Gemini',
    });
  }
});

// Endpoint: Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    time: new Date().toISOString(),
  });
});

// Setup Vite or static serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Leo tus Labios server running on port ${port} (mode: ${isProd ? 'production' : 'development'})`);
  });
}

startServer();
