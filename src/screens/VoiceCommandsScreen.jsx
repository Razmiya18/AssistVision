import React from 'react';
import { Play, Terminal } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const VoiceCommandsScreen = () => {
  const { handleVoiceCommand } = useApp();

  const commandGroups = [
    {
      category: 'System & Power',
      commands: [
        { phrase: 'Activate AssistVision', desc: 'One-time initial voice setup activation' },
        { phrase: 'Current Time', desc: 'Speaks the current time' },
        { phrase: 'Battery Status', desc: 'Speaks current battery percentage' }
      ]
    },
    {
      category: 'Vision & Perception',
      commands: [
        { phrase: 'Detect Objects', desc: 'Identifies nearby physical obstacles' },
        { phrase: 'Read Text', desc: 'Extracts and reads printed text' },
        { phrase: 'Detect Currency', desc: 'Identifies Indian currency banknotes' },
        { phrase: 'Recognize Face', desc: 'Identifies family, friends & strangers' },
        { phrase: 'Traffic Signal', desc: 'Detects crosswalk Red/Green light' },
        { phrase: "What's Around Me?", desc: 'Comprehensive surround vision scan' }
      ]
    },
    {
      category: 'Navigation & Safety',
      commands: [
        { phrase: 'Start Navigation', desc: 'Launches GPS outdoor/indoor map' },
        { phrase: 'Stop Navigation', desc: 'Ends active route guidance' },
        { phrase: 'Where Am I', desc: 'Speaks current GPS address' },
        { phrase: 'Emergency', desc: 'Triggers 100dB siren & SOS dispatch' }
      ]
    },
    {
      category: 'Camera & Controls',
      commands: [
        { phrase: 'Front Camera', desc: 'Switches feed to front selfie camera' },
        { phrase: 'Back Camera', desc: 'Switches feed to rear main camera' },
        { phrase: 'Read Again', desc: 'Repeats last spoken text or OCR' }
      ]
    }
  ];

  return (
    <div className="screen-container">
      
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Terminal size={28} color="#60A5FA" />
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#FFFFFF' }}>
            AssistVision Voice Commands
          </h2>
          <p style={{ fontSize: '14px', color: '#94A3B8' }}>
            Tap any command to execute test trigger
          </p>
        </div>
      </div>

      {commandGroups.map((group, idx) => (
        <div key={idx} style={{ marginBottom: '20px' }}>
          <h3 style={{
            fontSize: '15px',
            fontWeight: '800',
            color: '#38BDF8',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '10px'
          }}>
            {group.category}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {group.commands.map((cmd, i) => (
              <div
                key={i}
                className="m3-card m3-card-interactive"
                onClick={() => handleVoiceCommand(cmd.phrase)}
                style={{
                  marginBottom: 0,
                  padding: '14px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#0F172A'
                }}
              >
                <div>
                  <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#FFFFFF' }}>
                    "{cmd.phrase}"
                  </h4>
                  <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '2px' }}>
                    {cmd.desc}
                  </p>
                </div>

                <div style={{
                  background: 'rgba(37, 99, 235, 0.2)',
                  color: '#60A5FA',
                  padding: '8px',
                  borderRadius: '50%'
                }}>
                  <Play size={16} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

    </div>
  );
};
