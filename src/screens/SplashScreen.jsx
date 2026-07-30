import React, { useState, useEffect } from 'react';
import { Eye, Activity, Zap, WifiOff, Wifi, BatteryLow, BatteryFull, BatteryMedium, Navigation, MapPin } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { voiceService } from '../services/voiceService';

export const SplashScreen = () => {
  const { isActivated, setCurrentScreen, markActivated } = useApp();
  const [phase, setPhase] = useState('logo'); // 'logo' → 'loading' → 'ready'
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing AssistVision...');

  const loadingSteps = [
    { pct: 15, text: 'Loading Vision Engine...' },
    { pct: 35, text: 'Initializing Voice Assistant...' },
    { pct: 55, text: 'Calibrating OCR System...' },
    { pct: 72, text: 'Setting up GPS & Sensors...' },
    { pct: 88, text: 'Loading Safety Modules...' },
    { pct: 100, text: 'AssistVision Ready!' }
  ];

  useEffect(() => {
    // Start listening immediately on splash screen mount
    voiceService.startBackgroundListening({
      onWake: () => {
        markActivated();
        voiceService.playActivationBeep();
        voiceService.speak("Welcome to AssistVision. I'm listening.", true);
        setCurrentScreen('home');
      },
      onDeactivate: () => {},
      onCommand: (text) => {
        if (text.includes('activate') || text.includes('start')) {
          markActivated();
          voiceService.playActivationBeep();
          voiceService.speak("Welcome to AssistVision. I'm listening.", true);
          setCurrentScreen('home');
          return true;
        }
        return false;
      }
    });

    // Phase 1: Logo reveal (1.2s)
    const t1 = setTimeout(() => setPhase('loading'), 1200);

    // Phase 2: Progress simulation
    let stepIndex = 0;
    const t2 = setInterval(() => {
      if (stepIndex < loadingSteps.length) {
        setProgress(loadingSteps[stepIndex].pct);
        setStatusText(loadingSteps[stepIndex].text);
        stepIndex++;
      } else {
        clearInterval(t2);
      }
    }, 380);

    // Phase 3: Navigate
    const t3 = setTimeout(() => {
      if (isActivated) {
        voiceService.speak('Welcome back to AssistVision.');
        setCurrentScreen('home');
      } else {
        setCurrentScreen('calibration');
      }
    }, 3800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t3);
      clearInterval(t2);
    };
  }, []);

  const handleSkip = () => {
    markActivated();
    voiceService.speak('Welcome to AssistVision.');
    setCurrentScreen('home');
  };

  return (
    <div
      className="hero-bg"
      onClick={handleSkip}
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer'
      }}
    >
      {/* Background particle dots */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: `${4 + (i % 4) * 3}px`,
            height: `${4 + (i % 4) * 3}px`,
            borderRadius: '50%',
            background: i % 3 === 0 ? 'rgba(37,99,235,0.4)' : i % 3 === 1 ? 'rgba(16,185,129,0.35)' : 'rgba(139,92,246,0.3)',
            top: `${8 + (i * 7) % 85}%`,
            left: `${5 + (i * 11) % 90}%`,
            animation: `dotPulse ${1.5 + (i % 4) * 0.5}s infinite`,
            animationDelay: `${(i * 0.3) % 2}s`
          }}
        />
      ))}

      {/* Logo Ring */}
      <div
        className="splash-logo-ring"
        style={{
          width: '160px',
          height: '160px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(37,99,235,0.2), rgba(16,185,129,0.15))',
          border: '2px solid rgba(37,99,235,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '32px',
          animation: `${phase === 'logo' ? 'fadeIn 0.8s ease forwards' : 'splashRing 2s ease-in-out infinite alternate'}`
        }}
      >
        <div style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 40px rgba(37,99,235,0.6)'
        }}>
          <Eye size={56} color="#FFFFFF" strokeWidth={1.5} />
        </div>
      </div>

      {/* Brand Name */}
      <h1
        className="gradient-text"
        style={{
          fontSize: '46px',
          fontWeight: '900',
          letterSpacing: '-1px',
          marginBottom: '8px',
          animation: 'fadeIn 1s ease 0.3s both'
        }}
      >
        AssistVision
      </h1>

      <p style={{
        fontSize: '18px',
        color: '#64748B',
        fontWeight: '600',
        marginBottom: '52px',
        animation: 'fadeIn 1s ease 0.6s both'
      }}>
        AI Vision Companion · Powered by Real Camera AI
      </p>

      {/* Loading Progress */}
      {phase !== 'logo' && (
        <div style={{ width: 'min(340px, 85vw)', animation: 'fadeIn 0.5s ease both' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', color: '#64748B', fontWeight: '600' }}>{statusText}</span>
            <span style={{ fontSize: '14px', color: '#3B82F6', fontWeight: '700' }}>{progress}%</span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Version */}
      <p style={{
        position: 'absolute',
        bottom: '24px',
        fontSize: '13px',
        color: '#334155',
        fontWeight: '600',
        letterSpacing: '1px'
      }}>
        v2.0 · For Visually Impaired Users
      </p>
    </div>
  );
};
