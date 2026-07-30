import React, { useState } from 'react';
import { Box, Volume2, ShieldAlert, AlertTriangle, Layers, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { voiceService } from '../services/voiceService';

export const ObjectDetectionScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const allObjects = [
    { name: 'Person', category: 'People', distance: '2.1m', direction: 'Front', confidence: 98, warning: false, alertText: 'Person approaching from front.' },
    { name: 'Chair', category: 'Furniture', distance: '0.8m', direction: 'Front', confidence: 97, warning: true, alertText: 'Warning. Chair ahead 0.8 meters.' },
    { name: 'Stairs', category: 'Obstacles', distance: '1.5m', direction: 'Front', confidence: 96, warning: true, alertText: 'Stairs 1.5 meters ahead.' },
    { name: 'Bottle', category: 'Furniture', distance: '0.5m', direction: 'Left', confidence: 95, warning: true, alertText: 'Bottle on your left.' },
    { name: 'Car', category: 'Vehicles', distance: '4.2m', direction: 'Right', confidence: 94, warning: false, alertText: 'Car 4 meters on right.' },
    { name: 'Door', category: 'Obstacles', distance: '2.8m', direction: 'Front', confidence: 92, warning: false, alertText: 'Doorway 2.8 meters ahead.' },
    { name: 'Dog', category: 'Animals', distance: '3.0m', direction: 'Right', confidence: 90, warning: false, alertText: 'Dog on your right.' },
    { name: 'Pole', category: 'Obstacles', distance: '1.0m', direction: 'Left', confidence: 89, warning: true, alertText: 'Warning. Pole 1 meter on left.' }
  ];

  const categories = ['All', 'Obstacles', 'Furniture', 'People', 'Vehicles', 'Animals'];

  const filtered = selectedCategory === 'All'
    ? allObjects
    : allObjects.filter((o) => o.category === selectedCategory);

  const speakAlert = (obj) => {
    voiceService.speak(obj.alertText, true);
    if (obj.warning) voiceService.vibrate([100, 50, 100]);
  };

  return (
    <div className="screen-container">
      
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Box size={28} color="#10B981" />
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#FFFFFF' }}>
            Object Detection
          </h2>
        </div>
        <button
          onClick={() => {
            const summary = filtered.map(f => `${f.name} ${f.distance}`).join(', ');
            voiceService.speak(`Objects around you: ${summary}`);
          }}
          className="touch-btn touch-btn-outline"
          style={{ minHeight: '38px', padding: '6px 12px', fontSize: '13px' }}
        >
          <Volume2 size={16} /> Read List
        </button>
      </div>

      {/* Category Filter Chips */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '12px' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setSelectedCategory(cat);
              voiceService.speak(`Filtered by ${cat}`);
            }}
            style={{
              flex: '0 0 auto',
              background: selectedCategory === cat ? '#10B981' : '#0F172A',
              color: selectedCategory === cat ? '#042F2E' : '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '16px',
              padding: '8px 14px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Object Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.map((obj, idx) => (
          <div
            key={idx}
            className="m3-card m3-card-interactive"
            onClick={() => speakAlert(obj)}
            style={{
              marginBottom: 0,
              padding: '16px',
              borderLeft: `5px solid ${obj.warning ? '#EF4444' : '#10B981'}`,
              background: obj.warning ? 'rgba(239, 68, 68, 0.08)' : '#0F172A',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h4 style={{ fontSize: '20px', fontWeight: '800', color: '#FFFFFF' }}>
                  {obj.name}
                </h4>
                {obj.warning && (
                  <span className="badge badge-danger" style={{ fontSize: '11px', padding: '2px 6px' }}>
                    <AlertTriangle size={10} /> CLOSE
                  </span>
                )}
              </div>
              <p style={{ fontSize: '14px', color: '#94A3B8', marginTop: '2px' }}>
                Direction: <strong style={{ color: '#FFFFFF' }}>{obj.direction}</strong> • Confidence: {obj.confidence}%
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '24px', fontWeight: '900', color: obj.warning ? '#F87171' : '#34D399' }}>
                {obj.distance}
              </span>
              <p style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>DISTANCE</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
