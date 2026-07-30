import React, { useState, useEffect, useRef } from 'react';
import { TrafficCone, ShieldAlert, Volume2, Footprints, AlertOctagon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { cameraAIService, CAMERA_MODES } from '../services/cameraAIService';
import { voiceService } from '../services/voiceService';

export const TrafficSignalScreen = () => {
  const { addHistoryItem } = useApp();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [signalState, setSignalState] = useState('RED'); // 'RED', 'YELLOW', 'GREEN'

  const signalsInfo = {
    RED: {
      title: 'Red Signal',
      subtitle: 'PLEASE STOP IMMEDIATELY',
      prompt: 'Red Signal. Please Stop.',
      color: '#EF4444',
      bgGlow: 'rgba(239, 68, 68, 0.4)',
      vibrate: [300, 100, 300]
    },
    YELLOW: {
      title: 'Yellow Signal',
      subtitle: 'CAUTION - PREPARE TO STOP',
      prompt: 'Yellow Signal. Caution.',
      color: '#F59E0B',
      bgGlow: 'rgba(245, 158, 11, 0.4)',
      vibrate: [150]
    },
    GREEN: {
      title: 'Green Signal',
      subtitle: 'SAFE TO WALK NOW',
      prompt: 'Green Signal. You May Walk.',
      color: '#10B981',
      bgGlow: 'rgba(16, 185, 129, 0.4)',
      vibrate: [500]
    }
  };

  useEffect(() => {
    const initCam = async () => {
      if (videoRef.current) {
        await cameraAIService.startCamera(videoRef.current, 'environment');
      }
    };
    initCam();

    // Initial alert
    triggerSignalAlert('RED');

    const timer = setInterval(() => {
      const simulatedData = cameraAIService.getSimulatedDetections(CAMERA_MODES.TRAFFIC);
      if (canvasRef.current) {
        cameraAIService.drawCanvasOverlay(canvasRef.current, simulatedData, CAMERA_MODES.TRAFFIC);
      }
    }, 1000);

    return () => {
      clearInterval(timer);
      cameraAIService.stopCamera();
    };
  }, []);

  const triggerSignalAlert = (state) => {
    setSignalState(state);
    const info = signalsInfo[state];
    voiceService.speak(info.prompt, true);
    voiceService.vibrate(info.vibrate);
    addHistoryItem('Traffic Signal', info.prompt);
  };

  const currentInfo = signalsInfo[signalState];

  return (
    <div className="screen-container">
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrafficCone size={28} color="#EC4899" />
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#FFFFFF' }}>
            Traffic Signal Detector
          </h2>
        </div>
        <div className="badge badge-danger">Crosswalk AI</div>
      </div>

      {/* Live Camera Viewport */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '180px',
        borderRadius: '20px',
        overflow: 'hidden',
        background: '#000',
        border: `2px solid ${currentInfo.color}`,
        marginBottom: '16px'
      }}>
        <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <canvas ref={canvasRef} width={440} height={180} style={{ position: 'absolute', inset: 0 }} />
      </div>

      {/* Traffic Signal Main Status Card */}
      <div className="m3-card" style={{
        background: '#0F172A',
        border: `3px solid ${currentInfo.color}`,
        boxShadow: `0 0 30px ${currentInfo.bgGlow}`,
        textAlign: 'center',
        padding: '24px'
      }}>
        {/* Traffic Light Dots */}
        <div style={{
          display: 'inline-flex',
          gap: '16px',
          background: '#070A14',
          padding: '12px 24px',
          borderRadius: '30px',
          border: '1px solid rgba(255,255,255,0.1)',
          marginBottom: '16px'
        }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: signalState === 'RED' ? '#EF4444' : '#331111', boxShadow: signalState === 'RED' ? '0 0 15px #EF4444' : 'none' }} />
          <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: signalState === 'YELLOW' ? '#F59E0B' : '#332211', boxShadow: signalState === 'YELLOW' ? '0 0 15px #F59E0B' : 'none' }} />
          <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: signalState === 'GREEN' ? '#10B981' : '#113322', boxShadow: signalState === 'GREEN' ? '0 0 15px #10B981' : 'none' }} />
        </div>

        <h3 style={{ fontSize: '32px', fontWeight: '900', color: currentInfo.color }}>
          {currentInfo.title}
        </h3>
        
        <p style={{ fontSize: '20px', fontWeight: '800', color: '#FFFFFF', marginTop: '6px' }}>
          "{currentInfo.subtitle}"
        </p>

        <button
          onClick={() => voiceService.speak(currentInfo.prompt, true)}
          className="touch-btn touch-btn-primary"
          style={{ width: '100%', marginTop: '16px', padding: '14px' }}
        >
          <Volume2 size={20} /> Repeat Safety Alert
        </button>
      </div>

      {/* Manual Switcher for Testing */}
      <p style={{ fontSize: '13px', fontWeight: '700', color: '#94A3B8', marginBottom: '8px' }}>
        SIMULATE TRAFFIC SIGNAL STATE:
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        <button
          onClick={() => triggerSignalAlert('RED')}
          className="touch-btn touch-btn-danger"
          style={{ padding: '12px 6px', fontSize: '14px' }}
        >
          <AlertOctagon size={16} /> Red (Stop)
        </button>

        <button
          onClick={() => triggerSignalAlert('YELLOW')}
          style={{ background: '#F59E0B', color: '#000', padding: '12px 6px', fontSize: '14px', borderRadius: '16px', fontWeight: '800', border: 'none', cursor: 'pointer' }}
        >
          Yellow (Wait)
        </button>

        <button
          onClick={() => triggerSignalAlert('GREEN')}
          className="touch-btn touch-btn-accent"
          style={{ padding: '12px 6px', fontSize: '14px' }}
        >
          <Footprints size={16} /> Green (Walk)
        </button>
      </div>

    </div>
  );
};
