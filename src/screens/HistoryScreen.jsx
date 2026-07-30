import React from 'react';
import { Clock, Volume2, Trash2, Navigation, FileText, Banknote, UserCheck, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { voiceService } from '../services/voiceService';

export const HistoryScreen = () => {
  const { history } = useApp();

  const getIcon = (type) => {
    switch (type) {
      case 'Navigation': return <Navigation size={18} color="#2563EB" />;
      case 'OCR': return <FileText size={18} color="#38BDF8" />;
      case 'Currency': return <Banknote size={18} color="#F59E0B" />;
      case 'Face Recognition': return <UserCheck size={18} color="#8B5CF6" />;
      case 'Emergency SOS': return <ShieldAlert size={18} color="#EF4444" />;
      default: return <Clock size={18} color="#10B981" />;
    }
  };

  return (
    <div className="screen-container">
      
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={28} color="#10B981" />
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#FFFFFF' }}>
            Activity Log History
          </h2>
        </div>
        <button
          onClick={() => voiceService.speak(`History contains ${history.length} recent activity records.`)}
          className="touch-btn touch-btn-outline"
          style={{ minHeight: '36px', padding: '6px 12px', fontSize: '13px' }}
        >
          <Volume2 size={16} /> Read Count
        </button>
      </div>

      {/* History Items Stack */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {history.map((item) => (
          <div
            key={item.id}
            className="m3-card"
            style={{
              marginBottom: 0,
              padding: '16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              background: '#0F172A'
            }}
          >
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              padding: '10px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {getIcon(item.type)}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#60A5FA' }}>
                  {item.type.toUpperCase()}
                </span>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  {item.timestamp}
                </span>
              </div>

              <p style={{ fontSize: '16px', fontWeight: '700', color: '#FFFFFF', marginTop: '4px', lineHeight: '1.3' }}>
                {item.text}
              </p>
            </div>

            <button
              onClick={() => voiceService.speak(`${item.type}: ${item.text}`)}
              style={{
                background: 'none',
                border: 'none',
                color: '#38BDF8',
                cursor: 'pointer',
                padding: '6px'
              }}
              title="Replay Audio"
            >
              <Volume2 size={20} />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
};
