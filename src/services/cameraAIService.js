// Camera AI Service — Enhanced with Change-Detection Logic
// Only announces when something meaningful changes (new object, distance shift, warning toggle)

export const CAMERA_MODES = {
  OBJECT: 'object',
  OCR: 'ocr',
  CURRENCY: 'currency',
  FACE: 'face',
  TRAFFIC: 'traffic'
};

// Directional mapping — simplified 5-zone system
const COL_DIRECTION = ['Left', 'Front Left', 'Front', 'Front Right', 'Right'];

class CameraAIService {
  constructor() {
    this.stream = null;
    this.currentFacingMode = 'environment';
    this.analysisCanvas = document.createElement('canvas');
    this.analysisCtx = this.analysisCanvas.getContext('2d', { willReadFrequently: true });
    this.useDemoMode = false;

    // ── Temporal Persistence State ─────────────────────────────────────────────
    this.candidateHistory = new Map(); // key: cellIndex, value: frameHitCount
    this.historyFrameCount = 0;
  }

  // ─── Camera Control ─────────────────────────────────────────────────────────
  async startCamera(videoElement, facingMode = 'environment') {
    this.currentFacingMode = facingMode;
    if (this.stream) this.stopCamera();
    try {
      const constraints = {
        video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      };
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoElement) {
        videoElement.srcObject = this.stream;
        await videoElement.play();
      }
      return { success: true, facingMode };
    } catch (err) {
      console.warn('[Camera] Access error:', err.message);
      return { success: false, error: err.message };
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
  }

  isCameraRunning() { return !!this.stream; }
  setDemoMode(v) { this.useDemoMode = v; }

