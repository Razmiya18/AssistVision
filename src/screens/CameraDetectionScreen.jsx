import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  RefreshCw, AlertTriangle, Box, FileText, Banknote,
  UserCheck, TrafficCone, CheckCircle2, Eye, Gauge
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { cameraAIService, CAMERA_MODES } from '../services/cameraAIService';
import { voiceService } from '../services/voiceService';

export const CameraDetectionScreen = () => {
  const { cameraMode, setCameraMode, facingMode, setFacingMode, addHistoryItem, isCameraOpen } = useApp();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const loopRef = useRef(null);

  const [detections, setDetections] = useState([]);
  const [hasWarning, setHasWarning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [fps, setFps] = useState(0);
  const fpsCountRef = useRef(0);
  const fpsTimerRef = useRef(Date.now());

  // Sync canvas to video container
  const syncCanvas = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const w = videoRef.current.clientWidth, h = videoRef.current.clientHeight;
    if (w > 0 && h > 0) { canvasRef.current.width = w; canvasRef.current.height = h; }
  }, []);

  useEffect(() => {
    // Start camera only if camera is allowed (isCameraOpen flag)
    const initCam = async () => {
      if (videoRef.current) {
        const r = await cameraAIService.startCamera(videoRef.current, facingMode);
        setCameraActive(r.success);
        if (r.success) setTimeout(syncCanvas, 400);
      }
    };
    initCam();

    // ResizeObserver
    let obs;
    if (containerRef.current && window.ResizeObserver) {
      obs = new ResizeObserver(syncCanvas);
      obs.observe(containerRef.current);
    }

    // Detection loop — runs every 600ms
    const runLoop = () => {
      const dets = cameraAIService.analyzeLiveVideoFrame(videoRef.current, cameraMode);
      setDetections(dets);

      // FPS counter
      fpsCountRef.current++;
      const now = Date.now();
      if (now - fpsTimerRef.current >= 1000) {
        setFps(fpsCountRef.current);
        fpsCountRef.current = 0;
        fpsTimerRef.current = now;
      }

      // Warning state
      const warn = dets.some(d => d.warning);
      setHasWarning(warn);

      // Smart announcement — only announce critical safety warnings automatically
      const announcement = cameraAIService.getAnnouncementIfChanged(dets);
      if (announcement && announcement.startsWith('WARNING')) {
        voiceService.speak(announcement, true);
        addHistoryItem('Detection Warning', announcement);
      }

      // Canvas overlay
      syncCanvas();
      if (canvasRef.current) {
        cameraAIService.drawCanvasOverlay(canvasRef.current, dets, cameraMode);
      }

      loopRef.current = setTimeout(runLoop, 600);
    };

    runLoop();

    return () => {
      clearTimeout(loopRef.current);
      cameraAIService.stopCamera();
      if (obs) obs.disconnect();
    };
  }, [cameraMode, facingMode, syncCanvas]);

  const modeTabs = [
    { id: CAMERA_MODES.OBJECT, label: 'Objects', icon: Box, color: '#10B981' },
    { id: CAMERA_MODES.OCR, label: 'Text', icon: FileText, color: '#38BDF8' },
    { id: CAMERA_MODES.CURRENCY, label: 'Currency', icon: Banknote, color: '#F59E0B' },
    { id: CAMERA_MODES.FACE, label: 'Face', icon: UserCheck, color: '#8B5CF6' },
    { id: CAMERA_MODES.TRAFFIC, label: 'Traffic', icon: TrafficCone, color: '#EC4899' }
  ];

  return (
    <div className="screen-container fade-in" style={{ padding: '12px', paddingBottom: '90px' }}>

      {/* Mode Tabs */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '10px', paddingBottom: '2px' }}>
        {modeTabs.map(tab => {
          const Icon = tab.icon;
          const active = cameraMode === tab.id;
          return (
            <button key={tab.id}
              onClick={() => { setCameraMode(tab.id); voiceService.speak(`${tab.label} mode.`, true); }}
              style={{
                background: active ? tab.color : 'rgba(13,21,38,0.9)',
                color: '#FFF', border: `1px solid ${active ? tab.color : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '14px', padding: '8px 14px', fontSize: '14px', fontWeight: '700',
                display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', whiteSpace: 'nowrap',
                boxShadow: active ? `0 0 12px ${tab.color}55` : 'none', transition: 'all 0.2s'
              }}
            >
              <Icon size={15} /> {tab.label}
            </button>
          );
        })}
        <button
          onClick={() => { const n = facingMode === 'environment' ? 'user' : 'environment'; setFacingMode(n); voiceService.speak(n === 'user' ? 'Front camera.' : 'Rear camera.', true); }}
          style={{ background: 'rgba(13,21,38,0.9)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '8px 14px', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          <RefreshCw size={14} /> Flip
        </button>
      </div>

      {/* Camera + Detections Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', alignItems: 'start' }}>

        {/* Camera Viewport */}
        <div ref={containerRef} style={{
          position: 'relative', width: '100%', height: '360px',
          borderRadius: '20px', overflow: 'hidden', background: '#000',
          border: hasWarning ? '3px solid #EF4444' : '2px solid rgba(37,99,235,0.4)',
          boxShadow: hasWarning ? '0 0 28px rgba(239,68,68,0.5)' : '0 8px 24px rgba(0,0,0,0.5)',
          transition: 'border-color 0.2s, box-shadow 0.2s'
        }}>
          {hasWarning && <div className="proximity-warning-border" />}
          <div className="scanner-line" />
          <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', width: '100%', height: '100%' }} />

          {/* Overlaid Status */}
          <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', display: 'flex', justifyContent: 'space-between', zIndex: 10 }}>
            <div className={`badge ${hasWarning ? 'badge-danger' : 'badge-accent'}`}>
              {hasWarning ? <AlertTriangle size={12} /> : <Eye size={12} />}
              {hasWarning ? 'WARNING' : 'LIVE'}
            </div>
            <div style={{ background: 'rgba(7,10,20,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '4px 8px', fontSize: '12px', fontWeight: '700', color: fps > 0 ? '#10B981' : '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Gauge size={11} /> {fps} FPS
            </div>
          </div>
        </div>

        {/* Detections Panel */}
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#FFFFFF', marginBottom: '10px' }}>
            Detections <span style={{ color: '#475569', fontSize: '15px' }}>({detections.length})</span>
          </h3>

          {detections.length === 0 ? (
            <div className="glass-card" style={{ padding: '28px', textAlign: 'center', borderLeft: '4px solid #10B981' }}>
              <CheckCircle2 size={44} color="#10B981" style={{ margin: '0 auto 10px' }} />
              <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#FFFFFF' }}>Path Clear</h4>
              <p style={{ fontSize: '14px', color: '#475569', marginTop: '4px' }}>No obstacles detected.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {detections.map((det, i) => {
                const warn = det.warning || (det.distance && det.distance <= 1.0);
                return (
                  <div key={det.id} className="m3-card" style={{
                    marginBottom: 0, padding: '14px 16px',
                    borderLeft: `5px solid ${warn ? '#EF4444' : '#2563EB'}`,
                    background: warn ? 'rgba(239,68,68,0.07)' : i === 0 ? 'rgba(37,99,235,0.07)' : '#0D1526',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    animation: 'fadeIn 0.3s ease'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <span style={{ fontSize: '18px', fontWeight: '900', color: '#FFFFFF' }}>
                          {det.label}
                        </span>
                        {warn && <span className="badge badge-danger" style={{ fontSize: '10px', padding: '2px 6px' }}>TOO CLOSE</span>}
                        {i === 0 && !warn && <span className="badge badge-primary" style={{ fontSize: '10px', padding: '2px 6px' }}>NEAREST</span>}
                      </div>
                      <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
                        <strong style={{ color: '#94A3B8' }}>{det.direction}</strong>
                        {' · '}{det.confidence}% confidence
                      </p>
                    </div>
                    {det.distance && (
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '24px', fontWeight: '900', color: warn ? '#F87171' : '#60A5FA' }}>
                          {det.distance}m
                        </span>
                        <p style={{ fontSize: '10px', color: '#475569', fontWeight: '700' }}>DISTANCE</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
