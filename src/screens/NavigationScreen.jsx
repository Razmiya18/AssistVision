import React, { useState, useEffect, useRef } from 'react';
import {
  Navigation, MapPin, Compass, Volume2, ArrowUpRight, ArrowLeft,
  ArrowRight, ArrowUp, Building2, Footprints, Layers, RotateCcw,
  Search, Satellite, Signal
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { voiceService } from '../services/voiceService';
import { apiService } from '../services/apiService';

const DIRECTION_ICONS = {
  straight: ArrowUp,
  left: ArrowLeft,
  right: ArrowRight
};

const compassDirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

export const NavigationScreen = () => {
  const { settings, addHistoryItem, gpsCoords, compassHeading } = useApp();

  const [navMode, setNavMode] = useState('Outdoor');
  const [destination, setDestination] = useState('City General Hospital');
  const [searchInput, setSearchInput] = useState('');
  const [isNavigating, setIsNavigating] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [geocodeResult, setGeocodeResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef(null);

  const outdoorSteps = [
    { instruction: 'Head straight on Central Avenue for 150 meters', distance: '150m', turn: 'straight' },
    { instruction: 'Turn left onto Oak Parkway towards Hospital Gate', distance: '200m', turn: 'left' },
    { instruction: 'Cross pedestrian walkway — wait for green signal', distance: '50m', turn: 'straight' },
    { instruction: 'Destination: City Hospital on your right side', distance: '0m', turn: 'right' }
  ];

  const indoorSteps = [
    { floor: 'Ground Floor', room: 'Main Entrance Lobby', guidance: 'Walk straight 10 meters to Elevator B', type: 'Floor Guidance' },
    { floor: '3rd Floor', room: 'Corridor B-3', guidance: 'Take Elevator B to 3rd Floor, turn left out of elevator', type: 'Corridor Guidance' },
    { floor: '3rd Floor', room: 'Room 302 — Vision Lab', guidance: 'Room 302 is the 3rd door on your right side', type: 'Room Guidance' },
    { floor: '3rd Floor', room: 'Emergency Exit', guidance: 'Exit stairwell located 12 meters straight ahead', type: 'Exit Guidance' }
  ];

  const steps = navMode === 'Outdoor' ? outdoorSteps : indoorSteps;
  const currentStep = steps[currentStepIndex];

  useEffect(() => {
    if (isNavigating && currentStep) {
      const text = navMode === 'Outdoor' ? currentStep.instruction : currentStep.guidance;
      voiceService.speak(`Navigation: ${text}`);
    }
  }, [currentStepIndex, navMode, isNavigating]);

  useEffect(() => {
    const handleNext = () => nextStep();
    const handleRepeat = () => repeatDirection();

    window.addEventListener('assistvision-nav-next', handleNext);
    window.addEventListener('assistvision-nav-repeat', handleRepeat);

    return () => {
      window.removeEventListener('assistvision-nav-next', handleNext);
      window.removeEventListener('assistvision-nav-repeat', handleRepeat);
    };
  }, [currentStepIndex, steps.length, navMode]);

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(p => p + 1);
      voiceService.vibrate(80);
    } else {
      voiceService.speak(`You have arrived at ${destination}!`, true);
      addHistoryItem('Navigation', `Arrived at ${destination}`);
      setIsNavigating(false);
    }
  };

  const repeatDirection = () => {
    const text = navMode === 'Outdoor' ? currentStep.instruction : currentStep.guidance;
    voiceService.speak(text, true);
  };

  const handleSearch = async () => {
    if (!searchInput.trim()) return;
    setIsSearching(true);
    voiceService.speak(`Searching for ${searchInput}`);
    const result = await apiService.geocode(searchInput);
    setIsSearching(false);
    if (result.error) {
      voiceService.speak('Location not found. Please try a different search.');
    } else {
      setGeocodeResult(result);
      setDestination(searchInput);
      setCurrentStepIndex(0);
      setIsNavigating(true);
      voiceService.speak(`Found ${searchInput}. Starting navigation.`);
      addHistoryItem('Navigation', `Geocoded: ${result.displayName?.slice(0, 60)}`);
    }
    setSearchInput('');
  };

  const compassDir = compassHeading !== null
    ? compassDirs[Math.round(compassHeading / 45) % 8]
    : null;

  const TurnIcon = DIRECTION_ICONS[currentStep?.turn] || ArrowUp;

  return (
    <div className="screen-container fade-in">

      {/* Indoor / Outdoor Mode Switcher */}
      <div style={{
        display: 'flex',
        background: '#0D1526',
        borderRadius: '16px',
        padding: '4px',
        border: '1px solid rgba(255,255,255,0.08)',
        marginBottom: '16px'
      }}>
        {['Outdoor', 'Indoor'].map(mode => (
          <button
            key={mode}
            onClick={() => { setNavMode(mode); setCurrentStepIndex(0); voiceService.speak(`${mode} Navigation Mode`); }}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '12px',
              border: 'none',
              background: navMode === mode ? (mode === 'Outdoor' ? '#2563EB' : '#10B981') : 'transparent',
              color: '#FFFFFF',
              fontWeight: '700',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'background 0.25s ease'
            }}
          >
            {mode === 'Outdoor' ? <Compass size={18} /> : <Building2 size={18} />}
            {mode} Mode
          </button>
        ))}
      </div>

      {/* Destination Search */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          ref={inputRef}
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Search destination (e.g. nearest hospital)..."
          style={{
            flex: 1,
            background: '#0D1526',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '14px',
            color: '#FFFFFF',
            fontSize: '16px',
            fontWeight: '600',
            padding: '12px 16px',
            outline: 'none',
            fontFamily: 'var(--font-family)'
          }}
        />
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="touch-btn touch-btn-primary"
          style={{ minHeight: '48px', padding: '12px 18px', fontSize: '15px' }}
        >
          <Search size={18} /> {isSearching ? '...' : 'Go'}
        </button>
      </div>

      {/* Live Sensors Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '10px',
        marginBottom: '16px'
      }}>
        {/* GPS */}
        <div className="glass-card" style={{ padding: '12px', textAlign: 'center' }}>
          <Satellite size={20} color="#10B981" style={{ margin: '0 auto 6px' }} />
          <p style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>GPS</p>
          <p style={{ fontSize: '13px', fontWeight: '700', color: '#34D399' }}>
            {gpsCoords ? `${gpsCoords.lat}` : 'Searching...'}
          </p>
        </div>
        {/* Compass */}
        <div className="glass-card" style={{ padding: '12px', textAlign: 'center' }}>
          <Compass size={20} color="#60A5FA" style={{ margin: '0 auto 6px', transform: compassHeading ? `rotate(${compassHeading}deg)` : 'none', transition: 'transform 0.5s ease' }} />
          <p style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Heading</p>
          <p style={{ fontSize: '13px', fontWeight: '700', color: '#60A5FA' }}>
            {compassHeading !== null ? `${compassDir} ${compassHeading}°` : 'Unavailable'}
          </p>
        </div>
        {/* Accuracy */}
        <div className="glass-card" style={{ padding: '12px', textAlign: 'center' }}>
          <Signal size={20} color="#F59E0B" style={{ margin: '0 auto 6px' }} />
          <p style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Accuracy</p>
          <p style={{ fontSize: '13px', fontWeight: '700', color: '#FBBF24' }}>
            {gpsCoords ? `±${gpsCoords.accuracy}m` : '--'}
          </p>
        </div>
      </div>

      {/* Map / Direction Viewport */}
      {navMode === 'Outdoor' ? (
        <div style={{
          position: 'relative',
          width: '100%',
          height: '210px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, #0D1526, #162038)',
          border: '2px solid #2563EB',
          boxShadow: '0 8px 28px rgba(37,99,235,0.25)',
          marginBottom: '14px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: '10px',
          overflow: 'hidden'
        }}>
          {/* Animated Grid Background */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(37,99,235,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.06) 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }} />

          <div style={{
            width: '80px', height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 30px rgba(37,99,235,0.6)',
            zIndex: 1
          }}>
            <TurnIcon size={44} color="#FFFFFF" />
          </div>

          <div style={{ zIndex: 1 }}>
            <span style={{ fontSize: '22px', fontWeight: '900', color: '#FFFFFF', textTransform: 'uppercase' }}>
              {currentStep?.turn} in {currentStep?.distance}
            </span>
            <p style={{ fontSize: '13px', color: '#60A5FA', marginTop: '2px' }}>GPS Accuracy: ±{gpsCoords?.accuracy || '—'}m</p>
          </div>
        </div>
      ) : (
        <div style={{
          width: '100%', padding: '20px', borderRadius: '24px',
          background: 'rgba(16,185,129,0.08)', border: '2px solid rgba(16,185,129,0.4)',
          marginBottom: '14px'
        }}>
          <div className="badge badge-accent" style={{ marginBottom: '8px' }}>
            <Layers size={13} /> {currentStep?.type}
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#FFFFFF', marginBottom: '4px' }}>
            {currentStep?.floor} · {currentStep?.room}
          </h3>
          <p style={{ fontSize: '17px', color: '#34D399', fontWeight: '600' }}>{currentStep?.guidance}</p>
        </div>
      )}

      {/* Navigation Metrics */}
      <div className="m3-card" style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Destination</span>
            <h4 style={{ fontSize: '19px', fontWeight: '900', color: '#FFFFFF' }}>{destination}</h4>
            {geocodeResult && <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{geocodeResult.displayName?.slice(0, 60)}...</p>}
          </div>
          <button onClick={repeatDirection} className="touch-btn touch-btn-outline" style={{ minHeight: '42px', padding: '8px 14px', fontSize: '14px' }}>
            <Volume2 size={16} /> Repeat
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', background: '#070A14', padding: '12px', borderRadius: '14px' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#64748B' }}>REMAINING</span>
            <p style={{ fontSize: '20px', fontWeight: '900', color: '#38BDF8' }}>
              {(steps.length - currentStepIndex - 1) > 0 ? `${(steps.length - currentStepIndex - 1) * 150}m` : 'Arrived'}
            </p>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#64748B' }}>ETA</span>
            <p style={{ fontSize: '20px', fontWeight: '900', color: '#10B981' }}>
              {Math.max(0, (steps.length - currentStepIndex - 1) * 2)} min
            </p>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#64748B' }}>STEP</span>
            <p style={{ fontSize: '20px', fontWeight: '900', color: '#A78BFA' }}>
              {currentStepIndex + 1}/{steps.length}
            </p>
          </div>
        </div>
      </div>

      {/* Current Step */}
      <div className="m3-card" style={{ borderLeft: '6px solid #2563EB', marginBottom: '12px' }}>
        <span style={{ fontSize: '12px', color: '#60A5FA', fontWeight: '800', textTransform: 'uppercase' }}>
          Current Direction:
        </span>
        <p style={{ fontSize: '19px', fontWeight: '800', color: '#FFFFFF', marginTop: '6px' }}>
          "{navMode === 'Outdoor' ? currentStep?.instruction : currentStep?.guidance}"
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={nextStep} className="touch-btn touch-btn-primary" style={{ flex: 2, padding: '16px' }}>
          <Footprints size={22} /> Next Step
        </button>
        <button onClick={repeatDirection} className="touch-btn touch-btn-accent" style={{ flex: 1, padding: '16px' }}>
          <RotateCcw size={18} /> Repeat
        </button>
        <button onClick={() => { setIsNavigating(false); voiceService.speak('Navigation stopped.'); }} className="touch-btn touch-btn-danger" style={{ flex: 1, padding: '16px' }}>
          Stop
        </button>
      </div>

    </div>
  );
};