  // ─── Frame Analysis ─────────────────────────────────────────────────────────
  analyzeLiveVideoFrame(videoElement, mode = CAMERA_MODES.OBJECT) {
    if (this.useDemoMode) return this.getSimulatedDetections(mode);
    if (!videoElement || videoElement.readyState < 2 || !videoElement.videoWidth) return [];

    const W = 160, H = 120;
    this.analysisCanvas.width = W;
    this.analysisCanvas.height = H;

    try {
      this.analysisCtx.drawImage(videoElement, 0, 0, W, H);
      const imgData = this.analysisCtx.getImageData(0, 0, W, H);
      const data = imgData.data;

      const cols = 5, rows = 3;
      const cellW = W / cols, cellH = H / rows;
      const currentHits = new Set();
      const rawDetections = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cellIndex = r * cols + c;
          const lumaValues = [];
          let rSum = 0, gSum = 0, bSum = 0, count = 0;
          let strongEdgeCount = 0;

          const startY = Math.floor(r * cellH);
          const endY = Math.floor((r + 1) * cellH);
          const startX = Math.floor(c * cellW);
          const endX = Math.floor((c + 1) * cellW);

          for (let y = startY + 1; y < endY - 1; y += 2) {
            for (let x = startX + 1; x < endX - 1; x += 2) {
              const idx = (y * W + x) * 4;
              const rP = data[idx], gP = data[idx + 1], bP = data[idx + 2];
              const luma = 0.299 * rP + 0.587 * gP + 0.114 * bP;
              lumaValues.push(luma);
              rSum += rP; gSum += gP; bSum += bP;
              count++;

              // Sobel 3x3 Edge Magnitude approximation
              const idxLeft = (y * W + (x - 1)) * 4;
              const idxRight = (y * W + (x + 1)) * 4;
              const idxTop = ((y - 1) * W + x) * 4;
              const idxBottom = ((y + 1) * W + x) * 4;

              const lumaL = 0.299 * data[idxLeft] + 0.587 * data[idxLeft + 1] + 0.114 * data[idxLeft + 2];
              const lumaR = 0.299 * data[idxRight] + 0.587 * data[idxRight + 1] + 0.114 * data[idxRight + 2];
              const lumaT = 0.299 * data[idxTop] + 0.587 * data[idxTop + 1] + 0.114 * data[idxTop + 2];
              const lumaB = 0.299 * data[idxBottom] + 0.587 * data[idxBottom + 1] + 0.114 * data[idxBottom + 2];

              const gradX = Math.abs(lumaR - lumaL);
              const gradY = Math.abs(lumaB - lumaT);
              const edgeMag = gradX + gradY;

              if (edgeMag > 55) strongEdgeCount++;
            }
          }

          if (!count) continue;
          const avgLuma = lumaValues.reduce((a, b) => a + b, 0) / count;
          const minL = Math.min(...lumaValues), maxL = Math.max(...lumaValues);
          const contrastRange = maxL - minL;
          const variance = lumaValues.reduce((acc, v) => acc + (v - avgLuma) ** 2, 0) / count;
          const edgeRatio = strongEdgeCount / count;
          const avgR = rSum / count, avgG = gSum / count, avgB = bSum / count;

          let detected = false;
          let rawConf = 0;
          let label = 'Object';

          if (mode === CAMERA_MODES.OBJECT) {
            // Strict Object Detection: Requires strong physical edges AND structural contrast
            if (contrastRange > 165 && variance > 3800 && edgeRatio > 0.22 && avgLuma > 30 && avgLuma < 230) {
              detected = true;
              rawConf = Math.min(99, 82 + (edgeRatio - 0.22) * 50 + (contrastRange - 165) * 0.1);
              label = 'Obstacle';
            }
          } else if (mode === CAMERA_MODES.OCR) {
            if (contrastRange > 175 && variance > 4200 && edgeRatio > 0.28 && avgLuma > 35 && avgLuma < 220) {
              detected = true;
              rawConf = Math.min(99, 85 + (edgeRatio - 0.28) * 45);
              label = 'Text Region';
            }
          } else if (mode === CAMERA_MODES.CURRENCY) {
            if (contrastRange > 150 && variance > 2500 && edgeRatio > 0.18 && avgLuma > 50 && avgLuma < 210) {
              detected = true;
              rawConf = Math.min(99, 82 + (contrastRange - 150) * 0.12);
              label = 'Banknote';
            }
          } else if (mode === CAMERA_MODES.FACE) {
            // YCbCr skin chrominance validation to avoid false positives on wood/brown objects
            const cb = 128 - 0.168736 * avgR - 0.331264 * avgG + 0.5 * avgB;
            const cr = 128 + 0.5 * avgR - 0.418688 * avgG - 0.081312 * avgB;
            const isSkin = cb >= 77 && cb <= 127 && cr >= 133 && cr <= 173 && avgR > 110 && avgR > avgG;

            if (isSkin && contrastRange > 65 && variance > 800) {
              detected = true;
              rawConf = Math.min(99, 84 + variance * 0.003);
              label = 'Person';
            }
          } else if (mode === CAMERA_MODES.TRAFFIC) {
            const brightPixels = lumaValues.filter(l => l > 225).length;
            if ((brightPixels / count) > 0.18 && contrastRange > 140) {
              detected = true;
              rawConf = Math.min(99, 85 + (brightPixels / count) * 60);
              label = 'Signal';
            }
          }

          // ── Temporal Persistence Gate (must persist across >= 2 frames) ────
          if (detected && rawConf >= 82) {
            currentHits.add(cellIndex);
            const prevCount = this.candidateHistory.get(cellIndex) || 0;
            const newCount = prevCount + 1;
            this.candidateHistory.set(cellIndex, newCount);

            if (newCount >= 2) { // Frame persistence confirmed!
              const estDist = parseFloat((0.6 + (1.0 - r / rows) * 1.8).toFixed(1));
              const dir = COL_DIRECTION[c] || 'Front';
              const isWarning = estDist <= 1.0;

              rawDetections.push({
                id: cellIndex,
                label,
                distance: estDist,
                direction: dir,
                confidence: Math.round(rawConf),
                x: Math.round((c * cellW / W) * 100),
                y: Math.round((r * cellH / H) * 100),
                width: Math.round((cellW / W) * 100) + 4,
                height: Math.round((cellH / H) * 100) + 4,
                color: isWarning ? '#EF4444' : '#2563EB',
                warning: isWarning
              });
            }
          } else {
            // Decay cell hit count
            if (this.candidateHistory.has(cellIndex)) {
              const current = this.candidateHistory.get(cellIndex);
              if (current <= 1) this.candidateHistory.delete(cellIndex);
              else this.candidateHistory.set(cellIndex, current - 1);
            }
          }
        }
      }

