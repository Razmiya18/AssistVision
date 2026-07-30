import React, { useEffect, useState } from 'react';
import { Mic, CheckCircle2, ArrowRight, Eye } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { voiceService } from '../services/voiceService';

export const VoiceCalibrationScreen = () => {
  const { markActivated } = useApp();
  const [activated, setActivated] = useState(false);
  const [isListening, setIsListening] = useState(true);

  useEffect(() => {
    // Speak setup message once only
    setTimeout(() => {
      voiceService.speak("Say: Activate to start.");
    }, 800);

    // Use background listening to detect wake phrase here too
    voiceService.startBackgroundListening({
      onWake: () => triggerSuccess(),
      onDeactivate: () => {},
      onCommand: (text) => {
        if (text.includes('activate') || text.includes('start') || text.includes('turn on')) {
          triggerSuccess();
          return true;
        }
        return false;
      },
      onStateChange: (v) => setIsListening(v)
    });

    return () => {}; // keep listening
  }, []);

  const triggerSuccess = () => {
    if (activated) return;
    setActivated(true);
    voiceService.playActivationBeep();
    voiceService.speak("Welcome to AssistVision. I'm listening.", true);
    voiceService.vibrate([100, 50, 200]);
    setTimeout(() => markActivated(), 1800);
  };

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'space-between',
      padding: '32px 20px', textAlign: 'center',
      background: 'radial-gradient(ellipse at top, rgba(37,99,235,0.12) 0%, transparent 60%), #060912'
    }}>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '14px',
          background: 'linear-gradient(135deg, #2563EB, #10B981)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Eye size={26} color="#FFF" />
        </div>
        <div style={{ textAlign: 'left' }}>
          <p style={{ fontSize: '22px', fontWeight: '900', color: '#FFF', lineHeight: 1 }}>AssistVision</p>
          <p style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>AI Vision Companion</p>
        </div>
      </div>

      {/* Center area */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px' }}>

        {/* One-time setup label */}
        <div className="badge badge-primary" style={{ fontSize: '13px', padding: '8px 16px' }}>
          One-Time Voice Setup
        </div>

        <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#FFF', lineHeight: 1.2 }}>
          Activate Your Assistant
        </h2>

        {/* Animated ring + mic */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {!activated && (
            <>
              <div style={{ position: 'absolute', width: '180px', height: '180px', borderRadius: '50%', border: '2px solid rgba(37,99,235,0.3)', animation: 'splashRing 2s infinite' }} />
              <div style={{ position: 'absolute', width: '155px', height: '155px', borderRadius: '50%', border: '2px solid rgba(37,99,235,0.5)', animation: 'splashRing 2s infinite 0.5s' }} />
            </>
          )}
          <button
            onClick={triggerSuccess}
            aria-label="Activate AssistVision"
            style={{
              width: '130px', height: '130px', borderRadius: '50%',
              background: activated ? 'rgba(16,185,129,0.2)' : 'rgba(37,99,235,0.15)',
              border: `2px solid ${activated ? '#10B981' : '#2563EB'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: activated ? '0 0 40px rgba(16,185,129,0.4)' : '0 0 30px rgba(37,99,235,0.3)',
              transition: 'all 0.4s ease',
              cursor: 'pointer', outline: 'none'
            }}
          >
            {activated
              ? <CheckCircle2 size={60} color="#10B981" />
              : <Mic size={60} color="#2563EB" />}
          </button>
        </div>

        {/* Sound wave */}
        {!activated && (
          <div className="soundwave">
            {[...Array(7)].map((_, i) => <div key={i} className="wave-bar" />)}
          </div>
        )}

        {/* Status text */}
        <p style={{ fontSize: '16px', fontWeight: '700', color: activated ? '#10B981' : '#60A5FA' }}>
          {activated ? '✓ AssistVision Activated!' : 'Listening for your voice...'}
        </p>

        {/* Wake phrase display */}
        {!activated && (
          <div className="glass-card" style={{ padding: '18px 28px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: '#475569', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Say this phrase:</p>
            <p style={{ fontSize: '22px', fontWeight: '900', color: '#60A5FA' }}>
              "Activate AssistVision"
            </p>
          </div>
        )}
      </div>

      {/* Skip / Quick start */}
      {!activated && (
        <button
          className="touch-btn touch-btn-primary"
          onClick={triggerSuccess}
          style={{ width: '100%', maxWidth: '380px', padding: '18px', fontSize: '18px' }}
        >
          <ArrowRight size={22} /> Activate Now
        </button>
      )}
    </div>
  );
};
