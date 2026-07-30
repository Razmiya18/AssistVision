// VoiceService — Real Wake Word Engine + Smart TTS for AssistVision
// Behavior: always listening for wake phrase, short responses only, no chatbot style

class VoiceService {
  constructor() {
    this.synth = window.speechSynthesis || null;
    this.recognition = null;
    this.isListening = false;
    this.isWakeActive = false;      // true after "Activate AssistVision"
    this.speaking = false;
    this.rate = 1.25;               // High speed instant voice feedback
    this.pitch = 1.0;
    this.volume = 1.0;
    this.language = 'en-US';
    this.audioCtx = null;
    this.sirenOscillator = null;
    this.sirenTimer = null;
    this.lastCommandTime = 0;

    // Callbacks
    this.onWakeCallback = null;         // called when wake word detected
    this.onDeactivateCallback = null;   // called when deactivation detected
    this.onCommandCallback = null;      // called with command transcript
    this.onStateChangeCallback = null;  // called with (isListening bool)

    // Wake / deactivate phrases
    this.WAKE_PHRASES = [
      'activate',
      'start',
      'turn on',
      'activate assistvision',
      'activate assist vision',
      'activate assistant vision',
      'activate assiste vision',
      'activate assistant'
    ];
    this.DEACTIVATE_PHRASES = [
      'stop',
      'stop it',
      'stop camera',
      'stop reading',
      'stop navigation',
      'stop speaking',
      'stop video',
      'stop detection',
      'stop all',
      'stop assistvision',
      'stop assist vision',
      'deactivate assistvision',
      'deactivate assist vision',
      'stop assistant',
      'stop listening',
      'shut up',
      'be quiet',
      'quiet',
      'pause',
      'cancel',
      'silence',
      'mute',
      'off',
      'halt'
    ];

    this.initRecognition();
  }

