import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert, Phone, MapPin, AlertTriangle, CheckCircle2,
  Timer, X, Send, MessageSquare, Siren
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { voiceService } from '../services/voiceService';
import { apiService } from '../services/apiService';

export const EmergencySOSScreen = () => {
  const { settings, gpsCoords, addHistoryItem } = useApp();
  const [sosFired, setSosFired] = useState(false);
  const [countdown, setCountdown] = useState(null); // null | 5..1
  const [sosTriggering, setSosTriggering] = useState(false);
  const [sirenActive, setSirenActive] = useState(false);
  const countdownRef = useRef(null);

  useEffect(() => {
    return () => {
      voiceService.stopEmergencySiren();
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const startCountdown = () => {
    setCountdown(5);
    setSosTriggering(true);
    voiceService.speak('SOS will fire in 5 seconds. Tap Cancel to abort.', true);

    let remaining = 5;
    countdownRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining > 0) {
        voiceService.speak(`${remaining}`, true);
      } else {
        clearInterval(countdownRef.current);
        fireSOS();
      }
    }, 1000);
  };

  const cancelSOS = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(null);
    setSosTriggering(false);
    voiceService.speak('SOS cancelled.');
  };

  const fireSOS = async () => {
    setSosFired(true);
    setSosTriggering(false);
    setCountdown(null);

    // Build emergency message
    const locStr = gpsCoords
      ? `GPS: ${gpsCoords.lat}, ${gpsCoords.lon}`
      : 'GPS location unavailable';
    const msg = `EMERGENCY HELP NEEDED! AssistVision SOS Alert. ${locStr}. Please assist immediately.`;

    // Play siren
    voiceService.playEmergencySiren();
    setSirenActive(true);
    voiceService.vibrate([400, 200, 400, 200, 400]);

    // Announce
    voiceService.speak('Emergency SOS sent! Help is on the way. Stay calm.', true);

    // Send to backend
    await apiService.sendSOS({
      lat: gpsCoords?.lat,
      lon: gpsCoords?.lon,
      contacts: settings.emergencyContacts,
      message: msg
    });

    // Log to history
    addHistoryItem('SOS', `Emergency SOS fired — ${locStr}`);

    // Open SMS intent for first contact
    const contact = settings.emergencyContacts?.[0];
    if (contact?.phone) {
      const smsLink = `sms:${contact.phone}?body=${encodeURIComponent(msg)}`;
      window.open(smsLink, '_blank');
    }
  };

  const stopSiren = () => {
    voiceService.stopEmergencySiren();
    setSirenActive(false);
    voiceService.speak('Siren stopped.');
  };

  const callContact = (phone) => {
    voiceService.speak(`Calling ${phone}`);
    window.open(`tel:${phone}`, '_blank');
  };

  return (
    <div className="screen-container fade-in" style={{ alignItems: 'center' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: sosFired ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.1)',
          border: `2px solid ${sosFired ? '#EF4444' : 'rgba(239,68,68,0.4)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: sosFired ? '0 0 40px rgba(239,68,68,0.5)' : 'none',
          animation: sosFired ? 'warningFlash 0.6s infinite alternate' : 'none'
        }}>
          <ShieldAlert size={40} color="#EF4444" />
        </div>
        <h2 style={{ fontSize: '30px', fontWeight: '900', color: sosFired ? '#F87171' : '#FFFFFF', marginBottom: '6px' }}>
          {sosFired ? 'SOS SENT — Help Coming' : 'Emergency SOS'}
        </h2>
        <p style={{ fontSize: '16px', color: '#94A3B8' }}>
          {sosFired
            ? 'Emergency contacts have been alerted. Stay calm and stay safe.'
            : 'Press the button below to alert emergency contacts with your GPS location.'}
        </p>
      </div>

      {/* GPS Location Card */}
      <div className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '14px 18px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MapPin size={20} color={gpsCoords ? '#10B981' : '#F59E0B'} />
          <div>
            <p style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Your Location</p>
            <p style={{ fontSize: '15px', fontWeight: '700', color: gpsCoords ? '#34D399' : '#FBBF24' }}>
              {gpsCoords ? `${gpsCoords.lat}, ${gpsCoords.lon} (±${gpsCoords.accuracy}m)` : 'GPS acquiring... location approximate'}
            </p>
          </div>
        </div>
      </div>

      {/* SOS Button / Countdown */}
      {!sosFired ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
          {sosTriggering ? (
            <>
              {/* Countdown Circle */}
              <div style={{
                width: '160px', height: '160px',
                borderRadius: '50%',
                background: 'rgba(239,68,68,0.2)',
                border: '4px solid #EF4444',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 50px rgba(239,68,68,0.5)',
                animation: 'warningFlash 0.5s infinite alternate'
              }}>
                <span style={{ fontSize: '60px', fontWeight: '900', color: '#F87171' }}>{countdown}</span>
                <span style={{ fontSize: '14px', color: '#F87171', fontWeight: '700' }}>SECONDS</span>
              </div>
              <p style={{ fontSize: '18px', color: '#F87171', fontWeight: '800', textAlign: 'center' }}>
                SOS Firing in {countdown} second{countdown !== 1 ? 's' : ''}...
              </p>
              <button onClick={cancelSOS} className="touch-btn touch-btn-outline" style={{ width: '200px', padding: '14px' }}>
                <X size={20} /> Cancel SOS
              </button>
            </>
          ) : (
            <button
              onClick={startCountdown}
              className="touch-btn touch-btn-danger"
              style={{
                width: '200px', height: '200px', borderRadius: '50%',
                fontSize: '20px', fontWeight: '900',
                flexDirection: 'column', gap: '8px',
                boxShadow: '0 0 60px rgba(239,68,68,0.5)',
                animation: 'splashRing 2s ease-in-out infinite alternate'
              }}
            >
              <ShieldAlert size={52} />
              SEND SOS
            </button>
          )}
        </div>
      ) : (
        /* SOS Fired State */
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <CheckCircle2 size={64} color="#10B981" style={{ marginBottom: '12px' }} />
          <p style={{ fontSize: '22px', fontWeight: '900', color: '#34D399', marginBottom: '8px' }}>Alert Sent Successfully</p>
          {sirenActive && (
            <button onClick={stopSiren} className="touch-btn touch-btn-warning" style={{ margin: '0 auto' }}>
              <X size={18} /> Stop Siren
            </button>
          )}
        </div>
      )}

      {/* Emergency Contacts */}
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <p style={{ fontSize: '13px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
          Emergency Contacts
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {settings.emergencyContacts.map((contact, i) => (
            <div key={i} className="m3-card" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', marginBottom: 0,
              borderLeft: '4px solid #EF4444'
            }}>
              <div>
                <p style={{ fontSize: '17px', fontWeight: '800', color: '#FFFFFF' }}>{contact.name}</p>
                <p style={{ fontSize: '14px', color: '#94A3B8' }}>{contact.phone}</p>
              </div>
              <button
                onClick={() => callContact(contact.phone)}
                className="touch-btn touch-btn-danger"
                style={{ minHeight: '44px', padding: '10px 16px', fontSize: '15px' }}
              >
                <Phone size={18} /> Call
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
