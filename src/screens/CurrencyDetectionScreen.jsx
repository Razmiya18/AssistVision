import React, { useState, useEffect, useRef } from 'react';
import { Banknote, CheckCircle, Volume2, ShieldCheck, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { cameraAIService, CAMERA_MODES } from '../services/cameraAIService';
import { voiceService } from '../services/voiceService';

export const CurrencyDetectionScreen = () => {
  const { addHistoryItem } = useApp();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [detectedNote, setDetectedNote] = useState({
    value: '₹500',
    name: 'Five Hundred Rupees',
    color: '#10B981',
    confidence: 98
  });

  const notesList = [
    { value: '₹10', name: 'Ten Rupees', color: '#D97706' },
    { value: '₹20', name: 'Twenty Rupees', color: '#059669' },
    { value: '₹50', name: 'Fifty Rupees', color: '#2563EB' },
    { value: '₹100', name: 'One Hundred Rupees', color: '#7C3AED' },
    { value: '₹200', name: 'Two Hundred Rupees', color: '#EA580C' },
    { value: '₹500', name: 'Five Hundred Rupees', color: '#059669' },
    { value: '₹2000', name: 'Two Thousand Rupees', color: '#DB2777' }
  ];

  useEffect(() => {
    const initCam = async () => {
      if (videoRef.current) {
        await cameraAIService.startCamera(videoRef.current, 'environment');
      }
    };
    initCam();

    const syncCanvas = () => {
      if (canvasRef.current && canvasRef.current.parentElement) {
        canvasRef.current.width = canvasRef.current.parentElement.clientWidth;
        canvasRef.current.height = canvasRef.current.parentElement.clientHeight;
      }
    };
    syncCanvas();
    window.addEventListener('resize', syncCanvas);

    addHistoryItem('Currency', `Scanned ${detectedNote.value} (${detectedNote.name})`);

    const timer = setInterval(() => {
      syncCanvas();
      const simulatedData = cameraAIService.getSimulatedDetections(CAMERA_MODES.CURRENCY);
      if (canvasRef.current) {
        cameraAIService.drawCanvasOverlay(canvasRef.current, simulatedData, CAMERA_MODES.CURRENCY);
      }
    }, 1000);

    return () => {
      window.removeEventListener('resize', syncCanvas);
      clearInterval(timer);
      cameraAIService.stopCamera();
    };
  }, []);

  const simulateScanNote = (noteObj) => {
    setDetectedNote({
      value: noteObj.value,
      name: noteObj.name,
      color: noteObj.color,
      confidence: 99
    });
    voiceService.speak(`${noteObj.name}`);
    voiceService.vibrate(60);
    addHistoryItem('Currency', `Scanned ${noteObj.value}`);
  };

  return (
    <div className="screen-container fade-in">
      
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Banknote size={28} color="#F59E0B" />
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#FFFFFF' }}>
            Currency Scanner
          </h2>
        </div>
        <div className="badge badge-warning">Indian INR</div>
      </div>

      {/* Live Camera Viewport */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '240px',
        borderRadius: '20px',
        overflow: 'hidden',
        background: '#000',
        border: '2px solid #F59E0B',
        marginBottom: '16px'
      }}>
        <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
        <div className="scanner-line" style={{ background: 'linear-gradient(90deg, transparent, #F59E0B, transparent)' }} />
      </div>

      {/* Detected Note Display Card */}
      <div className="m3-card" style={{
        borderLeft: `6px solid ${detectedNote.color}`,
        background: '#0F172A',
        textAlign: 'center',
        padding: '24px'
      }}>
        <div className="badge badge-accent" style={{ marginBottom: '8px' }}>
          <ShieldCheck size={14} /> Genuine Note ({detectedNote.confidence}% Confidence)
        </div>
        
        <h3 style={{ fontSize: '48px', fontWeight: '900', color: '#FFFFFF', letterSpacing: '1px' }}>
          {detectedNote.value}
        </h3>
        
        <p style={{ fontSize: '24px', fontWeight: '800', color: detectedNote.color, marginTop: '4px' }}>
          "{detectedNote.name}"
        </p>

        <button
          onClick={() => voiceService.speak(detectedNote.name)}
          className="touch-btn touch-btn-primary"
          style={{ width: '100%', marginTop: '16px', padding: '14px' }}
        >
          <Volume2 size={20} /> Read Note Value Aloud
        </button>
      </div>

      {/* Note Switcher Test Chips */}
      <p style={{ fontSize: '13px', fontWeight: '700', color: '#94A3B8', marginBottom: '8px' }}>
        SIMULATE SCANNED BANKNOTE:
      </p>

      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
        {notesList.map((n, idx) => (
          <button
            key={idx}
            onClick={() => simulateScanNote(n)}
            style={{
              flex: '0 0 auto',
              background: n.value === detectedNote.value ? n.color : '#0F172A',
              color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '14px',
              padding: '10px 16px',
              fontSize: '16px',
              fontWeight: '800',
              cursor: 'pointer'
            }}
          >
            {n.value}
          </button>
        ))}
      </div>

    </div>
  );
};