  // ─── Speech Recognition Setup ──────────────────────────────────────────────
  initRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      console.warn('[VoiceService] SpeechRecognition not supported in this browser.');
      return;
    }
    try {
      this.recognition = new SR();
      this.recognition.continuous = true;
      this.recognition.interimResults = true; // Instant real-time word detection
      this.recognition.maxAlternatives = 1;
      this.recognition.lang = this.language;

      this.recognition.onstart = () => {
        this.isListening = true;
        if (this.onStateChangeCallback) this.onStateChangeCallback(true);
      };

      this.recognition.onend = () => {
        // Auto-restart: always keep background listening alive
        if (this.isListening) {
          try { this.recognition.start(); } catch (_) {}
        } else {
          if (this.onStateChangeCallback) this.onStateChangeCallback(false);
        }
      };

      this.recognition.onerror = (e) => {
        if (e.error === 'no-speech' || e.error === 'network') return; // benign
        console.warn('[VoiceService] SR error:', e.error);
      };

      this.recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript.trim().toLowerCase();
          if (this._routeTranscript(transcript)) break;
        }
      };
    } catch (err) {
      console.warn('[VoiceService] SR init failed:', err);
    }
  }

  // ─── Transcript Router ─────────────────────────────────────────────────────
  _routeTranscript(text) {
    if (!text || text.length < 2) return false;

    const now = Date.now();
    const isDeactivate = this.DEACTIVATE_PHRASES.some(p => text.includes(p));

    // IMMEDIATE STOP INTERRUPT: Stop phrase MUST process immediately, even if TTS is currently speaking
    if (isDeactivate) {
      this.lastCommandTime = now;
      this.stopSpeaking();
      this.stopEmergencySiren();
      window.dispatchEvent(new CustomEvent('assistvision-global-stop'));
      this._onDeactivateDetected();
      return true;
    }

    // Suppress microphone transcript while TTS is speaking for other commands to prevent self-talkback loops
    if (this.speaking) return false;

    // Filter out system response phrases
    const SYSTEM_RESPONSES = [
      'welcome to assistvision', 'camera activated', 'reading text',
      'currency detection started', 'face recognition started',
      'traffic signal detection started', 'object detection started',
      'navigation started', 'navigation stopped', 'emergency sos activated',
      'opening settings', 'opening history', 'opening dashboard',
      'assistant active', 'assistant paused', 'how can i help',
      'currency detected', 'five hundred rupees', 'ten rupees', 'twenty rupees',
      'fifty rupees', 'one hundred rupees', 'two hundred rupees',
      'two thousand rupees', 'red signal', 'yellow signal', 'green signal',
      'path clear', 'read text', 'next step', 'i\'m listening'
    ];
    if (SYSTEM_RESPONSES.some(phrase => text.includes(phrase))) {
      return false;
    }

    const isWake = this.WAKE_PHRASES.some(p => text.includes(p));

    if (isWake && !this.isWakeActive) {
      this.lastCommandTime = now;
      this._onWakeDetected();
      return true;
    }

    if (this.onCommandCallback) {
      // Debounce ONLY when a command actually matches and executes
      if (now - this.lastCommandTime < 300) return false;

      const executed = this.onCommandCallback(text);
      if (executed) {
        if (!this.isWakeActive) {
          this.isWakeActive = true;
          if (this.onWakeCallback) this.onWakeCallback();
        }
        this.lastCommandTime = now;
        return true;
      }
    }

    return false;
  }

  // ─── Wake Word Detected ────────────────────────────────────────────────────
  _onWakeDetected() {
    this.isWakeActive = true;
    this.playActivationBeep();
    // Short deliberate pause before speaking
    setTimeout(() => {
      this.speak("Welcome to AssistVision. I'm listening.", true);
    }, 350);
    if (this.onWakeCallback) this.onWakeCallback();
    console.log('[VoiceService] Wake word detected — assistant active.');
  }

  // ─── Deactivation Detected ─────────────────────────────────────────────────
  _onDeactivateDetected() {
    this.isWakeActive = false;
    this.stopSpeaking();
    this.speak('Assistant paused.', true);
    if (this.onDeactivateCallback) this.onDeactivateCallback();
    console.log('[VoiceService] Deactivated — back to wake-word listening.');
  }

  // ─── Start Always-On Background Listening ──────────────────────────────────
  startBackgroundListening({ onWake, onDeactivate, onCommand, onStateChange } = {}) {
    if (onWake) this.onWakeCallback = onWake;
    if (onDeactivate) this.onDeactivateCallback = onDeactivate;
    if (onCommand) this.onCommandCallback = onCommand;
    if (onStateChange) this.onStateChangeCallback = onStateChange;

    if (!this.recognition) return;
    if (this.isListening) return; // already running

    this.isListening = true;
    try {
      this.recognition.start();
      console.log('[VoiceService] Background listening started (waiting for wake word).');
    } catch (err) {
      console.warn('[VoiceService] Could not start listening:', err);
    }
  }

  stopBackgroundListening() {
    this.isListening = false;
    this.isWakeActive = false;
    if (this.recognition) {
      try { this.recognition.stop(); } catch (_) {}
    }
  }

  // ─── Legacy API (used by calibration screen) ───────────────────────────────
  startListening(onResult, onStateChange) {
    this.onCommandCallback = onResult;
    this.onStateChangeCallback = onStateChange;
    if (!this.isListening) {
      this.isListening = true;
      this.isWakeActive = true; // treat as already activated
      try { this.recognition?.start(); } catch (_) {}
    }
  }

  stopListening() {
    this.isListening = false;
    this.isWakeActive = false;
    try { this.recognition?.stop(); } catch (_) {}
    if (this.onStateChangeCallback) this.onStateChangeCallback(false);
  }

  // ─── Text-to-Speech ────────────────────────────────────────────────────────
  speak(text, priority = false) {
    if (!text || !this.synth) return;
    if (priority) this.synth.cancel();
    // Don't speak during already-speaking unless priority
    if (this.speaking && !priority) return;

    this.speaking = true; // Set speaking state immediately
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = this.rate;
    utt.pitch = this.pitch;
    utt.volume = this.volume;
    utt.lang = this.language;
    utt.onstart = () => { this.speaking = true; };
    utt.onend = () => {
      // 600ms grace period after TTS finishes so microphone tail echo is ignored
      setTimeout(() => { this.speaking = false; }, 600);
    };
    utt.onerror = () => { this.speaking = false; };
    this.synth.speak(utt);
    console.log('[TTS]', text);
  }

  stopSpeaking() {
    if (this.synth) { this.synth.cancel(); this.speaking = false; }
  }

  // ─── Read Commands One By One With Pauses ─────────────────────────────────
  speakCommandList() {
    const commands = [
      'Activate Camera.',
      'Read Text.',
      'Detect Objects.',
      'Recognize Face.',
      'Detect Currency.',
      'Traffic Signal.',
      'Start Navigation.',
      'Stop Navigation.',
      'Emergency.',
      'Stop AssistVision.'
    ];
    this.stopSpeaking();
    const prefix = 'You can say: ';
    let delay = 200;
    this.speak(prefix, true);
    commands.forEach((cmd, i) => {
      setTimeout(() => this.speak(cmd, false), delay + i * 2200);
    });
  }

  // ─── Activation Beep (two ascending tones) ────────────────────────────────
  playActivationBeep() {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      const play = (freq, startTime, duration) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
        gain.gain.linearRampToValueAtTime(0, startTime + duration);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      const now = this.audioCtx.currentTime;
      play(880, now, 0.12);        // High A
      play(1100, now + 0.14, 0.18); // C# — ascending resolution
    } catch (e) {
      console.warn('[VoiceService] Beep failed:', e);
    }
  }

  // ─── Emergency Siren ───────────────────────────────────────────────────────
  playEmergencySiren() {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      this.stopEmergencySiren();
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      let high = true;
      osc.frequency.setValueAtTime(800, this.audioCtx.currentTime);
      this.sirenTimer = setInterval(() => {
        if (this.audioCtx && osc) {
          osc.frequency.setValueAtTime(high ? 800 : 400, this.audioCtx.currentTime);
          high = !high;
        }
      }, 400);
      osc.start();
      this.sirenOscillator = osc;
    } catch (e) {
      console.warn('[VoiceService] Siren failed:', e);
    }
  }

  stopEmergencySiren() {
    if (this.sirenTimer) clearInterval(this.sirenTimer);
    if (this.sirenOscillator) {
      try { this.sirenOscillator.stop(); this.sirenOscillator.disconnect(); } catch (_) {}
      this.sirenOscillator = null;
    }
  }

  // ─── Vibration ─────────────────────────────────────────────────────────────
  vibrate(pattern = [200, 100, 200]) {
    if (navigator.vibrate) navigator.vibrate(pattern);
  }

  // ─── Settings ──────────────────────────────────────────────────────────────
  setSpeechSettings({ rate, pitch, volume, language } = {}) {
    if (rate !== undefined) this.rate = rate;
    if (pitch !== undefined) this.pitch = pitch;
    if (volume !== undefined) this.volume = volume;
    if (language !== undefined) {
      this.language = language;
      if (this.recognition) this.recognition.lang = language;
    }
  }

  getWakeActive() { return this.isWakeActive; }
  getIsListening() { return this.isListening; }
}

export const voiceService = new VoiceService();
