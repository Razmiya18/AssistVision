import React, { useState, useEffect } from 'react';
import { ArrowLeft, Eye, Mic, MicOff, Wifi, WifiOff, Battery, BatteryFull, BatteryMedium, BatteryLow, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { voiceService } from '../services/voiceService';

const SCREEN_TITLES = {
  home: 'AssistVision',
  camera: 'Object Detection',
  navigation: 'Navigation',
  ocr: 'Text Reader',
  currency: 'Currency',
  face: 'Face Recognition',
  traffic: 'Traffic Signal',
  objects: 'Object Detection',
  sos: 'Emergency SOS',
  settings: 'Settings',
  commands: 'Voice Commands',
  history: 'History',
  dashboard: 'Dashboard'
};

export const NavigationHeader = () => {
  const {
    currentScreen, setCurrentScreen,
    isWakeActive, assistantStatus, toggleWakeActive,
    batteryLevel, batteryCharging, isOnline
  } = useApp();

  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const canGoBack = currentScreen !== 'home';
  const statusColor = assistantStatus === 'listening' ? '#10B981'
    : assistantStatus === 'processing' ? '#F59E0B'
    : isWakeActive ? '#2563EB' : '#334155';

  const BattIcon = batteryLevel > 60 ? BatteryFull : batteryLevel > 25 ? BatteryMedium : BatteryLow;
  const battColor = batteryLevel > 60 ? '#60A5FA' : batteryLevel > 25 ? '#F59E0B' : '#EF4444';

  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 16px',
      background: 'rgba(7,10,20,0.92)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      minHeight: '52px', flexShrink: 0, gap: '8px', zIndex: 50
    }}>
      {/* Left: Back / Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
        {canGoBack ? (
          <button
            onClick={() => setCurrentScreen('home')}
            aria-label="Back to Home"
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px', color: '#FFF', width: '34px', height: '34px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0
            }}
          >
            <ArrowLeft size={17} />
          </button>
        ) : (
          <div style={{
            width: '30px', height: '30px', borderRadius: '9px',
            background: 'linear-gradient(135deg, #2563EB, #10B981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Eye size={16} color="#FFF" />
          </div>
        )}
        <h1 style={{
          fontSize: '16px', fontWeight: '900', color: '#FFF',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2
        }}>
          {SCREEN_TITLES[currentScreen] || 'AssistVision'}
        </h1>
      </div>

      {/* Right: status indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        {/* Time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={12} color="#475569" />
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#94A3B8' }}>
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        {/* Network */}
        {isOnline ? <Wifi size={13} color="#10B981" /> : <WifiOff size={13} color="#EF4444" />}
        {/* Battery */}
        {batteryLevel !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <BattIcon size={13} color={battColor} />
            <span style={{ fontSize: '11px', fontWeight: '700', color: battColor }}>{batteryLevel}%</span>
          </div>
        )}
        {/* Voice status button */}
        <button
          onClick={toggleWakeActive}
          style={{
            background: 'transparent', border: 'none', padding: '4px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', outline: 'none'
          }}
          aria-label={isWakeActive ? 'Voice assistant active (click to pause)' : 'Voice assistant paused (click to activate)'}
          title={isWakeActive ? 'Voice Active - Click to pause' : 'Voice Paused - Click to activate'}
        >
          <div style={{
            width: '12px', height: '12px', borderRadius: '50%',
            background: statusColor,
            boxShadow: isWakeActive ? `0 0 10px ${statusColor}` : 'none',
            transition: 'background 0.3s, box-shadow 0.3s',
            animation: assistantStatus === 'listening' ? 'pulse 1s infinite alternate' : 'none'
          }} />
        </button>
      </div>
    </header>
  );
};
