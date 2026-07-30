import React, { useState, useEffect } from 'react';
import { Home, Camera, Navigation, History, Settings, LayoutDashboard } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { voiceService } from '../services/voiceService';

const NAV_ITEMS = [
  { id: 'home',       label: 'Home',       icon: Home,            color: '#2563EB' },
  { id: 'camera',     label: 'Camera',     icon: Camera,          color: '#10B981' },
  { id: 'dashboard',  label: 'Dashboard',  icon: LayoutDashboard, color: '#06B6D4' },
  { id: 'navigation', label: 'Navigate',   icon: Navigation,      color: '#F59E0B' },
  { id: 'history',    label: 'History',    icon: History,         color: '#8B5CF6' },
  { id: 'settings',   label: 'Settings',   icon: Settings,        color: '#64748B' }
];

export const BottomNavBar = () => {
  const { currentScreen, setCurrentScreen, history } = useApp();
  const newHistoryCount = history.filter(h => h.timestamp.includes('Today')).length;

  return (
    <nav
      aria-label="Main navigation"
      style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '10px 8px',
        background: 'rgba(7, 10, 20, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.07)',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.5)'
      }}
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = currentScreen === item.id;
        const showBadge = item.id === 'history' && newHistoryCount > 0;

        return (
          <button
            key={item.id}
            onClick={() => {
              setCurrentScreen(item.id);
            }}
            aria-label={`Navigate to ${item.label}`}
            aria-current={isActive ? 'page' : undefined}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              border: 'none',
              cursor: 'pointer',
              padding: '6px 10px',
              borderRadius: '14px',
              minWidth: '52px',
              position: 'relative',
              transition: 'all 0.2s ease',
              color: isActive ? item.color : '#475569',
              background: isActive ? `${item.color}18` : 'transparent'
            }}
          >
            {/* Active glow indicator */}
            {isActive && (
              <div style={{
                position: 'absolute',
                top: '-1px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '28px',
                height: '3px',
                background: item.color,
                borderRadius: '0 0 4px 4px',
                boxShadow: `0 0 8px ${item.color}`
              }} />
            )}

            {/* Badge */}
            {showBadge && !isActive && (
              <div style={{
                position: 'absolute',
                top: '2px',
                right: '4px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: '700',
                color: '#FFFFFF',
                boxShadow: '0 0 6px rgba(239,68,68,0.6)'
              }}>
                {Math.min(newHistoryCount, 9)}
              </div>
            )}

            <Icon
              size={22}
              color={isActive ? item.color : '#475569'}
              strokeWidth={isActive ? 2.5 : 1.8}
            />
            <span style={{
              fontSize: '11px',
              fontWeight: isActive ? '800' : '600',
              color: isActive ? item.color : '#475569',
              letterSpacing: '0.2px'
            }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
