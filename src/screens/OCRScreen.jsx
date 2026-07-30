import React, { useState, useEffect, useRef } from 'react';
import { FileText, Volume2, Languages, Pause, Play, RefreshCw, Copy, Check, Eye, Loader2, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { cameraAIService, CAMERA_MODES } from '../services/cameraAIService';
import { tesseractService } from '../services/tesseractService';
import { voiceService } from '../services/voiceService';

export const OCRScreen = () => {
  const { addHistoryItem } = useApp();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [extractedText, setExtractedText] = useState('');
  const [ocrWords, setOcrWords] = useState([]);
  const [confidence, setConfidence] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [ocrStatus, setOcrStatus] = useState('idle'); // 'idle' | 'loading_engine' | 'scanning' | 'ready'
  const [ocrProgress, setOcrProgress] = useState(0);
  const [lastStableText, setLastStableText] = useState('');
  const [stableCount, setStableCount] = useState(0);
  const scanIntervalRef = useRef(null);

  useEffect(() => {
    // Start camera
    const initCam = async () => {
      if (videoRef.current) {
        await cameraAIService.startCamera(videoRef.current, 'environment');
      }
    };
    initCam();

    // Initialize Tesseract OCR engine
    setOcrStatus('loading_engine');
    tesseractService.init((progress) => setOcrProgress(progress));
    tesseractService.onReady(() => {
      setOcrStatus('ready');
    });

    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      cameraAIService.stopCamera();
    };
  }, []);

  // Scanning loop — starts when Tesseract is ready
  useEffect(() => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);

    if (ocrStatus !== 'ready' && !demoMode) return;

    scanIntervalRef.current = setInterval(async () => {
      if (demoMode) {
        const demoTxt = 'PHARMACY — OPEN 24 HOURS. EMERGENCY ENTRANCE 50M AHEAD.';
        setExtractedText(demoTxt);
        setConfidence(99);
        setOcrWords([{ text: 'PHARMACY', confidence: 99 }, { text: '24 HOURS', confidence: 97 }]);
        return;
      }

      setOcrStatus('scanning');

      // Draw canvas overlay (pixel detection)
      const pixelDets = cameraAIService.analyzeLiveVideoFrame(videoRef.current, CAMERA_MODES.OCR);
      if (canvasRef.current) {
        cameraAIService.drawCanvasOverlay(canvasRef.current, pixelDets, CAMERA_MODES.OCR);
      }

      // Real Tesseract OCR
      if (tesseractService.isEngineReady()) {
        const result = await tesseractService.extractTextFromVideo(videoRef.current);

        if (result.text && result.text.length > 2) {
          setExtractedText(result.text);
          setConfidence(result.confidence);
          setOcrWords(result.words || []);

          // Auto-speak once text is stable for 2 consecutive scans
          if (result.text === lastStableText) {
            setStableCount(prev => {
              const next = prev + 1;
              if (next === 2 && result.text) {
                voiceService.speak(`Text detected: ${result.text}`, false);
                addHistoryItem('OCR', result.text.slice(0, 80));
              }
              return next;
            });
          } else {
            setLastStableText(result.text);
            setStableCount(0);
          }
        } else {
          setExtractedText('');
          setConfidence(0);
          setOcrWords([]);
          setStableCount(0);
        }
      }

      setOcrStatus('ready');
    }, 1800); // every 1.8s to not overload CPU

    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, [ocrStatus, demoMode, lastStableText]);

  const handleReadAloud = () => {
    if (!extractedText) {
      voiceService.speak('No text detected to read.', true);
      return;
    }
    voiceService.speak(extractedText, true);
    setIsReading(true);
    setTimeout(() => setIsReading(false), extractedText.length * 60);
  };

  const handlePauseResume = () => {
    if (isReading) {
      voiceService.stopSpeaking();
      setIsReading(false);
    } else {
      handleReadAloud();
    }
  };

  const confidenceColor = confidence >= 80 ? '#10B981' : confidence >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <div className="screen-container fade-in">

      {/* Title Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileText size={28} color="#38BDF8" />
          <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#FFFFFF' }}>OCR Text Reader</h2>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Engine Status Badge */}
          {ocrStatus === 'loading_engine' && (
            <div className="badge badge-warning" style={{ gap: '6px' }}>
              <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
              Loading OCR {ocrProgress}%
            </div>
          )}
          {ocrStatus === 'ready' && (
            <div className="badge badge-accent">
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
              Engine Ready
            </div>
          )}

          <button
            onClick={() => setDemoMode(d => !d)}
            className="touch-btn touch-btn-outline"
            style={{ minHeight: '36px', padding: '6px 12px', fontSize: '13px', border: demoMode ? '1px solid #F59E0B' : '1px solid #10B981' }}
          >
            <Eye size={14} color={demoMode ? '#F59E0B' : '#10B981'} />
            {demoMode ? 'Demo Mode' : 'Live OCR'}
          </button>
        </div>
      </div>

      {/* Camera Viewport */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '240px',
        borderRadius: '20px',
        overflow: 'hidden',
        background: '#000',
        border: '2px solid rgba(56,189,248,0.5)',
        marginBottom: '16px',
        boxShadow: '0 0 24px rgba(56,189,248,0.15)'
      }}>
        <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <canvas ref={canvasRef} width={640} height={240} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
        <div className="scanner-line" />

        {/* Corner label */}
        <div className="badge badge-primary" style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '12px' }}>
          {ocrStatus === 'scanning' ? (
            <><Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> Scanning...</>
          ) : 'OCR Active'}
        </div>
      </div>

      {/* Extracted Text Result */}
      <div className="m3-card" style={{ borderLeft: '5px solid #38BDF8', background: '#0D1526', minHeight: '120px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Extracted Text
            </span>
            {confidence > 0 && (
              <span style={{ fontSize: '12px', fontWeight: '700', color: confidenceColor }}>
                {confidence}% confidence
              </span>
            )}
          </div>
          {extractedText && (
            <button
              onClick={() => { navigator.clipboard.writeText(extractedText); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
            >
              {copied ? <Check size={18} color="#10B981" /> : <Copy size={18} />}
            </button>
          )}
        </div>

        {extractedText ? (
          <>
            <p style={{ fontSize: '20px', fontWeight: '800', color: '#FFFFFF', lineHeight: '1.45', marginBottom: '10px' }}>
              "{extractedText}"
            </p>
            {/* Word confidence pills */}
            {ocrWords.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {ocrWords.slice(0, 12).map((w, i) => (
                  <span key={i} style={{
                    fontSize: '12px',
                    padding: '3px 8px',
                    borderRadius: '20px',
                    background: w.confidence >= 80 ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                    color: w.confidence >= 80 ? '#34D399' : '#FBBF24',
                    fontWeight: '600'
                  }}>{w.text}</span>
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0' }}>
            <AlertCircle size={20} color="#475569" />
            <p style={{ fontSize: '16px', color: '#475569', fontStyle: 'italic' }}>
              {ocrStatus === 'loading_engine'
                ? `Loading OCR engine... ${ocrProgress}%`
                : 'Point camera at printed text, signs, or documents...'}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        <button onClick={handleReadAloud} className="touch-btn touch-btn-primary" style={{ padding: '14px 8px', fontSize: '15px' }}>
          <Volume2 size={18} /> Read Text
        </button>
        <button
          onClick={() => {
            voiceService.speak('Translation feature requires backend API. Connect to AssistVision backend to enable.');
          }}
          className="touch-btn touch-btn-accent"
          style={{ padding: '14px 8px', fontSize: '15px' }}
        >
          <Languages size={18} /> Translate
        </button>
        <button onClick={handlePauseResume} className="touch-btn touch-btn-outline" style={{ padding: '14px 8px', fontSize: '15px' }}>
          {isReading ? <Pause size={18} /> : <Play size={18} />} {isReading ? 'Pause' : 'Resume'}
        </button>
      </div>

    </div>
  );
};
