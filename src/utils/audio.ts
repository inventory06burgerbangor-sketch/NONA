/**
 * Web Audio API synthesizer for realistic paper ripping, alarm chimes, and camera shutter.
 * Fully standalone with zero external audio assets to avoid broken audio links.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Realistic paper tearing sound using modulated filtered white noise
 */
export function playPageTearSound() {
  try {
    const ctx = getAudioContext();
    const duration = 0.45;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate textured noise simulating paper fibers tearing
    for (let i = 0; i < bufferSize; i++) {
      const progress = i / bufferSize;
      const envelope = Math.sin(progress * Math.PI) * Math.min(1, (1 - progress) * 1.5);
      const texture = (Math.random() * 2 - 1) * 0.7 + (Math.random() > 0.95 ? (Math.random() * 2 - 1) * 1.5 : 0);
      data[i] = texture * envelope;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // Filter to emphasize crisp paper scratch frequencies
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(1200, ctx.currentTime);
    bandpass.Q.setValueAtTime(1.8, ctx.currentTime);
    bandpass.frequency.exponentialRampToValueAtTime(3200, ctx.currentTime + duration * 0.7);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    noise.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
  } catch (err) {
    console.warn('Audio playback error', err);
  }
}

/**
 * Camera shutter click sound for polaroid snapshot
 */
export function playCameraShutterSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // First click
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(900, now);
    osc1.frequency.exponentialRampToValueAtTime(200, now + 0.05);
    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.05);

    // Second click (mechanical mirror return)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(600, now + 0.09);
    osc2.frequency.exponentialRampToValueAtTime(150, now + 0.16);
    gain2.gain.setValueAtTime(0.4, now + 0.09);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.09);
    osc2.stop(now + 0.16);
  } catch (err) {
    console.warn('Audio playback error', err);
  }
}

/**
 * Pleasant ringing melodic alarm chime sequence
 */
let alarmInterval: number | null = null;

export function startAlarmChime(onStop?: () => void) {
  stopAlarmChime();

  const playChimeChord = () => {
    try {
      const ctx = getAudioContext();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const baseTime = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, baseTime + idx * 0.12);

        gain.gain.setValueAtTime(0, baseTime + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.25, baseTime + idx * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, baseTime + idx * 0.12 + 0.7);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(baseTime + idx * 0.12);
        osc.stop(baseTime + idx * 0.12 + 0.7);
      });
    } catch (e) {
      console.warn('Alarm chime error', e);
    }
  };

  playChimeChord();
  alarmInterval = window.setInterval(playChimeChord, 2200);

  return () => {
    stopAlarmChime();
    if (onStop) onStop();
  };
}

export function stopAlarmChime() {
  if (alarmInterval !== null) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }
}

/**
 * Subtle fountain pen touch sound
 */
export function playPenStrokeSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400 + Math.random() * 200, now);
    osc.frequency.linearRampToValueAtTime(800, now + 0.03);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.03);
  } catch (err) {
    // Ignore silent interaction fail
  }
}
