import React, { useEffect, useState } from 'react';
import {
  Mic, MicOff, Wifi, WifiOff, Battery, BatteryFull, BatteryMedium, BatteryLow,
  MapPin, Clock, Compass, CheckCircle2, AlertTriangle, Volume2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { voiceService } from '../services/voiceService';

const STATUS = {
  idle: {
    label: 'Say "Activate" to start',
    sublabel: 'Listening for wake phrase (no tapping needed)...',
    color: '#2563EB',
    ringColor: 'rgba(37,99,235,0.25)',
    ringGlow: '0 0 0 rgba(37,99,235,0)'
  },
  listening: {
    label: "I'm listening",
    sublabel: 'Speak your command',
    color: '#10B981',
    ringColor: 'rgba(16,185,129,0.25)',
    ringGlow: '0 0 40px rgba(16,185,129,0.4)'
  },
  processing: {
    label: 'Processing...',
    sublabel: '',
    color: '#F59E0B',
    ringColor: 'rgba(245,158,11,0.2)',
    ringGlow: '0 0 30px rgba(245,158,11,0.3)'
  },
  speaking: {
    label: 'Speaking',
    sublabel: '',
    color: '#38BDF8',
    ringColor: 'rgba(56,189,248,0.2)',
    ringGlow: '0 0 30px rgba(56,189,248,0.3)'
  }
};

const BattIcon = ({ level, charging }) => {
  if (level === null) return <Battery size={13} color="#475569" />;
  if (level > 60) return <BatteryFull size={13} color={charging ? '#10B981' : '#60A5FA'} />;
  if (level > 25) return <BatteryMedium size={13} color="#F59E0B" />;
  return <BatteryLow size={13} color="#EF4444" />;
};

export const HomeScreen = () => {
  const {
    isWakeActive, assistantStatus, lastCommand, toggleWakeActive,
    batteryLevel, batteryCharging, gpsCoords, isOnline, compassHeading,
    history, setCurrentScreen
  } = useApp();

  const [time, setTime] = useState(new Date());
  const status = STATUS[assistantStatus] || STATUS.idle;
  const compassDirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const compassDir = compassHeading !== null ? compassDirs[Math.round(compassHeading / 45) % 8] : null;

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      minHeight: '100%',
      padding: '16px 16px 110px',
      gap: '16px',
      background: 'radial-gradient(ellipse at center top, rgba(37,99,235,0.10) 0%, transparent 60%), #060912',
      overflowY: 'auto'
    }}>

      {/* ── Top Status Bar ──────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', maxWidth: '600px',
        background: 'rgba(13,21,38,0.7)',
        backdropFilter: 'blur(12px)',
        borderRadius: '16px',
        padding: '10px 16px',
        border: '1px solid rgba(255,255,255,0.08)',
        flexWrap: 'wrap', gap: '8px',
        marginBottom: '10px', flexShrink: 0
      }}>
        {/* Time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#94A3B8' }}>
          <Clock size={13} />
          <span style={{ fontSize: '14px', fontWeight: '700' }}>
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        {/* GPS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <MapPin size={13} color={gpsCoords ? '#10B981' : '#475569'} />
          <span style={{ fontSize: '12px', fontWeight: '600', color: gpsCoords ? '#34D399' : '#475569' }}>
            {gpsCoords ? `${gpsCoords.lat}, ${gpsCoords.lon}` : 'GPS...'}
          </span>
        </div>
        {/* Compass */}
        {compassDir && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Compass size={13} color="#60A5FA" style={{ transform: `rotate(${compassHeading}deg)`, transition: 'transform 0.5s' }} />
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#60A5FA' }}>{compassDir} {compassHeading}°</span>
          </div>
        )}
        {/* Network */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span className={`status-dot ${isOnline ? 'status-dot-online' : 'status-dot-offline'}`} />
          {isOnline ? <Wifi size={13} color="#10B981" /> : <WifiOff size={13} color="#EF4444" />}
        </div>
        {/* Battery */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <BattIcon level={batteryLevel} charging={batteryCharging} />
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#94A3B8' }}>
            {batteryLevel !== null ? `${batteryLevel}%` : '--'}
          </span>
        </div>
      </div>

      {/* ── Central Voice Indicator ──────────────────────────────────── */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '16px', width: '100%', maxWidth: '600px', margin: 'auto 0'
      }}>

        {/* Pulsing Ring Container with Controlled Dimensions */}
        <div style={{
          position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '180px', height: '180px', margin: '8px 0'
        }}>

          {/* Outer pulse ring — nicely constrained */}
          {isWakeActive && (
            <>
              <div style={{
                position: 'absolute',
                width: '170px', height: '170px',
                borderRadius: '50%',
                border: `2px solid ${status.color}`,
                opacity: 0.35,
                animation: 'splashRing 1.8s ease-in-out infinite'
              }} />
              <div style={{
                position: 'absolute',
                width: '145px', height: '145px',
                borderRadius: '50%',
                border: `2px solid ${status.color}`,
                opacity: 0.55,
                animation: 'splashRing 1.8s ease-in-out infinite 0.4s'
              }} />
            </>
          )}

          {/* Core Circle Button */}
          <button
            onClick={toggleWakeActive}
            aria-label={isWakeActive ? "Pause Voice Assistant" : "Activate Voice Assistant"}
            style={{
              width: '120px', height: '120px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${status.color}22 0%, ${status.color}11 100%)`,
              border: `2px solid ${status.color}`,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              outline: 'none',
              zIndex: 2,
              boxShadow: isWakeActive ? status.ringGlow : 'none',
              transition: 'box-shadow 0.4s ease, border-color 0.4s ease, transform 0.2s ease'
            }}
          >
            {assistantStatus === 'idle' ? (
              <MicOff size={38} color="#475569" />
            ) : assistantStatus === 'listening' ? (
              <Mic size={38} color={status.color} />
            ) : assistantStatus === 'processing' ? (
              <Mic size={38} color={status.color} style={{ animation: 'pulse 0.5s infinite alternate' }} />
            ) : (
              <Volume2 size={38} color={status.color} />
            )}
          </button>
        </div>

        {/* Sound Wave — visible when listening */}
        {assistantStatus === 'listening' && (
          <div className="soundwave">
            {[...Array(9)].map((_, i) => <div key={i} className="wave-bar" />)}
          </div>
        )}

        {/* Status Text */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '22px', fontWeight: '900', color: status.color, marginBottom: '6px', lineHeight: 1.2 }}>
            {status.label}
          </p>
          {status.sublabel && (
            <p style={{ fontSize: '15px', color: '#475569', fontWeight: '600' }}>{status.sublabel}</p>
          )}
          {lastCommand && isWakeActive && (
            <div style={{
              marginTop: '12px', padding: '8px 16px',
              background: 'rgba(37,99,235,0.1)',
              border: '1px solid rgba(37,99,235,0.2)',
              borderRadius: '20px',
              fontSize: '14px', color: '#60A5FA', fontWeight: '600', fontStyle: 'italic'
            }}>
              "{lastCommand}"
            </div>
          )}
        </div>

        {/* Wake Word Hint when idle */}
        {!isWakeActive && (
          <div style={{ textAlign: 'center', maxWidth: '320px' }}>
            <button
              onClick={toggleWakeActive}
              className="glass-card"
              style={{
                padding: '18px', textAlign: 'center', cursor: 'pointer', border: '1px solid rgba(37,99,235,0.3)',
                background: 'rgba(37,99,235,0.06)', width: '100%', outline: 'none'
              }}
            >
              <p style={{ fontSize: '13px', color: '#475569', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                Tap or say phrase:
              </p>
              <p style={{ fontSize: '20px', fontWeight: '900', color: '#60A5FA' }}>
                "Activate AssistVision"
              </p>
              <p style={{ fontSize: '13px', color: '#64748B', marginTop: '8px', fontWeight: '600' }}>
                Click to activate voice mode now
              </p>
            </button>
          </div>
        )}

        {/* Quick command hints when active */}
        {isWakeActive && (
          <div style={{ width: '100%', maxWidth: '480px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              {[
                'Activate Camera', 'Read Text', 'Detect Objects',
                'Currency', 'Navigate', 'Emergency'
              ].map(cmd => (
                <button
                  key={cmd}
                  onClick={() => handleVoiceCommand(cmd)}
                  style={{
                    background: 'rgba(37,99,235,0.12)',
                    border: '1px solid rgba(37,99,235,0.3)',
                    borderRadius: '20px',
                    padding: '8px 16px',
                    fontSize: '13px', fontWeight: '700', color: '#60A5FA',
                    cursor: 'pointer', outline: 'none', transition: 'all 0.2s'
                  }}
                >
                  {cmd}
                </button>
              ))}
            </div>
            <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '13px', color: '#64748B', fontWeight: '600' }}>
              Tap any command above or speak to control
            </p>
          </div>
        )}
      </div>

      {/* ── Recent Activity ──────────────────────────────────────────── */}
      {history.length > 0 && (
        <div style={{ width: '100%', maxWidth: '600px' }}>
          <p style={{ fontSize: '12px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
            Recent Activity
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {history.slice(0, 2).map(item => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 14px',
                background: 'rgba(13,21,38,0.5)',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.04)'
              }}>
                <span className="badge badge-muted" style={{ fontSize: '10px', flexShrink: 0 }}>{item.type}</span>
                <span style={{ fontSize: '13px', color: '#64748B', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.text}
                </span>
                <span style={{ fontSize: '11px', color: '#334155', flexShrink: 0 }}>{item.timestamp.split('—')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