      // Cleanup stale history keys not hit in current frame
      for (const cellKey of this.candidateHistory.keys()) {
        if (!currentHits.has(cellKey)) {
          const val = this.candidateHistory.get(cellKey);
          if (val <= 1) this.candidateHistory.delete(cellKey);
          else this.candidateHistory.set(cellKey, val - 1);
        }
      }

      // ── Deduplication: merge adjacent cells with same label ────────────────
      const deduplicated = this._deduplicate(rawDetections);

      // ── Sort nearest first ─────────────────────────────────────────────────
      deduplicated.sort((a, b) => a.distance - b.distance);

      // ── Update empty-frame counter ─────────────────────────────────────────
      if (deduplicated.length === 0) {
        this._emptyFrameCount++;
      } else {
        this._emptyFrameCount = 0;
        this._clearReported = false;
      }

      return deduplicated.slice(0, 3); // max 3 high-confidence results

    } catch (e) {
      return [];
    }
  }

  // ─── Deduplication: remove overlapping/adjacent same-direction detections ──
  _deduplicate(detections) {
    const result = [];
    for (const det of detections) {
      const dup = result.find(d =>
        d.direction === det.direction &&
        Math.abs(d.distance - det.distance) < 0.5
      );
      if (!dup) {
        result.push(det);
      } else if (det.confidence > dup.confidence) {
        // Replace with higher-confidence one
        result.splice(result.indexOf(dup), 1, det);
      }
    }
    return result;
  }

  // ─── Change Detection — Should We Announce? ─────────────────────────────────
  // Returns announcement text if something changed, null otherwise
  getAnnouncementIfChanged(detections) {
    const now = Date.now();

    // Empty scene
    if (detections.length === 0) {
      if (!this._clearReported && this._emptyFrameCount >= 6) {
        this._clearReported = true;
        this.lastAnnouncedState = null;
        this.warningWasActive = false;
        return 'PATH_CLEAR';
      }
      return null;
    }

    // Nearest object is priority
    const nearest = detections[0];
    const distBucket = Math.round(nearest.distance * 2) / 2; // round to 0.5m buckets
    const newState = {
      label: nearest.label,
      direction: nearest.direction,
      distanceBucket: distBucket,
      warning: nearest.warning
    };

    const prev = this.lastAnnouncedState;
    const tooSoon = (now - this._lastAnnouncedAt) < this._ttsDebounceMs;

    // Always announce new warnings immediately (override debounce)
    const newWarning = nearest.warning && !this.warningWasActive;

    if (newWarning) {
      this.lastAnnouncedState = newState;
      this.warningWasActive = true;
      this._lastAnnouncedAt = now;
      return `WARNING: ${nearest.label} ${nearest.direction}. ${nearest.distance} meters.`;
    }

    // Warning cleared
    if (!nearest.warning && this.warningWasActive) {
      this.warningWasActive = false;
      this.lastAnnouncedState = newState;
      this._lastAnnouncedAt = now;
      return `${nearest.label} moving away.`;
    }

    if (tooSoon) return null;

    // First detection ever, or label/direction changed, or distance bucket changed
    if (!prev ||
        prev.label !== newState.label ||
        prev.direction !== newState.direction ||
        prev.distanceBucket !== newState.distanceBucket) {
      this.lastAnnouncedState = newState;
      this._lastAnnouncedAt = now;
      const dist = nearest.distance.toFixed(1).replace('.', ' point ');
      return `${nearest.label} ${nearest.direction}. ${dist} meters.`;
    }

    return null;
  }

  isStablyClear() {
    return this._emptyFrameCount >= 6 && !this._clearReported;
  }

  canFireWarning() {
    return (Date.now() - this._lastAnnouncedAt) > 4000;
  }

  // ─── Canvas Overlay ─────────────────────────────────────────────────────────
  drawCanvasOverlay(canvas, detections, mode) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    if (detections.length === 0) {
      ctx.fillStyle = 'rgba(16,185,129,0.88)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(10, 10, 280, 38, 10);
      else ctx.rect(10, 10, 280, 38);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 15px Outfit, sans-serif';
      ctx.fillText('✓  Path Clear', 20, 34);
      return;
    }

    detections.forEach((det, idx) => {
      const bx = (det.x / 100) * W, by = (det.y / 100) * H;
      const bw = (det.width / 100) * W, bh = (det.height / 100) * H;
      const color = det.warning ? '#EF4444' : '#2563EB';

      ctx.strokeStyle = color;
      ctx.lineWidth = det.warning ? 3.5 : 2.5;
      ctx.fillStyle = det.warning ? 'rgba(239,68,68,0.15)' : 'rgba(37,99,235,0.1)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 8); else ctx.rect(bx, by, bw, bh);
      ctx.fill(); ctx.stroke();

      // Corner accents
      const cLen = 10;
      ctx.strokeStyle = color; ctx.lineWidth = 2.5;
      [[bx, by], [bx + bw, by], [bx, by + bh], [bx + bw, by + bh]].forEach(([cx, cy], i) => {
        ctx.beginPath();
        ctx.moveTo(cx + (i % 2 === 0 ? cLen : -cLen), cy);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx, cy + (i < 2 ? cLen : -cLen));
        ctx.stroke();
      });

      // Label chip
      const lbl = det.label + (idx === 0 ? ` · ${det.distance}m` : '');
      ctx.font = 'bold 13px Outfit, sans-serif';
      const tw = ctx.measureText(lbl).width;
      const ly = by < 32 ? by + 4 : by - 28;
      ctx.fillStyle = color;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(bx, ly, tw + 16, 24, 6); else ctx.rect(bx, ly, tw + 16, 24);
      ctx.fill();
      ctx.fillStyle = '#FFF';
      ctx.fillText(lbl, bx + 8, ly + 16);

      // Distance tag
      if (det.distance && idx === 0) {
        const dtxt = `${det.distance}m · ${det.direction}`;
        const dw = ctx.measureText(dtxt).width + 14;
        const dy = Math.min(H - 26, by + bh + 4);
        ctx.fillStyle = 'rgba(7,10,20,0.88)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(bx, dy, dw, 20, 5); else ctx.rect(bx, dy, dw, 20);
        ctx.fill();
        ctx.fillStyle = det.warning ? '#F87171' : '#60A5FA';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText(dtxt, bx + 7, dy + 14);
      }
    });
  }

  // ─── Demo Mode Detections ───────────────────────────────────────────────────
  getSimulatedDetections(mode = CAMERA_MODES.OBJECT) {
    switch (mode) {
      case CAMERA_MODES.OBJECT:
        return [
          { id: 1, label: 'Chair', distance: 0.8, direction: 'Front', confidence: 92, x: 30, y: 35, width: 32, height: 48, color: '#EF4444', warning: true },
          { id: 2, label: 'Table', distance: 1.5, direction: 'Front Right', confidence: 85, x: 58, y: 28, width: 28, height: 38, color: '#2563EB', warning: false }
        ];
      case CAMERA_MODES.OCR:
        return [{ id: 101, text: 'PHARMACY — OPEN 24 HOURS', confidence: 94, x: 18, y: 28, width: 64, height: 22, lang: 'EN' }];
      case CAMERA_MODES.CURRENCY:
        return [{ id: 201, note: '₹500', value: 500, currency: 'INR', label: 'Five Hundred Rupees', confidence: 96, x: 22, y: 28, width: 56, height: 38, color: '#10B981' }];
      case CAMERA_MODES.FACE:
        return [{ id: 301, name: 'Known Person', relation: 'Family', distance: 1.2, confidence: 91, x: 28, y: 18, width: 44, height: 54, color: '#10B981', known: true }];
      case CAMERA_MODES.TRAFFIC:
        return [{ id: 401, signal: 'Red Signal', status: 'STOP', confidence: 97, x: 38, y: 12, width: 24, height: 48, color: '#EF4444', actionPrompt: 'Red Signal. Please Stop.' }];
      default: return [];
    }
  }
}

export const cameraAIService = new CameraAIService();
