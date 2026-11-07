/**
 * Audio Text-to-Speech utility using Web Speech API
 */

export function speakText(text: string, langCode: string = 'es'): Promise<boolean> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser');
      resolve(false);
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech

      if (!text || text.trim() === '') {
        resolve(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);

      const langMap: Record<string, string> = {
        es: 'es-ES',
        en: 'en-US',
        fr: 'fr-FR',
        de: 'de-DE',
        it: 'it-IT',
        pt: 'pt-PT',
        zh: 'zh-CN',
        ja: 'ja-JP',
      };

      utterance.lang = langMap[langCode] || langCode;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Try to find a matching voice if available
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const matchingVoice = voices.find((v) => v.lang.startsWith(langCode));
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }
      }

      utterance.onend = () => resolve(true);
      utterance.onerror = () => resolve(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('Error speaking text:', e);
      resolve(false);
    }
  });
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
