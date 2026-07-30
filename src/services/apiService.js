// API Service — Connects AssistVision React frontend to Python FastAPI backend
// Falls back gracefully if backend is unavailable (offline/no server)

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiService {
  constructor() {
    this.isBackendAvailable = false;
    this._checkBackendHealth();
  }

  async _checkBackendHealth() {
    try {
      const res = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(2000) });
      this.isBackendAvailable = res.ok;
      if (res.ok) console.log('[API] Backend connected at', BASE_URL);
    } catch {
      this.isBackendAvailable = false;
      console.warn('[API] Backend not available — running in offline mode');
    }
  }

  /**
   * Send a base64 image to the backend OCR endpoint
   * @param {string} base64Image
   * @returns {Promise<{ text: string, confidence: number }>}
   */
  async ocrFromImage(base64Image) {
    if (!this.isBackendAvailable) {
      return { text: '', confidence: 0, offline: true };
    }
    try {
      const res = await fetch(`${BASE_URL}/api/ocr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      });
      if (!res.ok) throw new Error('OCR API error');
      return await res.json();
    } catch (err) {
      console.warn('[API] OCR request failed:', err);
      return { text: '', confidence: 0, error: err.message };
    }
  }

  /**
   * Detect objects in a base64 image frame
   * @param {string} base64Image
   * @returns {Promise<{ detections: Array }>}
   */
  async detectObjects(base64Image) {
    if (!this.isBackendAvailable) {
      return { detections: [], offline: true };
    }
    try {
      const res = await fetch(`${BASE_URL}/api/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      });
      if (!res.ok) throw new Error('Detection API error');
      return await res.json();
    } catch (err) {
      console.warn('[API] Detection request failed:', err);
      return { detections: [], error: err.message };
    }
  }

  /**
   * Detect currency in a base64 image frame
   * @param {string} base64Image
   * @returns {Promise<{ currency: string, value: number, confidence: number }>}
   */
  async detectCurrency(base64Image) {
    if (!this.isBackendAvailable) {
      return { currency: null, offline: true };
    }
    try {
      const res = await fetch(`${BASE_URL}/api/currency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      });
      if (!res.ok) throw new Error('Currency API error');
      return await res.json();
    } catch (err) {
      console.warn('[API] Currency request failed:', err);
      return { currency: null, error: err.message };
    }
  }

  /**
   * Geocode a destination query string
   * @param {string} query
   * @returns {Promise<{ lat: number, lon: number, displayName: string }>}
   */
  async geocode(query) {
    try {
      // Use Nominatim (open, no API key needed) directly
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), displayName: data[0].display_name };
      }
      return { error: 'Location not found' };
    } catch (err) {
      return { error: err.message };
    }
  }

  /**
   * Send an SOS event to the backend for logging
   * @param {{ lat: number, lon: number, contacts: Array, message: string }} payload
   * @returns {Promise<{ success: boolean }>}
   */
  async sendSOS(payload) {
    if (!this.isBackendAvailable) {
      console.warn('[API] SOS logged offline (backend unavailable)');
      return { success: false, offline: true };
    }
    try {
      const res = await fetch(`${BASE_URL}/api/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err) {
      console.warn('[API] SOS request failed:', err);
      return { success: false, error: err.message };
    }
  }

  getBackendStatus() {
    return this.isBackendAvailable;
  }
}

export const apiService = new ApiService();
