// AppContext — Voice Assistant State Management
// Wake word driven, camera only on command, minimal TTS responses
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { voiceService } from '../services/voiceService';

const AppContext = createContext();

// Short canonical responses — no chatbot style
const RESPONSES = {
  camera:     'Camera activated.',
  ocr:        'Reading text.',
  currency:   'Currency detection started.',
  face:       'Face recognition started.',
  traffic:    'Traffic signal detection started.',
  objects:    'Object detection started.',
  navigation: 'Navigation started.',
  navStop:    'Navigation stopped.',
  sos:        'Emergency SOS activated.',
  settings:   'Opening settings.',
  history:    'Opening history.',
  dashboard:  'Opening dashboard.',
  home:       '',  // silent — just navigate
};

export const AppProvider = ({ children }) => {
  // Activation state
  const [isActivated, setIsActivated] = useState(() =>
    localStorage.getItem('assistvision_activated') === 'true'
  );
  const [isWakeActive, setIsWakeActive] = useState(false); // assistant actively listening

  // Navigation
  const [currentScreen, setCurrentScreen] = useState('splash');

  // Camera — NEVER opens automatically; only via voice command
  const [cameraMode, setCameraMode] = useState('object');
  const [facingMode, setFacingMode] = useState('environment');
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Sensors
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [batteryCharging, setBatteryCharging] = useState(false);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [compassHeading, setCompassHeading] = useState(null);

  // UI state
  const [lastCommand, setLastCommand] = useState('');
  const [assistantStatus, setAssistantStatus] = useState('idle'); // 'idle'|'listening'|'processing'|'speaking'

  // Settings
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('assistvision_settings');
      return saved ? JSON.parse(saved) : defaultSettings();
    } catch { return defaultSettings(); }
  });

  // History
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('assistvision_history');
      return saved ? JSON.parse(saved) : defaultHistory();
    } catch { return defaultHistory(); }
  });

  // Session stats
  const [sessionStats, setSessionStats] = useState({
    commandsIssued: 0, screensVisited: 0, sessionStart: new Date()
  });

  const gpsWatchRef = useRef(null);

  // ─── Sensor Initialization ────────────────────────────────────────────────
  useEffect(() => {
    // Battery
    if (navigator.getBattery) {
      navigator.getBattery().then(bat => {
        const upd = () => { setBatteryLevel(Math.round(bat.level * 100)); setBatteryCharging(bat.charging); };
        upd();
        bat.addEventListener('levelchange', upd);
        bat.addEventListener('chargingchange', upd);
      }).catch(() => {});
    }

    // Network
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);

    // GPS
    if (navigator.geolocation) {
      gpsWatchRef.current = navigator.geolocation.watchPosition(
        pos => setGpsCoords({ lat: pos.coords.latitude.toFixed(5), lon: pos.coords.longitude.toFixed(5), accuracy: Math.round(pos.coords.accuracy) }),
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    }

    // Compass
    const handleOrientation = e => {
      const h = e.webkitCompassHeading !== undefined ? e.webkitCompassHeading : (e.alpha !== null ? 360 - e.alpha : null);
      if (h !== null) setCompassHeading(Math.round(h));
    };
    window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    window.addEventListener('deviceorientation', handleOrientation, true);

    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
      window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
      window.removeEventListener('deviceorientation', handleOrientation, true);
      if (gpsWatchRef.current) navigator.geolocation?.clearWatch(gpsWatchRef.current);
    };
  }, []);

  // Persist settings + apply to voice service
  useEffect(() => {
    localStorage.setItem('assistvision_settings', JSON.stringify(settings));
    voiceService.setSpeechSettings({ rate: settings.voiceSpeed, volume: settings.voiceVolume, language: settings.language });
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('assistvision_history', JSON.stringify(history.slice(0, 50)));
  }, [history]);

  // ─── Global Stop Event Listener ──────────────────────────────────────────────
  useEffect(() => {
    const handleGlobalStop = () => {
      voiceService.stopSpeaking();
      voiceService.stopEmergencySiren();
      setIsWakeActive(false);
      setAssistantStatus('idle');
      setIsCameraOpen(false);
      if (currentScreen === 'camera' || currentScreen === 'ocr' || currentScreen === 'currency' || currentScreen === 'face' || currentScreen === 'traffic' || currentScreen === 'sos') {
        setCurrentScreen('home');
      }
    };
    window.addEventListener('assistvision-global-stop', handleGlobalStop);
    return () => window.removeEventListener('assistvision-global-stop', handleGlobalStop);
  }, [currentScreen]);

  // ─── Background Wake Word Listening ───────────────────────────────────────
  // Starts immediately when app mounts — always listening for wake phrase
  useEffect(() => {
    voiceService.startBackgroundListening({
      onWake: () => {
        setIsWakeActive(true);
        setAssistantStatus('listening');
        markActivated();
      },
      onDeactivate: () => {
        setIsWakeActive(false);
        setAssistantStatus('idle');
        setIsCameraOpen(false);
      },
      onCommand: (transcript) => {
        handleVoiceCommand(transcript);
      },
      onStateChange: () => {}
    });

    return () => {
      // Do NOT stop on unmount — keep listening in background
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Activation ───────────────────────────────────────────────────────────
  const markActivated = () => {
    localStorage.setItem('assistvision_activated', 'true');
    setIsActivated(true);
    setCurrentScreen('home');
  };

  const resetActivation = () => {
    localStorage.removeItem('assistvision_activated');
    localStorage.removeItem('assistvision_settings');
    localStorage.removeItem('assistvision_history');
    setIsActivated(false);
    setIsWakeActive(false);
    setCurrentScreen('calibration');
  };

  // Toggle Assistant Activation manually (e.g. from Mic button tap)
  const toggleWakeActive = () => {
    if (!isWakeActive) {
      setIsWakeActive(true);
      setAssistantStatus('listening');
      markActivated();
      voiceService.playActivationBeep();
      voiceService.speak("AssistVision active. How can I help?", true);
      voiceService.startBackgroundListening({
        onWake: () => {
          setIsWakeActive(true);
          setAssistantStatus('listening');
          markActivated();
        },
        onDeactivate: () => {
          setIsWakeActive(false);
          setAssistantStatus('idle');
          setIsCameraOpen(false);
        },
        onCommand: (transcript) => {
          handleVoiceCommand(transcript);
        },
        onStateChange: () => {}
      });
    } else {
      setIsWakeActive(false);
      setAssistantStatus('idle');
      voiceService.speak("Assistant paused.", true);
    }
  };

  // ─── Voice Command Handler ─────────────────────────────────────────────────
  const handleVoiceCommand = (raw) => {
    const text = raw.toLowerCase().trim();
    setLastCommand(raw);
    setAssistantStatus('processing');
    setSessionStats(p => ({ ...p, commandsIssued: p.commandsIssued + 1 }));

    // Global stop / pause command check
    if (matchesAny(text, ['stop', 'pause', 'quiet', 'shut up', 'cancel', 'silence', 'mute', 'off', 'halt'])) {
      voiceService.stopSpeaking();
      voiceService.stopEmergencySiren();
      window.dispatchEvent(new CustomEvent('assistvision-global-stop'));
      setIsWakeActive(false);
      setAssistantStatus('idle');
      setIsCameraOpen(false);
      if (currentScreen !== 'home') setCurrentScreen('home');
      voiceService.speak('Assistant paused.', true);
      return true;
    }

    // Determine command
    let executed = true;

    if (matchesAny(text, ['activate camera', 'open camera', 'start camera', 'camera', 'cam'])) {
      voiceService.speak(RESPONSES.camera, true);
      setIsCameraOpen(true);
      setCameraMode('object');
      setCurrentScreen('camera');

    } else if (matchesAny(text, ['detect objects', 'object detection', 'scan objects', "what's around me", 'around me', 'objects', 'object'])) {
      voiceService.speak(RESPONSES.objects, true);
      setIsCameraOpen(true);
      setCameraMode('object');
      setCurrentScreen('camera');

    } else if (matchesAny(text, ['read text', 'scan text', 'ocr', 'read sign', 'text reader', 'read', 'text', 'sign'])) {
      voiceService.speak(RESPONSES.ocr, true);
      setIsCameraOpen(true);
      setCameraMode('ocr');
      setCurrentScreen('ocr');

    } else if (matchesAny(text, ['detect currency', 'scan money', 'currency', 'money', 'rupee', 'cash', 'note'])) {
      voiceService.speak(RESPONSES.currency, true);
      setIsCameraOpen(true);
      setCameraMode('currency');
      setCurrentScreen('currency');

    } else if (matchesAny(text, ['recognize face', 'face recognition', 'who is this', 'identify person', 'face', 'person', 'who'])) {
      voiceService.speak(RESPONSES.face, true);
      setIsCameraOpen(true);
      setCameraMode('face');
      setCurrentScreen('face');

    } else if (matchesAny(text, ['traffic signal', 'traffic', 'signal', 'crossing', 'light'])) {
      voiceService.speak(RESPONSES.traffic, true);
      setIsCameraOpen(true);
      setCameraMode('traffic');
      setCurrentScreen('traffic');

    } else if (matchesAny(text, ['start navigation', 'navigate', 'navigation', 'direction', 'directions', 'show route', 'take me to', 'where to go', 'map', 'maps', 'nav', 'route'])) {
      voiceService.speak(RESPONSES.navigation, true);
      setCurrentScreen('navigation');

    } else if (matchesAny(text, ['next step', 'next direction', 'next', 'continue step', 'continue'])) {
      window.dispatchEvent(new CustomEvent('assistvision-nav-next'));
      voiceService.speak('Next step.', true);

    } else if (matchesAny(text, ['repeat direction', 'repeat step', 'repeat', 'say again'])) {
      window.dispatchEvent(new CustomEvent('assistvision-nav-repeat'));

    } else if (matchesAny(text, ['stop navigation', 'end navigation'])) {
      voiceService.speak(RESPONSES.navStop, true);
      setCurrentScreen('home');

    } else if (matchesAny(text, ['emergency', 'sos', 'help me', 'call for help', 'help'])) {
      voiceService.speak(RESPONSES.sos, true);
      setCurrentScreen('sos');

    } else if (matchesAny(text, ['close camera', 'stop camera', 'camera off', 'close'])) {
      setIsCameraOpen(false);
      voiceService.speak('Camera closed.', true);
      setCurrentScreen('home');

    } else if (matchesAny(text, ['dashboard', 'status'])) {
      voiceService.speak(RESPONSES.dashboard, true);
      setCurrentScreen('dashboard');

    } else if (matchesAny(text, ['history', 'recent activity', 'recent'])) {
      voiceService.speak(RESPONSES.history, true);
      setCurrentScreen('history');

    } else if (matchesAny(text, ['settings', 'preferences', 'setting'])) {
      voiceService.speak(RESPONSES.settings, true);
      setCurrentScreen('settings');

    } else if (matchesAny(text, ['go home', 'main menu', 'home'])) {
      setCurrentScreen('home');

    } else if (matchesAny(text, ['tell commands', 'list commands', 'what can you do', 'help me'])) {
      voiceService.speakCommandList();

    } else if (matchesAny(text, ['battery'])) {
      const lvl = batteryLevel !== null ? `${batteryLevel}%${batteryCharging ? ', charging' : ''}` : 'unavailable';
      voiceService.speak(`Battery: ${lvl}.`, true);

    } else if (matchesAny(text, ['time', 'clock'])) {
      const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      voiceService.speak(t, true);

    } else if (matchesAny(text, ['where am i', 'my location', 'gps', 'location'])) {
      if (gpsCoords) {
        voiceService.speak(`Latitude ${gpsCoords.lat}, longitude ${gpsCoords.lon}.`, true);
      } else {
        voiceService.speak('GPS unavailable.', true);
      }

    } else if (matchesAny(text, ['heading', 'compass', 'orientation'])) {
      const dirs = ['North', 'North East', 'East', 'South East', 'South', 'South West', 'West', 'North West'];
      if (compassHeading !== null) {
        voiceService.speak(`${dirs[Math.round(compassHeading / 45) % 8]}. ${compassHeading} degrees.`, true);
      } else {
        voiceService.speak('Compass unavailable.', true);
      }

    } else if (matchesAny(text, ['network', 'internet', 'connection'])) {
      voiceService.speak(isOnline ? 'Online.' : 'No internet.', true);

    } else {
      executed = false;
    }

    // Return to listening immediately
    setAssistantStatus('listening');
    return executed;
  };

  const addHistoryItem = (type, text) => {
    const item = { id: Date.now(), type, text, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' — Today' };
    setHistory(p => [item, ...p]);
  };

  const navigateTo = (screen) => {
    setCurrentScreen(screen);
    setSessionStats(p => ({ ...p, screensVisited: p.screensVisited + 1 }));
  };

  return (
    <AppContext.Provider value={{
      // Screen
      currentScreen, setCurrentScreen: navigateTo,
      // Camera
      cameraMode, setCameraMode, facingMode, setFacingMode, isCameraOpen, setIsCameraOpen,
      // Voice assistant state
      isWakeActive, setIsWakeActive, assistantStatus, setAssistantStatus, lastCommand,
      handleVoiceCommand, toggleWakeActive,
      // Sensors
      batteryLevel, batteryCharging, gpsCoords, isOnline, compassHeading,
      // App state
      isActivated, markActivated, resetActivation,
      settings, setSettings,
      history, addHistoryItem,
      sessionStats
    }}>
      {children}
    </AppContext.Provider>
  );
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function matchesAny(text, phrases) {
  return phrases.some(p => text.includes(p));
}

function defaultSettings() {
  return {
    voiceSpeed: 1.0, voiceVolume: 1.0, language: 'en-US',
    darkMode: true, offlineMode: false, cameraQuality: 'High 1080p',
    alertDistance: 1.5, navigationMode: 'Outdoor', faceRecognitionEnabled: true,
    emergencyContacts: [
      { name: 'Primary Guardian', phone: '+91 9999999999' },
      { name: 'Emergency Services', phone: '112' }
    ]
  };
}

function defaultHistory() {
  return [
    { id: 1, type: 'Navigation', text: 'Navigated to City Hospital', timestamp: '10:45 AM — Today' },
    { id: 2, type: 'OCR', text: 'Read: "Paracetamol 500mg — Take 1 tablet daily"', timestamp: '09:30 AM — Today' }
  ];
}

export const useApp = () => useContext(AppContext);
