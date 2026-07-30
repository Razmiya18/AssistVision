import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Mic, MapPin, Wifi, WifiOff, Battery, BatteryFull,
  BatteryMedium, BatteryLow, Compass, Activity, Clock, Eye, History,
  Server, Zap
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { voiceService } from '../services/voiceService';
import { apiService } from '../services/apiService';

const StatCard = ({ icon: Icon, label, value, color, subValue }) => (
  <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Icon size={18} color={color} />
      <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</span>
    </div>
    <p style={{ fontSize: '22px', fontWeight: '900', color: color || '#FFFFFF', lineHeight: 1 }}>{value}</p>
    {subValue && <p style={{ fontSize: '12px', color: '#475569', fontWeight: '600' }}>{subValue}</p>}
  </div>
);

export const DashboardScreen = () => {
  const {
    batteryLevel, batteryCharging,
    gpsCoords, gpsError,
    isOnline, compassHeading,
    isListening, sessionStats, history
  } = useApp();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [backendOnline, setBackendOnline] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    setBackendOnline(apiService.getBackendStatus());
    return () => clearInterval(t);
  }, []);



  const sessionDuration = Math.floor((new Date() - sessionStats.sessionStart) / 60000);
  const compassDirs = ['North', 'NE', 'East', 'SE', 'South', 'SW', 'West', 'NW'];
  const compassDir = compassHeading !== null ? compassDirs[Math.round(compassHeading / 45) % 8] : 'N/A';

  const BattIcon = batteryLevel > 60 ? BatteryFull : batteryLevel > 25 ? BatteryMedium : BatteryLow;
  const battColor = batteryLevel > 60 ? '#10B981' : batteryLevel > 25 ? '#F59E0B' : '#EF4444';

  return (
    <div className="screen-container fade-in">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{
          width: '48px', height: '48px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, rgba(37,99,235,0.3), rgba(16,185,129,0.2))',
          border: '1px solid rgba(37,99,235,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <LayoutDashboard size={24} color="#60A5FA" />
        </div>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#FFFFFF', lineHeight: 1 }}>Live Dashboard</h2>
          <p style={{ fontSize: '14px', color: '#64748B', fontWeight: '600' }}>Real-time device & app status</p>
        </div>
        {/* Live Clock */}
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <p style={{ fontSize: '22px', fontWeight: '900', color: '#60A5FA', lineHeight: 1 }}>
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
          <p style={{ fontSize: '12px', color: '#475569', fontWeight: '600' }}>
            {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Sensor Stats Grid */}
      <p style={{ fontSize: '13px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
        Device Sensors
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>

        <StatCard
          icon={BattIcon}
          label="Battery"
          value={batteryLevel !== null ? `${batteryLevel}%` : 'N/A'}
          color={battColor}
          subValue={batteryCharging ? '⚡ Charging' : 'On battery'}
        />

        <StatCard
          icon={MapPin}
          label="GPS"
          value={gpsCoords ? 'Active' : 'Searching'}
          color={gpsCoords ? '#10B981' : '#F59E0B'}
          subValue={gpsCoords ? `±${gpsCoords.accuracy}m accuracy` : gpsError || 'Locating...'}
        />

        <StatCard
          icon={isOnline ? Wifi : WifiOff}
          label="Network"
          value={isOnline ? 'Online' : 'Offline'}
          color={isOnline ? '#10B981' : '#EF4444'}
          subValue={isOnline ? 'Internet Connected' : 'No connection'}
        />

        <StatCard
          icon={Compass}
          label="Compass"
          value={compassHeading !== null ? `${compassHeading}°` : 'N/A'}
          color="#A78BFA"
          subValue={compassDir}
        />

        <StatCard
          icon={Server}
          label="Backend"
          value={backendOnline ? 'Connected' : 'Offline'}
          color={backendOnline ? '#10B981' : '#64748B'}
          subValue={backendOnline ? 'localhost:8000' : 'Start python server'}
        />

        <StatCard
          icon={Mic}
          label="Voice"
          value={isListening ? 'Active' : 'Idle'}
          color={isListening ? '#10B981' : '#60A5FA'}
          subValue={isListening ? 'Listening for commands' : 'Tap mic to activate'}
        />
      </div>

      {/* Session Stats */}
      <p style={{ fontSize: '13px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
        Session Stats
      </p>
      <div className="m3-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '30px', fontWeight: '900', color: '#60A5FA' }}>{sessionStats.commandsIssued}</p>
            <p style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>COMMANDS</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '30px', fontWeight: '900', color: '#34D399' }}>{sessionStats.screensVisited}</p>
            <p style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>SCREENS</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '30px', fontWeight: '900', color: '#A78BFA' }}>{sessionDuration}</p>
            <p style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>MINUTES</p>
          </div>
        </div>
      </div>

      {/* GPS Coordinates Detail */}
      {gpsCoords && (
        <div className="glass-card" style={{ padding: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <MapPin size={16} color="#10B981" />
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#10B981', textTransform: 'uppercase' }}>Live GPS Position</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#64748B' }}>LATITUDE</p>
              <p style={{ fontSize: '18px', fontWeight: '800', color: '#FFFFFF', fontVariantNumeric: 'tabular-nums' }}>{gpsCoords.lat}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#64748B' }}>LONGITUDE</p>
              <p style={{ fontSize: '18px', fontWeight: '800', color: '#FFFFFF', fontVariantNumeric: 'tabular-nums' }}>{gpsCoords.lon}</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent History */}
      <p style={{ fontSize: '13px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
        Recent Activity
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {history.slice(0, 4).map((item) => (
          <div key={item.id} className="m3-card" style={{ padding: '12px 16px', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="badge badge-muted" style={{ fontSize: '11px', flexShrink: 0 }}>{item.type}</span>
            <span style={{ fontSize: '14px', color: '#94A3B8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.text}</span>
            <span style={{ fontSize: '12px', color: '#475569', flexShrink: 0 }}>{item.timestamp.split('—')[0]}</span>
          </div>
        ))}
      </div>

    </div>
  );
};
