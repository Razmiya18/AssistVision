import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { NavigationHeader } from './components/NavigationHeader';
import { BottomNavBar } from './components/BottomNavBar';
import { SplashScreen } from './screens/SplashScreen';
import { VoiceCalibrationScreen } from './screens/VoiceCalibrationScreen';
import { HomeScreen } from './screens/HomeScreen';
import { CameraDetectionScreen } from './screens/CameraDetectionScreen';
import { NavigationScreen } from './screens/NavigationScreen';
import { OCRScreen } from './screens/OCRScreen';
import { CurrencyDetectionScreen } from './screens/CurrencyDetectionScreen';
import { FaceRecognitionScreen } from './screens/FaceRecognitionScreen';
import { TrafficSignalScreen } from './screens/TrafficSignalScreen';
import { ObjectDetectionScreen } from './screens/ObjectDetectionScreen';
import { EmergencySOSScreen } from './screens/EmergencySOSScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { VoiceCommandsScreen } from './screens/VoiceCommandsScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { DashboardScreen } from './screens/DashboardScreen';

const NO_CHROME = ['splash', 'calibration'];

const MainContent = () => {
  const { currentScreen } = useApp();

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':      return <SplashScreen />;
      case 'calibration': return <VoiceCalibrationScreen />;
      case 'home':        return <HomeScreen />;
      case 'camera':      return <CameraDetectionScreen />;
      case 'navigation':  return <NavigationScreen />;
      case 'ocr':         return <OCRScreen />;
      case 'currency':    return <CurrencyDetectionScreen />;
      case 'face':        return <FaceRecognitionScreen />;
      case 'traffic':     return <TrafficSignalScreen />;
      case 'objects':     return <ObjectDetectionScreen />;
      case 'sos':         return <EmergencySOSScreen />;
      case 'settings':    return <SettingsScreen />;
      case 'commands':    return <VoiceCommandsScreen />;
      case 'history':     return <HistoryScreen />;
      case 'dashboard':   return <DashboardScreen />;
      default:            return <HomeScreen />;
    }
  };

  const showChrome = !NO_CHROME.includes(currentScreen);

  return (
    <div className="app-wrapper">
      {showChrome && <NavigationHeader />}
      <main style={{ flex: 1, overflowY: 'auto', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        {renderScreen()}
      </main>
      {showChrome && <BottomNavBar />}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
