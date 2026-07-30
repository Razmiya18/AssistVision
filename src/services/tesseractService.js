// Tesseract.js OCR Service — Real In-Browser Text Extraction
import { createWorker } from 'tesseract.js';

class TesseractService {
  constructor() {
    this.worker = null;
    this.isReady = false;
    this.isInitializing = false;
    this.lastText = '';
    this.stableCount = 0;
    this.onReadyCallback = null;
  }

  async init(onProgress) {
    if (this.isReady || this.isInitializing) return;
    this.isInitializing = true;

    try {
      this.worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (onProgress && m.status === 'recognizing text') {
            onProgress(Math.round(m.progress * 100));
          }
        }
      });

      await this.worker.setParameters({
        tessedit_char_whitelist:
          'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,!?:;-/\\@#%&()\'"',
        preserve_interword_spaces: '1'
      });

      this.isReady = true;
      this.isInitializing = false;
      console.log('[Tesseract] OCR engine ready.');
      if (this.onReadyCallback) this.onReadyCallback();
    } catch (err) {
      console.warn('[Tesseract] Init failed:', err);
      this.isInitializing = false;
    }
  }

  /**
   * Extract text from a <video> element via canvas snapshot
   * @param {HTMLVideoElement} videoEl
   * @returns {Promise<{ text: string, confidence: number, words: Array }>}
   */
  async extractTextFromVideo(videoEl) {
    if (!this.isReady || !this.worker) {
      return { text: '', confidence: 0, words: [] };
    }
    if (!videoEl || videoEl.readyState < 2 || !videoEl.videoWidth) {
      return { text: '', confidence: 0, words: [] };
    }

    try {
      const snapCanvas = document.createElement('canvas');
      snapCanvas.width = videoEl.videoWidth;
      snapCanvas.height = videoEl.videoHeight;
      const ctx = snapCanvas.getContext('2d');
      ctx.drawImage(videoEl, 0, 0);

      // Enhance contrast for better OCR
      const imageData = ctx.getImageData(0, 0, snapCanvas.width, snapCanvas.height);
      const enhanced = this._enhanceContrast(imageData);
      ctx.putImageData(enhanced, 0, 0);

      const { data } = await this.worker.recognize(snapCanvas);

      const cleanText = data.text
        .replace(/\n+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();

      // Stability check: only return text if confidence is high enough
      if (data.confidence < 30) {
        return { text: '', confidence: data.confidence, words: [] };
      }

      return {
        text: cleanText,
        confidence: Math.round(data.confidence),
        words: (data.words || [])
          .filter((w) => w.confidence > 40)
          .map((w) => ({ text: w.text, confidence: Math.round(w.confidence) }))
      };
    } catch (err) {
      console.warn('[Tesseract] Recognition error:', err);
      return { text: '', confidence: 0, words: [] };
    }
  }

  /**
   * Enhance contrast of image data for better OCR accuracy
   */
  _enhanceContrast(imageData) {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      // Adaptive threshold: binarize for text clarity
      const val = gray > 128 ? 255 : 0;
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
    }
    return imageData;
  }

  isEngineReady() {
    return this.isReady;
  }

  onReady(cb) {
    this.onReadyCallback = cb;
    if (this.isReady) cb();
  }

  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isReady = false;
    }
  }
}

export const tesseractService = new TesseractService();
