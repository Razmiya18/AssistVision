import React, { useState, useEffect, useRef } from 'react';
import { UserCheck, UserPlus, Volume2, ShieldAlert, Heart } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { cameraAIService, CAMERA_MODES } from '../services/cameraAIService';
import { voiceService } from '../services/voiceService';

export const FaceRecognitionScreen = () => {
  const { addHistoryItem } = useApp();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [detectedFaces, setDetectedFaces] = useState([
    { id: 1, name: 'Mother', relation: 'Family', distance: 1.2, confidence: 97, known: true },
    { id: 2, name: 'Unknown Person', relation: 'Stranger', distance: 2.5, confidence: 91, known: false }
  ]);

  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [newFaceName, setNewFaceName] = useState('');

  useEffect(() => {
    const initCam = async () => {
      if (videoRef.current) {
        await cameraAIService.startCamera(videoRef.current, 'user'); // Front cam for face scanning
      }
    };
    initCam();

    const primaryFace = detectedFaces[0];
    addHistoryItem('Face Recognition', `Recognized ${primaryFace.name} (${primaryFace.distance}m)`);

    const timer = setInterval(() => {
      const simulatedFaces = cameraAIService.getSimulatedDetections(CAMERA_MODES.FACE);
      if (canvasRef.current) {
        cameraAIService.drawCanvasOverlay(canvasRef.current, simulatedFaces, CAMERA_MODES.FACE);
      }
    }, 1000);

    return () => {
      clearInterval(timer);
      cameraAIService.stopCamera();
    };
  }, []);

  const handleEnrollFace = (e) => {
    e.preventDefault();
    if (!newFaceName) return;

    const newFace = {
      id: Date.now(),
      name: newFaceName,
      relation: 'Friend / Contact',
      distance: 1.0,
      confidence: 99,
      known: true
    };

    setDetectedFaces([newFace, ...detectedFaces]);
    voiceService.speak(`Face successfully saved for ${newFaceName}`);
    addHistoryItem('Face Enrolled', `Enrolled face: ${newFaceName}`);
    setNewFaceName('');
    setShowEnrollModal(false);
  };

  return (
    <div className="screen-container">
      
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserCheck size={28} color="#8B5CF6" />
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#FFFFFF' }}>
            Face Recognition
          </h2>
        </div>
        <button
          onClick={() => {
            setShowEnrollModal(true);
            voiceService.speak('Add New Face Enrollment Modal opened');
          }}
          className="touch-btn touch-btn-accent"
          style={{ minHeight: '38px', padding: '6px 12px', fontSize: '13px' }}
        >
          <UserPlus size={16} /> Enroll Face
        </button>
      </div>

      {/* Live Camera Viewport */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '220px',
        borderRadius: '20px',
        overflow: 'hidden',
        background: '#000',
        border: '2px solid #8B5CF6',
        marginBottom: '16px'
      }}>
        <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <canvas ref={canvasRef} width={440} height={220} style={{ position: 'absolute', inset: 0 }} />
      </div>

      {/* Recognized People Stack */}
      <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#FFFFFF', marginBottom: '10px' }}>
        Recognized People Nearby ({detectedFaces.length})
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {detectedFaces.map((face) => (
          <div
            key={face.id}
            className="m3-card"
            style={{
              marginBottom: 0,
              borderLeft: `5px solid ${face.known ? '#10B981' : '#F59E0B'}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h4 style={{ fontSize: '20px', fontWeight: '800', color: '#FFFFFF' }}>
                  {face.name}
                </h4>
                {face.known ? (
                  <span className="badge badge-accent" style={{ fontSize: '11px', padding: '2px 6px' }}>
                    <Heart size={10} /> KNOWN
                  </span>
                ) : (
                  <span className="badge badge-warning" style={{ fontSize: '11px', padding: '2px 6px' }}>
                    UNKNOWN
                  </span>
                )}
              </div>
              <p style={{ fontSize: '14px', color: '#94A3B8', marginTop: '2px' }}>
                {face.relation} • {face.confidence}% Match
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '22px', fontWeight: '900', color: '#60A5FA' }}>
                {face.distance}m
              </span>
              <p style={{ fontSize: '11px', color: '#64748B' }}>AHEAD</p>
            </div>
          </div>
        ))}
      </div>

      {/* Face Enrollment Modal */}
      {showEnrollModal && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(7, 10, 20, 0.95)',
          zIndex: 50,
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <h3 style={{ fontSize: '26px', fontWeight: '900', color: '#FFFFFF', marginBottom: '12px' }}>
            Enroll New Person
          </h3>
          <p style={{ fontSize: '16px', color: '#94A3B8', marginBottom: '20px' }}>
            Position face in camera and type or speak name below:
          </p>

          <form onSubmit={handleEnrollFace}>
            <input
              type="text"
              placeholder="e.g. Brother / Alex"
              value={newFaceName}
              onChange={(e) => setNewFaceName(e.target.value)}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '14px',
                background: '#0F172A',
                border: '2px solid #8B5CF6',
                color: '#FFFFFF',
                fontSize: '18px',
                fontWeight: '700',
                marginBottom: '20px'
              }}
            />

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="touch-btn touch-btn-primary" style={{ flex: 1 }}>
                Save Face
              </button>
              <button
                type="button"
                onClick={() => setShowEnrollModal(false)}
                className="touch-btn touch-btn-outline"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
