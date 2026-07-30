import React, { useState } from 'react';
import {
  Settings, Volume2, Sliders, Moon, WifiOff, Camera,
  UserCheck, Lock, Play, Plus, Trash2, Phone, RefreshCw,
  ShieldAlert, Server, RotateCcw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { voiceService } from '../services/voiceService';

const SectionTitle = ({ icon: Icon, label, color }) => (
  <h3 style={{
    fontSize: '18px', fontWeight: '800',
    color: color || '#60A5FA',
    marginBottom: '14px',
    display: 'flex', alignItems: 'center', gap: '8px'
  }}>
    <Icon size={20} /> {label}
  </h3>
);

const ToggleRow = ({ label, icon: Icon, value, onChange }) => (
  <div
    onClick={onChange}
    style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '14px 0',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      cursor: 'pointer'
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <Icon size={18} color="#94A3B8" />
      <span style={{ fontSize: '16px', fontWeight: '600', color: '#FFFFFF' }}>{label}</span>
    </div>
    <div style={{
      width: '52px', height: '28px', borderRadius: '14px',
      background: value ? '#2563EB' : '#1E293B',
      border: `1px solid ${value ? 'rgba(37,99,235,0.5)' : 'rgba(255,255,255,0.1)'}`,
      position: 'relative', transition: 'background 0.25s ease',
      boxShadow: value ? '0 0 10px rgba(37,99,235,0.4)' : 'none'
    }}>
      <div style={{
        width: '22px', height: '22px', borderRadius: '50%',
        background: '#FFFFFF',
        position: 'absolute', top: '3px',
        left: value ? '27px' : '3px',
        transition: 'left 0.25s ease',
        boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
      }} />
    </div>
  </div>
);

export const SettingsScreen = () => {
  const { settings, setSettings, resetActivation } = useApp();
  const [newContact, setNewContact] = useState({ name: '', phone: '' });
  const [showAddContact, setShowAddContact] = useState(false);
  const [voicePreviewPlaying, setVoicePreviewPlaying] = useState(false);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    // Live apply voice settings
    if (['voiceSpeed', 'voiceVolume', 'language'].includes(key)) {
      voiceService.setSpeechSettings({
        rate: key === 'voiceSpeed' ? value : settings.voiceSpeed,
        volume: key === 'voiceVolume' ? value : settings.voiceVolume,
        language: key === 'language' ? value : settings.language
      });
    }
  };

  const handleVoicePreview = () => {
    voiceService.stopSpeaking();
    setVoicePreviewPlaying(true);
    voiceService.speak(
      `Voice preview. Speed is ${settings.voiceSpeed}x. Volume is ${Math.round(settings.voiceVolume * 100)} percent. This is how AssistVision will speak to you.`,
      true
    );
    setTimeout(() => setVoicePreviewPlaying(false), 4000);
  };

  const addContact = () => {
    if (!newContact.name.trim() || !newContact.phone.trim()) return;
    const updated = [...settings.emergencyContacts, { ...newContact }];
    updateSetting('emergencyContacts', updated);
    voiceService.speak(`Emergency contact ${newContact.name} added.`);
    setNewContact({ name: '', phone: '' });
    setShowAddContact(false);
  };

  const removeContact = (index) => {
    const updated = settings.emergencyContacts.filter((_, i) => i !== index);
    updateSetting('emergencyContacts', updated);
    voiceService.speak('Contact removed.');
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '12px',
    background: '#070A14',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#FFFFFF',
    fontSize: '16px',
    fontWeight: '600',
    fontFamily: 'var(--font-family)',
    outline: 'none'
  };

  const selectStyle = { ...inputStyle };

  return (
    <div className="screen-container fade-in">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px',
          background: 'rgba(37,99,235,0.15)',
          border: '1px solid rgba(37,99,235,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Settings size={22} color="#60A5FA" />
        </div>
        <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#FFFFFF' }}>
          Accessibility & Settings
        </h2>
      </div>

      {/* ── Voice & Audio ─────────────────────────────────────── */}
      <div className="m3-card" style={{ marginBottom: '14px' }}>
        <SectionTitle icon={Volume2} label="Voice & Audio Feedback" color="#60A5FA" />

        {/* Speed */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '15px', color: '#FFFFFF', fontWeight: '600' }}>Speech Speed</span>
            <strong style={{ color: '#10B981', fontSize: '15px' }}>{settings.voiceSpeed}x</strong>
          </div>
          <input type="range" min="0.5" max="2.0" step="0.1"
            value={settings.voiceSpeed}
            onChange={e => updateSetting('voiceSpeed', parseFloat(e.target.value))}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569', marginTop: '4px' }}>
            <span>Slow 0.5x</span><span>Normal 1.0x</span><span>Fast 2.0x</span>
          </div>
        </div>

        {/* Volume */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '15px', color: '#FFFFFF', fontWeight: '600' }}>Voice Volume</span>
            <strong style={{ color: '#38BDF8', fontSize: '15px' }}>{Math.round(settings.voiceVolume * 100)}%</strong>
          </div>
          <input type="range" min="0.1" max="1.0" step="0.05"
            value={settings.voiceVolume}
            onChange={e => updateSetting('voiceVolume', parseFloat(e.target.value))}
          />
        </div>

        {/* Language */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '15px', color: '#FFFFFF', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
            Assistant Language
          </label>
          <select value={settings.language} onChange={e => updateSetting('language', e.target.value)} style={selectStyle}>
            <option value="en-US">English (United States)</option>
            <option value="en-IN">English (India)</option>
            <option value="hi-IN">Hindi — हिंदी</option>
            <option value="es-ES">Spanish — Español</option>
            <option value="fr-FR">French — Français</option>
            <option value="ar-SA">Arabic — العربية</option>
            <option value="zh-CN">Chinese — 中文</option>
          </select>
        </div>

        {/* Voice Preview Button */}
        <button
          onClick={handleVoicePreview}
          disabled={voicePreviewPlaying}
          className="touch-btn touch-btn-primary"
          style={{ width: '100%', padding: '14px', fontSize: '16px' }}
        >
          <Play size={18} />
          {voicePreviewPlaying ? 'Playing Preview...' : 'Preview Voice Settings'}
        </button>
      </div>

      {/* ── Safety & Proximity ────────────────────────────────── */}
      <div className="m3-card" style={{ marginBottom: '14px' }}>
        <SectionTitle icon={Sliders} label="Safety & Proximity Alerts" color="#F59E0B" />

        <div style={{ marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '15px', color: '#FFFFFF', fontWeight: '600' }}>Alert Distance</span>
            <strong style={{ color: '#EF4444', fontSize: '15px' }}>{settings.alertDistance}m</strong>
          </div>
          <input type="range" min="0.5" max="4.0" step="0.5"
            value={settings.alertDistance}
            onChange={e => updateSetting('alertDistance', parseFloat(e.target.value))}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569', marginTop: '4px' }}>
            <span>Very Close 0.5m</span><span>Standard 1.5m</span><span>Far 4.0m</span>
          </div>
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label style={{ fontSize: '15px', color: '#FFFFFF', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
            Camera Resolution
          </label>
          <select value={settings.cameraQuality} onChange={e => updateSetting('cameraQuality', e.target.value)} style={selectStyle}>
            <option value="High 1080p">High Quality (1080p HD)</option>
            <option value="Balanced 720p">Balanced (720p HD)</option>
            <option value="Battery Saver 480p">Battery Saver (480p SD)</option>
          </select>
        </div>
      </div>

      {/* ── Emergency Contacts ────────────────────────────────── */}
      <div className="m3-card" style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <SectionTitle icon={ShieldAlert} label="Emergency Contacts" color="#EF4444" />
          <button
            onClick={() => setShowAddContact(s => !s)}
            className="touch-btn touch-btn-outline"
            style={{ minHeight: '36px', padding: '6px 14px', fontSize: '13px' }}
          >
            <Plus size={14} /> Add
          </button>
        </div>

        {/* Add Contact Form */}
        {showAddContact && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px', padding: '14px', background: 'rgba(239,68,68,0.06)', borderRadius: '14px', border: '1px solid rgba(239,68,68,0.2)' }}>
            <input
              placeholder="Contact Name"
              value={newContact.name}
              onChange={e => setNewContact(p => ({ ...p, name: e.target.value }))}
              style={inputStyle}
            />
            <input
              placeholder="Phone Number (e.g. +91 9999999999)"
              value={newContact.phone}
              onChange={e => setNewContact(p => ({ ...p, phone: e.target.value }))}
              style={inputStyle}
              type="tel"
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={addContact} className="touch-btn touch-btn-danger" style={{ flex: 1, padding: '12px', fontSize: '15px' }}>
                <Plus size={16} /> Save Contact
              </button>
              <button onClick={() => setShowAddContact(false)} className="touch-btn touch-btn-outline" style={{ flex: 1, padding: '12px', fontSize: '15px' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Contacts List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {settings.emergencyContacts.map((c, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', background: '#070A14',
              borderRadius: '14px', border: '1px solid rgba(239,68,68,0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Phone size={16} color="#EF4444" />
                <div>
                  <p style={{ fontSize: '15px', fontWeight: '800', color: '#FFFFFF' }}>{c.name}</p>
                  <p style={{ fontSize: '13px', color: '#64748B' }}>{c.phone}</p>
                </div>
              </div>
              <button
                onClick={() => removeContact(i)}
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: '#F87171', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Feature Toggles ───────────────────────────────────── */}
      <div className="m3-card" style={{ marginBottom: '14px' }}>
        <SectionTitle icon={Lock} label="App Modes & Permissions" color="#10B981" />

        <ToggleRow icon={Moon}        label="Dark High-Contrast Theme"    value={settings.darkMode}               onChange={() => updateSetting('darkMode', !settings.darkMode)} />
        <ToggleRow icon={WifiOff}     label="Offline / On-Device AI Mode" value={settings.offlineMode}           onChange={() => updateSetting('offlineMode', !settings.offlineMode)} />
        <ToggleRow icon={UserCheck}   label="Face Recognition Active"     value={settings.faceRecognitionEnabled} onChange={() => updateSetting('faceRecognitionEnabled', !settings.faceRecognitionEnabled)} />
      </div>

      {/* ── Backend Status ────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '14px' }}>
        <SectionTitle icon={Server} label="Backend API Connection" color="#06B6D4" />
        <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '10px' }}>
          Start the Python backend to enable server-side AI features (server OCR, object detection, SOS logging).
        </p>
        <div className="badge badge-muted" style={{ fontSize: '13px', padding: '8px 14px' }}>
          <span className="status-dot status-dot-warning" />
          Run: <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px', marginLeft: '4px' }}>
            uvicorn app.main:app --reload --port 8000
          </code>
        </div>
      </div>

      {/* ── Reset Button ──────────────────────────────────────── */}
      <div className="m3-card" style={{ borderLeft: '4px solid #EF4444' }}>
        <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#F87171', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RotateCcw size={18} /> Reset App Data
        </h3>
        <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '14px' }}>
          Clears activation state, settings, and history. The app will restart calibration.
        </p>
        <button
          onClick={() => {
            if (window.confirm('Are you sure? This will clear all app data.')) {
              resetActivation();
            }
          }}
          className="touch-btn touch-btn-danger"
          style={{ width: '100%', padding: '14px', fontSize: '16px' }}
        >
          <RotateCcw size={18} /> Reset All App Data
        </button>
      </div>

    </div>
  );
};
